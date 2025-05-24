"use strict";
/**
 * Token store utility
 * Securely stores and manages authentication tokens
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Token store class
 * Manages authentication tokens for users
 */
class TokenStore {
    constructor() {
        // Initialize token cache
        this.tokenCache = new node_cache_1.default({
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
    getToken(userId) {
        try {
            return this.tokenCache.get(userId) || null;
        }
        catch (error) {
            logger_1.default.error(`Error getting token for user ${userId}: ${error.message}`);
            return null;
        }
    }
    /**
     * Store token data for a user
     * @param userId - User ID
     * @param tokenData - Token data
     * @returns Success status
     */
    storeToken(userId, tokenData) {
        try {
            // Calculate TTL in seconds (from now until expiry)
            const now = Date.now();
            const ttl = Math.floor((tokenData.expiresAt - now) / 1000);
            // Store token with calculated TTL
            if (ttl > 0) {
                return this.tokenCache.set(userId, tokenData, ttl);
            }
            else {
                return this.tokenCache.set(userId, tokenData);
            }
        }
        catch (error) {
            logger_1.default.error(`Error storing token for user ${userId}: ${error.message}`);
            return false;
        }
    }
    /**
     * Remove token data for a user
     * @param userId - User ID
     * @returns Success status
     */
    removeToken(userId) {
        try {
            return this.tokenCache.del(userId) > 0;
        }
        catch (error) {
            logger_1.default.error(`Error removing token for user ${userId}: ${error.message}`);
            return false;
        }
    }
    /**
     * Check if token is expired for a user
     * @param userId - User ID
     * @returns True if token is expired or not found
     */
    isTokenExpired(userId) {
        try {
            const tokenData = this.getToken(userId);
            if (!tokenData)
                return true;
            return Date.now() >= tokenData.expiresAt;
        }
        catch (error) {
            logger_1.default.error(`Error checking token expiry for user ${userId}: ${error.message}`);
            return true; // Assume expired on error
        }
    }
    /**
     * Calculate token expiry time
     * @param ttlMs - TTL in milliseconds (default 24 hours)
     * @returns Expiry timestamp
     */
    calculateExpiryTime(ttlMs = 24 * 60 * 60 * 1000) {
        return Date.now() + ttlMs;
    }
    /**
     * Get all stored user IDs
     * @returns Array of user IDs
     */
    getAllUserIds() {
        return this.tokenCache.keys();
    }
    /**
     * Get stats about token store
     * @returns Stats object
     */
    getStats() {
        return this.tokenCache.getStats();
    }
}
// Export singleton instance
exports.default = new TokenStore();
//# sourceMappingURL=token-store.js.map