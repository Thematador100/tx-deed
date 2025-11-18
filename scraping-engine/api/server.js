import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from 'helmet';
import { JobQueueManager } from '../queue/job-queue.js';
import { BrowserManager } from '../core/browser-manager.js';
import { ProxyManager } from '../proxy/proxy-manager.js';
import { DataPipeline } from '../storage/data-pipeline.js';
import { metrics } from '../monitoring/metrics.js';
import { alerting } from '../monitoring/alerting.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const fastify = Fastify({
  logger: logger,
  trustProxy: true,
  bodyLimit: 10485760 // 10MB
});

// Plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  cache: 10000
});

// Initialize components
const jobQueue = new JobQueueManager();
const browserManager = new BrowserManager();
const proxyManager = new ProxyManager();
const dataPipeline = new DataPipeline();

// Start workers
jobQueue.startWorker('scraping');
jobQueue.startWorker('extraction');

// Validation schemas
const scrapeSingleSchema = z.object({
  url: z.string().url(),
  config: z.object({
    extractionMethod: z.enum(['ai', 'selectors', 'none']).optional(),
    extractionType: z.string().optional(),
    schema: z.any().optional(),
    selectors: z.record(z.any()).optional(),
    waitFor: z.string().optional(),
    screenshot: z.boolean().optional(),
    save: z.boolean().optional(),
    collection: z.string().optional()
  }).optional()
});

const scrapeMultipleSchema = z.object({
  urls: z.array(z.string().url()),
  config: z.object({
    concurrency: z.number().min(1).max(10).optional(),
    extractionMethod: z.enum(['ai', 'selectors', 'none']).optional(),
    batchDelay: z.number().optional()
  }).optional()
});

const scrapeSitemapSchema = z.object({
  sitemapUrl: z.string().url(),
  config: z.object({
    urlFilter: z.any().optional(),
    concurrency: z.number().optional()
  }).optional()
});

// Routes

/**
 * Health check
 */
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
});

/**
 * Metrics endpoint for Prometheus
 */
fastify.get('/metrics', async (request, reply) => {
  reply.header('Content-Type', metrics.getContentType());
  return metrics.getMetrics();
});

/**
 * Submit single scraping job
 */
