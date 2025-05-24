/**
 * Rate Limiter Service
 * Manages rate limiting for API requests
 */
import { UserRateLimits, GlobalRateLimits, ValidationFailureTracking, ValidationRateLimits } from '../types';
/**
 * Rate Limiter class
 * Manages rate limits for API requests
 */
declare class RateLimiter {
    private userLimits;
    private globalLimits;
    private validationFailures;
    private validationRateLimits;
    constructor();
    /**
     * Check if request would exceed rate limits
     * @param endpoint - API endpoint
     * @param userId - User ID (optional)
     * @throws {ApiError} If rate limit is exceeded
     */
    private resetLock;
    checkRateLimit(endpoint: string, userId?: string): Promise<void>;
    /**
     * Update rate limit information based on API response
     * @param endpoint - API endpoint
     * @param response - API response
     * @param userId - User ID (optional)
     */
    updateRateLimits(endpoint: string, response: any, userId?: string): void;
    /**
     * Helper to extract user ID from response
     * @param response - API response
     * @returns User ID or null if not found
     */
    private extractUserId;
    /**
     * Get rate limit information for a user
     * @param userId - User ID
     * @returns Rate limit information or null if not found
     */
    getUserRateLimits(userId: string): UserRateLimits | null;
    /**
     * Get global rate limit information
     * @returns Global rate limit information
     */
    getGlobalRateLimits(): GlobalRateLimits;
    /**
     * Decrement rate limit counter after successful action
     * @param endpoint - API endpoint
     * @param userId - User ID
     */
    decrementRateLimit(endpoint: string, userId: string): void;
    /**
     * Reset rate limits for a user
     * @param userId - User ID
     */
    resetUserRateLimits(userId: string): void;
    /**
     * Track validation failure for rate limiting
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     * @returns True if the user should be blocked due to excessive failures
     */
    trackValidationFailure(identifier: string, endpoint: string): boolean;
    /**
     * Check if validation is rate limited for an identifier
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     * @returns True if validation is rate limited
     */
    isValidationRateLimited(identifier: string, endpoint: string): boolean;
    /**
     * Get validation failure tracking for an identifier
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     * @returns Validation failure tracking or null if not found
     */
    getValidationFailureTracking(identifier: string, endpoint: string): ValidationFailureTracking | null;
    /**
     * Reset validation failure tracking for an identifier
     * @param identifier - User ID, IP address, or other identifier
     * @param endpoint - API endpoint
     */
    resetValidationFailureTracking(identifier: string, endpoint: string): void;
    /**
     * Get validation rate limits configuration
     * @returns Validation rate limits configuration
     */
    getValidationRateLimits(): ValidationRateLimits;
}
declare const _default: RateLimiter;
export default _default;
