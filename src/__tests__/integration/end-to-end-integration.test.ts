/**
 * End-to-End Integration Tests
 * 
 * Tests the complete flow of the MCP server, from authentication to API requests.
 */

import express, { Request, Response, NextFunction } from 'express';
import authService from '../../services/authentication';
import requestHandler from '../../services/request-handler';
import tokenStore from '../../utils/token-store';
import cacheManager from '../../services/cache-manager';
import rateLimiter from '../../services/rate-limiter';
import { handleHttpError } from '../../utils/error-handler';
import authRoutes from '../../routes/auth';
import userRoutes from '../../routes/user';
import interactionRoutes from '../../routes/interaction';

// Mock dependencies
jest.mock('../../services/authentication');
jest.mock('../../services/request-handler');
jest.mock('../../utils/token-store');
jest.mock('../../services/cache-manager');
jest.mock('../../services/rate-limiter');
jest.mock('../../utils/logger');

describe('End-to-End Integration Tests', () => {
  let app: express.Express;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    
    // Register routes
    app.use('/mcp/auth', authRoutes);
    app.use('/mcp/user', userRoutes);
    app.use('/mcp/interaction', interactionRoutes);
    
    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      handleHttpError(res, err);
    });
    
    // Create mock request/response objects
    mockRequest = {
      body: {},
      query: {},
      params: {},
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('Complete User Flow', () => {
    it('should handle the complete user flow from authentication to API requests', async () => {
      // Step 1: SMS Authentication - Request OTP
      (authService.authenticateWithSMS as jest.Mock).mockResolvedValueOnce({
        status: 'otp_sent',
        otpLength: 6
      });
      
      // Execute step 1
      const phoneNumber = '+1234567890';
      await authRoutes.sendSmsOtp(
        { ...mockRequest, body: { phoneNumber } } as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify step 1
      expect(authService.authenticateWithSMS).toHaveBeenCalledWith(phoneNumber, null);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'otp_sent',
          otpLength: 6
        }
      });
      
      // Step 2: SMS Authentication - Validate OTP
      (authService.authenticateWithSMS as jest.Mock).mockResolvedValueOnce({
        status: 'authenticated',
        userId: 'user-123',
        isNewUser: false
      });
      
      // Execute step 2
      const otpCode = '123456';
      await authRoutes.validateSmsOtp(
        { ...mockRequest, body: { phoneNumber, otpCode } } as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify step 2
      expect(authService.authenticateWithSMS).toHaveBeenCalledWith(phoneNumber, otpCode);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'authenticated',
          userId: 'user-123',
          isNewUser: false
        }
      });
      
      // Step 3: Get User Profile
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        _id: 'user-123',
        name: 'Test User',
        bio: 'Test bio',
        photos: []
      });
      
      // Execute step 3
      const userId = 'user-123';
      await userRoutes.getUserProfile(
        { ...mockRequest, params: { userId } } as unknown as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify step 3
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/user/user-123',
        userId: 'user-123'
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: 'user-123',
          name: 'Test User',
          bio: 'Test bio',
          photos: []
        }
      });
      
      // Step 4: Get Recommendations
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        data: [
          { _id: 'user-1', name: 'User 1' },
          { _id: 'user-2', name: 'User 2' }
        ]
      });
      
      // Execute step 4
      await userRoutes.getRecommendations(
        { ...mockRequest, query: { userId } } as unknown as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify step 4
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/v2/recs/core',
        userId: 'user-123'
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Step 5: Like a User
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        match: false,
        likes_remaining: 99
      });
      
      // Execute step 5
      const targetUserId = 'target-456';
      await interactionRoutes.likeUser(
        { ...mockRequest, body: { userId, targetUserId } } as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify step 5
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/like/target-456',
        userId: 'user-123'
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          match: false,
          likes_remaining: 99
        }
      });
    });
  });

  describe('Caching Integration', () => {
    it('should cache and retrieve responses', async () => {
      // Setup
      const userId = 'user-123';
      const cacheKey = '/user/user-123::user-123';
      const cachedData = {
        _id: 'user-123',
        name: 'Test User',
        bio: 'Cached bio',
        photos: []
      };
      
      // Mock cache hit
      (cacheManager.get as jest.Mock).mockResolvedValueOnce(cachedData);
      
      // Execute request
      await userRoutes.getUserProfile(
        { ...mockRequest, params: { userId } } as unknown as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify cache was checked and used
      expect(cacheManager.get).toHaveBeenCalled();
      expect(requestHandler.processRequest).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: cachedData
      });
      
      // Mock cache miss and subsequent cache set
      (cacheManager.get as jest.Mock).mockResolvedValueOnce(null);
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        _id: 'user-123',
        name: 'Test User',
        bio: 'Fresh bio',
        photos: []
      });
      
      // Reset mocks
      mockResponse.status.mockClear();
      mockResponse.json.mockClear();
      
      // Execute request again
      await userRoutes.getUserProfile(
        { ...mockRequest, params: { userId } } as unknown as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify cache was checked, missed, and then set
      expect(cacheManager.get).toHaveBeenCalled();
      expect(requestHandler.processRequest).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should check rate limits before processing requests', async () => {
      // Setup
      const userId = 'user-123';
      const targetUserId = 'target-456';
      
      // Mock rate limit check
      (rateLimiter.checkRateLimit as jest.Mock).mockResolvedValueOnce(undefined);
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        match: false,
        likes_remaining: 99
      });
      
      // Execute request
      await interactionRoutes.likeUser(
        { ...mockRequest, body: { userId, targetUserId } } as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify rate limit was checked
      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith('/like/target-456', 'user-123');
      expect(requestHandler.processRequest).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Mock rate limit exceeded
      (rateLimiter.checkRateLimit as jest.Mock).mockRejectedValueOnce({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        statusCode: 429
      });
      
      // Reset mocks
      mockResponse.status.mockClear();
      mockResponse.json.mockClear();
      
      // Execute request again
      await interactionRoutes.likeUser(
        { ...mockRequest, body: { userId, targetUserId } } as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify rate limit was checked and request was rejected
      expect(rateLimiter.checkRateLimit).toHaveBeenCalled();
      expect(requestHandler.processRequest).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle and format errors consistently', async () => {
      // Setup - authentication error
      (authService.authenticateWithSMS as jest.Mock).mockRejectedValueOnce({
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid OTP code',
        statusCode: 401
      });
      
      // Execute request
      await authRoutes.validateSmsOtp(
        { ...mockRequest, body: { phoneNumber: '+1234567890', otpCode: '123456' } } as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify error was passed to next middleware
      expect(mockNext).toHaveBeenCalled();
      
      // Setup - validation error
      (requestHandler.processRequest as jest.Mock).mockRejectedValueOnce({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        statusCode: 400
      });
      
      // Reset mocks
      mockNext.mockClear();
      
      // Execute request
      await userRoutes.getUserProfile(
        { ...mockRequest, params: { userId: 'invalid-id' } } as unknown as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify error was passed to next middleware
      expect(mockNext).toHaveBeenCalled();
    });
  });
});