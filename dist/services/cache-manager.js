"use strict";
/**
 * Cache Manager Service
 * Manages caching of API responses
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Cache Manager class
 * Provides caching functionality for API responses
 */
class CacheManager {
    constructor() {
        this.cache = new node_cache_1.default({
            stdTTL: config_1.default.CACHE.TTL,
            checkperiod: config_1.default.CACHE.CHECK_PERIOD,
            useClones: false
        });
        logger_1.default.info(`Cache initialized with TTL: ${config_1.default.CACHE.TTL}s, Check period: ${config_1.default.CACHE.CHECK_PERIOD}s`);
    }
    /**
     * Get cached value
     * @param key - Cache key
     * @returns Cached value or null if not found
     */
    async get(key) {
        try {
            const value = this.cache.get(key);
            return value !== undefined ? value : null;
        }
        catch (error) {
            logger_1.default.error(`Cache get error for key ${key}: ${error.message}`);
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
    async set(key, value, ttl) {
        try {
            if (ttl !== undefined) {
                return this.cache.set(key, value, ttl);
            }
            else {
                return this.cache.set(key, value);
            }
        }
        catch (error) {
            logger_1.default.error(`Cache set error for key ${key}: ${error.message}`);
            return false;
        }
    }
    /**
     * Delete cached value
     * @param key - Cache key
     * @returns Success status
     */
    async del(key) {
        try {
            return this.cache.del(key) > 0;
        }
        catch (error) {
            logger_1.default.error(`Cache delete error for key ${key}: ${error.message}`);
            return false;
        }
    }
    /**
     * Clear all cached values
     * @returns Success status
     */
    async clear() {
        try {
            this.cache.flushAll();
            logger_1.default.info('Cache cleared');
            return true;
        }
        catch (error) {
            logger_1.default.error(`Cache clear error: ${error.message}`);
            return false;
        }
    }
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getStats() {
        return this.cache.getStats();
    }
    /**
     * Get all cache keys
     * @returns Array of cache keys
     */
    getKeys() {
        return this.cache.keys();
    }
    /**
     * Check if key exists in cache
     * @param key - Cache key
     * @returns True if key exists
     */
    has(key) {
        return this.cache.has(key);
    }
}
// Export singleton instance
exports.default = new CacheManager();
//# sourceMappingURL=cache-manager.js.map