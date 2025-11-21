/**
 * Scraper Manager
 *
 * Orchestrates multiple scrapers:
 * - Queue management
 * - Parallel execution
 * - Scheduling
 * - Error handling
 * - Progress tracking
 */

import { CronJob } from 'cron';
import CountyTaxDeedScraper from '../scrapers/CountyTaxDeedScraper.js';
import { getActiveCounties, getCounty } from '../config/counties.config.js';

class ScraperManager {
  constructor(config = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 3,
      scheduleCron: config.scheduleCron || '0 2 * * *', // 2 AM daily
      autoStart: config.autoStart || false,
      onDataScraped: config.onDataScraped || null,
      onError: config.onError || null,
      ...config
    };

    this.queue = [];
    this.running = new Map();
    this.completed = [];
    this.failed = [];
    this.cronJob = null;
    this.isRunning = false;
  }

  /**
   * Initialize the scraper manager
   */
  async initialize() {
    console.log('[ScraperManager] Initializing...');

    if (this.config.autoStart) {
      await this.startScheduler();
    }

    console.log('[ScraperManager] Ready');
  }

  /**
   * Start scheduled scraping
   */
  startScheduler() {
    if (this.cronJob) {
      console.log('[ScraperManager] Scheduler already running');
      return;
    }

    console.log(`[ScraperManager] Starting scheduler: ${this.config.scheduleCron}`);

    this.cronJob = new CronJob(
      this.config.scheduleCron,
      async () => {
        console.log('[ScraperManager] Scheduled scrape triggered');
        await this.scrapeAllCounties();
      },
      null,
      true,
      'America/New_York'
    );
  }

  /**
   * Stop scheduler
   */
  stopScheduler() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[ScraperManager] Scheduler stopped');
    }
  }

  /**
   * Scrape all active counties
   */
  async scrapeAllCounties() {
    const counties = getActiveCounties();
    console.log(`[ScraperManager] Queuing ${counties.length} counties for scraping`);

    for (const county of counties) {
      this.addToQueue({
        type: 'county',
        county,
      });
    }

    await this.processQueue();
  }

  /**
   * Scrape specific county
   */
  async scrapeCounty(countyId) {
    const county = getCounty(countyId);

    if (!county) {
      throw new Error(`County not found: ${countyId}`);
    }

    console.log(`[ScraperManager] Scraping ${county.name} County, ${county.state}`);

    const scraper = new CountyTaxDeedScraper({
      county,
      platformType: county.platformType,
    });

    // Override saveData to use our callback
    const originalSaveData = scraper.saveData.bind(scraper);
    scraper.saveData = async (data) => {
      await originalSaveData(data);
      if (this.config.onDataScraped) {
        await this.config.onDataScraped(data);
      }
    };

    try {
      await scraper.run();
      const stats = scraper.getStats();

      console.log(`[ScraperManager] Completed ${county.name} County:`, {
        itemsScraped: stats.itemsScraped,
        duration: stats.duration,
        successRate: stats.successRate,
      });

      return { success: true, stats };

    } catch (error) {
      console.error(`[ScraperManager] Error scraping ${county.name} County:`, error.message);

      if (this.config.onError) {
        await this.config.onError(error, { county });
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Add job to queue
   */
  addToQueue(job) {
    this.queue.push({
      ...job,
      id: `${job.type}-${Date.now()}-${Math.random()}`,
      status: 'queued',
      addedAt: new Date(),
    });
  }

  /**
   * Process the queue with concurrency limit
   */
  async processQueue() {
    if (this.isRunning) {
      console.log('[ScraperManager] Queue already processing');
      return;
    }

    this.isRunning = true;
    console.log(`[ScraperManager] Processing queue (${this.queue.length} jobs)`);

    while (this.queue.length > 0 || this.running.size > 0) {
      // Start new jobs up to concurrency limit
      while (this.queue.length > 0 && this.running.size < this.config.maxConcurrent) {
        const job = this.queue.shift();
        this.runJob(job);
      }

      // Wait a bit before checking again
      await this.delay(1000);
    }

    this.isRunning = false;
    console.log('[ScraperManager] Queue processing complete');

    return {
      completed: this.completed.length,
      failed: this.failed.length,
      total: this.completed.length + this.failed.length,
    };
  }

  /**
   * Run a single job
   */
  async runJob(job) {
    job.status = 'running';
    job.startedAt = new Date();
    this.running.set(job.id, job);

    console.log(`[ScraperManager] Starting job: ${job.id}`);

    try {
      let result;

      switch (job.type) {
        case 'county':
          result = await this.scrapeCounty(job.county.id);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      this.completed.push(job);
      console.log(`[ScraperManager] Job completed: ${job.id}`);

    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;

      this.failed.push(job);
      console.error(`[ScraperManager] Job failed: ${job.id}`, error.message);

    } finally {
      this.running.delete(job.id);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedulerActive: !!this.cronJob,
      queueLength: this.queue.length,
      runningJobs: this.running.size,
      completedJobs: this.completed.length,
      failedJobs: this.failed.length,
      runningJobDetails: Array.from(this.running.values()).map(job => ({
        id: job.id,
        type: job.type,
        county: job.county?.name,
        startedAt: job.startedAt,
      })),
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalJobs = this.completed.length + this.failed.length;
    const successRate = totalJobs > 0
      ? (this.completed.length / totalJobs * 100).toFixed(2)
      : 0;

    const totalItemsScraped = this.completed.reduce((sum, job) => {
      return sum + (job.result?.stats?.itemsScraped || 0);
    }, 0);

    return {
      totalJobs,
      completedJobs: this.completed.length,
      failedJobs: this.failed.length,
      successRate: `${successRate}%`,
      totalItemsScraped,
      recentJobs: [...this.completed, ...this.failed]
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 10)
        .map(job => ({
          id: job.id,
          type: job.type,
          county: job.county?.name,
          status: job.status,
          itemsScraped: job.result?.stats?.itemsScraped,
          duration: job.completedAt - job.startedAt,
          completedAt: job.completedAt,
        })),
    };
  }

  /**
   * Clear completed and failed jobs
   */
  clearHistory() {
    this.completed = [];
    this.failed = [];
    console.log('[ScraperManager] History cleared');
  }

  /**
   * Stop all running scrapers
   */
  async stopAll() {
    console.log('[ScraperManager] Stopping all scrapers...');
    this.stopScheduler();
    this.queue = [];
    // Note: Individual scrapers need to implement stop() method
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ScraperManager;
