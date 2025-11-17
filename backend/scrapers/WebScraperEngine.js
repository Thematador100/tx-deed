/**
 * Web Scraper Engine with Anti-Detection
 * Advanced scraping engine for county websites and property data sources
 * Implements stealth techniques to avoid detection
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import proxyManager from '../services/ProxyManager.js';
import userAgentRotator from '../services/UserAgentRotator.js';
import rateLimiter from '../services/RateLimiter.js';
import config from '../config/config.js';

// Enable stealth mode
puppeteer.use(StealthPlugin());

class WebScraperEngine {
  constructor() {
    this.browser = null;
    this.pages = new Map();
    this.scrapingQueue = [];
    this.stats = {
      pagesScraped: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      blocked: 0,
    };
  }

  async initialize() {
    if (this.browser) {
      return this.browser;
    }

    const scrapingConfig = config.get('scraping');
    const proxy = proxyManager.getCurrentProxy();

    const launchOptions = {
      headless: scrapingConfig.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    };

    // Add proxy if available
    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy.host}:${proxy.port}`);
    }

    this.browser = await puppeteer.launch(launchOptions);

    console.log('[WebScraperEngine] Browser initialized');
    return this.browser;
  }

  async createPage() {
    await this.initialize();

    const page = await this.browser.newPage();
    const pageId = Math.random().toString(36).substring(7);

    // Authenticate proxy if needed
    const proxy = proxyManager.getCurrentProxy();
    if (proxy?.username) {
      await page.authenticate({
        username: proxy.username,
        password: proxy.password,
      });
    }

    // Set random user agent
    const userAgent = userAgentRotator.getRandomUserAgent();
    await page.setUserAgent(userAgent);

    // Set viewport to realistic size
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    // Add anti-detection measures
    await this.injectAntiDetectionScripts(page);

    // Set realistic timeout
    page.setDefaultTimeout(config.get('scraping.timeout'));

    this.pages.set(pageId, page);

    return { page, pageId };
  }

  async injectAntiDetectionScripts(page) {
    // Override webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Override plugins and languages
    await page.evaluateOnNewDocument(() => {
      // Chrome plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Add chrome runtime
      window.chrome = {
        runtime: {},
      };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
      );
    });

    // Add realistic mouse movements
    await page.evaluateOnNewDocument(() => {
      let lastX = 0;
      let lastY = 0;

      window.addEventListener('mousemove', (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
      });

      // Simulate human-like movements
      window.humanMove = (x, y) => {
        const steps = 10;
        const deltaX = (x - lastX) / steps;
        const deltaY = (y - lastY) / steps;

        for (let i = 0; i < steps; i++) {
          setTimeout(() => {
            const event = new MouseEvent('mousemove', {
              clientX: lastX + deltaX * i,
              clientY: lastY + deltaY * i,
            });
            window.dispatchEvent(event);
          }, i * 10);
        }
      };
    });
  }

  async scrapeUrl(url, options = {}) {
    const {
      selector = null,
      waitFor = null,
      extractData = null,
      screenshot = false,
      retryOnFail = true,
    } = options;

    const scrapingConfig = config.get('scraping');
    let attempts = 0;
    let lastError = null;

    while (attempts <= scrapingConfig.retryAttempts) {
      try {
        // Apply rate limiting
        await rateLimiter.acquireToken();

        const { page, pageId } = await this.createPage();

        this.stats.pagesScraped++;

        // Navigate to URL
        console.log(`[WebScraperEngine] Navigating to: ${url}`);

        const response = await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: scrapingConfig.timeout,
        });

        // Check if blocked
        if (this.isBlockedResponse(response)) {
          throw new Error('Request blocked by target website');
        }

        // Wait for specific element if provided
        if (waitFor) {
          await page.waitForSelector(waitFor, {
            timeout: scrapingConfig.timeout,
          });
        }

        // Random human-like delay
        await this.randomDelay(1000, 3000);

        // Extract data
        let data = null;

        if (extractData && typeof extractData === 'function') {
          data = await page.evaluate(extractData);
        } else if (selector) {
          data = await page.$$eval(selector, elements =>
            elements.map(el => ({
              text: el.textContent?.trim(),
              html: el.innerHTML,
              href: el.href || null,
            }))
          );
        } else {
          data = await page.content();
        }

        // Take screenshot if requested
        let screenshotPath = null;
        if (screenshot) {
          screenshotPath = `/tmp/screenshot-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath });
        }

        // Clean up page
        await page.close();
        this.pages.delete(pageId);

        rateLimiter.releaseToken();
        this.stats.successfulScrapes++;

        return {
          success: true,
          data,
          url,
          screenshot: screenshotPath,
          scrapedAt: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error;
        attempts++;

        this.stats.failedScrapes++;

        if (error.message.includes('blocked')) {
          this.stats.blocked++;
          // Rotate proxy on block
          proxyManager.markProxyAsFailed();
        }

        console.error(`[WebScraperEngine] Scraping attempt ${attempts} failed: ${error.message}`);

        if (attempts <= scrapingConfig.retryAttempts) {
          const backoffDelay = this.calculateBackoff(attempts, scrapingConfig.retryDelay);
          console.log(`[WebScraperEngine] Retrying in ${backoffDelay}ms...`);
          await this.sleep(backoffDelay);
        }

        rateLimiter.releaseToken();
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      url,
      attempts,
    };
  }

  async scrapeCountyTaxSales(countyName, stateCode) {
    // County-specific scraping logic
    const countyConfig = this.getCountyConfig(countyName, stateCode);

    if (!countyConfig) {
      throw new Error(`No scraping configuration for ${countyName}, ${stateCode}`);
    }

    console.log(`[WebScraperEngine] Scraping tax sales for ${countyName}, ${stateCode}`);

    const result = await this.scrapeUrl(countyConfig.url, {
      selector: countyConfig.selector,
      waitFor: countyConfig.waitFor,
      extractData: countyConfig.extractData,
    });

    if (!result.success) {
      throw new Error(`Failed to scrape ${countyName}: ${result.error}`);
    }

    // Parse and normalize data
    const properties = this.parseCountyData(result.data, countyConfig);

    return {
      county: countyName,
      state: stateCode,
      properties,
      scrapedAt: result.scrapedAt,
    };
  }

  getCountyConfig(countyName, stateCode) {
    // Example configurations - would be expanded for all counties
    const configs = {
      'Travis-TX': {
        url: 'https://tax-office.traviscountytx.gov/properties',
        selector: '.property-listing',
        waitFor: '.property-listing',
        extractData: () => {
          const properties = [];
          document.querySelectorAll('.property-listing').forEach(prop => {
            properties.push({
              address: prop.querySelector('.address')?.textContent?.trim(),
              owner: prop.querySelector('.owner')?.textContent?.trim(),
              taxAmount: prop.querySelector('.tax-amount')?.textContent?.trim(),
              auctionDate: prop.querySelector('.auction-date')?.textContent?.trim(),
            });
          });
          return properties;
        },
      },
      'Harris-TX': {
        url: 'https://www.hctax.net/Property/PropertyTax',
        selector: '.tax-property',
        waitFor: '.tax-property',
        extractData: () => {
          const properties = [];
          document.querySelectorAll('.tax-property').forEach(prop => {
            properties.push({
              address: prop.querySelector('.prop-address')?.textContent?.trim(),
              assessedValue: prop.querySelector('.assessed-value')?.textContent?.trim(),
              delinquentAmount: prop.querySelector('.delinquent')?.textContent?.trim(),
            });
          });
          return properties;
        },
      },
      // Add more county configurations here
    };

    return configs[`${countyName}-${stateCode}`];
  }

  parseCountyData(data, config) {
    // Normalize data from different county formats
    if (Array.isArray(data)) {
      return data.map(prop => ({
        address: prop.address || prop.PropertyAddress || prop.location,
        owner: prop.owner || prop.OwnerName,
        assessedValue: this.parseMoneyValue(prop.assessedValue || prop.AssessedValue),
        taxAmount: this.parseMoneyValue(prop.taxAmount || prop.TaxAmount),
        delinquentAmount: this.parseMoneyValue(prop.delinquentAmount || prop.DelinquentAmount),
        auctionDate: this.parseDate(prop.auctionDate || prop.AuctionDate),
        source: 'county_scraper',
        scrapedAt: new Date().toISOString(),
      }));
    }

    return [];
  }

  parseMoneyValue(value) {
    if (!value) return null;

    const cleaned = value.toString().replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
  }

  parseDate(value) {
    if (!value) return null;

    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  isBlockedResponse(response) {
    const status = response?.status();
    const blockedCodes = [403, 429, 503];

    if (blockedCodes.includes(status)) {
      return true;
    }

    // Check for CAPTCHA or blocking page
    // This would be more sophisticated in production
    return false;
  }

  calculateBackoff(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }

  async randomDelay(min, max) {
    const delay = min + Math.random() * (max - min);
    await this.sleep(delay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async closePage(pageId) {
    const page = this.pages.get(pageId);
    if (page) {
      await page.close();
      this.pages.delete(pageId);
    }
  }

  async shutdown() {
    // Close all pages
    for (const [pageId, page] of this.pages.entries()) {
      await page.close();
    }
    this.pages.clear();

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log('[WebScraperEngine] Shutdown complete');
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.pagesScraped > 0
        ? ((this.stats.successfulScrapes / this.stats.pagesScraped) * 100).toFixed(2) + '%'
        : '0%',
      blockRate: this.stats.pagesScraped > 0
        ? ((this.stats.blocked / this.stats.pagesScraped) * 100).toFixed(2) + '%'
        : '0%',
      activePages: this.pages.size,
    };
  }

  resetStats() {
    this.stats = {
      pagesScraped: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      blocked: 0,
    };
    console.log('[WebScraperEngine] Reset statistics');
  }
}

// Export singleton instance
const webScraperEngine = new WebScraperEngine();
export default webScraperEngine;
