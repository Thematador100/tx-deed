export default {
  // Browser configuration
  browser: {
    headless: process.env.HEADLESS !== 'false',
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_BROWSERS) || 5,
    timeout: parseInt(process.env.BROWSER_TIMEOUT) || 30000,
    retries: parseInt(process.env.MAX_RETRIES) || 3,
    proxyRotation: process.env.ENABLE_PROXY_ROTATION !== 'false',
    fingerprintSpoofing: process.env.ENABLE_FINGERPRINT_SPOOFING !== 'false',
    blockResources: process.env.BLOCK_RESOURCES !== 'false'
  },

  // AI configuration
  ai: {
    provider: process.env.AI_PROVIDER || 'anthropic',
    model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
    temperature: 0,
    maxTokens: 4096,
    cacheResults: true
  },

  // Queue configuration
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 5,
    maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES) || 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  },

  // Rate limiting configuration
  rateLimit: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT) || 5,
    minTime: parseInt(process.env.MIN_TIME_BETWEEN_REQUESTS) || 1000
  },

  // Storage configuration
  storage: {
    storage: process.env.STORAGE_TYPE || 'json',
    dataDir: process.env.DATA_DIR || './data',
    batchSize: 100,
    autoFlush: true,
    flushInterval: 5000
  },

  // Scraping defaults
  scraping: {
    respectRobotsTxt: process.env.RESPECT_ROBOTS_TXT !== 'false',
    defaultDelay: parseInt(process.env.DEFAULT_DELAY) || 1000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    timeout: parseInt(process.env.BROWSER_TIMEOUT) || 30000
  },

  // Alerting configuration
  alerting: {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO
    },
    sms: {
      enabled: process.env.ALERT_SMS_ENABLED === 'true',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ALERT_SMS_TO
    },
    webhook: {
      enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
      url: process.env.ALERT_WEBHOOK_URL
    },
    thresholds: {
      errorRate: 0.1,
      queueSize: 1000,
      failedJobs: 50,
      proxyFailureRate: 0.5
    }
  },

  // Domain-specific rate limits
  domainLimits: {
    'example.com': {
      maxConcurrent: 2,
      minTime: 2000
    },
    'google.com': {
      maxConcurrent: 1,
      minTime: 5000
    }
  }
};
