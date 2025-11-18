import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';
import { logger } from './logger.js';

export class CacheManager {
  constructor(config = {}) {
    this.config = {
      type: config.type || 'memory', // 'memory' or 'redis'
      ttl: config.ttl || 3600, // seconds
      max: config.max || 1000,
      ...config
    };

    if (this.config.type === 'memory') {
      this.cache = new LRUCache({
        max: this.config.max,
        ttl: this.config.ttl * 1000, // Convert to milliseconds
        updateAgeOnGet: true,
        updateAgeOnHas: true
      });
    } else if (this.config.type === 'redis') {
      this.redis = new Redis({
        host: config.redisHost || process.env.REDIS_HOST || 'localhost',
        port: config.redisPort || process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: config.redisDb || 0,
        keyPrefix: config.keyPrefix || 'cache:',
        ...config.redis
      });
    }
  }

  async get(key) {
    try {
      if (this.config.type === 'memory') {
        return this.cache.get(key);
      } else if (this.config.type === 'redis') {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl) {
    try {
      const cacheTtl = ttl || this.config.ttl;

      if (this.config.type === 'memory') {
        this.cache.set(key, value, { ttl: cacheTtl * 1000 });
      } else if (this.config.type === 'redis') {
        await this.redis.setex(key, cacheTtl, JSON.stringify(value));
      }

      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      if (this.config.type === 'memory') {
        this.cache.delete(key);
      } else if (this.config.type === 'redis') {
        await this.redis.del(key);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      if (this.config.type === 'memory') {
        this.cache.clear();
      } else if (this.config.type === 'redis') {
        const keys = await this.redis.keys(`${this.config.keyPrefix || 'cache:'}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  async has(key) {
    try {
      if (this.config.type === 'memory') {
        return this.cache.has(key);
      } else if (this.config.type === 'redis') {
        return (await this.redis.exists(key)) === 1;
      }
    } catch (error) {
      logger.error(`Cache has error for key ${key}:`, error);
      return false;
    }
  }

  async getOrSet(key, fetchFn, ttl) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
