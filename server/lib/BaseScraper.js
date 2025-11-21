/**
 * Base Scraper Class
 *
 * Abstract base class for all scrapers with:
 * - Error handling and retry logic
 * - Rate limiting
 * - Data validation
 * - Logging
 * - Session management
 */

import BrowserManager from './BrowserManager.js';
import * as cheerio from 'cheerio';
import axios from 'axios';

class BaseScraper {
  constructor(config = {}) {
    this.config = {
      name: config.name || 'UnnamedScraper',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      requestDelay: config.requestDelay || 2000,
      timeout: config.timeout || 30000,
      useProxy: config.useProxy || false,
      proxy: config.proxy || null,
      ...config
    };

    this.browserManager = null;
    this.stats = {
      started: null,
      completed: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      itemsScraped: 0,
      errors: []
    };

    this.isRunning = false;
    this.shouldStop = false;
  }

  /**
   * Initialize scraper
   */
  async initialize() {
    this.log('Initializing scraper...');
    this.stats.started = new Date();
    this.isRunning = true;
    this.shouldStop = false;

    if (this.config.useBrowser) {
      this.browserManager = new BrowserManager({
        proxy: this.config.proxy,
        timeout: this.config.timeout,
      });
      await this.browserManager.launch();
    }

    await this.onInitialize();
  }

  /**
   * Override this in child classes
   */
  async onInitialize() {
    // Custom initialization logic
  }

  /**
   * Main scraping method - override in child classes
   */
  async scrape() {
    throw new Error('scrape() method must be implemented in child class');
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(url, options = {}, retries = 0) {
    this.stats.totalRequests++;

    try {
      // Rate limiting
      await this.delay(this.config.requestDelay);

      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers
        },
        timeout: this.config.timeout,
        ...options
      });

      this.stats.successfulRequests++;
      return response;

    } catch (error) {
      this.stats.failedRequests++;

      if (retries < this.config.maxRetries) {
        this.log(`Request failed, retrying (${retries + 1}/${this.config.maxRetries})...`);
        await this.delay(this.config.retryDelay * (retries + 1));
        return this.makeRequest(url, options, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Parse HTML with Cheerio
   */
  parseHTML(html) {
    return cheerio.load(html);
  }

  /**
   * Navigate to page with browser
   */
  async navigateToPage(pageId, url, options = {}) {
    if (!this.browserManager) {
      throw new Error('Browser not initialized. Set useBrowser: true in config');
    }

    let page = this.browserManager.getPage(pageId);
    if (!page) {
      page = await this.browserManager.createPage(pageId);
    }

    await this.browserManager.navigateHuman(page, url, options);
    return page;
  }

  /**
   * Extract data - override in child classes
   */
  async extractData(html, metadata = {}) {
    throw new Error('extractData() method must be implemented in child class');
  }

  /**
   * Validate scraped data
   */
  validateData(data) {
    // Basic validation - override in child classes for specific validation
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid data format'] };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Transform data to standard format
   */
  async transformData(rawData) {
    // Default transformation - override in child classes
    return rawData;
  }

  /**
   * Save scraped data
   */
  async saveData(data) {
    // Override in child classes to implement database save
    this.log(`Data saved: ${JSON.stringify(data, null, 2)}`);
    this.stats.itemsScraped++;
  }

  /**
   * Handle errors
   */
  handleError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    };

    this.stats.errors.push(errorInfo);
    this.log(`Error: ${error.message}`, 'error');

    // Override in child classes for custom error handling
    this.onError(error, context);
  }

  /**
   * Override for custom error handling
   */
  onError(error, context) {
    // Custom error handling
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.log('Cleaning up resources...');

    if (this.browserManager) {
      await this.browserManager.close();
    }

    this.stats.completed = new Date();
    this.isRunning = false;

    await this.onCleanup();
  }

  /**
   * Override for custom cleanup
   */
  async onCleanup() {
    // Custom cleanup logic
  }

  /**
   * Stop scraper gracefully
   */
  async stop() {
    this.log('Stopping scraper...');
    this.shouldStop = true;
    await this.cleanup();
  }

  /**
   * Delay execution
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Random delay
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.delay(delay);
  }

  /**
   * Logging
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.config.name}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ERROR:`, message);
        break;
      case 'warn':
        console.warn(`${prefix} WARN:`, message);
        break;
      case 'debug':
        if (this.config.debug) {
          console.log(`${prefix} DEBUG:`, message);
        }
        break;
      default:
        console.log(`${prefix}`, message);
    }
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    const duration = this.stats.completed
      ? this.stats.completed - this.stats.started
      : Date.now() - this.stats.started;

    return {
      ...this.stats,
      duration,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Run the scraper with full lifecycle
   */
  async run() {
    try {
      await this.initialize();
      await this.scrape();
    } catch (error) {
      this.handleError(error, { phase: 'run' });
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

export default BaseScraper;
