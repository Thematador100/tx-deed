/**
 * User Agent Rotator
 * Rotates user agents to prevent fingerprinting and blocking
 * Uses real browser user agents for better stealth
 */

class UserAgentRotator {
  constructor() {
    this.userAgents = this.buildUserAgentPool();
    this.currentIndex = 0;
    this.usageStats = new Map();
  }

  buildUserAgentPool() {
    return [
      // Chrome on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',

      // Chrome on Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

      // Firefox on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',

      // Firefox on Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',

      // Safari on Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',

      // Edge on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',

      // Chrome on Linux
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

      // Mobile Chrome
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',

      // Mobile Safari
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    ];
  }

  getRandomUserAgent() {
    const randomIndex = Math.floor(Math.random() * this.userAgents.length);
    const userAgent = this.userAgents[randomIndex];

    this.incrementUsage(userAgent);
    return userAgent;
  }

  getNextUserAgent() {
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    const userAgent = this.userAgents[this.currentIndex];

    this.incrementUsage(userAgent);
    return userAgent;
  }

  getLeastUsedUserAgent() {
    let minUsage = Infinity;
    let leastUsed = this.userAgents[0];

    for (const ua of this.userAgents) {
      const usage = this.usageStats.get(ua) || 0;
      if (usage < minUsage) {
        minUsage = usage;
        leastUsed = ua;
      }
    }

    this.incrementUsage(leastUsed);
    return leastUsed;
  }

  incrementUsage(userAgent) {
    const current = this.usageStats.get(userAgent) || 0;
    this.usageStats.set(userAgent, current + 1);
  }

  getDefaultHeaders(userAgent = null) {
    const ua = userAgent || this.getRandomUserAgent();

    // Detect browser type from user agent
    const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
    const isFirefox = ua.includes('Firefox');
    const isSafari = ua.includes('Safari') && !ua.includes('Chrome');
    const isEdge = ua.includes('Edg');

    const headers = {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
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
    };

    // Browser-specific headers
    if (isChrome || isEdge) {
      headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
      headers['sec-ch-ua-mobile'] = '?0';
      headers['sec-ch-ua-platform'] = '"Windows"';
    }

    return headers;
  }

  getStats() {
    return {
      totalUserAgents: this.userAgents.length,
      currentIndex: this.currentIndex,
      usageStats: Object.fromEntries(this.usageStats),
    };
  }

  reset() {
    this.usageStats.clear();
    this.currentIndex = 0;
    console.log('[UserAgentRotator] Reset usage statistics');
  }
}

// Export singleton instance
const userAgentRotator = new UserAgentRotator();
export default userAgentRotator;
