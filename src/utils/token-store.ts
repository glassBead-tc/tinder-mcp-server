/**
 * Token store utility
 * Securely stores and manages authentication tokens
 */

import NodeCache from 'node-cache';
import logger from './logger';
import { TokenData } from '../types';

/**
 * Token store class
 * Manages authentication tokens for users
 */
class TokenStore {
  private tokenCache: NodeCache;

  constructor() {
    // Initialize token cache
    this.tokenCache = new NodeCache({
      stdTTL: 86400, // 24 hours default TTL
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false // Store references to objects
    });
  }

  /**
   * Get token data for a user
   * @param userId - User ID
   * @returns Token data or null if not found
   */
  public getToken(userId: string): TokenData | null {
    try {
      return this.tokenCache.get<TokenData>(userId) || null;
    } catch (error) {
      logger.error(`Error getting token for user ${userId}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Store token data for a user
   * @param userId - User ID
   * @param tokenData - Token data
   * @returns Success status
   */
  public storeToken(userId: string, tokenData: TokenData): boolean {
    try {
      // Calculate TTL in seconds (from now until expiry)
      const now = Date.now();
      const ttl = Math.floor((tokenData.expiresAt - now) / 1000);
      
      // Store token with calculated TTL
      if (ttl > 0) {
        return this.tokenCache.set(userId, tokenData, ttl);
      } else {
        return this.tokenCache.set(userId, tokenData);
      }
    } catch (error) {
      logger.error(`Error storing token for user ${userId}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Remove token data for a user
   * @param userId - User ID
   * @returns Success status
   */
  public removeToken(userId: string): boolean {
    try {
      return this.tokenCache.del(userId) > 0;
    } catch (error) {
      logger.error(`Error removing token for user ${userId}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Check if token is expired for a user
   * @param userId - User ID
   * @returns True if token is expired or not found
   */
  public isTokenExpired(userId: string): boolean {
    try {
      const tokenData = this.getToken(userId);
      if (!tokenData) return true;
      
      return Date.now() >= tokenData.expiresAt;
    } catch (error) {
      logger.error(`Error checking token expiry for user ${userId}: ${(error as Error).message}`);
      return true; // Assume expired on error
    }
  }

  /**
   * Calculate token expiry time
   * @param ttlMs - TTL in milliseconds (default 24 hours)
   * @returns Expiry timestamp
   */
  public calculateExpiryTime(ttlMs: number = 24 * 60 * 60 * 1000): number {
    return Date.now() + ttlMs;
  }

  /**
   * Get all stored user IDs
   * @returns Array of user IDs
   */
  public getAllUserIds(): string[] {
    return this.tokenCache.keys();
  }

  /**
   * Get stats about token store
   * @returns Stats object
   */
  public getStats(): NodeCache.Stats {
    return this.tokenCache.getStats();
  }
}

// Export singleton instance
export default new TokenStore();