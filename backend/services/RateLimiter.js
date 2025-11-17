/**
 * Rate Limiter
 * Advanced rate limiting to prevent being flagged as a bot
 * Implements token bucket algorithm with concurrent request limiting
 */

import config from '../config/config.js';

class RateLimiter {
  constructor() {
    const rateLimitConfig = config.get('rateLimit');

    this.requestsPerMinute = rateLimitConfig.requestsPerMinute;
    this.requestsPerHour = rateLimitConfig.requestsPerHour;
    this.maxConcurrent = rateLimitConfig.concurrentRequests;

    this.minuteTokens = this.requestsPerMinute;
    this.hourTokens = this.requestsPerHour;
    this.concurrentRequests = 0;

    this.requestQueue = [];
    this.requestHistory = [];

    // Refill tokens every minute
    setInterval(() => this.refillMinuteTokens(), 60000);

    // Refill hour tokens every hour
    setInterval(() => this.refillHourTokens(), 3600000);
  }

  refillMinuteTokens() {
    this.minuteTokens = this.requestsPerMinute;
    console.log('[RateLimiter] Refilled minute tokens');
  }

  refillHourTokens() {
    this.hourTokens = this.requestsPerHour;
    console.log('[RateLimiter] Refilled hour tokens');
  }

  async acquireToken() {
    return new Promise((resolve) => {
      const attempt = () => {
        // Check if we have tokens and capacity for concurrent requests
        if (
          this.minuteTokens > 0 &&
          this.hourTokens > 0 &&
          this.concurrentRequests < this.maxConcurrent
        ) {
          this.minuteTokens--;
          this.hourTokens--;
          this.concurrentRequests++;

          this.recordRequest();
          resolve();
        } else {
          // Calculate wait time
          const waitTime = this.calculateWaitTime();
          setTimeout(attempt, waitTime);
        }
      };

      attempt();
    });
  }

  releaseToken() {
    this.concurrentRequests = Math.max(0, this.concurrentRequests - 1);
  }

  calculateWaitTime() {
    // If no minute tokens, wait 1 second
    if (this.minuteTokens <= 0) {
      return 1000;
    }

    // If no hour tokens, wait 5 seconds
    if (this.hourTokens <= 0) {
      return 5000;
    }

    // If at max concurrent, wait 500ms
    if (this.concurrentRequests >= this.maxConcurrent) {
      return 500;
    }

    // Default wait
    return 100;
  }

  recordRequest() {
    this.requestHistory.push({
      timestamp: Date.now(),
    });

    // Keep only last hour of history
    const oneHourAgo = Date.now() - 3600000;
    this.requestHistory = this.requestHistory.filter(
      req => req.timestamp > oneHourAgo
    );
  }

  async executeWithRateLimit(fn) {
    await this.acquireToken();

    try {
      const result = await fn();
      return result;
    } finally {
      this.releaseToken();
    }
  }

  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    const requestsLastMinute = this.requestHistory.filter(
      req => req.timestamp > oneMinuteAgo
    ).length;

    const requestsLastHour = this.requestHistory.filter(
      req => req.timestamp > oneHourAgo
    ).length;

    return {
      minuteTokensRemaining: this.minuteTokens,
      hourTokensRemaining: this.hourTokens,
      concurrentRequests: this.concurrentRequests,
      maxConcurrent: this.maxConcurrent,
      requestsLastMinute,
      requestsLastHour,
      requestsPerMinuteLimit: this.requestsPerMinute,
      requestsPerHourLimit: this.requestsPerHour,
    };
  }

  reset() {
    this.minuteTokens = this.requestsPerMinute;
    this.hourTokens = this.requestsPerHour;
    this.concurrentRequests = 0;
    this.requestHistory = [];
    console.log('[RateLimiter] Reset all limits');
  }
}

// Export singleton instance
const rateLimiter = new RateLimiter();
export default rateLimiter;
