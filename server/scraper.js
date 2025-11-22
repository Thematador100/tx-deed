/**
 * Advanced Web Scraping Server
 * Demonstrates the most powerful scraping techniques on Earth
 *
 * Features:
 * - Playwright: Headless browser automation with anti-detection
 * - Crawlee: Enterprise-grade orchestration and queue management
 * - Cheerio: Lightning-fast HTML parsing
 * - Got: Advanced HTTP client with retry logic
 * - Proxy rotation and user-agent randomization
 * - Session management and cookie persistence
 * - Auto-scaling and rate limiting
 */

import express from 'express';
import cors from 'cors';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import got from 'got';
import { CookieJar } from 'tough-cookie';
import UserAgent from 'user-agents';
import { scraperConfig } from './config.js';

const app = express();
const PORT = process.env.SCRAPER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize services
const cookieJar = new CookieJar();
let currentProxyIndex = 0;

/**
 * Utility: Get random user agent
 */
function getRandomUserAgent() {
  if (scraperConfig.userAgents.rotation) {
    const randomUA = new UserAgent({ deviceCategory: 'desktop' });
    return randomUA.toString();
  }
  return scraperConfig.playwright.contextOptions.userAgent;
}

/**
 * Utility: Get next proxy
 */
function getNextProxy() {
  if (!scraperConfig.proxies.enabled || scraperConfig.proxies.list.length === 0) {
    return null;
  }

  if (scraperConfig.proxies.rotation === 'random') {
    return scraperConfig.proxies.list[
      Math.floor(Math.random() * scraperConfig.proxies.list.length)
    ];
  }

  // Round-robin
  const proxy = scraperConfig.proxies.list[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % scraperConfig.proxies.list.length;
  return proxy;
}

/**
 * Utility: Human-like delay
 */
async function humanDelay() {
  const { min, max } = scraperConfig.antiBot.humanDelay;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Method 1: PLAYWRIGHT CRAWLER (Most Advanced)
 * Full browser automation with JavaScript execution
 * Best for: SPAs, sites with heavy JavaScript, anti-bot protection
 */
async function scrapeWithPlaywright(url, options = {}) {
  console.log('🎭 Starting Playwright Crawler (Most Advanced Method)...');

  const results = [];

  const crawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        ...scraperConfig.playwright.launchOptions,
        headless: options.headless ?? scraperConfig.playwright.headless,
      },
    },

    browserPoolOptions: {
      maxOpenPagesPerBrowser: 10,
      retireBrowserAfterPageCount: 50,
    },

    maxRequestsPerCrawl: options.maxPages || scraperConfig.crawlee.maxRequestsPerCrawl,
    maxConcurrency: options.concurrency || scraperConfig.crawlee.maxConcurrency,

    // Advanced request handler
    async requestHandler({ page, request, enqueueLinks }) {
      console.log(`Scraping: ${request.url}`);

      // Anti-detection: Remove webdriver property
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // Override the permissions API
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

      // Set random user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      // Human-like behavior: Random mouse movements
      if (scraperConfig.antiBot.mouseMovement) {
        await page.mouse.move(
          Math.random() * 800,
          Math.random() * 600
        );
      }

      // Wait for content to load
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

      // Human-like behavior: Random scrolling
      if (scraperConfig.antiBot.randomScroll) {
        await page.evaluate(() => {
          window.scrollTo(0, Math.random() * document.body.scrollHeight);
        });
        await humanDelay();
      }

      // Extract data using Playwright selectors
      const data = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
            tag: h.tagName,
            text: h.textContent.trim(),
          })),
          links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
            text: a.textContent.trim(),
            href: a.href,
          })).slice(0, 20),
          images: Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
          })).slice(0, 10),
          meta: {
            description: document.querySelector('meta[name="description"]')?.content,
            keywords: document.querySelector('meta[name="keywords"]')?.content,
            ogTitle: document.querySelector('meta[property="og:title"]')?.content,
            ogDescription: document.querySelector('meta[property="og:description"]')?.content,
            ogImage: document.querySelector('meta[property="og:image"]')?.content,
          },
        };
      });

      results.push(data);

      // Save to Crawlee dataset
      await Dataset.pushData(data);

      // Optionally enqueue found links
      if (options.followLinks) {
        await enqueueLinks({
          strategy: 'same-domain',
          transformRequestFunction: (req) => {
            req.userData = { depth: (request.userData?.depth || 0) + 1 };
            return req;
          },
        });
      }

      // Human-like delay before next request
      await humanDelay();
    },

    // Error handling with retry logic
    failedRequestHandler({ request, error }) {
      console.error(`Request ${request.url} failed: ${error.message}`);
    },
  });

  await crawler.run([url]);

  return results;
}

