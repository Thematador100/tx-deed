/**
 * Advanced Scraper Configuration
 * Features: Proxy rotation, user-agent rotation, rate limiting, retry logic
 */

export const scraperConfig = {
  // Playwright Configuration - Most Advanced Browser Automation
  playwright: {
    headless: true,
    timeout: 30000,
    navigationTimeout: 60000,
    // Anti-detection settings
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    },
    // Stealth mode context options
    contextOptions: {
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      geolocation: { latitude: 40.7128, longitude: -74.0060 },
      javaScriptEnabled: true,
      hasTouch: false,
      isMobile: false,
    },
  },

  // Crawlee Configuration - Enterprise Orchestration
  crawlee: {
    maxRequestsPerCrawl: 1000,
    maxConcurrency: 10,
    minConcurrency: 1,
    requestHandlerTimeoutSecs: 180,
    maxRequestRetries: 5,
    maxSessionRotations: 10,

    // Auto-scaling configuration
    autoscaledPoolOptions: {
      systemStatusOptions: {
        maxUsedCpuRatio: 0.95,
        maxUsedMemoryRatio: 0.85,
      },
      maxConcurrency: 50,
      minConcurrency: 5,
    },

    // Session pool for cookie/session management
    sessionPoolOptions: {
      maxPoolSize: 100,
      sessionOptions: {
        maxAgeSecs: 3000,
        maxUsageCount: 50,
      },
      persistStateKeyValueStoreId: 'scraper-sessions',
    },

    // Request queue configuration
    requestQueueOptions: {
      forefront: true,
    },
  },

  // Proxy Configuration
  proxies: {
    enabled: false, // Set to true when you have proxies
    rotation: 'round-robin', // 'round-robin', 'random', 'sticky-session'
    list: [
      // Add your proxies here in format: 'http://user:pass@host:port'
      // 'http://proxy1.example.com:8080',
      // 'http://proxy2.example.com:8080',
    ],
    retryOnFailure: true,
    maxRetries: 3,
  },

  // User Agent Rotation
  userAgents: {
    rotation: true,
    pool: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.3; rv:123.0) Gecko/20100101 Firefox/123.0',
    ],
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    requestsPerSecond: 2,
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },

  // Cookie Management
  cookies: {
    enabled: true,
    persistPath: './data/cookies',
    domains: {},
  },

  // Cache Configuration
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour in seconds
    path: './data/cache',
  },

  // Anti-Bot Bypass Features
  antiBot: {
    // Random delays between actions (milliseconds)
    humanDelay: {
      min: 100,
      max: 3000,
    },
    // Mouse movement simulation
    mouseMovement: true,
    // Random scrolling
    randomScroll: true,
    // Fingerprint randomization
    randomizeFingerprint: true,
    // WebRTC leak protection
    webRTCProtection: true,
    // Canvas fingerprinting protection
    canvasProtection: true,
  },

  // Data Export
  export: {
    format: 'json', // 'json', 'csv', 'xlsx', 'database'
    path: './data/exports',
    database: {
      type: 'supabase', // 'supabase', 'postgres', 'mongodb'
      // Add connection details from env
    },
  },

  // Logging
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
    saveToFile: true,
    filePath: './logs',
  },
};

export default scraperConfig;
