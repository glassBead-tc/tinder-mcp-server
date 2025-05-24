import axios from 'axios';
import { z } from 'zod';
import requestHandler from '../../services/request-handler';
import authService from '../../services/authentication';
import cacheManager from '../../services/cache-manager';
import rateLimiter from '../../services/rate-limiter';
import logger from '../../utils/logger';
import { ApiError } from '../../utils/error-handler';
import { ErrorCodes, ClientRequest } from '../../types';
import validationService from '../../utils/validation';
import { schemaRegistry } from '../../schemas/registry';

// Mock dependencies
jest.mock('axios');
jest.mock('../../services/authentication');
jest.mock('../../services/cache-manager');
jest.mock('../../services/rate-limiter');
jest.mock('../../utils/logger');
jest.mock('../../utils/validation');
jest.mock('../../schemas/registry');

describe('Request Handler', () => {
  // Mock axios instance
  const mockAxiosCreate = axios.create as jest.Mock;
  const mockAxiosInstance = jest.fn();
  
  // Sample client request
  const sampleRequest: ClientRequest = {
    method: 'GET',
    endpoint: '/user/123',
    userId: 'user-456'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios
    mockAxiosCreate.mockReturnValue(mockAxiosInstance);
    mockAxiosInstance.mockResolvedValue({
      data: { success: true }
    });
    
    // Mock auth service
    (authService.getValidToken as jest.Mock).mockResolvedValue('mock-token');
    
    // Mock rate limiter
    (rateLimiter.checkRateLimit as jest.Mock).mockResolvedValue(undefined);
    (rateLimiter.updateRateLimits as jest.Mock).mockReturnValue(undefined);
    
    // Mock cache manager
    (cacheManager.get as jest.Mock).mockResolvedValue(null);
    (cacheManager.set as jest.Mock).mockResolvedValue(true);
    
    // Mock validation service
    (validationService.formatZodError as jest.Mock).mockReturnValue('Validation error');
  });

  describe('processRequest', () => {
    it('should process GET request successfully', async () => {
      // Act
      const result = await requestHandler.processRequest(sampleRequest);

      // Assert
      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(sampleRequest.endpoint, sampleRequest.userId);
      expect(authService.getValidToken).toHaveBeenCalledWith(sampleRequest.userId);
      expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: '/user/123',
        headers: expect.objectContaining({
          'X-Auth-Token': 'mock-token'
        })
      }));
      expect(result).toEqual({ success: true });
      expect(logger.info).toHaveBeenCalledWith(`Sending GET request to /user/123`);
    });

    it('should process POST request successfully', async () => {
      // Arrange
      const postRequest: ClientRequest = {
        method: 'POST',
        endpoint: '/like/123',
        body: { rating: 5 },
        userId: 'user-456'
      };

      // Act
      const result = await requestHandler.processRequest(postRequest);

      // Assert
      expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: '/like/123',
        data: { rating: 5 }
      }));
      expect(result).toEqual({ success: true });
    });

    it('should return cached response for GET requests if available', async () => {
      // Arrange
      const cachedResponse = { success: true, cached: true };
      (cacheManager.get as jest.Mock).mockResolvedValueOnce(cachedResponse);

      // Act
      const result = await requestHandler.processRequest(sampleRequest);

      // Assert
      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockAxiosInstance).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResponse);
      expect(logger.debug).toHaveBeenCalledWith(`Cache hit for /user/123`);
    });

    it('should cache response for GET requests', async () => {
      // Arrange
      const response = {
        data: { success: true }
      };
      mockAxiosInstance.mockResolvedValueOnce(response);

      // Act
      await requestHandler.processRequest(sampleRequest);

      // Assert
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        response.data
      );
    });

    it('should not add auth token for public endpoints', async () => {
      // Arrange
      const publicRequest: ClientRequest = {
        method: 'POST',
        endpoint: '/v2/auth/sms/send',
        body: { phone_number: '+1234567890' }
      };

      // Act
      await requestHandler.processRequest(publicRequest);

      // Assert
      expect(authService.getValidToken).not.toHaveBeenCalled();
      expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
        headers: expect.not.objectContaining({
          'X-Auth-Token': expect.anything()
        })
      }));
    });

    it('should validate request structure', async () => {
      // Arrange
      const invalidRequest = {
        // Missing required 'method' field
        endpoint: '/user/123'
      } as any;

      // Mock validation failure
      const mockClientRequestSchema = {
        safeParse: jest.fn().mockReturnValue({
          success: false,
          error: {
            format: () => ({ errors: [{ message: 'Method is required' }] })
          }
        })
      };
      jest.spyOn(z, 'object').mockReturnValueOnce(mockClientRequestSchema as any);

      // Act & Assert
      await expect(requestHandler.processRequest(invalidRequest))
        .rejects.toThrow(ApiError);
      expect(mockAxiosInstance).not.toHaveBeenCalled();
    });

    it('should validate request body against endpoint-specific schema', async () => {
      // Arrange
      const postRequest: ClientRequest = {
        method: 'POST',
        endpoint: '/like/123',
        body: { invalid: true },
        userId: 'user-456'
      };

      // Mock schema registry
      const mockSchema = {
        safeParse: jest.fn().mockReturnValue({
          success: false,
          error: {
            format: () => ({ errors: [{ message: 'Invalid request body' }] })
          }
        })
      };
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockSchema);

      // Act & Assert
      await expect(requestHandler.processRequest(postRequest))
        .rejects.toThrow(ApiError);
      expect(mockAxiosInstance).not.toHaveBeenCalled();
    });

    it('should handle API error responses', async () => {
      // Arrange
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: 'Unauthorized',
            message: 'Invalid token'
          }
        }
      };
      mockAxiosInstance.mockRejectedValueOnce(errorResponse);

      // Act & Assert
      await expect(requestHandler.processRequest(sampleRequest))
        .rejects.toThrow(ApiError);
      expect(authService.removeToken).toHaveBeenCalledWith(sampleRequest.userId);
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = {
        code: 'ECONNABORTED',
        message: 'Request timeout'
      };
      mockAxiosInstance.mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(requestHandler.processRequest(sampleRequest))
        .rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle rate limit errors', async () => {
      // Arrange
      (rateLimiter.checkRateLimit as jest.Mock).mockRejectedValueOnce(
        new ApiError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          { resetAt: Date.now() + 60000 },
          429
        )
      );

      // Act & Assert
      await expect(requestHandler.processRequest(sampleRequest))
        .rejects.toThrow(ApiError);
      expect(mockAxiosInstance).not.toHaveBeenCalled();
    });

    it('should update rate limits from response', async () => {
      // Arrange
      const response = {
        data: { success: true },
        headers: {
          'x-rate-limit-remaining': '10',
          'x-rate-limit-reset': '60'
        }
      };
      mockAxiosInstance.mockResolvedValueOnce(response);

      // Act
      await requestHandler.processRequest(sampleRequest);

      // Assert
      expect(rateLimiter.updateRateLimits).toHaveBeenCalledWith(
        sampleRequest.endpoint,
        response,
        sampleRequest.userId
      );
    });

    it('should add standard headers to request', async () => {
      // Act
      await requestHandler.processRequest(sampleRequest);

      // Assert
      expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
        headers: expect.objectContaining({
          'app-version': expect.any(String),
          'platform': 'web',
          'content-type': 'application/json',
          'x-supported-image-formats': expect.any(String)
        })
      }));
    });

    it('should implement retry logic for 5xx errors', async () => {
      // Arrange
      const serverError = {
        response: {
          status: 503,
          data: {
            error: 'Service Unavailable'
          }
        },
        config: {}
      };
      
      // First call fails, second succeeds
      mockAxiosInstance
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({
          data: { success: true, retried: true }
        });

      // Mock setTimeout
      jest.useFakeTimers();
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        callback();
        return 1 as any;
      });

      // Act
      const result = await requestHandler.processRequest(sampleRequest);

      // Assert
      expect(mockAxiosInstance).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true, retried: true });
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
      jest.useRealTimers();
    });
  });

  describe('validateRequest', () => {
    it('should validate user ID for like endpoint', async () => {
      // Arrange
      const likeRequest: ClientRequest = {
        method: 'GET',
        endpoint: '/like/invalid-id',
        userId: 'user-456'
      };

      // Mock UUID validation failure
      const mockUuidSchema = {
        safeParse: jest.fn().mockReturnValue({
          success: false,
          error: {
            format: () => ({ errors: [{ message: 'Invalid UUID format' }] })
          }
        })
      };
      jest.spyOn(z, 'object').mockReturnValueOnce({
        safeParse: jest.fn().mockReturnValue({ success: true })
      } as any);
      
      // Mock base schema
      jest.mock('../../schemas/common/base.schema', () => ({
        uuidString: mockUuidSchema
      }));

      // Act & Assert
      await expect(requestHandler.processRequest(likeRequest))
        .rejects.toThrow(ApiError);
      expect(mockAxiosInstance).not.toHaveBeenCalled();
    });
  });

  describe('isCacheable', () => {
    it('should cache user profile requests', async () => {
      // Arrange
      const userRequest: ClientRequest = {
        method: 'GET',
        endpoint: '/user/123',
        userId: 'user-456'
      };

      // Act
      await requestHandler.processRequest(userRequest);

      // Assert
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should cache recommendation requests', async () => {
      // Arrange
      const recsRequest: ClientRequest = {
        method: 'GET',
        endpoint: '/v2/recs/core',
        userId: 'user-456'
      };

      // Act
      await requestHandler.processRequest(recsRequest);

      // Assert
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should not cache non-GET requests', async () => {
      // Arrange
      const postRequest: ClientRequest = {
        method: 'POST',
        endpoint: '/like/123',
        body: { rating: 5 },
        userId: 'user-456'
      };

      // Act
      await requestHandler.processRequest(postRequest);

      // Assert
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should not cache non-cacheable endpoints', async () => {
      // Arrange
      const nonCacheableRequest: ClientRequest = {
        method: 'GET',
        endpoint: '/matches/123',
        userId: 'user-456'
      };

      // Act
      await requestHandler.processRequest(nonCacheableRequest);

      // Assert
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });
});