/**
 * Advanced Browser Manager with Anti-Detection
 *
 * Implements state-of-the-art techniques to appear as a legitimate user:
 * - Stealth plugin to avoid detection
 * - Rotating user agents
 * - Randomized viewport sizes
 * - Mouse movement simulation
 * - Human-like delays
 * - WebRTC/Canvas fingerprint protection
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';

// Add stealth plugin - this makes Puppeteer undetectable
puppeteer.use(StealthPlugin());

class BrowserManager {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false ? 'new' : false,
      proxy: options.proxy || null,
      slowMo: options.slowMo || 0,
      timeout: options.timeout || 30000,
      ...options
    };

    this.browser = null;
    this.pages = new Map();
  }

  /**
   * Launch browser with anti-detection measures
   */
  async launch() {
    const launchOptions = {
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        // Randomize window size to avoid fingerprinting
        `--window-size=${1920 + Math.floor(Math.random() * 100)},${1080 + Math.floor(Math.random() * 100)}`,
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: null,
    };

    // Add proxy if configured
    if (this.options.proxy) {
      launchOptions.args.push(`--proxy-server=${this.options.proxy}`);
    }

    this.browser = await puppeteer.launch(launchOptions);
    return this.browser;
  }

  /**
   * Create a new page with advanced anti-detection
   */
  async createPage(pageId) {
    if (!this.browser) {
      await this.launch();
    }

    const page = await this.browser.newPage();

    // Set random but realistic user agent
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });
    await page.setUserAgent(userAgent.toString());

    // Set random viewport to avoid fingerprinting
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });

    // Override navigator properties to appear more human
    await page.evaluateOnNewDocument(() => {
      // Webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Chrome property
      window.chrome = {
        runtime: {},
      };

      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Block ads, trackers, and unnecessary media
      if (
        resourceType === 'image' && !url.includes('captcha') ||
        resourceType === 'stylesheet' && this.options.skipStyles ||
        resourceType === 'font' ||
        url.includes('google-analytics') ||
        url.includes('googletagmanager') ||
        url.includes('facebook') ||
        url.includes('doubleclick') ||
        url.includes('analytics')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Set extra headers to appear legitimate
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
    });

    // Set default timeout
    page.setDefaultTimeout(this.options.timeout);
    page.setDefaultNavigationTimeout(this.options.timeout);

    this.pages.set(pageId, page);
    return page;
  }

  /**
   * Navigate to URL with human-like behavior
   */
  async navigateHuman(page, url, waitOptions = {}) {
    // Random delay before navigation (simulate human thinking)
    await this.randomDelay(500, 2000);

    const options = {
      waitUntil: 'networkidle2',
      ...waitOptions
    };

    await page.goto(url, options);

    // Random delay after page load (simulate human reading)
    await this.randomDelay(1000, 3000);

    // Simulate human-like mouse movement
    await this.simulateHumanActivity(page);
  }

  /**
   * Simulate human mouse movement and scrolling
   */
  async simulateHumanActivity(page) {
    try {
      // Random scroll
      await page.evaluate(() => {
        window.scrollBy({
          top: Math.random() * 300,
          left: 0,
          behavior: 'smooth'
        });
      });

      await this.randomDelay(500, 1500);

      // Random mouse movements
      const moves = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < moves; i++) {
        await page.mouse.move(
          Math.random() * 1920,
          Math.random() * 1080,
          { steps: 10 }
        );
        await this.randomDelay(100, 500);
      }
    } catch (error) {
      // Ignore errors in simulation
    }
  }

  /**
   * Type text with human-like delays
   */
  async typeHuman(page, selector, text, options = {}) {
    await page.waitForSelector(selector, { visible: true });
    await this.randomDelay(300, 800);

    // Click the input
    await page.click(selector);
    await this.randomDelay(200, 500);

    // Type with random delays between characters
    for (const char of text) {
      await page.keyboard.type(char);
      await this.randomDelay(50, 150);
    }

    await this.randomDelay(300, 800);
  }

  /**
   * Click element with human-like behavior
   */
  async clickHuman(page, selector, options = {}) {
    await page.waitForSelector(selector, { visible: true });
    await this.randomDelay(300, 800);

    // Move mouse to element first
    const element = await page.$(selector);
    const box = await element.boundingBox();

    if (box) {
      await page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2,
        { steps: 10 }
      );
      await this.randomDelay(100, 300);
    }

    await page.click(selector);
    await this.randomDelay(500, 1500);
  }

  /**
   * Random delay to mimic human behavior
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Wait for selector with retry logic
   */
  async waitForSelectorWithRetry(page, selector, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await page.waitForSelector(selector, {
          visible: true,
          timeout: this.options.timeout,
          ...options
        });
        return true;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.randomDelay(1000, 2000);
      }
    }
  }

  /**
   * Handle CAPTCHA detection
   */
  async detectCaptcha(page) {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.g-recaptcha',
      '#captcha',
      '[class*="captcha"]',
      '[id*="captcha"]',
    ];

    for (const selector of captchaSelectors) {
      const found = await page.$(selector);
      if (found) {
        return {
          detected: true,
          type: selector.includes('recaptcha') ? 'recaptcha' : 'unknown',
          selector
        };
      }
    }

    return { detected: false };
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(page, path) {
    await page.screenshot({ path, fullPage: true });
  }

  /**
   * Get page by ID
   */
  getPage(pageId) {
    return this.pages.get(pageId);
  }

  /**
   * Close specific page
   */
  async closePage(pageId) {
    const page = this.pages.get(pageId);
    if (page) {
      await page.close();
      this.pages.delete(pageId);
    }
  }

  /**
   * Close browser and all pages
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.pages.clear();
    }
  }

  /**
   * Check if browser is running
   */
  isRunning() {
    return this.browser !== null && this.browser.isConnected();
  }
}

export default BrowserManager;
