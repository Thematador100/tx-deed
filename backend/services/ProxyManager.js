/**
 * Proxy Manager
 * Advanced proxy rotation and management system to prevent IP blocking
 * Supports multiple proxy providers: BrightData, Oxylabs, SmartProxy
 */

import config from '../config/config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

class ProxyManager {
  constructor() {
    this.currentProxy = null;
    this.proxyPool = [];
    this.failedProxies = new Set();
    this.requestCounts = new Map();
    this.lastRotation = Date.now();
    this.initialize();
  }

  initialize() {
    const proxyConfig = config.get('proxy');

    if (!proxyConfig.rotationEnabled) {
      console.log('[ProxyManager] Proxy rotation is disabled');
      return;
    }

    // Build proxy pool from configured providers
    this.buildProxyPool();

    // Select initial proxy
    this.rotateProxy();

    // Set up automatic rotation
    if (proxyConfig.rotationInterval > 0) {
      setInterval(() => {
        this.rotateProxy();
      }, proxyConfig.rotationInterval);
    }
  }

  buildProxyPool() {
    const proxyConfig = config.get('proxy');
    const provider = proxyConfig.provider;

    switch (provider) {
      case 'brightdata':
        this.addBrightDataProxies();
        break;
      case 'oxylabs':
        this.addOxylabsProxies();
        break;
      case 'smartproxy':
        this.addSmartProxyProxies();
        break;
      case 'all':
        this.addBrightDataProxies();
        this.addOxylabsProxies();
        this.addSmartProxyProxies();
        break;
      default:
        console.warn(`[ProxyManager] Unknown proxy provider: ${provider}`);
    }

    console.log(`[ProxyManager] Built proxy pool with ${this.proxyPool.length} proxies`);
  }

  addBrightDataProxies() {
    const { username, password, host, port } = config.get('proxy.brightData');

    if (!username || !password) {
      console.warn('[ProxyManager] BrightData credentials not configured');
      return;
    }

    // BrightData supports session control for sticky IPs
    const sessionId = Math.random().toString(36).substring(7);

    const proxy = {
      provider: 'brightdata',
      host,
      port,
      username: `${username}-session-${sessionId}`,
      password,
      url: `http://${username}-session-${sessionId}:${password}@${host}:${port}`,
      sessionId,
      type: 'residential',
    };

    this.proxyPool.push(proxy);
  }

  addOxylabsProxies() {
    const { username, password, host, port } = config.get('proxy.oxylabs');

    if (!username || !password) {
      console.warn('[ProxyManager] Oxylabs credentials not configured');
      return;
    }

    const sessionId = Math.random().toString(36).substring(7);

    const proxy = {
      provider: 'oxylabs',
      host,
      port,
      username: `${username}-session-${sessionId}`,
      password,
      url: `http://${username}-session-${sessionId}:${password}@${host}:${port}`,
      sessionId,
      type: 'residential',
    };

    this.proxyPool.push(proxy);
  }

  addSmartProxyProxies() {
    const { username, password, host, port } = config.get('proxy.smartProxy');

    if (!username || !password) {
      console.warn('[ProxyManager] SmartProxy credentials not configured');
      return;
    }

    const sessionId = Math.random().toString(36).substring(7);

    const proxy = {
      provider: 'smartproxy',
      host,
      port,
      username: `${username}-session-${sessionId}`,
      password,
      url: `http://${username}-session-${sessionId}:${password}@${host}:${port}`,
      sessionId,
      type: 'residential',
    };

    this.proxyPool.push(proxy);
  }

  rotateProxy() {
    if (this.proxyPool.length === 0) {
      console.warn('[ProxyManager] No proxies available in pool');
      return null;
    }

    // Filter out failed proxies
    const availableProxies = this.proxyPool.filter(
      proxy => !this.failedProxies.has(proxy.url)
    );

    if (availableProxies.length === 0) {
      console.warn('[ProxyManager] All proxies have failed, resetting failed list');
      this.failedProxies.clear();
      return this.rotateProxy();
    }

    // Select proxy with least usage
    const proxyWithLeastUsage = availableProxies.reduce((min, proxy) => {
      const count = this.requestCounts.get(proxy.url) || 0;
      const minCount = this.requestCounts.get(min.url) || 0;
      return count < minCount ? proxy : min;
    });

    this.currentProxy = proxyWithLeastUsage;
    this.lastRotation = Date.now();

    console.log(`[ProxyManager] Rotated to proxy: ${this.currentProxy.provider} (${this.currentProxy.sessionId})`);

    return this.currentProxy;
  }

  getCurrentProxy() {
    if (!this.currentProxy) {
      this.rotateProxy();
    }
    return this.currentProxy;
  }

  getProxyAgent() {
    const proxy = this.getCurrentProxy();

    if (!proxy) {
      return null;
    }

    return new HttpsProxyAgent(proxy.url);
  }

  getProxyConfig() {
    const proxy = this.getCurrentProxy();

    if (!proxy) {
      return null;
    }

    return {
      host: proxy.host,
      port: proxy.port,
      auth: {
        username: proxy.username,
        password: proxy.password,
      },
    };
  }

  incrementRequestCount(proxyUrl = null) {
    const url = proxyUrl || this.currentProxy?.url;
    if (!url) return;

    const count = this.requestCounts.get(url) || 0;
    this.requestCounts.set(url, count + 1);
  }

  markProxyAsFailed(proxyUrl = null) {
    const url = proxyUrl || this.currentProxy?.url;
    if (!url) return;

    this.failedProxies.add(url);
    console.warn(`[ProxyManager] Marked proxy as failed: ${url}`);

    // Rotate to a new proxy
    this.rotateProxy();
  }

  getStats() {
    return {
      totalProxies: this.proxyPool.length,
      failedProxies: this.failedProxies.size,
      currentProxy: this.currentProxy ? {
        provider: this.currentProxy.provider,
        sessionId: this.currentProxy.sessionId,
      } : null,
      requestCounts: Object.fromEntries(this.requestCounts),
      lastRotation: new Date(this.lastRotation).toISOString(),
    };
  }

  reset() {
    this.failedProxies.clear();
    this.requestCounts.clear();
    console.log('[ProxyManager] Reset all proxy statistics');
  }
}

// Export singleton instance
const proxyManager = new ProxyManager();
export default proxyManager;
