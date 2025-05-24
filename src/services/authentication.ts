/**
 * Authentication Service
 * Handles authentication with the Tinder API
 */

import axios, { AxiosInstance } from 'axios';
import config from '../config';
import tokenStore from '../utils/token-store';
import logger from '../utils/logger';
import { ApiError } from '../utils/error-handler';
import { ErrorCodes, SmsAuthResult, FacebookAuthResult, CaptchaVerificationResult } from '../types';
import validationService from '../utils/validation';
import authSchemas from '../schemas/api/auth.schema';
import commonAuthSchemas from '../schemas/common/auth.schema';
import userSchemas from '../schemas/common/user.schema';

/**
 * Authentication service class
 * Manages authentication flows with Tinder API
 */
class AuthenticationService {
  private baseUrl: string;
  private httpClient: AxiosInstance;

  constructor() {
    this.baseUrl = config.TINDER_API.BASE_URL;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: config.TINDER_API.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'app-version': '1020345',
        'platform': 'web',
        'x-supported-image-formats': 'webp,jpeg'
      }
    });
  }

  /**
   * Authenticate with SMS
   * @param phoneNumber - User's phone number
   * @param otpCode - OTP code (if available)
   * @returns Authentication result
   */
  public async authenticateWithSMS(phoneNumber: string, otpCode: string | null = null): Promise<SmsAuthResult> {
    try {
      // Validate phone number
      const phoneNumberResult = userSchemas.phoneNumberSchema.safeParse(phoneNumber);
      if (!phoneNumberResult.success) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Invalid phone number: ${validationService.formatZodError(phoneNumberResult.error)}`,
          { details: phoneNumberResult.error.format() },
          400
        );
      }

      if (!otpCode) {
        // Step 1: Request OTP
        // Validate request using schema
        const smsRequest = { phoneNumber, purpose: 'login' as const };
        const requestValidation = authSchemas.smsRequestSchema.safeParse(smsRequest);
        
        if (!requestValidation.success) {
          throw new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            `Invalid SMS request: ${validationService.formatZodError(requestValidation.error)}`,
            { details: requestValidation.error.format() },
            400
          );
        }
        
        const response = await this.httpClient.post('/v2/auth/sms/send', {
          phone_number: phoneNumber
        });
        
        logger.info(`OTP sent to phone number: ${phoneNumber}`);
        
        // Validate response using schema
        const smsResponse = {
          status: 'success' as const,
          otpLength: response.data.otp_length,
          expiresIn: response.data.expires_in || 300,
          attemptsRemaining: response.data.attempts_remaining || 3
        };
        
        const responseValidation = authSchemas.smsResponseSchema.safeParse(smsResponse);
        if (!responseValidation.success) {
          logger.warn(`SMS response validation failed: ${validationService.formatZodError(responseValidation.error)}`);
        }
        
        return {
          status: 'otp_sent',
          otpLength: response.data.otp_length
        };
      } else {
        // Step 2: Validate OTP
        // Validate OTP code
        if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
          throw new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            'OTP must be 6 digits',
            null,
            400
          );
        }
        
        // Validate request using schema
        const otpRequest = { phoneNumber, otp: otpCode, purpose: 'login' as const };
        const requestValidation = authSchemas.otpVerificationRequestSchema.safeParse(otpRequest);
        
        if (!requestValidation.success) {
          throw new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            `Invalid OTP verification request: ${validationService.formatZodError(requestValidation.error)}`,
            { details: requestValidation.error.format() },
            400
          );
        }
        
        const validateResponse = await this.httpClient.post('/v2/auth/sms/validate', {
          otp_code: otpCode,
          phone_number: phoneNumber,
          is_update: false
        });
        
        if (!validateResponse.data.refresh_token) {
          throw new ApiError(
            ErrorCodes.AUTHENTICATION_FAILED,
            'Failed to validate OTP code',
            null,
            401
          );
        }
        
        // Step 3: Login with refresh token
        const loginResponse = await this.httpClient.post('/v2/auth/login/sms', {
          refresh_token: validateResponse.data.refresh_token
        });
        
        // Validate token data
        const tokenData = {
          apiToken: loginResponse.data.api_token,
          refreshToken: loginResponse.data.refresh_token,
          expiresAt: tokenStore.calculateExpiryTime()
        };
        
        const tokenValidation = commonAuthSchemas.tokenDataSchema.safeParse(tokenData);
        if (!tokenValidation.success) {
          throw new ApiError(
            ErrorCodes.AUTHENTICATION_FAILED,
            `Invalid token data: ${validationService.formatZodError(tokenValidation.error)}`,
            { details: tokenValidation.error.format() },
            401
          );
        }
        
        // Store tokens securely
        const userId = loginResponse.data._id;
        tokenStore.storeToken(userId, tokenData);
        
        logger.info(`User authenticated via SMS: ${userId}`);
        
        return {
          status: 'authenticated',
          userId: userId,
          isNewUser: loginResponse.data.is_new_user || false
        };
      }
    } catch (error) {
      logger.error(`SMS authentication error: ${(error as Error).message}`);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        `SMS authentication failed: ${(error as Error).message}`,
        (error as any).response?.data,
        401
      );
    }
  }

  /**
   * Authenticate with Facebook
   * @param facebookToken - Facebook access token
   * @returns Authentication result
   */
  public async authenticateWithFacebook(facebookToken: string): Promise<FacebookAuthResult> {
    try {
      // Validate Facebook token
      if (!facebookToken || typeof facebookToken !== 'string') {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Facebook token is required',
          null,
          400
        );
      }
      
      // Validate request using schema
      const fbRequest = { accessToken: facebookToken };
      const requestValidation = authSchemas.facebookAuthRequestSchema.safeParse(fbRequest);
      
      if (!requestValidation.success) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Invalid Facebook auth request: ${validationService.formatZodError(requestValidation.error)}`,
          { details: requestValidation.error.format() },
          400
        );
      }
      
      const response = await this.httpClient.post('/v2/auth/login/facebook', {
        token: facebookToken
      });
      
      if (response.data.is_new_user) {
        logger.info('New user authenticated via Facebook');
        
        // Validate response for new user
        const fbResponse = {
          status: 'onboarding_required' as const,
          onboardingToken: response.data.onboarding_token
        };
        
        const responseValidation = authSchemas.facebookAuthResponseSchema.safeParse(fbResponse);
        if (!responseValidation.success) {
          logger.warn(`Facebook response validation failed: ${validationService.formatZodError(responseValidation.error)}`);
        }
        
        return fbResponse;
      } else {
        // Validate token data
        const tokenData = {
          apiToken: response.data.api_token,
          refreshToken: response.data.refresh_token,
          expiresAt: tokenStore.calculateExpiryTime()
        };
        
        const tokenValidation = commonAuthSchemas.tokenDataSchema.safeParse(tokenData);
        if (!tokenValidation.success) {
          throw new ApiError(
            ErrorCodes.AUTHENTICATION_FAILED,
            `Invalid token data: ${validationService.formatZodError(tokenValidation.error)}`,
            { details: tokenValidation.error.format() },
            401
          );
        }
        
        // Store tokens securely
        const userId = response.data._id;
        tokenStore.storeToken(userId, tokenData);
        
        logger.info(`User authenticated via Facebook: ${userId}`);
        
        // Validate response for existing user
        const fbResponse = {
          status: 'authenticated' as const,
          userId: userId
        };
        
        const responseValidation = authSchemas.facebookAuthResponseSchema.safeParse(fbResponse);
        if (!responseValidation.success) {
          logger.warn(`Facebook response validation failed: ${validationService.formatZodError(responseValidation.error)}`);
        }
        
        return fbResponse;
      }
    } catch (error) {
      logger.error(`Facebook authentication error: ${(error as Error).message}`);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        `Facebook authentication failed: ${(error as Error).message}`,
        (error as any).response?.data,
        401
      );
    }
  }

  /**
   * Verify CAPTCHA
   * @param captchaInput - CAPTCHA response
   * @param vendor - CAPTCHA vendor (arkose|recaptcha)
   * @returns Verification result
   */
  public async verifyCaptcha(captchaInput: string, vendor: string): Promise<CaptchaVerificationResult> {
    try {
      // Validate CAPTCHA input
      if (!captchaInput || typeof captchaInput !== 'string') {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'CAPTCHA input is required',
          null,
          400
        );
      }
      
      // Validate vendor
      if (!vendor || !['arkose', 'recaptcha'].includes(vendor)) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid CAPTCHA vendor. Must be "arkose" or "recaptcha"',
          null,
          400
        );
      }
      
      const response = await this.httpClient.post('/v2/auth/verify-captcha', {
        captcha_input: captchaInput,
        vendor: vendor
      });
      
      logger.info(`CAPTCHA verified successfully for vendor: ${vendor}`);
      
      return {
        status: 'verified',
        data: response.data
      };
    } catch (error) {
      logger.error(`CAPTCHA verification error: ${(error as Error).message}`);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        `CAPTCHA verification failed: ${(error as Error).message}`,
        (error as any).response?.data,
        401
      );
    }
  }

  /**
   * Refresh authentication token
   * @param userId - User ID
   * @returns New API token
   */
  public async refreshToken(userId: string): Promise<string> {
    try {
      // Validate user ID
      const userIdResult = userSchemas.userIdSchema.safeParse(userId);
      if (!userIdResult.success) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Invalid user ID: ${validationService.formatZodError(userIdResult.error)}`,
          { details: userIdResult.error.format() },
          400
        );
      }
      
      const tokenData = tokenStore.getToken(userId);
      
      if (!tokenData) {
        throw new ApiError(
          ErrorCodes.AUTHENTICATION_FAILED,
          'No token found for user',
          null,
          401
        );
      }
      
      // Validate request using schema
      const refreshRequest = { refreshToken: tokenData.refreshToken };
      const requestValidation = authSchemas.refreshTokenRequestSchema.safeParse(refreshRequest);
      
      if (!requestValidation.success) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Invalid refresh token request: ${validationService.formatZodError(requestValidation.error)}`,
          { details: requestValidation.error.format() },
          400
        );
      }
      
      const response = await this.httpClient.post('/v2/auth/login/sms', {
        refresh_token: tokenData.refreshToken
      });
      
      // Validate token data
      const newTokenData = {
        apiToken: response.data.api_token,
        refreshToken: response.data.refresh_token,
        expiresAt: tokenStore.calculateExpiryTime()
      };
      
      const tokenValidation = commonAuthSchemas.tokenDataSchema.safeParse(newTokenData);
      if (!tokenValidation.success) {
        throw new ApiError(
          ErrorCodes.AUTHENTICATION_FAILED,
          `Invalid token data: ${validationService.formatZodError(tokenValidation.error)}`,
          { details: tokenValidation.error.format() },
          401
        );
      }
      
      // Update stored tokens
      tokenStore.storeToken(userId, newTokenData);
      
      logger.info(`Token refreshed for user: ${userId}`);
      
      return response.data.api_token;
    } catch (error) {
      logger.error(`Token refresh error for user ${userId}: ${(error as Error).message}`);
      tokenStore.removeToken(userId); // Remove invalid token
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        `Token refresh failed: ${(error as Error).message}`,
        (error as any).response?.data,
        401
      );
    }
  }

  /**
   * Get valid token for a user
   * @param userId - User ID
   * @returns Valid API token
   */
  public async getValidToken(userId: string): Promise<string> {
    // Validate user ID
    const userIdResult = userSchemas.userIdSchema.safeParse(userId);
    if (!userIdResult.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid user ID: ${validationService.formatZodError(userIdResult.error)}`,
        { details: userIdResult.error.format() },
        400
      );
    }
    
    const tokenData = tokenStore.getToken(userId);
    
    if (!tokenData || tokenStore.isTokenExpired(userId)) {
      return await this.refreshToken(userId);
    }
    
    return tokenData.apiToken;
  }

  /**
   * Remove token for a user
   * @param userId - User ID
   * @returns Success status
   */
  public removeToken(userId: string): boolean {
    // Validate user ID
    const userIdResult = userSchemas.userIdSchema.safeParse(userId);
    if (!userIdResult.success) {
      logger.warn(`Invalid user ID for token removal: ${userId}`);
      return false;
    }
    
    return tokenStore.removeToken(userId);
  }
}

// Export singleton instance
export default new AuthenticationService();