"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rate_limiter_1 = __importDefault(require("../../services/rate-limiter"));
const logger_1 = __importDefault(require("../../utils/logger"));
const error_handler_1 = require("../../utils/error-handler");
// Mock dependencies
jest.mock('../../utils/logger');
describe('Rate Limiter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset rate limiter state by accessing private properties
        // This is necessary for testing the singleton
        const userLimits = rate_limiter_1.default.userLimits;
        const globalLimits = rate_limiter_1.default.globalLimits;
        const validationFailures = rate_limiter_1.default.validationFailures;
        userLimits.clear();
        validationFailures.clear();
        // Reset global limits
        globalLimits.currentCount = 0;
        globalLimits.windowStart = Date.now();
    });
    describe('checkRateLimit', () => {
        it('should allow requests within global rate limit', async () => {
            // Act & Assert
            await expect(rate_limiter_1.default.checkRateLimit('/test', 'user-123')).resolves.not.toThrow();
            expect(logger_1.default.warn).not.toHaveBeenCalled();
        });
        it('should throw error when global rate limit is exceeded', async () => {
            // Arrange
            const globalLimits = rate_limiter_1.default.globalLimits;
            globalLimits.currentCount = globalLimits.requestsPerMinute;
            // Act & Assert
            await expect(rate_limiter_1.default.checkRateLimit('/test', 'user-123'))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(logger_1.default.warn).toHaveBeenCalled();
        });
        it('should reset global counter when window has passed', async () => {
            // Arrange
            const globalLimits = rate_limiter_1.default.globalLimits;
            globalLimits.currentCount = globalLimits.requestsPerMinute;
            globalLimits.windowStart = Date.now() - 61000; // 61 seconds ago
            // Act
            await rate_limiter_1.default.checkRateLimit('/test', 'user-123');
            // Assert
            expect(globalLimits.currentCount).toBe(1); // Should be reset to 0 and then incremented to 1
            expect(globalLimits.windowStart).toBeGreaterThan(Date.now() - 1000);
        });
        it('should throw error when like rate limit is exceeded', async () => {
            // Arrange
            const userId = 'user-123';
            const userLimits = rate_limiter_1.default.userLimits;
            userLimits.set(userId, {
                likes: { remaining: 0, resetAt: Date.now() + 3600000 },
                superLikes: { remaining: 5, resetAt: Date.now() + 3600000 },
                boosts: { remaining: 1, resetAt: Date.now() + 3600000 }
            });
            // Act & Assert
            await expect(rate_limiter_1.default.checkRateLimit('/like/456', userId))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(logger_1.default.warn).toHaveBeenCalled();
        });
        it('should throw error when super like rate limit is exceeded', async () => {
            // Arrange
            const userId = 'user-123';
            const userLimits = rate_limiter_1.default.userLimits;
            userLimits.set(userId, {
                likes: { remaining: 100, resetAt: Date.now() + 3600000 },
                superLikes: { remaining: 0, resetAt: Date.now() + 3600000 },
                boosts: { remaining: 1, resetAt: Date.now() + 3600000 }
            });
            // Act & Assert
            await expect(rate_limiter_1.default.checkRateLimit('/like/456/super', userId))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(logger_1.default.warn).toHaveBeenCalled();
        });
        it('should throw error when boost rate limit is exceeded', async () => {
            // Arrange
            const userId = 'user-123';
            const userLimits = rate_limiter_1.default.userLimits;
            userLimits.set(userId, {
                likes: { remaining: 100, resetAt: Date.now() + 3600000 },
                superLikes: { remaining: 5, resetAt: Date.now() + 3600000 },
                boosts: { remaining: 0, resetAt: Date.now() + 3600000 }
            });
            // Act & Assert
            await expect(rate_limiter_1.default.checkRateLimit('/boost', userId))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(logger_1.default.warn).toHaveBeenCalled();
        });
        it('should not throw error when rate limit is expired', async () => {
            // Arrange
            const userId = 'user-123';
            const userLimits = rate_limiter_1.default.userLimits;
            userLimits.set(userId, {
                likes: { remaining: 0, resetAt: Date.now() - 3600000 }, // Expired 1 hour ago
                superLikes: { remaining: 5, resetAt: Date.now() + 3600000 },
                boosts: { remaining: 1, resetAt: Date.now() + 3600000 }
            });
            // Act & Assert
            await expect(rate_limiter_1.default.checkRateLimit('/like/456', userId)).resolves.not.toThrow();
        });
    });
    describe('updateRateLimits', () => {
        it('should initialize user limits if not exists', () => {
            // Arrange
            const userId = 'user-123';
            const response = {
                data: {
                    _id: userId
                }
            };
            // Act
            rate_limiter_1.default.updateRateLimits('/test', response, userId);
            // Assert
            const userLimits = rate_limiter_1.default.userLimits;
            expect(userLimits.has(userId)).toBe(true);
            const limits = userLimits.get(userId);
            expect(limits).toHaveProperty('likes');
            expect(limits).toHaveProperty('superLikes');
            expect(limits).toHaveProperty('boosts');
        });
        it('should extract user ID from response if not provided', () => {
            // Arrange
            const userId = 'user-123';
            const response = {
                data: {
                    _id: userId
                }
            };
            // Act
            rate_limiter_1.default.updateRateLimits('/test', response);
            // Assert
            const userLimits = rate_limiter_1.default.userLimits;
            expect(userLimits.has(userId)).toBe(true);
        });
        it('should update like limits from response', () => {
            // Arrange
            const userId = 'user-123';
            const response = {
                data: {
                    _id: userId,
                    likes_remaining: 50,
                    rate_limited_until: Date.now() + 7200000
                }
            };
            // Act
            rate_limiter_1.default.updateRateLimits('/like/456', response, userId);
            // Assert
            const userLimits = rate_limiter_1.default.userLimits;
            const limits = userLimits.get(userId);
            expect(limits.likes.remaining).toBe(50);
            expect(limits.likes.resetAt).toBe(response.data.rate_limited_until);
        });
        it('should update super like limits from response', () => {
            // Arrange
            const userId = 'user-123';
            const response = {
                data: {
                    _id: userId,
                    super_likes: {
                        remaining: 3,
                        resets_at: new Date(Date.now() + 7200000).toISOString()
                    }
                }
            };
            // Act
            rate_limiter_1.default.updateRateLimits('/like/456/super', response, userId);
            // Assert
            const userLimits = rate_limiter_1.default.userLimits;
            const limits = userLimits.get(userId);
            expect(limits.superLikes.remaining).toBe(3);
            expect(limits.superLikes.resetAt).toBeGreaterThan(Date.now());
        });
        it('should update boost limits from response', () => {
            // Arrange
            const userId = 'user-123';
            const response = {
                data: {
                    _id: userId,
                    remaining: 0,
                    resets_at: Date.now() + 7200000
                }
            };
            // Act
            rate_limiter_1.default.updateRateLimits('/boost', response, userId);
            // Assert
            const userLimits = rate_limiter_1.default.userLimits;
            const limits = userLimits.get(userId);
            expect(limits.boosts.remaining).toBe(0);
            expect(limits.boosts.resetAt).toBe(response.data.resets_at);
        });
    });
    describe('getUserRateLimits', () => {
        it('should return user rate limits if exists', () => {
            // Arrange
            const userId = 'user-123';
            const userLimits = rate_limiter_1.default.userLimits;
            const mockLimits = {
                likes: { remaining: 100, resetAt: Date.now() + 3600000 },
                superLikes: { remaining: 5, resetAt: Date.now() + 3600000 },
                boosts: { remaining: 1, resetAt: Date.now() + 3600000 }
            };
            userLimits.set(userId, mockLimits);
            // Act
            const result = rate_limiter_1.default.getUserRateLimits(userId);
            // Assert
            expect(result).toEqual(mockLimits);
        });
        it('should return null if user rate limits do not exist', () => {
            // Act
            const result = rate_limiter_1.default.getUserRateLimits('non-existent-user');
            // Assert
            expect(result).toBeNull();
        });
    });
    describe('getGlobalRateLimits', () => {
        it('should return global rate limits', () => {
            // Act
            const result = rate_limiter_1.default.getGlobalRateLimits();
            // Assert
            expect(result).toHaveProperty('requestsPerMinute');
            expect(result).toHaveProperty('currentCount');
            expect(result).toHaveProperty('windowStart');
        });
    });
    describe('resetUserRateLimits', () => {
        it('should reset user rate limits', () => {
            // Arrange
            const userId = 'user-123';
            const userLimits = rate_limiter_1.default.userLimits;
            userLimits.set(userId, {
                likes: { remaining: 0, resetAt: Date.now() + 3600000 },
                superLikes: { remaining: 0, resetAt: Date.now() + 3600000 },
                boosts: { remaining: 0, resetAt: Date.now() + 3600000 }
            });
            // Act
            rate_limiter_1.default.resetUserRateLimits(userId);
            // Assert
            expect(userLimits.has(userId)).toBe(false);
        });
    });
    describe('validation rate limiting', () => {
        it('should track validation failures', () => {
            // Arrange
            const identifier = 'user-123';
            const endpoint = '/test';
            // Act
            const result = rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
            // Assert
            expect(result).toBe(false); // Should not be blocked yet
            const validationFailures = rate_limiter_1.default.validationFailures;
            expect(validationFailures.has(`${identifier}:${endpoint}`)).toBe(true);
            const tracking = validationFailures.get(`${identifier}:${endpoint}`);
            expect(tracking.failures).toBe(1);
            expect(tracking.lastFailure).toBeGreaterThan(0);
            expect(tracking.endpoint).toBe(endpoint);
        });
        it('should return true when minute rate limit is exceeded', () => {
            // Arrange
            const identifier = 'user-123';
            const endpoint = '/test';
            const validationFailures = rate_limiter_1.default.validationFailures;
            const validationRateLimits = rate_limiter_1.default.validationRateLimits;
            // Create multiple failures
            for (let i = 0; i < validationRateLimits.maxFailuresPerMinute; i++) {
                validationFailures.set(`${identifier}:${endpoint}-${i}`, {
                    failures: 1,
                    lastFailure: Date.now(),
                    endpoint
                });
            }
            // Act
            const result = rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
            // Assert
            expect(result).toBe(true); // Should be blocked
            expect(logger_1.default.warn).toHaveBeenCalled();
        });
        it('should return true when hourly rate limit is exceeded', () => {
            // Arrange
            const identifier = 'user-123';
            const endpoint = '/test';
            const validationFailures = rate_limiter_1.default.validationFailures;
            const validationRateLimits = rate_limiter_1.default.validationRateLimits;
            // Create multiple failures
            for (let i = 0; i < validationRateLimits.maxFailuresPerHour; i++) {
                validationFailures.set(`${identifier}:${endpoint}-${i}`, {
                    failures: 1,
                    lastFailure: Date.now() - 30 * 60 * 1000, // 30 minutes ago
                    endpoint
                });
            }
            // Act
            const result = rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
            // Assert
            expect(result).toBe(true); // Should be blocked
            expect(logger_1.default.warn).toHaveBeenCalled();
        });
        it('should reset failure count after an hour', () => {
            // Arrange
            const identifier = 'user-123';
            const endpoint = '/test';
            const validationFailures = rate_limiter_1.default.validationFailures;
            // Create old failure
            validationFailures.set(`${identifier}:${endpoint}`, {
                failures: 10,
                lastFailure: Date.now() - 61 * 60 * 1000, // 61 minutes ago
                endpoint
            });
            // Act
            rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
            // Assert
            const tracking = validationFailures.get(`${identifier}:${endpoint}`);
            expect(tracking.failures).toBe(1); // Should be reset to 0 and then incremented to 1
        });
        it('should check if validation is rate limited', () => {
            // Arrange
            const identifier = 'user-123';
            const endpoint = '/test';
            const validationFailures = rate_limiter_1.default.validationFailures;
            const validationRateLimits = rate_limiter_1.default.validationRateLimits;
            // Create multiple failures
            for (let i = 0; i < validationRateLimits.maxFailuresPerMinute; i++) {
                validationFailures.set(`${identifier}:${endpoint}-${i}`, {
                    failures: 1,
                    lastFailure: Date.now(),
                    endpoint
                });
            }
            // Act
            const result = rate_limiter_1.default.isValidationRateLimited(identifier, endpoint);
            // Assert
            expect(result).toBe(true);
        });
        it('should get validation failure tracking', () => {
            // Arrange
            const identifier = 'user-123';
            const endpoint = '/test';
            const validationFailures = rate_limiter_1.default.validationFailures;
            const mockTracking = {
                failures: 5,
                lastFailure: Date.now(),
                endpoint
            };
            validationFailures.set(`${identifier}:${endpoint}`, mockTracking);
            // Act
            const result = rate_limiter_1.default.getValidationFailureTracking(identifier, endpoint);
            // Assert
            expect(result).toEqual(mockTracking);
        });
        it('should reset validation failure tracking', () => {
            // Arrange
            const identifier = 'user-123';
            const endpoint = '/test';
            const validationFailures = rate_limiter_1.default.validationFailures;
            validationFailures.set(`${identifier}:${endpoint}`, {
                failures: 5,
                lastFailure: Date.now(),
                endpoint
            });
            // Act
            rate_limiter_1.default.resetValidationFailureTracking(identifier, endpoint);
            // Assert
            expect(validationFailures.has(`${identifier}:${endpoint}`)).toBe(false);
        });
        it('should get validation rate limits configuration', () => {
            // Act
            const result = rate_limiter_1.default.getValidationRateLimits();
            // Assert
            expect(result).toHaveProperty('maxFailuresPerMinute');
            expect(result).toHaveProperty('maxFailuresPerHour');
            expect(result).toHaveProperty('blockDurationMs');
        });
    });
});
//# sourceMappingURL=rate-limiter.test.js.map