fastify.post('/api/scrape/single', async (request, reply) => {
  try {
    const { url, config } = scrapeSingleSchema.parse(request.body);

    const job = await jobQueue.addJob({
      type: 'scrape_single',
      url,
      config
    }, {
      priority: config?.priority || 'normal'
    });

    return {
      success: true,
      jobId: job.id,
      message: 'Scraping job queued successfully'
    };
  } catch (error) {
    logger.error('Failed to queue scraping job:', error);
    reply.code(400);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Submit multiple scraping jobs
 */
fastify.post('/api/scrape/multiple', async (request, reply) => {
  try {
    const { urls, config } = scrapeMultipleSchema.parse(request.body);

    const job = await jobQueue.addJob({
      type: 'scrape_multiple',
      urls,
      config
    });

    return {
      success: true,
      jobId: job.id,
      urlCount: urls.length,
      message: 'Batch scraping job queued successfully'
    };
  } catch (error) {
    logger.error('Failed to queue batch scraping job:', error);
    reply.code(400);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Submit sitemap scraping job
 */
fastify.post('/api/scrape/sitemap', async (request, reply) => {
  try {
    const { sitemapUrl, config } = scrapeSitemapSchema.parse(request.body);

    const job = await jobQueue.addJob({
      type: 'scrape_sitemap',
      url: sitemapUrl,
      config
    });

    return {
      success: true,
      jobId: job.id,
      message: 'Sitemap scraping job queued successfully'
    };
  } catch (error) {
    logger.error('Failed to queue sitemap scraping job:', error);
    reply.code(400);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Extract property data
 */
fastify.post('/api/extract/property', async (request, reply) => {
  try {
    const { url, config } = scrapeSingleSchema.parse(request.body);

    const job = await jobQueue.addJob({
      type: 'extract_property_data',
      url,
      config
    }, {
      queue: 'extraction',
      priority: 'high'
    });

    return {
      success: true,
      jobId: job.id,
      message: 'Property extraction job queued successfully'
    };
  } catch (error) {
    logger.error('Failed to queue property extraction job:', error);
    reply.code(400);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Schedule recurring job
 */
fastify.post('/api/schedule', async (request, reply) => {
  try {
    const { jobData, cronPattern, options } = request.body;

    const job = await jobQueue.scheduleRecurring(jobData, cronPattern, options);

    return {
      success: true,
      jobId: job.id,
      cronPattern,
      message: 'Recurring job scheduled successfully'
    };
  } catch (error) {
    logger.error('Failed to schedule recurring job:', error);
    reply.code(400);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get job status
 */
fastify.get('/api/jobs/:jobId', async (request, reply) => {
  try {
    const { jobId } = request.params;
    const { queue = 'scraping' } = request.query;

    const jobState = await jobQueue.getJobState(jobId, queue);

    if (!jobState) {
      reply.code(404);
      return {
        success: false,
        error: 'Job not found'
      };
    }

    return {
      success: true,
      job: jobState
    };
  } catch (error) {
    logger.error('Failed to get job status:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Retry failed job
 */
fastify.post('/api/jobs/:jobId/retry', async (request, reply) => {
  try {
    const { jobId } = request.params;
    const { queue = 'scraping' } = request.query;

    await jobQueue.retryJob(jobId, queue);

    return {
      success: true,
      message: 'Job scheduled for retry'
    };
  } catch (error) {
    logger.error('Failed to retry job:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Remove job
 */
fastify.delete('/api/jobs/:jobId', async (request, reply) => {
  try {
    const { jobId } = request.params;
    const { queue = 'scraping' } = request.query;

    await jobQueue.removeJob(jobId, queue);

    return {
      success: true,
      message: 'Job removed successfully'
    };
  } catch (error) {
    logger.error('Failed to remove job:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get queue statistics
 */
fastify.get('/api/queues/stats', async (request, reply) => {
  try {
    const stats = await jobQueue.getAllStats();

    return {
      success: true,
      stats
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get specific queue statistics
 */
fastify.get('/api/queues/:queueName/stats', async (request, reply) => {
  try {
    const { queueName } = request.params;
    const stats = await jobQueue.getQueueStats(queueName);

    return {
      success: true,
      stats
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Pause queue
 */
fastify.post('/api/queues/:queueName/pause', async (request, reply) => {
  try {
    const { queueName } = request.params;
    await jobQueue.pauseQueue(queueName);

    return {
      success: true,
      message: `Queue "${queueName}" paused`
    };
  } catch (error) {
    logger.error('Failed to pause queue:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Resume queue
 */
fastify.post('/api/queues/:queueName/resume', async (request, reply) => {
  try {
    const { queueName } = request.params;
    await jobQueue.resumeQueue(queueName);

    return {
      success: true,
      message: `Queue "${queueName}" resumed`
    };
  } catch (error) {
    logger.error('Failed to resume queue:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get browser statistics
 */
fastify.get('/api/browsers/stats', async (request, reply) => {
  try {
    const stats = browserManager.getBrowserStats();

    return {
      success: true,
      stats
    };
  } catch (error) {
    logger.error('Failed to get browser stats:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Get proxy statistics
 */
fastify.get('/api/proxies/stats', async (request, reply) => {
  try {
    const stats = proxyManager.getStats();

    return {
      success: true,
      stats
    };
  } catch (error) {
    logger.error('Failed to get proxy stats:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Query scraped data
 */
fastify.get('/api/data', async (request, reply) => {
  try {
    const {
      collection = 'default',
      limit = 100,
      offset = 0,
      success,
      url
    } = request.query;

    const filters = {};
    if (collection) filters.collection = collection;
    if (success !== undefined) filters.success = success === 'true';
    if (url) filters.url = url;

    const results = await dataPipeline.query(filters, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      success: true,
      count: results.length,
      data: results
    };
  } catch (error) {
    logger.error('Failed to query data:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * System stats
 */
fastify.get('/api/stats', async (request, reply) => {
  try {
    const [queueStats, browserStats, proxyStats] = await Promise.all([
      jobQueue.getAllStats(),
      browserManager.getBrowserStats(),
      proxyManager.getStats()
    ]);

    return {
      success: true,
      stats: {
        queues: queueStats,
        browsers: browserStats,
        proxies: proxyStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get system stats:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message
    };
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error('Request error:', error);

  reply.code(error.statusCode || 500).send({
    success: false,
    error: error.message,
    statusCode: error.statusCode || 500
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    await fastify.close();
    await jobQueue.close();
    await browserManager.closeAll();
    await dataPipeline.close();

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    const port = process.env.API_PORT || 3001;
    const host = process.env.API_HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    logger.info(`API server listening on http://${host}:${port}`);
    logger.info(`Health check: http://${host}:${port}/health`);
    logger.info(`Metrics: http://${host}:${port}/metrics`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default fastify;
