import { BrowserManager } from '../core/browser-manager.js';
import { AIExtractionEngine } from '../ai/extraction-engine.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import { DataPipeline } from '../storage/data-pipeline.js';
import { logger } from '../utils/logger.js';
import cheerio from 'cheerio';
import axios from 'axios';
import robotsParser from 'robots-parser';

export class ScrapingOrchestrator {
  constructor(config = {}) {
    this.config = {
      respectRobotsTxt: config.respectRobotsTxt ?? true,
      defaultDelay: config.defaultDelay || 1000,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      ...config
    };

    this.browserManager = new BrowserManager(config.browser);
    this.aiEngine = new AIExtractionEngine(config.ai);
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.dataPipeline = new DataPipeline(config.storage);
    this.robotsCache = new Map();
  }

  /**
   * Scrape a single URL
   */
  async scrapeSingle(url, config = {}) {
    logger.info(`Starting single page scrape: ${url}`);

    // Check robots.txt
    if (this.config.respectRobotsTxt) {
      const allowed = await this.checkRobotsTxt(url);
      if (!allowed) {
        throw new Error(`Scraping ${url} is disallowed by robots.txt`);
      }
    }

    // Rate limiting
    await this.rateLimiter.throttle(this.getDomain(url));

    let browserId;
    let page;

    try {
      // Create browser and page
      const { browserId: bid, browser } = await this.browserManager.createBrowser();
      browserId = bid;
      page = await this.browserManager.createPage(browserId, url);

      // Navigate to page
      await this.browserManager.navigate(page, url, config.navigation);

      // Wait for dynamic content if specified
      if (config.waitFor) {
        await page.waitForSelector(config.waitFor, {
          timeout: config.timeout || this.config.timeout
        });
      }

      // Additional wait for JavaScript rendering
      if (config.waitForJs !== false) {
        await page.waitForTimeout(config.jsWaitTime || 2000);
      }

      // Execute custom scripts if provided
      if (config.beforeExtract) {
        await page.evaluate(config.beforeExtract);
      }

      // Get page content
      const html = await page.content();
      const pageUrl = page.url();

      // Take screenshot if requested
      let screenshot;
      if (config.screenshot) {
        screenshot = await page.screenshot({
          fullPage: config.fullPageScreenshot ?? true,
          type: config.screenshotType || 'png'
        });
      }

      // Extract data
      let data;
      if (config.extractionMethod === 'ai') {
        data = await this.extractWithAI(html, pageUrl, config);
      } else if (config.selectors) {
        data = await this.extractWithSelectors(page, config.selectors);
      } else {
        data = { html, url: pageUrl };
      }

      // Get metadata
      const metadata = await this.getPageMetadata(page);

      const result = {
        url: pageUrl,
        originalUrl: url,
        data,
        metadata,
        screenshot: screenshot ? screenshot.toString('base64') : null,
        scrapedAt: new Date().toISOString(),
        success: true
      };

      // Save to storage
      if (config.save !== false) {
        await this.dataPipeline.save(result, config.collection);
      }

      // Emit event
      if (config.onSuccess) {
        await config.onSuccess(result);
      }

      logger.info(`Successfully scraped: ${url}`);
      return result;

    } catch (error) {
      logger.error(`Failed to scrape ${url}:`, error);

      const errorResult = {
        url,
        success: false,
        error: error.message,
        scrapedAt: new Date().toISOString()
      };

      if (config.onError) {
        await config.onError(errorResult);
      }

      throw error;

    } finally {
      // Cleanup
      if (page) await page.close();
      if (browserId) await this.browserManager.closeBrowser(browserId);
    }
  }

  /**
   * Scrape multiple URLs
   */
  async scrapeMultiple(urls, config = {}) {
    logger.info(`Starting batch scrape of ${urls.length} URLs`);

    const concurrency = config.concurrency || 3;
    const results = [];

    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(url => this.scrapeSingle(url, config))
      );

      results.push(...batchResults.map((result, idx) => ({
        url: batch[idx],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      })));

