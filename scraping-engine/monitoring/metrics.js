import client from 'prom-client';
import { logger } from '../utils/logger.js';

export class MetricsCollector {
  constructor() {
    // Create a Registry
    this.register = new client.Registry();

    // Add default metrics
    client.collectDefaultMetrics({ register: this.register });

    // Custom metrics for scraping
    this.scrapingDuration = new client.Histogram({
      name: 'scraping_duration_seconds',
      help: 'Duration of scraping operations in seconds',
      labelNames: ['url', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
    });

    this.scrapingTotal = new client.Counter({
      name: 'scraping_total',
      help: 'Total number of scraping operations',
      labelNames: ['status']
    });

    this.scrapingErrors = new client.Counter({
      name: 'scraping_errors_total',
      help: 'Total number of scraping errors',
      labelNames: ['error_type']
    });

    this.activeBrowsers = new client.Gauge({
      name: 'active_browsers',
      help: 'Number of active browser instances'
    });

    this.queueSize = new client.Gauge({
      name: 'queue_size',
      help: 'Number of jobs in queue',
      labelNames: ['queue', 'status']
    });

    this.proxyHealth = new client.Gauge({
      name: 'proxy_health',
      help: 'Number of healthy proxies',
      labelNames: ['type']
    });

    this.dataExtracted = new client.Counter({
      name: 'data_extracted_total',
      help: 'Total amount of data extracted',
      labelNames: ['type']
    });

    this.aiRequests = new client.Counter({
      name: 'ai_requests_total',
      help: 'Total number of AI API requests',
      labelNames: ['provider', 'model', 'status']
    });

    this.aiCost = new client.Counter({
      name: 'ai_cost_total',
      help: 'Total cost of AI API usage in USD',
      labelNames: ['provider', 'model']
    });

    this.rateLimitHits = new client.Counter({
      name: 'rate_limit_hits_total',
      help: 'Number of times rate limit was hit',
      labelNames: ['domain']
    });

    // Register all metrics
    this.register.registerMetric(this.scrapingDuration);
    this.register.registerMetric(this.scrapingTotal);
    this.register.registerMetric(this.scrapingErrors);
    this.register.registerMetric(this.activeBrowsers);
    this.register.registerMetric(this.queueSize);
    this.register.registerMetric(this.proxyHealth);
    this.register.registerMetric(this.dataExtracted);
    this.register.registerMetric(this.aiRequests);
    this.register.registerMetric(this.aiCost);
    this.register.registerMetric(this.rateLimitHits);

    logger.info('Metrics collector initialized');
  }

  recordScrapingDuration(url, duration, status) {
    this.scrapingDuration.observe({ url, status }, duration);
  }

  incrementScrapingTotal(status) {
    this.scrapingTotal.inc({ status });
  }

  incrementScrapingErrors(errorType) {
    this.scrapingErrors.inc({ error_type: errorType });
  }

  setActiveBrowsers(count) {
    this.activeBrowsers.set(count);
  }

  setQueueSize(queue, status, size) {
    this.queueSize.set({ queue, status }, size);
  }

  setProxyHealth(type, count) {
    this.proxyHealth.set({ type }, count);
  }

  incrementDataExtracted(type) {
    this.dataExtracted.inc({ type });
  }

  incrementAIRequests(provider, model, status) {
    this.aiRequests.inc({ provider, model, status });
  }

  addAICost(provider, model, cost) {
    this.aiCost.inc({ provider, model }, cost);
  }

  incrementRateLimitHits(domain) {
    this.rateLimitHits.inc({ domain });
  }

  async getMetrics() {
    return this.register.metrics();
  }

  getContentType() {
    return this.register.contentType;
  }
}

// Singleton instance
export const metrics = new MetricsCollector();
