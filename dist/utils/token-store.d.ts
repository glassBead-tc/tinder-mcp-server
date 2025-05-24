/**
 * Token store utility
 * Securely stores and manages authentication tokens
 */
import NodeCache from 'node-cache';
import { TokenData } from '../types';
/**
 * Token store class
 * Manages authentication tokens for users
 */
declare class TokenStore {
    private tokenCache;
    constructor();
    /**
     * Get token data for a user
     * @param userId - User ID
     * @returns Token data or null if not found
     */
    getToken(userId: string): TokenData | null;
    /**
     * Store token data for a user
     * @param userId - User ID
     * @param tokenData - Token data
     * @returns Success status
     */
    storeToken(userId: string, tokenData: TokenData): boolean;
    /**
     * Remove token data for a user
     * @param userId - User ID
     * @returns Success status
     */
    removeToken(userId: string): boolean;
    /**
     * Check if token is expired for a user
     * @param userId - User ID
     * @returns True if token is expired or not found
     */
    isTokenExpired(userId: string): boolean;
    /**
     * Calculate token expiry time
     * @param ttlMs - TTL in milliseconds (default 24 hours)
     * @returns Expiry timestamp
     */
    calculateExpiryTime(ttlMs?: number): number;
    /**
     * Get all stored user IDs
     * @returns Array of user IDs
     */
    getAllUserIds(): string[];
    /**
     * Get stats about token store
     * @returns Stats object
     */
    getStats(): NodeCache.Stats;
}
declare const _default: TokenStore;
export default _default;
