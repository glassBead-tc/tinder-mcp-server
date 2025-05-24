/**
 * Cache Manager Service
 * Manages caching of API responses
 */

import NodeCache from 'node-cache';
import config from '../config';
import logger from '../utils/logger';

/**
 * Cache Manager class
 * Provides caching functionality for API responses
 */
class CacheManager {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.CACHE.TTL,
      checkperiod: config.CACHE.CHECK_PERIOD,
      useClones: false
    });
    
    logger.info(`Cache initialized with TTL: ${config.CACHE.TTL}s, Check period: ${config.CACHE.CHECK_PERIOD}s`);
  }

  /**
   * Get cached value
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get<T>(key);
      return value !== undefined ? value : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Set cache value
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional, uses default if not provided)
   * @returns Success status
   */
  public async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (ttl !== undefined) {
        return this.cache.set(key, value, ttl);
      } else {
        return this.cache.set(key, value);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Delete cached value
   * @param key - Cache key
   * @returns Success status
   */
  public async del(key: string): Promise<boolean> {
    try {
      return this.cache.del(key) > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Clear all cached values
   * @returns Success status
   */
  public async clear(): Promise<boolean> {
    try {
      this.cache.flushAll();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error(`Cache clear error: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  /**
   * Get all cache keys
   * @returns Array of cache keys
   */
  public getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns True if key exists
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Export singleton instance
export default new CacheManager();