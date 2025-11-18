import Bottleneck from 'bottleneck';
import { logger } from './logger.js';

export class RateLimiter {
  constructor(config = {}) {
    this.config = {
      defaultMaxConcurrent: config.maxConcurrent || 5,
      defaultMinTime: config.minTime || 1000, // ms between requests
      reservoir: config.reservoir || null,
      reservoirRefreshAmount: config.reservoirRefreshAmount || null,
      reservoirRefreshInterval: config.reservoirRefreshInterval || null,
      ...config
    };

    // Store limiters per domain
    this.limiters = new Map();
    this.domainConfigs = new Map();
  }

  /**
   * Set rate limit for specific domain
   */
  setDomainLimit(domain, config) {
    this.domainConfigs.set(domain, config);
    logger.info(`Rate limit set for ${domain}:`, config);
  }

  /**
   * Get or create limiter for domain
   */
  getLimiter(domain) {
    if (this.limiters.has(domain)) {
      return this.limiters.get(domain);
    }

    const config = this.domainConfigs.get(domain) || {};

    const limiter = new Bottleneck({
      maxConcurrent: config.maxConcurrent || this.config.defaultMaxConcurrent,
      minTime: config.minTime || this.config.defaultMinTime,
      reservoir: config.reservoir || this.config.reservoir,
      reservoirRefreshAmount: config.reservoirRefreshAmount || this.config.reservoirRefreshAmount,
      reservoirRefreshInterval: config.reservoirRefreshInterval || this.config.reservoirRefreshInterval,
      highWater: config.highWater || 0,
      strategy: Bottleneck.strategy.LEAK
    });

    // Event handlers
    limiter.on('failed', async (error, jobInfo) => {
      const id = jobInfo.options.id;
      logger.warn(`Job ${id} failed: ${error}`);

      if (jobInfo.retryCount < 3) {
        logger.info(`Retrying job ${id} in ${jobInfo.retryCount * 2000}ms...`);
        return jobInfo.retryCount * 2000;
      }
    });

    limiter.on('retry', (error, jobInfo) => {
      logger.info(`Job ${jobInfo.options.id} is being retried (attempt ${jobInfo.retryCount})`);
    });

    limiter.on('depleted', () => {
      logger.warn(`Rate limiter for ${domain} depleted`);
    });

    this.limiters.set(domain, limiter);
    return limiter;
  }

  /**
   * Schedule a task with rate limiting
   */
  async schedule(domain, task, priority = 5) {
    const limiter = this.getLimiter(domain);

    return limiter.schedule({ priority }, async () => {
      logger.debug(`Executing task for ${domain}`);
      return await task();
    });
  }

  /**
   * Throttle a promise
   */
  async throttle(domain, priority) {
    const limiter = this.getLimiter(domain);
    await limiter.schedule({ priority }, () => Promise.resolve());
  }

  /**
   * Get limiter statistics
   */
  getStats(domain) {
    const limiter = this.limiters.get(domain);
    if (!limiter) {
      return null;
    }

    return {
      domain,
      running: limiter.running(),
      queued: limiter.queued(),
      done: limiter.done,
      failed: limiter.failed
    };
  }

  /**
   * Get all statistics
   */
  getAllStats() {
    const stats = {};
    for (const [domain, limiter] of this.limiters.entries()) {
      stats[domain] = {
        running: limiter.running(),
        queued: limiter.queued(),
        done: limiter.done,
        failed: limiter.failed
      };
    }
    return stats;
  }

  /**
   * Clear rate limiter for domain
   */
  async clear(domain) {
    const limiter = this.limiters.get(domain);
    if (limiter) {
      await limiter.stop({ dropWaitingJobs: false });
      this.limiters.delete(domain);
      logger.info(`Rate limiter cleared for ${domain}`);
    }
  }

  /**
   * Clear all rate limiters
   */
  async clearAll() {
    const promises = Array.from(this.limiters.keys()).map(domain => this.clear(domain));
    await Promise.all(promises);
    logger.info('All rate limiters cleared');
  }

  /**
   * Update reservoir (for APIs with request quotas)
   */
  updateReservoir(domain, amount) {
    const limiter = this.limiters.get(domain);
    if (limiter) {
      limiter.updateSettings({
        reservoir: amount
      });
      logger.info(`Reservoir updated for ${domain}: ${amount}`);
    }
  }
}
