/**
 * Rate Limiting Integration Tests
 * 
 * Tests the integration between rate limiter, request handler, and API endpoints.
 */

import rateLimiter from '../../services/rate-limiter';
import requestHandler from '../../services/request-handler';
import { ApiError } from '../../utils/error-handler';
import { ErrorCodes } from '../../types';

// Mock dependencies
jest.mock('../../utils/logger');

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset rate limiter state
    (rateLimiter as any).globalLimits = {
      requestsPerMinute: 100,
      currentCount: 0,
      windowStart: Date.now()
    };
    (rateLimiter as any).userLimits = new Map();
  });

  describe('Global Rate Limiting', () => {
    it('should allow requests within the global rate limit', async () => {
      // Setup
      const checkRateLimitSpy = jest.spyOn(rateLimiter, 'checkRateLimit');
      const processRequestSpy = jest.spyOn(requestHandler, 'processRequest').mockResolvedValue({});
      
      // Execute multiple requests within limit
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(requestHandler.processRequest({
          method: 'GET',
          endpoint: '/user/123',
          userId: 'user-123'
        }));
      }
      
      // Wait for all requests to complete
      await Promise.all(requests);
      
      // Verify
      expect(checkRateLimitSpy).toHaveBeenCalledTimes(10);
      expect(processRequestSpy).toHaveBeenCalledTimes(10);
      expect((rateLimiter as any).globalLimits.currentCount).toBe(10);
    });

    it('should reject requests exceeding the global rate limit', async () => {
      // Setup - set current count to limit
      (rateLimiter as any).globalLimits.currentCount = 100;
      
      // Execute request that exceeds limit
      const request = requestHandler.processRequest({
        method: 'GET',
        endpoint: '/user/123',
        userId: 'user-123'
      });
      
      // Verify
      await expect(request).rejects.toThrow(ApiError);
      await expect(request).rejects.toMatchObject({
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message: expect.stringContaining('Global rate limit exceeded')
      });
    });

    it('should reset counter after window expires', async () => {
      // Setup - set window start to past time
      (rateLimiter as any).globalLimits.currentCount = 50;
      (rateLimiter as any).globalLimits.windowStart = Date.now() - 61000; // 61 seconds ago
      
      // Execute request
      await requestHandler.processRequest({
        method: 'GET',
        endpoint: '/user/123',
        userId: 'user-123'
      });
      
      // Verify counter was reset
      expect((rateLimiter as any).globalLimits.currentCount).toBe(1);
      expect((rateLimiter as any).globalLimits.windowStart).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('User-Specific Rate Limiting', () => {
    it('should track like limits per user', async () => {
      // Setup
      const userId = 'user-123';
      const updateRateLimitsSpy = jest.spyOn(rateLimiter, 'updateRateLimits');
      jest.spyOn(requestHandler, 'processRequest').mockResolvedValue({
        likes_remaining: 95,
        rate_limited_until: Date.now() + 3600000
      });
      
      // Execute request
      await requestHandler.processRequest({
        method: 'GET',
        endpoint: '/like/target-456',
        userId
      });
      
      // Verify
      expect(updateRateLimitsSpy).toHaveBeenCalled();
      const userLimits = (rateLimiter as any).userLimits.get(userId);
      expect(userLimits).toBeDefined();
      expect(userLimits.likes.remaining).toBe(95);
    });

    it('should track super like limits per user', async () => {
      // Setup
      const userId = 'user-123';
      const updateRateLimitsSpy = jest.spyOn(rateLimiter, 'updateRateLimits');
      jest.spyOn(requestHandler, 'processRequest').mockResolvedValue({
        super_likes: {
          remaining: 4,
          resets_at: new Date(Date.now() + 86400000).toISOString()
        }
      });
      
      // Execute request
      await requestHandler.processRequest({
        method: 'POST',
        endpoint: '/like/target-456/super',
        userId
      });
      
      // Verify
      expect(updateRateLimitsSpy).toHaveBeenCalled();
      const userLimits = (rateLimiter as any).userLimits.get(userId);
      expect(userLimits).toBeDefined();
      expect(userLimits.superLikes.remaining).toBe(4);
    });

    it('should reject requests exceeding like limits', async () => {
      // Setup
      const userId = 'user-123';
      (rateLimiter as any).userLimits.set(userId, {
        likes: { remaining: 0, resetAt: Date.now() + 3600000 },
        superLikes: { remaining: 5, resetAt: Date.now() + 3600000 },
        boosts: { remaining: 1, resetAt: Date.now() + 3600000 }
      });
      
      // Execute request
      const request = requestHandler.processRequest({
        method: 'GET',
        endpoint: '/like/target-456',
        userId
      });
      
      // Verify
      await expect(request).rejects.toThrow(ApiError);
      await expect(request).rejects.toMatchObject({
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message: expect.stringContaining('Like rate limit exceeded')
      });
    });
  });

  describe('Validation Failure Rate Limiting', () => {
    it('should track validation failures', () => {
      // Setup
      const identifier = 'user-123';
      const endpoint = '/auth/sms/validate';
      
      // Execute
      const result = rateLimiter.trackValidationFailure(identifier, endpoint);
      
      // Verify
      expect(result).toBe(false); // First failure should not trigger blocking
      const tracking = (rateLimiter as any).validationFailures.get(`${identifier}:${endpoint}`);
      expect(tracking).toBeDefined();
      expect(tracking.failures).toBe(1);
    });

    it('should block after excessive validation failures', () => {
      // Setup
      const identifier = 'user-123';
      const endpoint = '/auth/sms/validate';
      
      // Simulate multiple failures
      for (let i = 0; i < 10; i++) {
        rateLimiter.trackValidationFailure(identifier, endpoint);
      }
      
      // Execute
      const isLimited = rateLimiter.isValidationRateLimited(identifier, endpoint);
      
      // Verify
      expect(isLimited).toBe(true);
    });

    it('should reset failure count after time window', () => {
      // Setup
      const identifier = 'user-123';
      const endpoint = '/auth/sms/validate';
      
      // Record a failure
      rateLimiter.trackValidationFailure(identifier, endpoint);
      
      // Simulate time passing
      const tracking = (rateLimiter as any).validationFailures.get(`${identifier}:${endpoint}`);
      tracking.lastFailure = Date.now() - 61 * 60 * 1000; // 61 minutes ago
      
      // Execute
      const result = rateLimiter.trackValidationFailure(identifier, endpoint);
      
      // Verify
      expect(result).toBe(false); // Counter should be reset
      expect(tracking.failures).toBe(1); // Should be reset to 1
    });
  });

  describe('Integration with Request Handler', () => {
    it('should check rate limits before processing requests', async () => {
      // Setup
      const checkRateLimitSpy = jest.spyOn(rateLimiter, 'checkRateLimit');
      jest.spyOn(requestHandler as any, 'validateRequest').mockImplementation(() => {});
      jest.spyOn(requestHandler as any, 'validateRequestBody').mockImplementation(() => {});
      jest.spyOn(requestHandler as any, 'requiresAuthentication').mockReturnValue(false);
      jest.spyOn(requestHandler as any, 'isCacheable').mockReturnValue(false);
      
      const mockAxiosInstance = {
        request: jest.fn().mockResolvedValue({ data: {} })
      };
      (requestHandler as any).httpClient = mockAxiosInstance;
      
      // Execute
      await requestHandler.processRequest({
        method: 'GET',
        endpoint: '/user/123'
      });
      
      // Verify
      expect(checkRateLimitSpy).toHaveBeenCalledWith('/user/123', undefined);
    });

    it('should update rate limits after successful requests', async () => {
      // Setup
      const updateRateLimitsSpy = jest.spyOn(rateLimiter, 'updateRateLimits');
      jest.spyOn(requestHandler as any, 'validateRequest').mockImplementation(() => {});
      jest.spyOn(requestHandler as any, 'validateRequestBody').mockImplementation(() => {});
      jest.spyOn(requestHandler as any, 'requiresAuthentication').mockReturnValue(false);
      jest.spyOn(requestHandler as any, 'isCacheable').mockReturnValue(false);
      
      const mockAxiosInstance = {
        request: jest.fn().mockResolvedValue({ data: { _id: 'user-123' } })
      };
      (requestHandler as any).httpClient = mockAxiosInstance;
      
      // Execute
      await requestHandler.processRequest({
        method: 'GET',
        endpoint: '/user/123',
        userId: 'user-123'
      });
      
      // Verify
      expect(updateRateLimitsSpy).toHaveBeenCalledWith(
        '/user/123',
        expect.objectContaining({ data: { _id: 'user-123' } }),
        'user-123'
      );
    });
  });
});