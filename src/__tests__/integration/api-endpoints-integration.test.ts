/**
 * API Endpoints Integration Tests
 * 
 * Tests the integration between routes, request handler, and authentication.
 */

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import authRoutes from '../../routes/auth';
import userRoutes from '../../routes/user';
import interactionRoutes from '../../routes/interaction';
import { handleHttpError } from '../../utils/error-handler';
import authService from '../../services/authentication';
import requestHandler from '../../services/request-handler';

// Mock dependencies
jest.mock('../../services/authentication');
jest.mock('../../services/request-handler');
jest.mock('../../utils/logger');

describe('API Endpoints Integration Tests', () => {
  let app: express.Express;

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
  });

  describe('Authentication Endpoints', () => {
    it('should handle SMS authentication request', async () => {
      // Mock authentication service
      (authService.authenticateWithSMS as jest.Mock).mockResolvedValueOnce({
        status: 'otp_sent',
        otpLength: 6
      });
      
      // Make request
      const response = await request(app)
        .post('/mcp/auth/sms/send')
        .send({ phoneNumber: '+1234567890' });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'otp_sent',
          otpLength: 6
        }
      });
      expect(authService.authenticateWithSMS).toHaveBeenCalledWith('+1234567890', null);
    });

    it('should handle SMS validation request', async () => {
      // Mock authentication service
      (authService.authenticateWithSMS as jest.Mock).mockResolvedValueOnce({
        status: 'authenticated',
        userId: 'user-123',
        isNewUser: false
      });
      
      // Make request
      const response = await request(app)
        .post('/mcp/auth/sms/validate')
        .send({ 
          phoneNumber: '+1234567890',
          otpCode: '123456'
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'authenticated',
          userId: 'user-123',
          isNewUser: false
        }
      });
      expect(authService.authenticateWithSMS).toHaveBeenCalledWith('+1234567890', '123456');
    });

    it('should handle Facebook authentication request', async () => {
      // Mock authentication service
      (authService.authenticateWithFacebook as jest.Mock).mockResolvedValueOnce({
        status: 'authenticated',
        userId: 'user-123'
      });
      
      // Make request
      const response = await request(app)
        .post('/mcp/auth/facebook')
        .send({ facebookToken: 'mock-facebook-token' });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'authenticated',
          userId: 'user-123'
        }
      });
      expect(authService.authenticateWithFacebook).toHaveBeenCalledWith('mock-facebook-token');
    });

    it('should handle authentication errors', async () => {
      // Mock authentication service to throw error
      (authService.authenticateWithSMS as jest.Mock).mockRejectedValueOnce(
        new Error('Authentication failed')
      );
      
      // Make request
      const response = await request(app)
        .post('/mcp/auth/sms/send')
        .send({ phoneNumber: '+1234567890' });
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('User Endpoints', () => {
    it('should get user profile', async () => {
      // Mock request handler
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        _id: 'user-123',
        name: 'Test User',
        bio: 'Test bio',
        photos: []
      });
      
      // Make request
      const response = await request(app)
        .get('/mcp/user/user-123')
        .set('Authorization', 'Bearer mock-token');
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          _id: 'user-123',
          name: 'Test User',
          bio: 'Test bio',
          photos: []
        }
      });
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/user/user-123',
        userId: 'user-123'
      }));
    });

    it('should get recommendations', async () => {
      // Mock request handler
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        data: [
          { _id: 'user-1', name: 'User 1' },
          { _id: 'user-2', name: 'User 2' }
        ]
      });
      
      // Make request
      const response = await request(app)
        .get('/mcp/user/recommendations')
        .set('Authorization', 'Bearer mock-token')
        .query({ userId: 'user-123' });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          data: [
            { _id: 'user-1', name: 'User 1' },
            { _id: 'user-2', name: 'User 2' }
          ]
        }
      });
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/v2/recs/core',
        userId: 'user-123'
      }));
    });
  });

  describe('Interaction Endpoints', () => {
    it('should like a user', async () => {
      // Mock request handler
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        match: false,
        likes_remaining: 99
      });
      
      // Make request
      const response = await request(app)
        .post('/mcp/interaction/like')
        .send({
          userId: 'user-123',
          targetUserId: 'target-456'
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          match: false,
          likes_remaining: 99
        }
      });
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/like/target-456',
        userId: 'user-123'
      }));
    });

    it('should pass on a user', async () => {
      // Mock request handler
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        status: 'success'
      });
      
      // Make request
      const response = await request(app)
        .post('/mcp/interaction/pass')
        .send({
          userId: 'user-123',
          targetUserId: 'target-456'
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'success'
        }
      });
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/pass/target-456',
        userId: 'user-123'
      }));
    });

    it('should super like a user', async () => {
      // Mock request handler
      (requestHandler.processRequest as jest.Mock).mockResolvedValueOnce({
        match: true,
        super_likes: {
          remaining: 4,
          resets_at: '2023-01-01T00:00:00Z'
        }
      });
      
      // Make request
      const response = await request(app)
        .post('/mcp/interaction/superlike')
        .send({
          userId: 'user-123',
          targetUserId: 'target-456'
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          match: true,
          super_likes: {
            remaining: 4,
            resets_at: '2023-01-01T00:00:00Z'
          }
        }
      });
      expect(requestHandler.processRequest).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        endpoint: '/like/target-456/super',
        userId: 'user-123'
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      // Make request with invalid data
      const response = await request(app)
        .post('/mcp/auth/sms/send')
        .send({}); // Missing required phoneNumber
      
      // Verify response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle rate limit errors', async () => {
      // Mock request handler to throw rate limit error
      (requestHandler.processRequest as jest.Mock).mockRejectedValueOnce({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        statusCode: 429
      });
      
      // Make request
      const response = await request(app)
        .post('/mcp/interaction/like')
        .send({
          userId: 'user-123',
          targetUserId: 'target-456'
        });
      
      // Verify response
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});