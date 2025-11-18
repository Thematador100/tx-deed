import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { ScrapingOrchestrator } from './orchestrator.js';

export class JobQueueManager {
  constructor(config = {}) {
    this.config = {
      redis: {
        host: config.redisHost || process.env.REDIS_HOST || 'localhost',
        port: config.redisPort || process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        ...config.redis
      },
      concurrency: config.concurrency || 5,
      maxRetries: config.maxRetries || 3,
      backoff: config.backoff || {
        type: 'exponential',
        delay: 5000
      },
      ...config
    };

    this.connection = new Redis(this.config.redis);
    this.queues = new Map();
    this.workers = new Map();
    this.schedulers = new Map();
    this.orchestrator = new ScrapingOrchestrator();
  }

  /**
   * Create or get a queue
   */
  getQueue(name = 'scraping') {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const queue = new Queue(name, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: this.config.maxRetries,
        backoff: this.config.backoff,
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600 // 24 hours
        },
        removeOnFail: {
          count: 5000,
          age: 7 * 24 * 3600 // 7 days
        }
      }
    });

    // Create scheduler for this queue
    const scheduler = new QueueScheduler(name, {
      connection: this.connection
    });

    this.queues.set(name, queue);
    this.schedulers.set(name, scheduler);

    logger.info(`Queue "${name}" created`);
    return queue;
  }

  /**
   * Add scraping job to queue
   */
  async addJob(jobData, options = {}) {
    const queue = this.getQueue(options.queue || 'scraping');

    const job = await queue.add(
      options.jobName || 'scrape',
      {
        ...jobData,
        createdAt: Date.now(),
        priority: options.priority || 'normal'
      },
      {
        priority: this.getPriorityValue(options.priority),
        delay: options.delay || 0,
        repeat: options.repeat,
        jobId: options.jobId,
        ...options.jobOptions
      }
    );

    logger.info(`Job ${job.id} added to queue "${queue.name}"`);
    return job;
  }

  /**
   * Add bulk scraping jobs
   */
  async addBulkJobs(jobsData, options = {}) {
    const queue = this.getQueue(options.queue || 'scraping');

    const jobs = jobsData.map((data, index) => ({
      name: options.jobName || 'scrape',
      data: {
        ...data,
        createdAt: Date.now(),
        batchId: options.batchId || `batch_${Date.now()}`
      },
      opts: {
        priority: this.getPriorityValue(data.priority || options.priority),
        jobId: data.jobId || `${options.batchId || 'batch'}_${index}`
      }
    }));

    const addedJobs = await queue.addBulk(jobs);
    logger.info(`${addedJobs.length} jobs added to queue "${queue.name}"`);
    return addedJobs;
  }

  /**
   * Start worker to process jobs
   */
  startWorker(queueName = 'scraping', processor) {
    if (this.workers.has(queueName)) {
      logger.warn(`Worker for queue "${queueName}" already running`);
      return this.workers.get(queueName);
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        logger.info(`Processing job ${job.id} from queue "${queueName}"`);

        try {
          const result = processor
            ? await processor(job)
            : await this.defaultProcessor(job);

          logger.info(`Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          logger.error(`Job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: this.config.concurrency,
        limiter: {
          max: 10,
          duration: 1000 // Max 10 jobs per second
        }
      }
    );

    // Worker event handlers
    worker.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed:`, {
        duration: Date.now() - job.timestamp,
        attempts: job.attemptsMade
      });
    });

    worker.on('failed', (job, error) => {
      logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);
    });

    worker.on('error', (error) => {
      logger.error(`Worker error in queue "${queueName}":`, error);
    });

    this.workers.set(queueName, worker);
    logger.info(`Worker started for queue "${queueName}" with concurrency ${this.config.concurrency}`);

    return worker;
  }

  /**
   * Default job processor
   */
  async defaultProcessor(job) {
    const { type, url, urls, config } = job.data;

    switch (type) {
      case 'scrape_single':
        return await this.orchestrator.scrapeSingle(url, config);

      case 'scrape_multiple':
        return await this.orchestrator.scrapeMultiple(urls, config);

      case 'scrape_sitemap':
        return await this.orchestrator.scrapeSitemap(url, config);

      case 'scrape_search':
        return await this.orchestrator.scrapeSearch(job.data);

      case 'extract_property_data':
        return await this.orchestrator.extractPropertyData(url, config);

      case 'monitor_page':
        return await this.orchestrator.monitorPage(url, config);

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Schedule recurring scraping job
   */
  async scheduleRecurring(jobData, cronPattern, options = {}) {
    return this.addJob(jobData, {
      ...options,
      repeat: {
        pattern: cronPattern,
        ...options.repeatOptions
      }
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName = 'scraping') {
    const queue = this.getQueue(queueName);

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount()
    ]);

    return {
      queue: queueName,
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
        total: waiting + active + completed + failed + delayed + paused
      }
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllStats() {
    const stats = await Promise.all(
      Array.from(this.queues.keys()).map(name => this.getQueueStats(name))
    );
    return stats;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId, queueName = 'scraping') {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  /**
   * Get job state
   */
  async getJobState(jobId, queueName = 'scraping') {
    const job = await this.getJob(jobId, queueName);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state: await job.getState(),
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue
    };
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId, queueName = 'scraping') {
    const job = await this.getJob(jobId, queueName);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.retry();
    logger.info(`Job ${jobId} scheduled for retry`);
  }

  /**
   * Remove job
   */
  async removeJob(jobId, queueName = 'scraping') {
    const job = await this.getJob(jobId, queueName);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    logger.info(`Job ${jobId} removed`);
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName = 'scraping') {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logger.info(`Queue "${queueName}" paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName = 'scraping') {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logger.info(`Queue "${queueName}" resumed`);
  }

  /**
   * Clean old jobs
   */
  async cleanQueue(queueName = 'scraping', options = {}) {
    const queue = this.getQueue(queueName);

    const grace = options.grace || 24 * 3600 * 1000; // 24 hours
    const limit = options.limit || 1000;

    const cleaned = await Promise.all([
      queue.clean(grace, limit, 'completed'),
      queue.clean(grace * 7, limit, 'failed') // Keep failed jobs longer
    ]);

    logger.info(`Cleaned ${cleaned[0].length} completed and ${cleaned[1].length} failed jobs from "${queueName}"`);
    return cleaned;
  }

  /**
   * Obliterate queue (remove all jobs and queue data)
   */
  async obliterateQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.obliterate();
    logger.warn(`Queue "${queueName}" obliterated`);
  }

  /**
   * Get priority value from string
   */
  getPriorityValue(priority) {
    const priorities = {
      critical: 1,
      high: 2,
      normal: 3,
      low: 4,
      very_low: 5
    };
    return priorities[priority] || priorities.normal;
  }

  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing job queue manager...');

    // Close all workers
    await Promise.all(
      Array.from(this.workers.values()).map(worker => worker.close())
    );

    // Close all queues
    await Promise.all(
      Array.from(this.queues.values()).map(queue => queue.close())
    );

    // Close schedulers
    await Promise.all(
      Array.from(this.schedulers.values()).map(scheduler => scheduler.close())
    );

    // Close Redis connection
    await this.connection.quit();

    logger.info('Job queue manager closed');
  }
}
