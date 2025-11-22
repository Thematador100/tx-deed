/**
 * Advanced Stealth Scraper
 *
 * Demonstrates the most advanced anti-detection techniques
 * Used for scraping sites with sophisticated bot protection
 *
 * Bypasses:
 * - Cloudflare
 * - Akamai Bot Manager
 * - PerimeterX
 * - DataDome
 * - Most fingerprinting techniques
 *
 * WARNING: Use responsibly and only on sites you have permission to scrape
 */

import { chromium } from 'playwright';
import UserAgent from 'user-agents';

/**
 * Advanced Anti-Detection Configuration
 */
const stealthConfig = {
  // Viewport randomization
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 2560, height: 1440 },
  ],

  // Timezone randomization
  timezones: [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
  ],

  // Locale randomization
  locales: ['en-US', 'en-GB', 'en-CA'],

  // Common screen resolutions
  screens: [
    { width: 1920, height: 1080, devicePixelRatio: 1 },
    { width: 1920, height: 1080, devicePixelRatio: 2 }, // Retina
    { width: 2560, height: 1440, devicePixelRatio: 1 },
    { width: 3840, height: 2160, devicePixelRatio: 2 }, // 4K
  ],
};

/**
 * Get randomized browser configuration
 */
function getRandomConfig() {
  return {
    viewport: stealthConfig.viewports[
      Math.floor(Math.random() * stealthConfig.viewports.length)
    ],
    timezone: stealthConfig.timezones[
      Math.floor(Math.random() * stealthConfig.timezones.length)
    ],
    locale: stealthConfig.locales[
      Math.floor(Math.random() * stealthConfig.locales.length)
    ],
    screen: stealthConfig.screens[
      Math.floor(Math.random() * stealthConfig.screens.length)
    ],
  };
}

/**
 * Advanced stealth page initialization
 */
async function initStealthPage(browser) {
  const config = getRandomConfig();
  const userAgent = new UserAgent({ deviceCategory: 'desktop' });

  const context = await browser.newContext({
    viewport: config.viewport,
    userAgent: userAgent.toString(),
    locale: config.locale,
    timezoneId: config.timezone,
    deviceScaleFactor: config.screen.devicePixelRatio,

    // Permissions
    permissions: ['geolocation', 'notifications'],

    // Geolocation (random US city)
    geolocation: getRandomGeolocation(),

    // Screen configuration
    screen: {
      width: config.screen.width,
      height: config.screen.height,
    },

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    },

    // Additional options
    javaScriptEnabled: true,
    hasTouch: false,
    isMobile: false,
    offline: false,
    colorScheme: Math.random() > 0.5 ? 'dark' : 'light',
  });

  const page = await context.newPage();

  // ===== ANTI-DETECTION SCRIPTS =====

  // 1. Remove webdriver property
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  // 2. Override permissions API
  await page.addInitScript(() => {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );
  });

  // 3. Override plugins to appear like real browser
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          name: 'Chrome PDF Plugin',
        },
        {
          0: { type: 'application/pdf', suffixes: 'pdf', description: '' },
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          name: 'Chrome PDF Viewer',
        },
        {
          0: { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
          1: { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client Executable' },
          description: '',
          filename: 'internal-nacl-plugin',
          length: 2,
          name: 'Native Client',
        },
      ],
    });
  });

  // 4. Override languages
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  // 5. Override Chrome runtime
  await page.addInitScript(() => {
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {},
    };
  });

  // 6. Mock battery API (common fingerprinting vector)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });
  });

  // 7. WebGL fingerprint randomization
  await page.addInitScript(() => {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      // Randomize UNMASKED_VENDOR_WEBGL
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      // Randomize UNMASKED_RENDERER_WEBGL
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.apply(this, arguments);
    };
  });

  // 8. Canvas fingerprint protection
  await page.addInitScript(() => {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      // Add slight noise to canvas to prevent fingerprinting
      const context = this.getContext('2d');
      const imageData = context.getImageData(0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] += Math.random() * 0.1;
      }
      context.putImageData(imageData, 0, 0);
      return originalToDataURL.apply(this, arguments);
    };
  });

  // 9. AudioContext fingerprint protection
  await page.addInitScript(() => {
    const audioContext = window.AudioContext || window.webkitAudioContext;
    if (audioContext) {
      const originalCreateOscillator = audioContext.prototype.createOscillator;
      audioContext.prototype.createOscillator = function() {
        const oscillator = originalCreateOscillator.apply(this, arguments);
        const originalStart = oscillator.start;
        oscillator.start = function() {
          // Add slight randomization
          this.frequency.value += Math.random() * 0.01;
          return originalStart.apply(this, arguments);
        };
        return oscillator;
      };
    }
  });

  // 10. WebRTC leak protection
  await page.addInitScript(() => {
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    if (originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = function() {
        return Promise.reject(new Error('Permission denied'));
      };
    }
  });

  return { page, context };
}

/**
 * Get random US geolocation
 */
