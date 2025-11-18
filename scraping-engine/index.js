#!/usr/bin/env node

import dotenv from 'dotenv';
import { JobQueueManager } from './queue/job-queue.js';
import { ScrapingOrchestrator } from './queue/orchestrator.js';
import { logger } from './utils/logger.js';
import config from './config/default.js';

// Load environment variables
dotenv.config();

class ScrapingEngine {
  constructor(customConfig = {}) {
    this.config = { ...config, ...customConfig };
    this.jobQueue = new JobQueueManager(this.config.queue);
    this.orchestrator = new ScrapingOrchestrator(this.config.scraping);
    this.isRunning = false;
  }

  /**
   * Start the scraping engine
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Scraping engine is already running');
      return;
    }

    logger.info('Starting AI-driven scraping engine...');

    try {
      // Start workers
      this.jobQueue.startWorker('scraping');
      this.jobQueue.startWorker('extraction');

      this.isRunning = true;
      logger.info('Scraping engine started successfully');

      // Display stats periodically
      this.statsInterval = setInterval(async () => {
        await this.displayStats();
      }, 60000); // Every minute

    } catch (error) {
      logger.error('Failed to start scraping engine:', error);
      throw error;
    }
  }

  /**
   * Stop the scraping engine
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Scraping engine is not running');
      return;
    }

    logger.info('Stopping scraping engine...');

    try {
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
      }

      await this.jobQueue.close();
      await this.orchestrator.browserManager.closeAll();
      await this.orchestrator.dataPipeline.close();

      this.isRunning = false;
      logger.info('Scraping engine stopped successfully');
    } catch (error) {
      logger.error('Error stopping scraping engine:', error);
      throw error;
    }
  }

  /**
   * Submit a scraping job
   */
  async scrape(url, options = {}) {
    return this.jobQueue.addJob({
      type: 'scrape_single',
      url,
      config: options
    }, {
      priority: options.priority || 'normal'
    });
  }

  /**
   * Submit multiple scraping jobs
   */
  async scrapeMultiple(urls, options = {}) {
    return this.jobQueue.addJob({
      type: 'scrape_multiple',
      urls,
      config: options
    });
  }

  /**
   * Submit sitemap scraping job
   */
  async scrapeSitemap(sitemapUrl, options = {}) {
    return this.jobQueue.addJob({
      type: 'scrape_sitemap',
      url: sitemapUrl,
      config: options
    });
  }

  /**
   * Extract property data
   */
  async extractPropertyData(url, options = {}) {
    return this.jobQueue.addJob({
      type: 'extract_property_data',
      url,
      config: options
    }, {
      queue: 'extraction',
      priority: 'high'
    });
  }

  /**
   * Schedule recurring scraping
   */
  async scheduleRecurring(jobData, cronPattern, options = {}) {
    return this.jobQueue.scheduleRecurring(jobData, cronPattern, options);
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId, queue = 'scraping') {
    return this.jobQueue.getJobState(jobId, queue);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return this.jobQueue.getAllStats();
  }

  /**
   * Display engine statistics
   */
  async displayStats() {
    try {
      const stats = await this.getQueueStats();

      logger.info('=== Scraping Engine Statistics ===');
      for (const queueStats of stats) {
        logger.info(`Queue: ${queueStats.queue}`);
        logger.info(`  Waiting: ${queueStats.counts.waiting}`);
        logger.info(`  Active: ${queueStats.counts.active}`);
        logger.info(`  Completed: ${queueStats.counts.completed}`);
        logger.info(`  Failed: ${queueStats.counts.failed}`);
      }

      const browserStats = this.orchestrator.browserManager.getBrowserStats();
      logger.info(`Active Browsers: ${browserStats.active}`);

      const proxyStats = this.orchestrator.proxyManager.getStats();
      logger.info(`Proxies: ${proxyStats.healthy}/${proxyStats.total} healthy`);

      logger.info('===================================');
    } catch (error) {
      logger.error('Failed to display stats:', error);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const engine = new ScrapingEngine();

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Received shutdown signal');
    await engine.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start engine
  await engine.start();

  // Example usage - you can customize this
  logger.info('Scraping engine is ready to accept jobs');
  logger.info('Submit jobs via API or programmatically');
}

export default ScrapingEngine;
export { ScrapingEngine };