      // Delay between batches
      if (i + concurrency < urls.length) {
        await this.delay(config.batchDelay || 5000);
      }
    }

    logger.info(`Batch scrape completed: ${results.filter(r => r.success).length}/${urls.length} successful`);
    return results;
  }

  /**
   * Scrape entire sitemap
   */
  async scrapeSitemap(sitemapUrl, config = {}) {
    logger.info(`Scraping sitemap: ${sitemapUrl}`);

    // Fetch and parse sitemap
    const urls = await this.parseSitemap(sitemapUrl);
    logger.info(`Found ${urls.length} URLs in sitemap`);

    // Filter URLs if filter function provided
    const filteredUrls = config.urlFilter
      ? urls.filter(config.urlFilter)
      : urls;

    logger.info(`Scraping ${filteredUrls.length} filtered URLs`);

    return this.scrapeMultiple(filteredUrls, config);
  }

  /**
   * Scrape search results
   */
  async scrapeSearch(searchConfig) {
    const { searchEngine, query, pages = 1, config = {} } = searchConfig;

    logger.info(`Scraping search results for: ${query} (${pages} pages)`);

    const urls = await this.getSearchUrls(searchEngine, query, pages);
    return this.scrapeMultiple(urls, config);
  }

  /**
   * Extract property data specifically
   */
  async extractPropertyData(url, config = {}) {
    logger.info(`Extracting property data from: ${url}`);

    const result = await this.scrapeSingle(url, {
      ...config,
      extractionMethod: 'ai'
    });

    // Use AI to extract structured property data
    if (result.success && result.data.html) {
      const propertyData = await this.aiEngine.extractPropertyData(
        result.data.html,
        url
      );

      result.data = { ...result.data, ...propertyData };
    }

    return result;
  }

  /**
   * Monitor page for changes
   */
  async monitorPage(url, config = {}) {
    const interval = config.interval || 3600000; // 1 hour
    const compareWith = config.compareWith || 'previous';

    logger.info(`Starting page monitoring for: ${url} (interval: ${interval}ms)`);

    let previousData = null;

    const check = async () => {
      try {
        const result = await this.scrapeSingle(url, config);

        if (previousData) {
          const changes = this.detectChanges(previousData, result.data);

          if (changes.length > 0) {
            logger.info(`Detected ${changes.length} changes on ${url}`);

            if (config.onChanges) {
              await config.onChanges({ url, changes, data: result.data });
            }
          }
        }

        previousData = result.data;
      } catch (error) {
        logger.error(`Monitoring check failed for ${url}:`, error);
      }
    };

    // Initial check
    await check();

    // Schedule periodic checks
    return setInterval(check, interval);
  }

  /**
   * Extract data using AI
   */
  async extractWithAI(html, url, config) {
    if (config.extractionType === 'property') {
      return this.aiEngine.extractPropertyData(html, url);
    } else if (config.extractionType === 'contact') {
      return this.aiEngine.extractContactInfo(html);
    } else if (config.schema) {
      return this.aiEngine.extractStructuredData(html, config.schema);
    } else {
      // General extraction
      return {
        html,
        summary: await this.aiEngine.summarize(html),
        entities: await this.aiEngine.extractEntities(html)
      };
    }
  }

  /**
   * Extract data using CSS selectors
   */
  async extractWithSelectors(page, selectors) {
    const data = {};

    for (const [key, selector] of Object.entries(selectors)) {
      try {
        if (typeof selector === 'string') {
          // Single element
          data[key] = await page.$eval(selector, el => el.textContent.trim());
        } else if (selector.multiple) {
          // Multiple elements
          data[key] = await page.$$eval(selector.selector, els =>
            els.map(el => el.textContent.trim())
          );
        } else if (selector.attribute) {
          // Get attribute
          data[key] = await page.$eval(selector.selector, (el, attr) =>
            el.getAttribute(attr), selector.attribute
          );
        }
      } catch (error) {
        logger.debug(`Failed to extract ${key} with selector ${selector}:`, error.message);
        data[key] = null;
      }
    }

    return data;
  }

  /**
   * Get page metadata
   */
  async getPageMetadata(page) {
    return page.evaluate(() => {
      const getMeta = (name) => {
        const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return element ? element.content : null;
      };

      return {
        title: document.title,
        description: getMeta('description') || getMeta('og:description'),
        keywords: getMeta('keywords'),
        author: getMeta('author'),
        ogTitle: getMeta('og:title'),
        ogImage: getMeta('og:image'),
        ogUrl: getMeta('og:url'),
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        lang: document.documentElement.lang,
        charset: document.characterSet
      };
    });
  }

  /**
   * Parse sitemap
   */
  async parseSitemap(sitemapUrl) {
    try {
      const response = await axios.get(sitemapUrl);
      const $ = cheerio.load(response.data, { xmlMode: true });

      const urls = [];

      // Check if it's a sitemap index
      $('sitemap loc').each((i, el) => {
        urls.push($(el).text());
      });

      // If sitemap index, fetch all sitemaps
      if (urls.length > 0) {
        const allUrls = [];
        for (const url of urls) {
          const subUrls = await this.parseSitemap(url);
          allUrls.push(...subUrls);
        }
        return allUrls;
      }

      // Parse regular sitemap
      $('url loc').each((i, el) => {
        urls.push($(el).text());
      });

      return urls;
    } catch (error) {
      logger.error(`Failed to parse sitemap ${sitemapUrl}:`, error);
      return [];
    }
  }

  /**
   * Check robots.txt
   */
  async checkRobotsTxt(url) {
    const domain = this.getDomain(url);

    if (this.robotsCache.has(domain)) {
      const robots = this.robotsCache.get(domain);
      return robots.isAllowed(url, 'ScrapingBot');
    }

    try {
      const robotsUrl = `${new URL(url).origin}/robots.txt`;
      const response = await axios.get(robotsUrl);
      const robots = robotsParser(robotsUrl, response.data);

      this.robotsCache.set(domain, robots);

      return robots.isAllowed(url, 'ScrapingBot');
    } catch (error) {
      // If robots.txt doesn't exist, allow scraping
      logger.debug(`No robots.txt found for ${domain}`);
      return true;
    }
  }

  /**
   * Get search URLs
   */
  async getSearchUrls(searchEngine, query, pages) {
    // Implementation for different search engines
    // This is a simplified example
    const urls = [];
    const encodedQuery = encodeURIComponent(query);

    for (let page = 0; page < pages; page++) {
      const offset = page * 10;
      urls.push(`https://www.google.com/search?q=${encodedQuery}&start=${offset}`);
    }

    return urls;
  }

  /**
   * Detect changes between data objects
   */
  detectChanges(previous, current) {
    const changes = [];

    const compare = (prev, curr, path = '') => {
      if (typeof prev !== typeof curr) {
        changes.push({ path, type: 'type_changed', from: typeof prev, to: typeof curr });
        return;
      }

      if (typeof prev === 'object' && prev !== null) {
        for (const key in { ...prev, ...curr }) {
          compare(prev?.[key], curr?.[key], path ? `${path}.${key}` : key);
        }
      } else if (prev !== curr) {
        changes.push({ path, type: 'value_changed', from: prev, to: curr });
      }
    };

    compare(previous, current);
    return changes;
  }

  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
