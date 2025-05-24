"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const authentication_1 = __importDefault(require("../../services/authentication"));
const token_store_1 = __importDefault(require("../../utils/token-store"));
const logger_1 = __importDefault(require("../../utils/logger"));
const error_handler_1 = require("../../utils/error-handler");
const validation_1 = __importDefault(require("../../utils/validation"));
// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/token-store');
jest.mock('../../utils/logger');
jest.mock('../../schemas/registry');
jest.mock('../../utils/validation');
jest.mock('../../schemas/api/auth.schema', () => ({
    smsRequestSchema: jest.fn(),
    smsResponseSchema: jest.fn(),
    otpVerificationRequestSchema: jest.fn(),
    facebookAuthRequestSchema: jest.fn(),
    facebookAuthResponseSchema: jest.fn(),
    refreshTokenRequestSchema: jest.fn()
}));
jest.mock('../../schemas/common/auth.schema', () => ({
    tokenDataSchema: jest.fn()
}));
jest.mock('../../schemas/common/user.schema', () => ({
    phoneNumberSchema: {
        safeParse: jest.fn()
    },
    userIdSchema: {
        safeParse: jest.fn()
    }
}));
describe('Authentication Service', () => {
    // Mock axios instance
    const mockAxiosCreate = axios_1.default.create;
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
        // Mock validation service
        validation_1.default.formatZodError.mockReturnValue('Validation error');
        // Mock token store
        token_store_1.default.calculateExpiryTime.mockReturnValue(Date.now() + 3600000);
        token_store_1.default.storeToken.mockReturnValue(true);
        token_store_1.default.getToken.mockReturnValue({
            apiToken: 'mock-api-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000
        });
        // Mock user schema validations
        const userSchemas = require('../../schemas/common/user.schema');
        userSchemas.phoneNumberSchema.safeParse.mockReturnValue({
            success: true,
            data: '+1234567890'
        });
        userSchemas.userIdSchema.safeParse.mockReturnValue({
            success: true,
            data: 'user-123'
        });
    });
    describe('authenticateWithSMS', () => {
        it('should request OTP when no OTP code is provided', async () => {
            // Arrange
            const phoneNumber = '+1234567890';
            const mockResponse = {
                data: {
                    otp_length: 6,
                    expires_in: 300,
                    attempts_remaining: 3
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.smsRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { phoneNumber, purpose: 'login' }
            });
            authSchemas.smsResponseSchema.safeParse.mockReturnValue({
                success: true,
                data: {
                    status: 'success',
                    otpLength: 6,
                    expiresIn: 300,
                    attemptsRemaining: 3
                }
            });
            // Act
            const result = await authentication_1.default.authenticateWithSMS(phoneNumber);
            // Assert
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/sms/send', {
                phone_number: phoneNumber
            });
            expect(result).toEqual({
                status: 'otp_sent',
                otpLength: 6
            });
            expect(logger_1.default.info).toHaveBeenCalledWith(`OTP sent to phone number: ${phoneNumber}`);
        });
        it('should validate OTP and authenticate when OTP code is provided', async () => {
            // Arrange
            const phoneNumber = '+1234567890';
            const otpCode = '123456';
            const userId = 'user-123';
            const validateResponse = {
                data: {
                    refresh_token: 'mock-refresh-token'
                }
            };
            const loginResponse = {
                data: {
                    api_token: 'mock-api-token',
                    refresh_token: 'mock-refresh-token',
                    _id: userId,
                    is_new_user: false
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(validateResponse);
            mockAxiosInstance.post.mockResolvedValueOnce(loginResponse);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.otpVerificationRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { phoneNumber, otp: otpCode, purpose: 'login' }
            });
            const commonAuthSchemas = require('../../schemas/common/auth.schema');
            commonAuthSchemas.tokenDataSchema.safeParse.mockReturnValue({
                success: true,
                data: {
                    apiToken: 'mock-api-token',
                    refreshToken: 'mock-refresh-token',
                    expiresAt: Date.now() + 3600000
                }
            });
            // Act
            const result = await authentication_1.default.authenticateWithSMS(phoneNumber, otpCode);
            // Assert
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/sms/validate', {
                otp_code: otpCode,
                phone_number: phoneNumber,
                is_update: false
            });
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/sms', {
                refresh_token: 'mock-refresh-token'
            });
            expect(token_store_1.default.storeToken).toHaveBeenCalledWith(userId, expect.objectContaining({
                apiToken: 'mock-api-token',
                refreshToken: 'mock-refresh-token'
            }));
            expect(result).toEqual({
                status: 'authenticated',
                userId: userId,
                isNewUser: false
            });
            expect(logger_1.default.info).toHaveBeenCalledWith(`User authenticated via SMS: ${userId}`);
        });
        it('should throw ApiError when phone number validation fails', async () => {
            // Arrange
            const phoneNumber = 'invalid-phone';
            const userSchemas = require('../../schemas/common/user.schema');
            userSchemas.phoneNumberSchema.safeParse.mockReturnValue({
                success: false,
                error: {
                    format: () => ({ errors: [{ message: 'Invalid phone number' }] })
                }
            });
            // Act & Assert
            await expect(authentication_1.default.authenticateWithSMS(phoneNumber))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
        it('should throw ApiError when OTP validation fails', async () => {
            // Arrange
            const phoneNumber = '+1234567890';
            const otpCode = '12345'; // Invalid (not 6 digits)
            // Act & Assert
            await expect(authentication_1.default.authenticateWithSMS(phoneNumber, otpCode))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
        it('should throw ApiError when OTP verification fails', async () => {
            // Arrange
            const phoneNumber = '+1234567890';
            const otpCode = '123456';
            const validateResponse = {
                data: {} // No refresh_token
            };
            mockAxiosInstance.post.mockResolvedValueOnce(validateResponse);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.otpVerificationRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { phoneNumber, otp: otpCode, purpose: 'login' }
            });
            // Act & Assert
            await expect(authentication_1.default.authenticateWithSMS(phoneNumber, otpCode))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/sms/validate', expect.any(Object));
            expect(mockAxiosInstance.post).not.toHaveBeenCalledWith('/v2/auth/login/sms', expect.any(Object));
        });
    });
    describe('authenticateWithFacebook', () => {
        it('should authenticate with Facebook token for existing user', async () => {
            // Arrange
            const facebookToken = 'mock-facebook-token';
            const userId = 'user-123';
            const response = {
                data: {
                    api_token: 'mock-api-token',
                    refresh_token: 'mock-refresh-token',
                    _id: userId,
                    is_new_user: false
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(response);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.facebookAuthRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { accessToken: facebookToken }
            });
            const commonAuthSchemas = require('../../schemas/common/auth.schema');
            commonAuthSchemas.tokenDataSchema.safeParse.mockReturnValue({
                success: true,
                data: {
                    apiToken: 'mock-api-token',
                    refreshToken: 'mock-refresh-token',
                    expiresAt: Date.now() + 3600000
                }
            });
            authSchemas.facebookAuthResponseSchema.safeParse.mockReturnValue({
                success: true,
                data: {
                    status: 'authenticated',
                    userId: userId
                }
            });
            // Act
            const result = await authentication_1.default.authenticateWithFacebook(facebookToken);
            // Assert
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/facebook', {
                token: facebookToken
            });
            expect(token_store_1.default.storeToken).toHaveBeenCalledWith(userId, expect.objectContaining({
                apiToken: 'mock-api-token',
                refreshToken: 'mock-refresh-token'
            }));
            expect(result).toEqual({
                status: 'authenticated',
                userId: userId
            });
            expect(logger_1.default.info).toHaveBeenCalledWith(`User authenticated via Facebook: ${userId}`);
        });
        it('should return onboarding token for new user', async () => {
            // Arrange
            const facebookToken = 'mock-facebook-token';
            const response = {
                data: {
                    is_new_user: true,
                    onboarding_token: 'mock-onboarding-token'
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(response);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.facebookAuthRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { accessToken: facebookToken }
            });
            authSchemas.facebookAuthResponseSchema.safeParse.mockReturnValue({
                success: true,
                data: {
                    status: 'onboarding_required',
                    onboardingToken: 'mock-onboarding-token'
                }
            });
            // Act
            const result = await authentication_1.default.authenticateWithFacebook(facebookToken);
            // Assert
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/facebook', {
                token: facebookToken
            });
            expect(token_store_1.default.storeToken).not.toHaveBeenCalled();
            expect(result).toEqual({
                status: 'onboarding_required',
                onboardingToken: 'mock-onboarding-token'
            });
            expect(logger_1.default.info).toHaveBeenCalledWith('New user authenticated via Facebook');
        });
        it('should throw ApiError when Facebook token is invalid', async () => {
            // Arrange
            const facebookToken = '';
            // Act & Assert
            await expect(authentication_1.default.authenticateWithFacebook(facebookToken))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
        it('should throw ApiError when token validation fails', async () => {
            // Arrange
            const facebookToken = 'mock-facebook-token';
            const response = {
                data: {
                    is_new_user: false,
                    api_token: 'mock-api-token',
                    refresh_token: 'mock-refresh-token',
                    _id: 'user-123'
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(response);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.facebookAuthRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { accessToken: facebookToken }
            });
            const commonAuthSchemas = require('../../schemas/common/auth.schema');
            commonAuthSchemas.tokenDataSchema.safeParse.mockReturnValue({
                success: false,
                error: {
                    format: () => ({ errors: [{ message: 'Invalid token data' }] })
                }
            });
            // Act & Assert
            await expect(authentication_1.default.authenticateWithFacebook(facebookToken))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/facebook', {
                token: facebookToken
            });
            expect(token_store_1.default.storeToken).not.toHaveBeenCalled();
        });
    });
    describe('verifyCaptcha', () => {
        it('should verify CAPTCHA successfully', async () => {
            // Arrange
            const captchaInput = 'mock-captcha-input';
            const vendor = 'recaptcha';
            const response = {
                data: {
                    success: true
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(response);
            // Act
            const result = await authentication_1.default.verifyCaptcha(captchaInput, vendor);
            // Assert
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/verify-captcha', {
                captcha_input: captchaInput,
                vendor: vendor
            });
            expect(result).toEqual({
                status: 'verified',
                data: { success: true }
            });
            expect(logger_1.default.info).toHaveBeenCalledWith(`CAPTCHA verified successfully for vendor: ${vendor}`);
        });
        it('should throw ApiError when CAPTCHA input is invalid', async () => {
            // Arrange
            const captchaInput = '';
            const vendor = 'recaptcha';
            // Act & Assert
            await expect(authentication_1.default.verifyCaptcha(captchaInput, vendor))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
        it('should throw ApiError when vendor is invalid', async () => {
            // Arrange
            const captchaInput = 'mock-captcha-input';
            const vendor = 'invalid-vendor';
            // Act & Assert
            await expect(authentication_1.default.verifyCaptcha(captchaInput, vendor))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
    });
    describe('refreshToken', () => {
        it('should refresh token successfully', async () => {
            // Arrange
            const userId = 'user-123';
            const response = {
                data: {
                    api_token: 'new-api-token',
                    refresh_token: 'new-refresh-token'
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(response);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.refreshTokenRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { refreshToken: 'mock-refresh-token' }
            });
            const commonAuthSchemas = require('../../schemas/common/auth.schema');
            commonAuthSchemas.tokenDataSchema.safeParse.mockReturnValue({
                success: true,
                data: {
                    apiToken: 'new-api-token',
                    refreshToken: 'new-refresh-token',
                    expiresAt: Date.now() + 3600000
                }
            });
            // Act
            const result = await authentication_1.default.refreshToken(userId);
            // Assert
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/sms', {
                refresh_token: 'mock-refresh-token'
            });
            expect(token_store_1.default.storeToken).toHaveBeenCalledWith(userId, expect.objectContaining({
                apiToken: 'new-api-token',
                refreshToken: 'new-refresh-token'
            }));
            expect(result).toBe('new-api-token');
            expect(logger_1.default.info).toHaveBeenCalledWith(`Token refreshed for user: ${userId}`);
        });
        it('should throw ApiError when user ID is invalid', async () => {
            // Arrange
            const userId = 'invalid-user-id';
            const userSchemas = require('../../schemas/common/user.schema');
            userSchemas.userIdSchema.safeParse.mockReturnValue({
                success: false,
                error: {
                    format: () => ({ errors: [{ message: 'Invalid user ID' }] })
                }
            });
            // Act & Assert
            await expect(authentication_1.default.refreshToken(userId))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
        it('should throw ApiError when no token is found for user', async () => {
            // Arrange
            const userId = 'user-123';
            token_store_1.default.getToken.mockReturnValueOnce(null);
            // Act & Assert
            await expect(authentication_1.default.refreshToken(userId))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
        });
        it('should throw ApiError when token validation fails', async () => {
            // Arrange
            const userId = 'user-123';
            const response = {
                data: {
                    api_token: 'new-api-token',
                    refresh_token: 'new-refresh-token'
                }
            };
            mockAxiosInstance.post.mockResolvedValueOnce(response);
            // Mock schema validations
            const authSchemas = require('../../schemas/api/auth.schema');
            authSchemas.refreshTokenRequestSchema.safeParse.mockReturnValue({
                success: true,
                data: { refreshToken: 'mock-refresh-token' }
            });
            const commonAuthSchemas = require('../../schemas/common/auth.schema');
            commonAuthSchemas.tokenDataSchema.safeParse.mockReturnValue({
                success: false,
                error: {
                    format: () => ({ errors: [{ message: 'Invalid token data' }] })
                }
            });
            // Act & Assert
            await expect(authentication_1.default.refreshToken(userId))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/auth/login/sms', {
                refresh_token: 'mock-refresh-token'
            });
            expect(token_store_1.default.storeToken).not.toHaveBeenCalled();
        });
    });
    describe('getValidToken', () => {
        it('should return existing token when not expired', async () => {
            // Arrange
            const userId = 'user-123';
            const tokenData = {
                apiToken: 'mock-api-token',
                refreshToken: 'mock-refresh-token',
                expiresAt: Date.now() + 3600000
            };
            token_store_1.default.getToken.mockReturnValueOnce(tokenData);
            token_store_1.default.isTokenExpired.mockReturnValueOnce(false);
            // Act
            const result = await authentication_1.default.getValidToken(userId);
            // Assert
            expect(result).toBe('mock-api-token');
            expect(token_store_1.default.getToken).toHaveBeenCalledWith(userId);
            expect(token_store_1.default.isTokenExpired).toHaveBeenCalledWith(userId);
        });
        it('should refresh token when expired', async () => {
            // Arrange
            const userId = 'user-123';
            const tokenData = {
                apiToken: 'mock-api-token',
                refreshToken: 'mock-refresh-token',
                expiresAt: Date.now() - 3600000 // Expired
            };
            token_store_1.default.getToken.mockReturnValueOnce(tokenData);
            token_store_1.default.isTokenExpired.mockReturnValueOnce(true);
            // Mock refreshToken
            const refreshSpy = jest.spyOn(authentication_1.default, 'refreshToken').mockResolvedValueOnce('new-api-token');
            // Act
            const result = await authentication_1.default.getValidToken(userId);
            // Assert
            expect(result).toBe('new-api-token');
            expect(token_store_1.default.getToken).toHaveBeenCalledWith(userId);
            expect(token_store_1.default.isTokenExpired).toHaveBeenCalledWith(userId);
            expect(refreshSpy).toHaveBeenCalledWith(userId);
            // Clean up
            refreshSpy.mockRestore();
        });
        it('should throw ApiError when user ID is invalid', async () => {
            // Arrange
            const userId = 'invalid-user-id';
            const userSchemas = require('../../schemas/common/user.schema');
            userSchemas.userIdSchema.safeParse.mockReturnValue({
                success: false,
                error: {
                    format: () => ({ errors: [{ message: 'Invalid user ID' }] })
                }
            });
            // Act & Assert
            await expect(authentication_1.default.getValidToken(userId))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(token_store_1.default.getToken).not.toHaveBeenCalled();
        });
    });
    describe('removeToken', () => {
        it('should remove token successfully', () => {
            // Arrange
            const userId = 'user-123';
            token_store_1.default.removeToken.mockReturnValueOnce(true);
            // Act
            const result = authentication_1.default.removeToken(userId);
            // Assert
            expect(result).toBe(true);
            expect(token_store_1.default.removeToken).toHaveBeenCalledWith(userId);
        });
        it('should return false when user ID is invalid', () => {
            // Arrange
            const userId = 'invalid-user-id';
            const userSchemas = require('../../schemas/common/user.schema');
            userSchemas.userIdSchema.safeParse.mockReturnValue({
                success: false,
                error: {
                    format: () => ({ errors: [{ message: 'Invalid user ID' }] })
                }
            });
            // Act
            const result = authentication_1.default.removeToken(userId);
            // Assert
            expect(result).toBe(false);
            expect(token_store_1.default.removeToken).not.toHaveBeenCalled();
            expect(logger_1.default.warn).toHaveBeenCalledWith(`Invalid user ID for token removal: ${userId}`);
        });
    });
});
//# sourceMappingURL=authentication.test.js.map