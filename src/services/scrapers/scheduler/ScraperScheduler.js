/**
 * Scraper Scheduler
 * Manages automated execution of scraping jobs
 */

import { supabase } from '../../../lib/customSupabaseClient.js';
import TaxSaleResourcesScraper from '../sources/TaxSaleResourcesScraper.js';
import PropertyTransformer from '../transformers/PropertyTransformer.js';

export class ScraperScheduler {
  constructor(config = {}) {
    this.config = {
      defaultInterval: config.defaultInterval || '0 2 * * *', // 2 AM daily
      maxConcurrent: config.maxConcurrent || 3,
      retryAttempts: config.retryAttempts || 3,
      ...config
    };

    this.jobs = new Map();
    this.activeJobs = new Set();
  }

  /**
   * Register a scraping job
   */
  registerJob(name, scraperClass, config = {}) {
    this.jobs.set(name, {
      name,
      scraperClass,
      config,
      schedule: config.schedule || this.config.defaultInterval,
      enabled: config.enabled !== false,
      lastRun: null,
      nextRun: null,
      stats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        totalRecordsScraped: 0
      }
    });

    console.log(`Registered scraper job: ${name}`);
  }

  /**
   * Execute a specific job
   */
  async executeJob(jobName, params = {}) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    if (this.activeJobs.has(jobName)) {
      console.warn(`Job ${jobName} is already running`);
      return { success: false, error: 'Job already running' };
    }

    this.activeJobs.add(jobName);
    job.lastRun = new Date();
    job.stats.totalRuns++;

    console.log(`Starting scraper job: ${jobName}`);

    try {
      // Create scraper instance
      const scraper = new job.scraperClass(job.config);

      // Authenticate if credentials available
      const credentials = await this.getCredentials(jobName);
      if (credentials) {
        await scraper.authenticate(credentials);
      }

      // Execute scraping
      const records = await scraper.scrape(params);

      console.log(`Scraped ${records.length} records from ${jobName}`);

      // Transform and save to database
      const transformer = new PropertyTransformer();
      const result = await transformer.transformAndSave(records, jobName);

      // Update job stats
      job.stats.successfulRuns++;
      job.stats.totalRecordsScraped += result.count || 0;

      // Log job execution
      await this.logExecution(jobName, {
        status: 'success',
        recordsScraped: records.length,
        recordsSaved: result.count || 0,
        duration: scraper.stats.duration
      });

      console.log(`Job ${jobName} completed successfully`);

      return {
        success: true,
        recordsScraped: records.length,
        recordsSaved: result.count || 0,
        stats: job.stats
      };

    } catch (error) {
      console.error(`Job ${jobName} failed:`, error);

      job.stats.failedRuns++;

      // Log failed execution
      await this.logExecution(jobName, {
        status: 'failed',
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };

    } finally {
      this.activeJobs.delete(jobName);
      this.scheduleNextRun(job);
    }
  }

  /**
   * Execute all enabled jobs
   */
  async executeAll(params = {}) {
    const results = {};

    for (const [jobName, job] of this.jobs) {
      if (job.enabled) {
        results[jobName] = await this.executeJob(jobName, params);

        // Delay between jobs to avoid rate limiting
        await this.sleep(5000);
      }
    }

    return results;
  }

  /**
   * Get credentials for a scraper
   */
  async getCredentials(scraperName) {
    try {
      // Try to get credentials from database
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_value, metadata')
        .eq('key_name', `${scraperName}_credentials`)
        .single();

      if (error) {
        console.warn(`No credentials found for ${scraperName}`);
        return null;
      }

      // Decrypt credentials
      const decrypted = await supabase.rpc('get_api_key', {
        key_name: `${scraperName}_credentials`
      });

      if (decrypted.data) {
        return JSON.parse(decrypted.data.decrypted_value);
      }

    } catch (error) {
      console.error(`Error retrieving credentials for ${scraperName}:`, error);
    }

    return null;
  }

  /**
   * Log job execution to database
   */
  async logExecution(jobName, details) {
    try {
      await supabase
        .from('scout_agents')
        .insert({
          agent_name: jobName,
          status: details.status,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          results: details
        });
    } catch (error) {
      console.error('Error logging execution:', error);
    }
  }

  /**
   * Schedule next run for a job
   */
  scheduleNextRun(job) {
    // Parse cron schedule and calculate next run time
    // For simplicity, using fixed intervals
    const interval = this.parseCronToMs(job.schedule);
    job.nextRun = new Date(Date.now() + interval);

    console.log(`Next run for ${job.name} scheduled at ${job.nextRun.toISOString()}`);
  }

  /**
   * Parse cron expression to milliseconds (simplified)
   */
  parseCronToMs(cronExpression) {
    // Simplified parser - in production use a proper cron library
    // Default: run daily (24 hours)
    return 24 * 60 * 60 * 1000;
  }

  /**
   * Start scheduler
   */
  async start() {
    console.log('Scraper scheduler started');

    // Check for jobs to run every minute
    setInterval(async () => {
      const now = new Date();

      for (const [jobName, job] of this.jobs) {
        if (job.enabled && job.nextRun && now >= job.nextRun) {
          console.log(`Auto-executing scheduled job: ${jobName}`);
          await this.executeJob(jobName);
        }
      }
    }, 60000); // Check every minute

    // Initialize next run times
    for (const job of this.jobs.values()) {
      if (job.enabled) {
        this.scheduleNextRun(job);
      }
    }
  }

  /**
   * Stop scheduler
   */
  stop() {
    console.log('Scraper scheduler stopped');
    // In production, clear intervals
  }

  /**
   * Get job status
   */
  getJobStatus(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) return null;

    return {
      name: job.name,
      enabled: job.enabled,
      isRunning: this.activeJobs.has(jobName),
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      stats: job.stats
    };
  }

  /**
   * Get all jobs status
   */
  getAllJobsStatus() {
    const status = [];

    for (const [jobName] of this.jobs) {
      status.push(this.getJobStatus(jobName));
    }

    return status;
  }

  /**
   * Enable/disable job
   */
  setJobEnabled(jobName, enabled) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.enabled = enabled;

      if (enabled) {
        this.scheduleNextRun(job);
      }

      console.log(`Job ${jobName} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create default scheduler instance
export const defaultScheduler = new ScraperScheduler();

// Register TaxSaleResources scraper
defaultScheduler.registerJob(
  'taxsaleresources',
  TaxSaleResourcesScraper,
  {
    schedule: '0 2 * * *', // 2 AM daily
    enabled: true,
    maxRetries: 3
  }
);

export default ScraperScheduler;
