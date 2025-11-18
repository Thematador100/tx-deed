import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import UserAgent from 'user-agents';
import { logger } from '../utils/logger.js';
import { ProxyManager } from '../proxy/proxy-manager.js';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export class BrowserManager {
  constructor(config = {}) {
    this.config = {
      headless: config.headless ?? 'new',
      maxConcurrent: config.maxConcurrent || 5,
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      proxyRotation: config.proxyRotation ?? true,
      fingerprintSpoofing: config.fingerprintSpoofing ?? true,
      ...config
    };

    this.browsers = new Map();
    this.proxyManager = new ProxyManager();
    this.fingerprintGenerator = new FingerprintGenerator();
    this.activeBrowsers = 0;
  }

  async createBrowser(options = {}) {
    if (this.activeBrowsers >= this.config.maxConcurrent) {
      throw new Error('Maximum concurrent browsers reached');
    }

    const proxy = this.config.proxyRotation
      ? await this.proxyManager.getProxy()
      : null;

    const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();

    const launchOptions = {
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        ...this.config.additionalArgs || []
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: true,
        isMobile: false
      }
    };

    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy.url}`);
      logger.info(`Using proxy: ${proxy.url}`);
    }

    try {
      const browser = await puppeteer.launch(launchOptions);
      const browserId = this.generateBrowserId();

      this.browsers.set(browserId, {
        browser,
        proxy,
        createdAt: Date.now(),
        requestCount: 0
      });

      this.activeBrowsers++;
      logger.info(`Browser ${browserId} created. Active browsers: ${this.activeBrowsers}`);

      return { browserId, browser };
    } catch (error) {
      logger.error('Failed to create browser:', error);
      throw error;
    }
  }

  async createPage(browserId, url) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) {
      throw new Error(`Browser ${browserId} not found`);
    }

    const { browser, proxy } = browserData;
    const page = await browser.newPage();

    // Apply fingerprint spoofing
    if (this.config.fingerprintSpoofing) {
      await this.applyFingerprint(page);
    }

    // Set random user agent
    const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();
    await page.setUserAgent(userAgent);

    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    });

    // Authenticate proxy if credentials provided
    if (proxy?.username && proxy?.password) {
      await page.authenticate({
        username: proxy.username,
        password: proxy.password
      });
    }

    // Add stealth techniques
    await this.applyStealth(page);

    // Set timeouts
    page.setDefaultTimeout(this.config.timeout);
    page.setDefaultNavigationTimeout(this.config.timeout);

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const blockedTypes = ['image', 'stylesheet', 'font', 'media'];

      if (this.config.blockResources && blockedTypes.includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    browserData.requestCount++;

    return page;
  }

  async applyFingerprint(page) {
    try {
      const fingerprint = this.fingerprintGenerator.getFingerprint({
        devices: ['desktop'],
        browsers: ['chrome', 'firefox', 'safari'],
        operatingSystems: ['windows', 'macos', 'linux']
      });

      const injector = new FingerprintInjector();
      await injector.attachFingerprintToPuppeteer(page, fingerprint);

      logger.debug('Fingerprint applied to page');
    } catch (error) {
      logger.error('Failed to apply fingerprint:', error);
    }
  }

  async applyStealth(page) {
    // Override navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });

    // Override permissions
    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // Add random mouse movements
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('load', () => {
        let mouseX = 0;
        let mouseY = 0;

        setInterval(() => {
          mouseX += Math.random() * 10 - 5;
          mouseY += Math.random() * 10 - 5;

          const event = new MouseEvent('mousemove', {
            clientX: mouseX,
            clientY: mouseY
          });
          document.dispatchEvent(event);
        }, 100 + Math.random() * 100);
      });
    });

    // Mock plugins and mimeTypes
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ]
      });
    });
  }

  async navigate(page, url, options = {}) {
    const maxRetries = options.retries || this.config.retries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Navigating to ${url} (attempt ${attempt}/${maxRetries})`);

        // Random delay before navigation
        await this.randomDelay(500, 2000);

        const response = await page.goto(url, {
          waitUntil: options.waitUntil || 'networkidle2',
          timeout: this.config.timeout
        });

        if (!response.ok() && response.status() >= 400) {
          throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
        }

        logger.info(`Successfully navigated to ${url}`);
        return response;
      } catch (error) {
        lastError = error;
        logger.warn(`Navigation attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          await this.randomDelay(2000, 5000);
        }
      }
    }

    throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts: ${lastError.message}`);
  }

  async closeBrowser(browserId) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) {
      logger.warn(`Browser ${browserId} not found for closing`);
      return;
    }

    try {
      await browserData.browser.close();
      this.browsers.delete(browserId);
      this.activeBrowsers--;

      if (browserData.proxy) {
        this.proxyManager.releaseProxy(browserData.proxy);
      }

      logger.info(`Browser ${browserId} closed. Active browsers: ${this.activeBrowsers}`);
    } catch (error) {
      logger.error(`Error closing browser ${browserId}:`, error);
    }
  }

  async closeAll() {
    logger.info('Closing all browsers...');
    const closePromises = Array.from(this.browsers.keys()).map(id =>
      this.closeBrowser(id)
    );
    await Promise.all(closePromises);
    logger.info('All browsers closed');
  }

  randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  generateBrowserId() {
    return `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getBrowserStats() {
    return {
      active: this.activeBrowsers,
      total: this.browsers.size,
      browsers: Array.from(this.browsers.entries()).map(([id, data]) => ({
        id,
        uptime: Date.now() - data.createdAt,
        requests: data.requestCount,
        proxy: data.proxy?.url || 'none'
      }))
    };
  }
}