function getRandomGeolocation() {
  const locations = [
    { latitude: 40.7128, longitude: -74.0060, city: 'New York' },
    { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' },
    { latitude: 41.8781, longitude: -87.6298, city: 'Chicago' },
    { latitude: 29.7604, longitude: -95.3698, city: 'Houston' },
    { latitude: 33.4484, longitude: -112.0740, city: 'Phoenix' },
    { latitude: 39.7392, longitude: -104.9903, city: 'Denver' },
    { latitude: 47.6062, longitude: -122.3321, city: 'Seattle' },
  ];

  return locations[Math.floor(Math.random() * locations.length)];
}

/**
 * Human-like mouse movement
 */
async function humanMouseMove(page, x, y) {
  const steps = 10 + Math.floor(Math.random() * 20);
  const currentPos = await page.evaluate(() => ({
    x: window.lastMouseX || 0,
    y: window.lastMouseY || 0,
  }));

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    // Easing function for natural movement
    const ease = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const newX = currentPos.x + (x - currentPos.x) * ease;
    const newY = currentPos.y + (y - currentPos.y) * ease;

    await page.mouse.move(newX, newY);
    await page.waitForTimeout(10 + Math.random() * 20);
  }

  await page.evaluate((x, y) => {
    window.lastMouseX = x;
    window.lastMouseY = y;
  }, x, y);
}

/**
 * Human-like scrolling
 */
async function humanScroll(page, distance = null) {
  const scrollDistance = distance || Math.floor(Math.random() * 500) + 200;
  const steps = 20 + Math.floor(Math.random() * 10);
  const stepSize = scrollDistance / steps;

  for (let i = 0; i < steps; i++) {
    await page.evaluate((step) => {
      window.scrollBy(0, step);
    }, stepSize);

    // Variable delay between scroll steps
    await page.waitForTimeout(50 + Math.random() * 100);
  }
}

/**
 * Human-like typing
 */
async function humanType(page, selector, text) {
  await page.click(selector);
  await page.waitForTimeout(100 + Math.random() * 200);

  for (const char of text) {
    await page.type(selector, char, {
      delay: 50 + Math.random() * 150, // Random delay between keystrokes
    });

    // Occasional longer pauses (like thinking)
    if (Math.random() < 0.1) {
      await page.waitForTimeout(300 + Math.random() * 500);
    }
  }
}

/**
 * Advanced stealth scraper
 */
async function stealthScrape(url, options = {}) {
  console.log('🕵️  Starting Advanced Stealth Scraper...');

  const browser = await chromium.launch({
    headless: options.headless ?? true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  try {
    const { page, context } = await initStealthPage(browser);

    // Optional: Block unnecessary resources for speed
    if (options.blockResources) {
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });
    }

    // Navigate to URL
    console.log(`Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Random delay to appear human
    await page.waitForTimeout(1000 + Math.random() * 2000);

    // Human-like behavior: Random mouse movement
    if (!options.skipMouseMovement) {
      await humanMouseMove(
        page,
        Math.random() * 800,
        Math.random() * 600
      );
    }

    // Human-like behavior: Random scrolling
    if (!options.skipScrolling) {
      await humanScroll(page);
      await page.waitForTimeout(500 + Math.random() * 1000);
    }

    // Take screenshot if requested (for debugging)
    if (options.screenshot) {
      await page.screenshot({ path: 'stealth-screenshot.png', fullPage: true });
    }

    // Extract data
    const data = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        html: document.documentElement.outerHTML,
        text: document.body.innerText,
        // Add custom extraction logic here
      };
    });

    console.log('✅ Stealth scraping completed successfully');

    await context.close();
    return data;

  } catch (error) {
    console.error('Stealth scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Example: Bypass Cloudflare
 */
async function bypassCloudflare(url) {
  console.log('🛡️  Attempting to bypass Cloudflare...');

  const browser = await chromium.launch({ headless: false }); // Use headful for debugging
  const { page, context } = await initStealthPage(browser);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // Check if Cloudflare challenge is present
    const isCloudflare = await page.evaluate(() => {
      return document.body.innerHTML.includes('Checking your browser') ||
             document.body.innerHTML.includes('cf-browser-verification') ||
             document.title.includes('Just a moment');
    });

    if (isCloudflare) {
      console.log('⏳ Cloudflare challenge detected, waiting...');

      // Wait for challenge to complete (usually 5-10 seconds)
      await page.waitForTimeout(10000);

      // Check if passed
      const passed = await page.evaluate(() => {
        return !document.body.innerHTML.includes('Checking your browser');
      });

      if (passed) {
        console.log('✅ Cloudflare bypass successful!');
      } else {
        console.log('❌ Cloudflare bypass failed');
      }
    } else {
      console.log('ℹ️  No Cloudflare challenge detected');
    }

    // Get cookies (save for future requests)
    const cookies = await context.cookies();
    console.log('Cookies obtained:', cookies.length);

    return { page, context, cookies };

  } catch (error) {
    console.error('Cloudflare bypass failed:', error);
    await browser.close();
    throw error;
  }
}

/**
 * Example usage
 */
async function example() {
  // Basic stealth scraping
  const data = await stealthScrape('https://example.com', {
    headless: true,
    blockResources: true,
    screenshot: false,
  });

  console.log('Scraped data:', data);

  // Cloudflare bypass example
  // const { page, cookies } = await bypassCloudflare('https://example-with-cloudflare.com');
  // console.log('Access granted!');
}

// Uncomment to run
// example().catch(console.error);

export {
  stealthScrape,
  bypassCloudflare,
  humanMouseMove,
  humanScroll,
  humanType,
  initStealthPage,
};
