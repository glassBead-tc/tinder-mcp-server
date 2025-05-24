"use strict";
/**
 * Rate Limiter Service
 * Manages rate limiting for API requests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const error_handler_1 = require("../utils/error-handler");
const types_1 = require("../types");
/**
 * Rate Limiter class
 * Manages rate limits for API requests
 */
class RateLimiter {
    constructor() {
        /**
         * Check if request would exceed rate limits
         * @param endpoint - API endpoint
         * @param userId - User ID (optional)
         * @throws {ApiError} If rate limit is exceeded
         */
        // Lock object for synchronizing counter resets
        this.resetLock = {
            isResetting: false,
            lastResetTime: Date.now()
        };
        this.userLimits = new Map();
        this.globalLimits = {
            requestsPerMinute: 100,
            currentCount: 0,
            windowStart: Date.now()
        };
        this.validationFailures = new Map();
        this.validationRateLimits = {
            maxFailuresPerMinute: 10,
            maxFailuresPerHour: 30,
            blockDurationMs: 15 * 60 * 1000 // 15 minutes
        };
        logger_1.default.info('Rate limiter initialized');
    }
    async checkRateLimit(endpoint, userId) {
        // SECURITY FIX: Fix race condition in counter reset logic
        // Use atomic operations with a lock mechanism to prevent race conditions
        const now = Date.now();
        const windowExpired = now - this.globalLimits.windowStart > 60000;
        // Safely reset counter if window has passed
        if (windowExpired && !this.resetLock.isResetting) {
            try {
                // Set lock to prevent other threads from resetting simultaneously
                this.resetLock.isResetting = true;
                // Double-check that another thread hasn't reset in the meantime
                if (now - this.resetLock.lastResetTime > 60000) {
                    this.globalLimits.currentCount = 0;
                    this.globalLimits.windowStart = now;
                    this.resetLock.lastResetTime = now;
                }
            }
            finally {
                // Always release the lock
                this.resetLock.isResetting = false;
            }
        }
        // Check global rate limit
        if (this.globalLimits.currentCount >= this.globalLimits.requestsPerMinute) {
            logger_1.default.warn(`Global rate limit exceeded for endpoint: ${endpoint}`);
            throw new error_handler_1.ApiError(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Global rate limit exceeded', { resetAt: this.globalLimits.windowStart + 60000 }, 429);
        }
        // Increment counter (atomic operation)
        this.globalLimits.currentCount++;
        // Check user-specific limits
        if (userId && this.userLimits.has(userId)) {
            const userLimit = this.userLimits.get(userId);
            // Check like limit (matches GET /like/{user_id})
            if (endpoint.match(/^\/like\/[^\/]+$/) &&
                userLimit.likes.remaining <= 0 && Date.now() < userLimit.likes.resetAt) {
                logger_1.default.warn(`Like rate limit exceeded for user: ${userId}`);
                throw new error_handler_1.ApiError(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Like rate limit exceeded', { resetAt: userLimit.likes.resetAt }, 429);
            }
            // Check super like limit (matches POST /like/{user_id}/super)
            if (endpoint.match(/^\/like\/[^\/]+\/super$/) &&
                userLimit.superLikes.remaining <= 0 && Date.now() < userLimit.superLikes.resetAt) {
                logger_1.default.warn(`Super like rate limit exceeded for user: ${userId}`);
                throw new error_handler_1.ApiError(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Super like rate limit exceeded', { resetAt: userLimit.superLikes.resetAt }, 429);
            }
            // Check boost limit (matches POST /boost)
            if (endpoint === '/boost' &&
                userLimit.boosts.remaining <= 0 && Date.now() < userLimit.boosts.resetAt) {
                logger_1.default.warn(`Boost rate limit exceeded for user: ${userId}`);
                throw new error_handler_1.ApiError(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Boost rate limit exceeded', { resetAt: userLimit.boosts.resetAt }, 429);
            }
        }
    }
    /**
     * Update rate limit information based on API response
     * @param endpoint - API endpoint
     * @param response - API response
     * @param userId - User ID (optional)
     */
    updateRateLimits(endpoint, response, userId) {
        if (!response || !response.data)
            return;
        // Extract user ID from response if not provided
        const extractedUserId = userId || this.extractUserId(response);
        if (!extractedUserId)
            return;
        // Initialize user limits if not exists
        if (!this.userLimits.has(extractedUserId)) {
            this.userLimits.set(extractedUserId, {
                likes: { remaining: 100, resetAt: Date.now() + 12 * 60 * 60 * 1000 },
                superLikes: { remaining: 5, resetAt: Date.now() + 24 * 60 * 60 * 1000 },
                boosts: { remaining: 1, resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }
            });
        }
        const userLimit = this.userLimits.get(extractedUserId);
        // Update like limits (matches GET /like/{user_id})
        if (endpoint.match(/^\/like\/[^\/]+$/) &&
            response.data.likes_remaining !== undefined) {
            userLimit.likes.remaining = response.data.likes_remaining;
            if (response.data.rate_limited_until) {
                userLimit.likes.resetAt = response.data.rate_limited_until;
            }
        }
        // Update super like limits (matches POST /like/{user_id}/super)
        if (endpoint.match(/^\/like\/[^\/]+\/super$/) &&
            response.data.super_likes) {
            userLimit.superLikes.remaining = response.data.super_likes.remaining;
            if (response.data.super_likes.resets_at) {
                userLimit.superLikes.resetAt = new Date(response.data.super_likes.resets_at).getTime();
            }
        }
        // Update boost limits (matches POST /boost)
        if (endpoint === '/boost') {
            userLimit.boosts.remaining = response.data.remaining || 0;
            if (response.data.resets_at) {
                userLimit.boosts.resetAt = response.data.resets_at;
            }
        }
        // Save updated limits
        this.userLimits.set(extractedUserId, userLimit);
    }
    /**
     * Helper to extract user ID from response
     * @param response - API response
     * @returns User ID or null if not found
     */
    extractUserId(response) {
        // Try to find user ID in various response formats
        if (response.data?._id)
            return response.data._id;
        if (response.data?.user?._id)
            return response.data.user._id;
        return null;
    }
    /**
     * Get rate limit information for a user
     * @param userId - User ID
     * @returns Rate limit information or null if not found
     */
    getUserRateLimits(userId) {
        return this.userLimits.get(userId) || null;
    }
    /**
     * Get global rate limit information
     * @returns Global rate limit information
     */
    getGlobalRateLimits() {
        return { ...this.globalLimits };
    }
    /**
     * Decrement rate limit counter after successful action
     * @param endpoint - API endpoint
     * @param userId - User ID
     */
    decrementRateLimit(endpoint, userId) {
        if (!userId || !this.userLimits.has(userId))
            return;
        const userLimit = this.userLimits.get(userId);
        // Decrement like counter (matches GET /like/{user_id})
        if (endpoint.match(/^\/like\/[^\/]+$/) && userLimit.likes.remaining > 0) {
            userLimit.likes.remaining--;
            logger_1.default.debug(`Decremented like counter for user ${userId}: ${userLimit.likes.remaining} remaining`);
        }
        // Decrement super like counter (matches POST /like/{user_id}/super)
        if (endpoint.match(/^\/like\/[^\/]+\/super$/) && userLimit.superLikes.remaining > 0) {
            userLimit.superLikes.remaining--;
            logger_1.default.debug(`Decremented super like counter for user ${userId}: ${userLimit.superLikes.remaining} remaining`);
        }
        // Decrement boost counter (matches POST /boost)
        if (endpoint === '/boost' && userLimit.boosts.remaining > 0) {
            userLimit.boosts.remaining--;
            logger_1.default.debug(`Decremented boost counter for user ${userId}: ${userLimit.boosts.remaining} remaining`);
        }
        // Save updated limits
        this.userLimits.set(userId, userLimit);
    }
    /**
     * Reset rate limits for a user
     * @param userId - User ID
     */
    resetUserRateLimits(userId) {
        this.userLimits.delete(userId);
    }
    /**
     * Track validation failure for rate limiting
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     * @returns True if the user should be blocked due to excessive failures
     */
    trackValidationFailure(identifier, endpoint) {
        const key = `${identifier}:${endpoint}`;
        const now = Date.now();
        // Get or create tracking entry
        let tracking = this.validationFailures.get(key);
        if (!tracking) {
            tracking = {
                failures: 0,
                lastFailure: now,
                endpoint
            };
        }
        // Reset counter if more than an hour has passed
        if (now - tracking.lastFailure > 60 * 60 * 1000) {
            tracking.failures = 0;
        }
        // Increment failure count and update timestamp
        tracking.failures++;
        tracking.lastFailure = now;
        // Store updated tracking
        this.validationFailures.set(key, tracking);
        // Check if rate limit is exceeded
        const minuteAgo = now - 60 * 1000;
        const hourAgo = now - 60 * 60 * 1000;
        // Count recent failures
        const recentFailures = Array.from(this.validationFailures.values())
            .filter(t => t.lastFailure > minuteAgo &&
            (t.endpoint === endpoint || identifier.includes(identifier)))
            .length;
        const hourlyFailures = Array.from(this.validationFailures.values())
            .filter(t => t.lastFailure > hourAgo &&
            (t.endpoint === endpoint || identifier.includes(identifier)))
            .length;
        // Log excessive failures
        if (recentFailures >= this.validationRateLimits.maxFailuresPerMinute) {
            logger_1.default.warn(`Validation rate limit exceeded for ${identifier} on ${endpoint}: ${recentFailures} failures in the last minute`);
            return true;
        }
        if (hourlyFailures >= this.validationRateLimits.maxFailuresPerHour) {
            logger_1.default.warn(`Validation rate limit exceeded for ${identifier} on ${endpoint}: ${hourlyFailures} failures in the last hour`);
            return true;
        }
        return false;
    }
    /**
     * Check if validation is rate limited for an identifier
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     * @returns True if validation is rate limited
     */
    isValidationRateLimited(identifier, endpoint) {
        const key = `${identifier}:${endpoint}`;
        const tracking = this.validationFailures.get(key);
        if (!tracking)
            return false;
        const now = Date.now();
        const minuteAgo = now - 60 * 1000;
        const hourAgo = now - 60 * 60 * 1000;
        // Count recent failures
        const recentFailures = Array.from(this.validationFailures.values())
            .filter(t => t.lastFailure > minuteAgo &&
            (t.endpoint === endpoint || identifier.includes(identifier)))
            .length;
        const hourlyFailures = Array.from(this.validationFailures.values())
            .filter(t => t.lastFailure > hourAgo &&
            (t.endpoint === endpoint || identifier.includes(identifier)))
            .length;
        return recentFailures >= this.validationRateLimits.maxFailuresPerMinute ||
            hourlyFailures >= this.validationRateLimits.maxFailuresPerHour;
    }
    /**
     * Get validation failure tracking for an identifier
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     * @returns Validation failure tracking or null if not found
     */
    getValidationFailureTracking(identifier, endpoint) {
        const key = `${identifier}:${endpoint}`;
        return this.validationFailures.get(key) || null;
    }
    /**
     * Reset validation failure tracking for an identifier
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     */
    resetValidationFailureTracking(identifier, endpoint) {
        const key = `${identifier}:${endpoint}`;
        this.validationFailures.delete(key);
    }
    /**
     * Get validation rate limits configuration
     * @returns Validation rate limits configuration
     */
    getValidationRateLimits() {
        return { ...this.validationRateLimits };
    }
}
// Export singleton instance
exports.default = new RateLimiter();
//# sourceMappingURL=rate-limiter.js.map