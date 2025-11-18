/**
 * Base Scraper Class
 * Abstract base class for all data source scrapers
 */

export class BaseScraper {
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 2000,
      timeout: config.timeout || 30000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...config
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      recordsScraped: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Main scraping method - must be implemented by subclasses
   */
  async scrape(params = {}) {
    throw new Error('scrape() must be implemented by subclass');
  }

  /**
   * Login/authentication - override if needed
   */
  async authenticate(credentials) {
    throw new Error('authenticate() must be implemented by subclass');
  }

  /**
   * Extract data from page - must be implemented by subclasses
   */
  async extractData(page, selector) {
    throw new Error('extractData() must be implemented by subclass');
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(url, options = {}) {
    const maxRetries = options.maxRetries || this.config.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.stats.totalRequests++;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': this.config.userAgent,
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.stats.successfulRequests++;
        return response;

      } catch (error) {
        lastError = error;
        this.stats.failedRequests++;

        console.warn(`Request attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Request failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Parse HTML or JSON response
   */
  async parseResponse(response, type = 'html') {
    if (type === 'json') {
      return await response.json();
    } else if (type === 'text' || type === 'html') {
      return await response.text();
    } else {
      throw new Error(`Unsupported response type: ${type}`);
    }
  }

  /**
   * Extract data using CSS selectors (client-side simulation)
   */
  parseHTML(html, selectors) {
    // This is a simplified version - in production, use a proper HTML parser
    // like cheerio (Node.js) or DOMParser (browser)

    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const results = {};
      for (const [key, selector] of Object.entries(selectors)) {
        const element = doc.querySelector(selector);
        results[key] = element ? element.textContent.trim() : null;
      }

      return results;
    } else {
      console.warn('DOMParser not available - HTML parsing limited');
      return {};
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Rate limiting
   */
  async rateLimit(requestsPerSecond = 2) {
    const delay = 1000 / requestsPerSecond;
    await this.sleep(delay);
  }

  /**
   * Start scraping session
   */
  startSession() {
    this.stats.startTime = new Date();
    this.stats.totalRequests = 0;
    this.stats.successfulRequests = 0;
    this.stats.failedRequests = 0;
    this.stats.recordsScraped = 0;
  }

  /**
   * End scraping session
   */
  endSession() {
    this.stats.endTime = new Date();
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;

    return {
      ...this.stats,
      duration: `${duration.toFixed(2)}s`,
      successRate: `${((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2)}%`
    };
  }

  /**
   * Log scraping activity
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${this.constructor.name}] ${message}`, data);
  }
}
