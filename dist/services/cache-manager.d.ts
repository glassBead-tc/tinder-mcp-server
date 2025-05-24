/**
 * Cache Manager Service
 * Manages caching of API responses
 */
import NodeCache from 'node-cache';
/**
 * Cache Manager class
 * Provides caching functionality for API responses
 */
declare class CacheManager {
    private cache;
    constructor();
    /**
     * Get cached value
     * @param key - Cache key
     * @returns Cached value or null if not found
     */
    get<T = any>(key: string): Promise<T | null>;
    /**
     * Set cache value
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time to live in seconds (optional, uses default if not provided)
     * @returns Success status
     */
    set<T = any>(key: string, value: T, ttl?: number): Promise<boolean>;
    /**
     * Delete cached value
     * @param key - Cache key
     * @returns Success status
     */
    del(key: string): Promise<boolean>;
    /**
     * Clear all cached values
     * @returns Success status
     */
    clear(): Promise<boolean>;
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getStats(): NodeCache.Stats;
    /**
     * Get all cache keys
     * @returns Array of cache keys
     */
    getKeys(): string[];
    /**
     * Check if key exists in cache
     * @param key - Cache key
     * @returns True if key exists
     */
    has(key: string): boolean;
}
declare const _default: CacheManager;
export default _default;
