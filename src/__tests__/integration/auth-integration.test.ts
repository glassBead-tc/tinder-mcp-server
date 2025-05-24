/**
 * Authentication Integration Tests
 * 
 * Tests the complete authentication flow, including:
 * - SMS authentication
 * - Facebook authentication
 * - Token management
 * - Token refresh
 */

import axios from 'axios';
import authService from '../../services/authentication';
import tokenStore from '../../utils/token-store';
import { ApiError } from '../../utils/error-handler';

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/token-store');
jest.mock('../../utils/logger');

describe('Authentication Flow Integration Tests', () => {
  // Mock axios instance
  const mockAxiosCreate = axios.create as jest.Mock;
  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosCreate.mockReturnValue(mockAxiosInstance);
    
    // Mock token store
    (tokenStore.calculateExpiryTime as jest.Mock).mockReturnValue(Date.now() + 3600000);
    (tokenStore.storeToken as jest.Mock).mockReturnValue(true);
    (tokenStore.getToken as jest.Mock).mockReturnValue({
      apiToken: 'mock-api-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 3600000
    });
    (tokenStore.isTokenExpired as jest.Mock).mockReturnValue(false);
  });

  describe('Complete SMS Authentication Flow', () => {
    it('should complete the full SMS authentication flow', async () => {
      // Step 1: Request OTP
      const phoneNumber = '+1234567890';
      const otpResponse = {
        data: {
          otp_length: 6,
          expires_in: 300,
          attempts_remaining: 3
        }
      };
      mockAxiosInstance.post.mockResolvedValueOnce(otpResponse);
      
      // Execute step 1
      const step1Result = await authService.authenticateWithSMS(phoneNumber);
      
      // Verify step 1
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/sms/send', {
        phone_number: phoneNumber
      });
      expect(step1Result).toEqual({
        status: 'otp_sent',
        otpLength: 6
      });
      
      // Step 2: Validate OTP and login
      const otpCode = '123456';
      const validateResponse = {
        data: {
          refresh_token: 'mock-refresh-token'
        }
      };
      const loginResponse = {
        data: {
          api_token: 'mock-api-token',
          refresh_token: 'mock-refresh-token',
          _id: 'user-123',
          is_new_user: false
        }
      };
      mockAxiosInstance.post.mockResolvedValueOnce(validateResponse);
      mockAxiosInstance.post.mockResolvedValueOnce(loginResponse);
      
      // Execute step 2
      const step2Result = await authService.authenticateWithSMS(phoneNumber, otpCode);
      
      // Verify step 2
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/sms/validate', {
        otp_code: otpCode,
        phone_number: phoneNumber,
        is_update: false
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/sms', {
        refresh_token: 'mock-refresh-token'
      });
      expect(tokenStore.storeToken).toHaveBeenCalledWith('user-123', expect.objectContaining({
        apiToken: 'mock-api-token',
        refreshToken: 'mock-refresh-token'
      }));
      expect(step2Result).toEqual({
        status: 'authenticated',
        userId: 'user-123',
        isNewUser: false
      });
      
      // Step 3: Get valid token for API requests
      const userId = 'user-123';
      
      // Execute step 3
      const token = await authService.getValidToken(userId);
      
      // Verify step 3
      expect(tokenStore.getToken).toHaveBeenCalledWith(userId);
      expect(tokenStore.isTokenExpired).toHaveBeenCalledWith(userId);
      expect(token).toBe('mock-api-token');
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh an expired token', async () => {
      // Setup
      const userId = 'user-123';
      (tokenStore.isTokenExpired as jest.Mock).mockReturnValueOnce(true);
      
      const refreshResponse = {
        data: {
          api_token: 'new-api-token',
          refresh_token: 'new-refresh-token'
        }
      };
      mockAxiosInstance.post.mockResolvedValueOnce(refreshResponse);
      
      // Execute
      const token = await authService.getValidToken(userId);
      
      // Verify
      expect(tokenStore.isTokenExpired).toHaveBeenCalledWith(userId);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/sms', {
        refresh_token: 'mock-refresh-token'
      });
      expect(tokenStore.storeToken).toHaveBeenCalledWith(userId, expect.objectContaining({
        apiToken: 'new-api-token',
        refreshToken: 'new-refresh-token'
      }));
      expect(token).toBe('new-api-token');
    });
  });

  describe('Facebook Authentication Flow', () => {
    it('should authenticate with Facebook for existing user', async () => {
      // Setup
      const facebookToken = 'mock-facebook-token';
      const response = {
        data: {
          api_token: 'mock-api-token',
          refresh_token: 'mock-refresh-token',
          _id: 'user-123',
          is_new_user: false
        }
      };
      mockAxiosInstance.post.mockResolvedValueOnce(response);
      
      // Execute
      const result = await authService.authenticateWithFacebook(facebookToken);
      
      // Verify
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/facebook', {
        token: facebookToken
      });
      expect(tokenStore.storeToken).toHaveBeenCalledWith('user-123', expect.objectContaining({
        apiToken: 'mock-api-token',
        refreshToken: 'mock-refresh-token'
      }));
      expect(result).toEqual({
        status: 'authenticated',
        userId: 'user-123'
      });
    });

    it('should handle new user onboarding with Facebook', async () => {
      // Setup
      const facebookToken = 'mock-facebook-token';
      const response = {
        data: {
          is_new_user: true,
          onboarding_token: 'mock-onboarding-token'
        }
      };
      mockAxiosInstance.post.mockResolvedValueOnce(response);
      
      // Execute
      const result = await authService.authenticateWithFacebook(facebookToken);
      
      // Verify
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/facebook', {
        token: facebookToken
      });
      expect(tokenStore.storeToken).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'onboarding_required',
        onboardingToken: 'mock-onboarding-token'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication failures gracefully', async () => {
      // Setup
      const phoneNumber = '+1234567890';
      const otpCode = '123456';
      const error = new Error('Authentication failed');
      (error as any).response = {
        status: 401,
        data: {
          error: 'Invalid OTP code'
        }
      };
      mockAxiosInstance.post.mockRejectedValueOnce(error);
      
      // Execute & Verify
      await expect(authService.authenticateWithSMS(phoneNumber, otpCode))
        .rejects.toThrow(ApiError);
    });
  });
});