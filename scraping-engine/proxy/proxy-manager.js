import axios from 'axios';
import { logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache-manager.js';

export class ProxyManager {
  constructor(config = {}) {
    this.config = {
      providers: config.providers || [],
      rotationStrategy: config.rotationStrategy || 'round-robin', // round-robin, random, least-used
      healthCheckInterval: config.healthCheckInterval || 300000, // 5 minutes
      maxFailures: config.maxFailures || 3,
      healthCheckUrl: config.healthCheckUrl || 'https://api.ipify.org?format=json',
      ...config
    };

    this.proxies = [];
    this.activeProxies = new Map();
    this.failedProxies = new Set();
    this.usageStats = new Map();
    this.currentIndex = 0;
    this.cache = new CacheManager({ ttl: 3600 });

    this.initialize();
  }

  async initialize() {
    logger.info('Initializing proxy manager...');

    // Load proxies from providers
    await this.loadProxies();

    // Start health check interval
    if (this.config.healthCheckInterval > 0) {
      setInterval(() => this.healthCheck(), this.config.healthCheckInterval);
    }

    logger.info(`Proxy manager initialized with ${this.proxies.length} proxies`);
  }

  async loadProxies() {
    // Load from environment variables
    if (process.env.PROXY_LIST) {
      const envProxies = process.env.PROXY_LIST.split(',').map(p => p.trim());
      this.addProxies(envProxies.map(url => ({ url })));
    }

    // Load from providers
    for (const provider of this.config.providers) {
      try {
        const proxies = await this.fetchFromProvider(provider);
        this.addProxies(proxies);
        logger.info(`Loaded ${proxies.length} proxies from ${provider.name}`);
      } catch (error) {
        logger.error(`Failed to load proxies from ${provider.name}:`, error);
      }
    }

    // Load residential/datacenter proxies if configured
    if (process.env.BRIGHTDATA_USERNAME && process.env.BRIGHTDATA_PASSWORD) {
      this.addBrightDataProxy();
    }

    if (process.env.OXYLABS_USERNAME && process.env.OXYLABS_PASSWORD) {
      this.addOxylabsProxy();
    }

    if (process.env.SMARTPROXY_USERNAME && process.env.SMARTPROXY_PASSWORD) {
      this.addSmartproxyProxy();
    }
  }

  addBrightDataProxy() {
    const proxy = {
      url: `http://brd.superproxy.io:22225`,
      username: process.env.BRIGHTDATA_USERNAME,
      password: process.env.BRIGHTDATA_PASSWORD,
      type: 'residential',
      provider: 'brightdata'
    };
    this.addProxies([proxy]);
    logger.info('Added BrightData residential proxy');
  }

  addOxylabsProxy() {
    const proxy = {
      url: `http://pr.oxylabs.io:7777`,
      username: process.env.OXYLABS_USERNAME,
      password: process.env.OXYLABS_PASSWORD,
      type: 'residential',
      provider: 'oxylabs'
    };
    this.addProxies([proxy]);
    logger.info('Added Oxylabs residential proxy');
  }

  addSmartproxyProxy() {
    const proxy = {
      url: `http://gate.smartproxy.com:7000`,
      username: process.env.SMARTPROXY_USERNAME,
      password: process.env.SMARTPROXY_PASSWORD,
      type: 'residential',
      provider: 'smartproxy'
    };
    this.addProxies([proxy]);
    logger.info('Added Smartproxy residential proxy');
  }

  async fetchFromProvider(provider) {
    if (provider.type === 'api') {
      const response = await axios.get(provider.url, {
        headers: provider.headers || {},
        params: provider.params || {}
      });

      return this.parseProxyList(response.data, provider.format);
    } else if (provider.type === 'file') {
      const fs = await import('fs/promises');
      const content = await fs.readFile(provider.path, 'utf-8');
      return this.parseProxyList(content, provider.format);
    }

    return [];
  }

  parseProxyList(data, format = 'text') {
    if (format === 'json') {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return Array.isArray(parsed) ? parsed : [parsed];
    }

    // Text format: ip:port or ip:port:user:pass
    const lines = data.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const parts = line.trim().split(':');
      if (parts.length >= 2) {
        const proxy = {
          url: `http://${parts[0]}:${parts[1]}`
        };
        if (parts.length >= 4) {
          proxy.username = parts[2];
          proxy.password = parts[3];
        }
        return proxy;
      }
      return null;
    }).filter(Boolean);
  }

  addProxies(proxies) {
    for (const proxy of proxies) {
      const proxyId = this.generateProxyId(proxy);
      if (!this.proxies.find(p => this.generateProxyId(p) === proxyId)) {
        this.proxies.push({
          id: proxyId,
          ...proxy,
          addedAt: Date.now(),
          healthy: true,
          failures: 0,
          lastChecked: null,
          lastUsed: null,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0
        });
      }
    }
  }

  async getProxy(options = {}) {
    const availableProxies = this.proxies.filter(p =>
      p.healthy &&
      !this.failedProxies.has(p.id) &&
      (!options.type || p.type === options.type)
    );

    if (availableProxies.length === 0) {
      logger.warn('No healthy proxies available');
      return null;
    }

    let proxy;

    switch (this.config.rotationStrategy) {
      case 'round-robin':
        proxy = availableProxies[this.currentIndex % availableProxies.length];
        this.currentIndex++;
        break;

      case 'random':
        proxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
        break;

      case 'least-used':
        proxy = availableProxies.reduce((least, current) =>
          current.totalRequests < least.totalRequests ? current : least
        );
        break;

      default:
        proxy = availableProxies[0];
    }

    proxy.lastUsed = Date.now();
    proxy.totalRequests++;
    this.activeProxies.set(proxy.id, proxy);

    return proxy;
  }

  releaseProxy(proxy) {
    if (proxy && proxy.id) {
      this.activeProxies.delete(proxy.id);
    }
  }

  reportSuccess(proxy) {
    if (proxy && proxy.id) {
      const p = this.proxies.find(pr => pr.id === proxy.id);
      if (p) {
        p.successfulRequests++;
        p.failures = 0;
        p.healthy = true;
        this.failedProxies.delete(p.id);
      }
    }
  }

  reportFailure(proxy, error) {
    if (!proxy || !proxy.id) return;

    const p = this.proxies.find(pr => pr.id === proxy.id);
    if (p) {
      p.failedRequests++;
      p.failures++;

      logger.warn(`Proxy ${p.url} failed (${p.failures}/${this.config.maxFailures}):`, error?.message);

      if (p.failures >= this.config.maxFailures) {
        p.healthy = false;
        this.failedProxies.add(p.id);
        logger.error(`Proxy ${p.url} marked as unhealthy after ${p.failures} failures`);
      }
    }
  }

  async healthCheck() {
    logger.info('Starting proxy health check...');

    const checks = this.proxies.map(proxy => this.checkProxy(proxy));
    const results = await Promise.allSettled(checks);

    let healthy = 0;
    let unhealthy = 0;

    results.forEach((result, index) => {
      const proxy = this.proxies[index];
      if (result.status === 'fulfilled' && result.value) {
        proxy.healthy = true;
        proxy.failures = 0;
        this.failedProxies.delete(proxy.id);
        healthy++;
      } else {
        proxy.failures++;
        if (proxy.failures >= this.config.maxFailures) {
          proxy.healthy = false;
          this.failedProxies.add(proxy.id);
        }
        unhealthy++;
      }
      proxy.lastChecked = Date.now();
    });

    logger.info(`Health check complete: ${healthy} healthy, ${unhealthy} unhealthy`);
  }

  async checkProxy(proxy) {
    try {
      const proxyUrl = proxy.username && proxy.password
        ? proxy.url.replace('://', `://${proxy.username}:${proxy.password}@`)
        : proxy.url;

      const response = await axios.get(this.config.healthCheckUrl, {
        proxy: {
          host: new URL(proxy.url).hostname,
          port: parseInt(new URL(proxy.url).port),
          auth: proxy.username && proxy.password ? {
            username: proxy.username,
            password: proxy.password
          } : undefined
        },
        timeout: 10000
      });

      return response.status === 200;
    } catch (error) {
      logger.debug(`Proxy health check failed for ${proxy.url}:`, error.message);
      return false;
    }
  }

  generateProxyId(proxy) {
    return `${proxy.url}_${proxy.username || 'anon'}`;
  }

  getStats() {
    const totalProxies = this.proxies.length;
    const healthyProxies = this.proxies.filter(p => p.healthy).length;
    const activeCount = this.activeProxies.size;
    const totalRequests = this.proxies.reduce((sum, p) => sum + p.totalRequests, 0);
    const successfulRequests = this.proxies.reduce((sum, p) => sum + p.successfulRequests, 0);
    const failedRequests = this.proxies.reduce((sum, p) => sum + p.failedRequests, 0);

    return {
      total: totalProxies,
      healthy: healthyProxies,
      unhealthy: totalProxies - healthyProxies,
      active: activeCount,
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: failedRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) + '%' : '0%'
      },
      proxies: this.proxies.map(p => ({
        id: p.id,
        url: p.url,
        type: p.type,
        provider: p.provider,
        healthy: p.healthy,
        requests: p.totalRequests,
        successRate: p.totalRequests > 0
          ? (p.successfulRequests / p.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        lastUsed: p.lastUsed,
        lastChecked: p.lastChecked
      }))
    };
  }

  async rotateIP(proxy) {
    // For services that support IP rotation via API
    if (proxy.provider === 'brightdata' && process.env.BRIGHTDATA_API_KEY) {
      try {
        await axios.post('https://brightdata.com/api/zone/rotate_ip', {
          zone: proxy.zone || 'default'
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.BRIGHTDATA_API_KEY}`
          }
        });
        logger.info(`Rotated IP for proxy ${proxy.id}`);
      } catch (error) {
        logger.error(`Failed to rotate IP for proxy ${proxy.id}:`, error);
      }
    }
  }
}
