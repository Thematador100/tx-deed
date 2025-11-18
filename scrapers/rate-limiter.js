/**
 * RATE LIMITER
 *
 * Ensures respectful crawling by limiting request rates
 * Prevents overwhelming county websites and getting IP banned
 */

export class RateLimiter {
    constructor(requestsPerMinute = 60) {
        this.requestsPerMinute = requestsPerMinute;
        this.requestTimestamps = [];
        this.minIntervalMs = (60 * 1000) / requestsPerMinute;
    }

    /**
     * Wait for an available slot based on rate limit
     */
    async waitForSlot() {
        const now = Date.now();

        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < 60000
        );

        // If we're at capacity, wait
        if (this.requestTimestamps.length >= this.requestsPerMinute) {
            const oldestTimestamp = this.requestTimestamps[0];
            const waitTime = 60000 - (now - oldestTimestamp);

            if (waitTime > 0) {
                await this.sleep(waitTime);
            }
        }

        // Also ensure minimum interval between requests
        if (this.requestTimestamps.length > 0) {
            const lastTimestamp = this.requestTimestamps[this.requestTimestamps.length - 1];
            const timeSinceLastRequest = now - lastTimestamp;

            if (timeSinceLastRequest < this.minIntervalMs) {
                await this.sleep(this.minIntervalMs - timeSinceLastRequest);
            }
        }

        // Record this request
        this.requestTimestamps.push(Date.now());
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current usage statistics
     */
    getStats() {
        const now = Date.now();
        const recentRequests = this.requestTimestamps.filter(
            timestamp => now - timestamp < 60000
        );

        return {
            requestsInLastMinute: recentRequests.length,
            capacityUsed: (recentRequests.length / this.requestsPerMinute) * 100,
            remainingCapacity: this.requestsPerMinute - recentRequests.length
        };
    }
}

export default RateLimiter;
