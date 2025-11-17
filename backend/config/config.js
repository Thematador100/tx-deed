/**
 * Configuration Manager
 * Centralized configuration management with validation
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // Environment
      env: process.env.NODE_ENV || 'development',
      appEnv: process.env.VITE_APP_ENV || 'development',

      // Supabase
      supabase: {
        url: process.env.VITE_SUPABASE_URL,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },

      // Melissa Data (Prepaid License)
      melissaData: {
        licenseKey: process.env.MELISSA_DATA_LICENSE_KEY,
        apiUrl: process.env.MELISSA_DATA_API_URL || 'https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify',
      },

      // Property Data APIs
      apis: {
        attom: {
          apiKey: process.env.ATTOM_API_KEY,
          apiUrl: process.env.ATTOM_API_URL || 'https://api.gateway.attomdata.com/propertyapi/v1.0.0',
          costPerRequest: parseFloat(process.env.API_COST_ATTOM || '0.15'),
        },
        coreLogic: {
          apiKey: process.env.CORELOGIC_API_KEY,
          apiUrl: process.env.CORELOGIC_API_URL || 'https://api.corelogic.com/property',
          costPerRequest: parseFloat(process.env.API_COST_CORELOGIC || '0.20'),
        },
        zillow: {
          apiKey: process.env.ZILLOW_API_KEY,
          costPerRequest: 0.10,
        },
        propStream: {
          apiKey: process.env.PROPSTREAM_API_KEY,
          apiUrl: process.env.PROPSTREAM_API_URL || 'https://api.propstreampro.com',
          costPerRequest: parseFloat(process.env.API_COST_PROPSTREAM || '0.12'),
        },
        regrid: {
          apiKey: process.env.REGRID_API_KEY,
          apiUrl: process.env.REGRID_API_URL || 'https://app.regrid.com/api/v1',
          costPerRequest: parseFloat(process.env.API_COST_REGRID || '0.08'),
        },
        dataTree: {
          username: process.env.DATATREE_USERNAME,
          password: process.env.DATATREE_PASSWORD,
          costPerRequest: 0.25,
        },
      },

      // Proxy Configuration
      proxy: {
        provider: process.env.PROXY_PROVIDER || 'brightdata',
        rotationEnabled: process.env.PROXY_ROTATION_ENABLED === 'true',
        rotationInterval: parseInt(process.env.PROXY_ROTATION_INTERVAL || '300000'),
        brightData: {
          username: process.env.BRIGHT_DATA_USERNAME,
          password: process.env.BRIGHT_DATA_PASSWORD,
          host: process.env.BRIGHT_DATA_HOST || 'brd.superproxy.io',
          port: parseInt(process.env.BRIGHT_DATA_PORT || '22225'),
        },
        oxylabs: {
          username: process.env.OXYLABS_USERNAME,
          password: process.env.OXYLABS_PASSWORD,
          host: process.env.OXYLABS_HOST || 'pr.oxylabs.io',
          port: parseInt(process.env.OXYLABS_PORT || '7777'),
        },
        smartProxy: {
          username: process.env.SMARTPROXY_USERNAME,
          password: process.env.SMARTPROXY_PASSWORD,
          host: process.env.SMARTPROXY_HOST || 'gate.smartproxy.com',
          port: parseInt(process.env.SMARTPROXY_PORT || '7000'),
        },
      },

      // CAPTCHA Solving
      captcha: {
        provider: process.env.CAPTCHA_SOLVER_PROVIDER || '2captcha',
        twoCaptcha: {
          apiKey: process.env.TWOCAPTCHA_API_KEY,
        },
        antiCaptcha: {
          apiKey: process.env.ANTICAPTCHA_API_KEY,
        },
      },

      // Rate Limiting
      rateLimit: {
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '10'),
        requestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '100'),
        concurrentRequests: parseInt(process.env.RATE_LIMIT_CONCURRENT_REQUESTS || '5'),
      },

      // Scraping Configuration
      scraping: {
        enabled: process.env.SCRAPING_ENABLED === 'true',
        headless: process.env.SCRAPING_HEADLESS !== 'false',
        timeout: parseInt(process.env.SCRAPING_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.SCRAPING_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.SCRAPING_RETRY_DELAY || '5000'),
      },

      // AI Services
      ai: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
        },
        google: {
          apiKey: process.env.GOOGLE_AI_API_KEY,
        },
        deepseek: {
          apiKey: process.env.DEEPSEEK_API_KEY,
          apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
        },
      },

      // Stripe
      stripe: {
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
      },

      // Communications
      email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@winwithdeeds.com',
      },
      sms: {
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
      },

      // Database & Cache
      database: {
        url: process.env.DATABASE_URL,
      },
      redis: {
        url: process.env.REDIS_URL,
        cacheTTL: parseInt(process.env.REDIS_CACHE_TTL || '3600'),
      },

      // Feature Flags
      features: {
        advancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
        quantModels: process.env.ENABLE_QUANT_MODELS === 'true',
        pdfReports: process.env.ENABLE_PDF_REPORTS === 'true',
        distressedDetection: process.env.ENABLE_DISTRESSED_DETECTION === 'true',
      },

      // Cost Optimization
      costOptimization: {
        enabled: process.env.API_COST_OPTIMIZATION_ENABLED === 'true',
        fallbackOrder: (process.env.API_FALLBACK_ORDER || 'melissa,attom,corelogic,propstream,regrid').split(','),
      },
    };
  }

  validateConfig() {
    const errors = [];

    // Validate critical configurations
    if (!this.config.supabase.url) {
      errors.push('VITE_SUPABASE_URL is required');
    }

    if (!this.config.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is required');
    }

    // Warn about missing optional configurations
    const warnings = [];

    if (!this.config.melissaData.licenseKey) {
      warnings.push('MELISSA_DATA_LICENSE_KEY is not set - Melissa Data integration will not work');
    }

    if (!this.config.proxy.brightData.username && !this.config.proxy.oxylabs.username && !this.config.proxy.smartProxy.username) {
      warnings.push('No proxy service configured - anti-blocking features will be limited');
    }

    if (!this.config.captcha.twoCaptcha.apiKey && !this.config.captcha.antiCaptcha.apiKey) {
      warnings.push('No CAPTCHA solver configured - CAPTCHA challenges cannot be automatically solved');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }

    if (warnings.length > 0 && this.config.env === 'development') {
      console.warn('Configuration warnings:');
      warnings.forEach(warning => console.warn(`- ${warning}`));
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      value = value?.[k];
    }

    return value;
  }

  getAll() {
    return this.config;
  }

  isProduction() {
    return this.config.env === 'production';
  }

  isDevelopment() {
    return this.config.env === 'development';
  }
}

// Export singleton instance
const config = new ConfigManager();
export default config;