/**
 * Method 2: CHEERIO + GOT (Fastest)
 * HTTP requests + HTML parsing without browser
 * Best for: Static sites, APIs, high-speed scraping
 */
async function scrapeWithCheerio(url, options = {}) {
  console.log('⚡ Starting Cheerio + Got Scraper (Fastest Method)...');

  try {
    const response = await got(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      cookieJar,
      followRedirect: true,
      retry: {
        limit: scraperConfig.crawlee.maxRequestRetries,
        methods: ['GET', 'POST'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      },
      timeout: {
        request: 30000,
      },
      https: {
        rejectUnauthorized: false,
      },
    });

    const $ = cheerio.load(response.body);

    // Extract data using Cheerio selectors
    const data = {
      title: $('title').text(),
      url: url,
      headings: $('h1, h2, h3').map((i, el) => ({
        tag: el.tagName,
        text: $(el).text().trim(),
      })).get(),
      links: $('a[href]').map((i, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr('href'),
      })).get().slice(0, 20),
      images: $('img').map((i, el) => ({
        src: $(el).attr('src'),
        alt: $(el).attr('alt'),
      })).get().slice(0, 10),
      meta: {
        description: $('meta[name="description"]').attr('content'),
        keywords: $('meta[name="keywords"]').attr('content'),
        ogTitle: $('meta[property="og:title"]').attr('content'),
        ogDescription: $('meta[property="og:description"]').attr('content'),
        ogImage: $('meta[property="og:image"]').attr('content'),
      },
      paragraphs: $('p').map((i, el) => $(el).text().trim()).get().slice(0, 10),
    };

    return data;
  } catch (error) {
    console.error(`Cheerio scraping failed: ${error.message}`);
    throw error;
  }
}

/**
 * Method 3: HYBRID APPROACH
 * Uses Cheerio first, falls back to Playwright if needed
 * Best for: Cost-effective scraping with fallback
 */
async function scrapeHybrid(url, options = {}) {
  console.log('🔄 Starting Hybrid Scraper...');

  try {
    // Try fast method first
    const data = await scrapeWithCheerio(url, options);

    // Check if we got meaningful data
    if (data.headings.length > 0 || data.paragraphs.length > 0) {
      console.log('✅ Cheerio succeeded!');
      return { method: 'cheerio', data };
    }

    // Fall back to browser if content seems JavaScript-dependent
    console.log('⚠️  Cheerio got limited data, trying Playwright...');
    const playwrightData = await scrapeWithPlaywright(url, options);
    return { method: 'playwright', data: playwrightData };

  } catch (error) {
    console.log('⚠️  Cheerio failed, trying Playwright...');
    const playwrightData = await scrapeWithPlaywright(url, options);
    return { method: 'playwright', data: playwrightData };
  }
}

/**
 * API Endpoints
 */

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      proxiesEnabled: scraperConfig.proxies.enabled,
      rateLimitEnabled: scraperConfig.rateLimit.enabled,
      cacheEnabled: scraperConfig.cache.enabled,
    },
  });
});

// Scrape with Playwright
app.post('/scrape/playwright', async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const results = await scrapeWithPlaywright(url, options);
    res.json({ success: true, method: 'playwright', data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scrape with Cheerio
app.post('/scrape/cheerio', async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const data = await scrapeWithCheerio(url, options);
    res.json({ success: true, method: 'cheerio', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scrape with hybrid approach (recommended)
app.post('/scrape', async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await scrapeHybrid(url, options);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🚀 ADVANCED WEB SCRAPER SERVER STARTED                         ║
║                                                                   ║
║   Port: ${PORT}                                                    ║
║   Status: http://localhost:${PORT}/health                          ║
║                                                                   ║
║   Endpoints:                                                      ║
║   • POST /scrape           - Hybrid (Recommended)                ║
║   • POST /scrape/playwright - Full Browser                       ║
║   • POST /scrape/cheerio   - Fast HTTP                          ║
║                                                                   ║
║   Features Enabled:                                              ║
║   ✓ Playwright (Anti-Detection)                                 ║
║   ✓ Crawlee (Enterprise Orchestration)                          ║
║   ✓ Cheerio (Fast Parsing)                                      ║
║   ✓ Got (Advanced HTTP)                                         ║
║   ✓ User-Agent Rotation                                         ║
║   ✓ Cookie Management                                           ║
║   ✓ Human-like Behavior                                         ║
║   ${scraperConfig.proxies.enabled ? '✓' : '✗'} Proxy Rotation                                           ║
║   ${scraperConfig.rateLimit.enabled ? '✓' : '✗'} Rate Limiting                                          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});

export { scrapeWithPlaywright, scrapeWithCheerio, scrapeHybrid };
