/**
 * Anti-Blocking HTTP Client
 * Advanced HTTP client with anti-blocking features:
 * - Proxy rotation
 * - User-agent rotation
 * - Rate limiting
 * - Retry logic with exponential backoff
 * - Request fingerprinting randomization
 */

import fetch from 'node-fetch';
import proxyManager from './ProxyManager.js';
import userAgentRotator from './UserAgentRotator.js';
import rateLimiter from './RateLimiter.js';
import config from '../config/config.js';

class AntiBlockingHttpClient {
  constructor() {
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      blocked: 0,
    };
  }

  async request(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      useProxy = true,
      rotateUserAgent = true,
      retryAttempts = config.get('scraping.retryAttempts') || 3,
      retryDelay = config.get('scraping.retryDelay') || 5000,
      timeout = config.get('scraping.timeout') || 30000,
      validateResponse = null,
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Apply rate limiting
        await rateLimiter.executeWithRateLimit(async () => {
          // Build request options
          const requestOptions = await this.buildRequestOptions({
            method,
            headers,
            body,
            useProxy,
            rotateUserAgent,
            timeout,
          });

          // Make request
          this.requestStats.total++;

          const response = await fetch(url, requestOptions);

          // Check if blocked
          if (this.isBlockedResponse(response)) {
            this.requestStats.blocked++;
            throw new Error('Request blocked - detected bot behavior');
          }

          // Validate response if validator provided
          if (validateResponse && !validateResponse(response)) {
            throw new Error('Response validation failed');
          }

          // Check if successful
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          this.requestStats.successful++;

          // Return response
          return response;
        });

        return; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        this.requestStats.failed++;

        // If this was not the last attempt, retry with backoff
        if (attempt < retryAttempts) {
          this.requestStats.retried++;

          const backoffDelay = this.calculateBackoff(attempt, retryDelay);
          console.log(`[AntiBlockingHttpClient] Retry attempt ${attempt + 1}/${retryAttempts} after ${backoffDelay}ms - ${error.message}`);

          // Rotate proxy on failure
          if (useProxy) {
            proxyManager.markProxyAsFailed();
          }

          await this.sleep(backoffDelay);
        }
      }
    }

    // All retries failed
    throw new Error(`Request failed after ${retryAttempts} attempts: ${lastError.message}`);
  }

  async buildRequestOptions({ method, headers, body, useProxy, rotateUserAgent, timeout }) {
    const requestOptions = {
      method,
      headers: { ...headers },
      timeout,
    };

    // Add body if present
    if (body) {
      if (typeof body === 'object' && !(body instanceof FormData)) {
        requestOptions.body = JSON.stringify(body);
        requestOptions.headers['Content-Type'] = 'application/json';
      } else {
        requestOptions.body = body;
      }
    }

    // Rotate user agent
    if (rotateUserAgent) {
      const defaultHeaders = userAgentRotator.getDefaultHeaders();
      requestOptions.headers = { ...defaultHeaders, ...requestOptions.headers };
    }

    // Add proxy
    if (useProxy) {
      const proxyAgent = proxyManager.getProxyAgent();
      if (proxyAgent) {
        requestOptions.agent = proxyAgent;
        proxyManager.incrementRequestCount();
      }
    }

    // Add random delays to headers to simulate human behavior
    this.addRandomFingerprint(requestOptions.headers);

    return requestOptions;
  }

  addRandomFingerprint(headers) {
    // Randomize header order and add subtle variations
    const variations = [
      { key: 'Accept-CH', value: 'DPR, Width, Viewport-Width' },
      { key: 'Viewport-Width', value: String(Math.floor(Math.random() * 500) + 1200) },
      { key: 'DPR', value: String(Math.random() > 0.5 ? '1' : '2') },
    ];

    // Randomly add some of these headers
    if (Math.random() > 0.5) {
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];
      headers[randomVariation.key] = randomVariation.value;
    }
  }

  isBlockedResponse(response) {
    // Common blocking indicators
    const blockedStatusCodes = [403, 429, 503];
    const blockedHeaders = ['cf-ray', 'cf-mitigated'];

    // Check status code
    if (blockedStatusCodes.includes(response.status)) {
      return true;
    }

    // Check for Cloudflare or other WAF headers
    for (const header of blockedHeaders) {
      if (response.headers.has(header)) {
        return true;
      }
    }

    return false;
  }

  calculateBackoff(attempt, baseDelay) {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, { ...options, method: 'POST', body: data });
  }

  async put(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body: data });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  getStats() {
    return {
      ...this.requestStats,
      successRate: this.requestStats.total > 0
        ? ((this.requestStats.successful / this.requestStats.total) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  resetStats() {
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      blocked: 0,
    };
    console.log('[AntiBlockingHttpClient] Reset statistics');
  }
}

// Export singleton instance
const httpClient = new AntiBlockingHttpClient();
export default httpClient;
