"use strict";
/**
 * Authentication Service
 * Handles authentication with the Tinder API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const token_store_1 = __importDefault(require("../utils/token-store"));
const logger_1 = __importDefault(require("../utils/logger"));
const error_handler_1 = require("../utils/error-handler");
const types_1 = require("../types");
const validation_1 = __importDefault(require("../utils/validation"));
const auth_schema_1 = __importDefault(require("../schemas/api/auth.schema"));
const auth_schema_2 = __importDefault(require("../schemas/common/auth.schema"));
const user_schema_1 = __importDefault(require("../schemas/common/user.schema"));
/**
 * Authentication service class
 * Manages authentication flows with Tinder API
 */
class AuthenticationService {
    constructor() {
        this.baseUrl = config_1.default.TINDER_API.BASE_URL;
        this.httpClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config_1.default.TINDER_API.TIMEOUT,
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
    async authenticateWithSMS(phoneNumber, otpCode = null) {
        try {
            // Validate phone number
            const phoneNumberResult = user_schema_1.default.phoneNumberSchema.safeParse(phoneNumber);
            if (!phoneNumberResult.success) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid phone number: ${validation_1.default.formatZodError(phoneNumberResult.error)}`, { details: phoneNumberResult.error.format() }, 400);
            }
            if (!otpCode) {
                // Step 1: Request OTP
                // Validate request using schema
                const smsRequest = { phoneNumber, purpose: 'login' };
                const requestValidation = auth_schema_1.default.smsRequestSchema.safeParse(smsRequest);
                if (!requestValidation.success) {
                    throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid SMS request: ${validation_1.default.formatZodError(requestValidation.error)}`, { details: requestValidation.error.format() }, 400);
                }
                const response = await this.httpClient.post('/v2/auth/sms/send', {
                    phone_number: phoneNumber
                });
                logger_1.default.info(`OTP sent to phone number: ${phoneNumber}`);
                // Validate response using schema
                const smsResponse = {
                    status: 'success',
                    otpLength: response.data.otp_length,
                    expiresIn: response.data.expires_in || 300,
                    attemptsRemaining: response.data.attempts_remaining || 3
                };
                const responseValidation = auth_schema_1.default.smsResponseSchema.safeParse(smsResponse);
                if (!responseValidation.success) {
                    logger_1.default.warn(`SMS response validation failed: ${validation_1.default.formatZodError(responseValidation.error)}`);
                }
                return {
                    status: 'otp_sent',
                    otpLength: response.data.otp_length
                };
            }
            else {
                // Step 2: Validate OTP
                // Validate OTP code
                if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
                    throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'OTP must be 6 digits', null, 400);
                }
                // Validate request using schema
                const otpRequest = { phoneNumber, otp: otpCode, purpose: 'login' };
                const requestValidation = auth_schema_1.default.otpVerificationRequestSchema.safeParse(otpRequest);
                if (!requestValidation.success) {
                    throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid OTP verification request: ${validation_1.default.formatZodError(requestValidation.error)}`, { details: requestValidation.error.format() }, 400);
                }
                const validateResponse = await this.httpClient.post('/v2/auth/sms/validate', {
                    otp_code: otpCode,
                    phone_number: phoneNumber,
                    is_update: false
                });
                if (!validateResponse.data.refresh_token) {
                    throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Failed to validate OTP code', null, 401);
                }
                // Step 3: Login with refresh token
                const loginResponse = await this.httpClient.post('/v2/auth/login/sms', {
                    refresh_token: validateResponse.data.refresh_token
                });
                // Validate token data
                const tokenData = {
                    apiToken: loginResponse.data.api_token,
                    refreshToken: loginResponse.data.refresh_token,
                    expiresAt: token_store_1.default.calculateExpiryTime()
                };
                const tokenValidation = auth_schema_2.default.tokenDataSchema.safeParse(tokenData);
                if (!tokenValidation.success) {
                    throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, `Invalid token data: ${validation_1.default.formatZodError(tokenValidation.error)}`, { details: tokenValidation.error.format() }, 401);
                }
                // Store tokens securely
                const userId = loginResponse.data._id;
                token_store_1.default.storeToken(userId, tokenData);
                logger_1.default.info(`User authenticated via SMS: ${userId}`);
                return {
                    status: 'authenticated',
                    userId: userId,
                    isNewUser: loginResponse.data.is_new_user || false
                };
            }
        }
        catch (error) {
            logger_1.default.error(`SMS authentication error: ${error.message}`);
            if (error instanceof error_handler_1.ApiError) {
                throw error;
            }
            throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, `SMS authentication failed: ${error.message}`, error.response?.data, 401);
        }
    }
    /**
     * Authenticate with Facebook
     * @param facebookToken - Facebook access token
     * @returns Authentication result
     */
    async authenticateWithFacebook(facebookToken) {
        try {
            // Validate Facebook token
            if (!facebookToken || typeof facebookToken !== 'string') {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'Facebook token is required', null, 400);
            }
            // Validate request using schema
            const fbRequest = { accessToken: facebookToken };
            const requestValidation = auth_schema_1.default.facebookAuthRequestSchema.safeParse(fbRequest);
            if (!requestValidation.success) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid Facebook auth request: ${validation_1.default.formatZodError(requestValidation.error)}`, { details: requestValidation.error.format() }, 400);
            }
            const response = await this.httpClient.post('/v2/auth/login/facebook', {
                token: facebookToken
            });
            if (response.data.is_new_user) {
                logger_1.default.info('New user authenticated via Facebook');
                // Validate response for new user
                const fbResponse = {
                    status: 'onboarding_required',
                    onboardingToken: response.data.onboarding_token
                };
                const responseValidation = auth_schema_1.default.facebookAuthResponseSchema.safeParse(fbResponse);
                if (!responseValidation.success) {
                    logger_1.default.warn(`Facebook response validation failed: ${validation_1.default.formatZodError(responseValidation.error)}`);
                }
                return fbResponse;
            }
            else {
                // Validate token data
                const tokenData = {
                    apiToken: response.data.api_token,
                    refreshToken: response.data.refresh_token,
                    expiresAt: token_store_1.default.calculateExpiryTime()
                };
                const tokenValidation = auth_schema_2.default.tokenDataSchema.safeParse(tokenData);
                if (!tokenValidation.success) {
                    throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, `Invalid token data: ${validation_1.default.formatZodError(tokenValidation.error)}`, { details: tokenValidation.error.format() }, 401);
                }
                // Store tokens securely
                const userId = response.data._id;
                token_store_1.default.storeToken(userId, tokenData);
                logger_1.default.info(`User authenticated via Facebook: ${userId}`);
                // Validate response for existing user
                const fbResponse = {
                    status: 'authenticated',
                    userId: userId
                };
                const responseValidation = auth_schema_1.default.facebookAuthResponseSchema.safeParse(fbResponse);
                if (!responseValidation.success) {
                    logger_1.default.warn(`Facebook response validation failed: ${validation_1.default.formatZodError(responseValidation.error)}`);
                }
                return fbResponse;
            }
        }
        catch (error) {
            logger_1.default.error(`Facebook authentication error: ${error.message}`);
            if (error instanceof error_handler_1.ApiError) {
                throw error;
            }
            throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, `Facebook authentication failed: ${error.message}`, error.response?.data, 401);
        }
    }
    /**
     * Verify CAPTCHA
     * @param captchaInput - CAPTCHA response
     * @param vendor - CAPTCHA vendor (arkose|recaptcha)
     * @returns Verification result
     */
    async verifyCaptcha(captchaInput, vendor) {
        try {
            // Validate CAPTCHA input
            if (!captchaInput || typeof captchaInput !== 'string') {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'CAPTCHA input is required', null, 400);
            }
            // Validate vendor
            if (!vendor || !['arkose', 'recaptcha'].includes(vendor)) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'Invalid CAPTCHA vendor. Must be "arkose" or "recaptcha"', null, 400);
            }
            const response = await this.httpClient.post('/v2/auth/verify-captcha', {
                captcha_input: captchaInput,
                vendor: vendor
            });
            logger_1.default.info(`CAPTCHA verified successfully for vendor: ${vendor}`);
            return {
                status: 'verified',
                data: response.data
            };
        }
        catch (error) {
            logger_1.default.error(`CAPTCHA verification error: ${error.message}`);
            if (error instanceof error_handler_1.ApiError) {
                throw error;
            }
            throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, `CAPTCHA verification failed: ${error.message}`, error.response?.data, 401);
        }
    }
    /**
     * Refresh authentication token
     * @param userId - User ID
     * @returns New API token
     */
    async refreshToken(userId) {
        try {
            // Validate user ID
            const userIdResult = user_schema_1.default.userIdSchema.safeParse(userId);
            if (!userIdResult.success) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid user ID: ${validation_1.default.formatZodError(userIdResult.error)}`, { details: userIdResult.error.format() }, 400);
            }
            const tokenData = token_store_1.default.getToken(userId);
            if (!tokenData) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'No token found for user', null, 401);
            }
            // Validate request using schema
            const refreshRequest = { refreshToken: tokenData.refreshToken };
            const requestValidation = auth_schema_1.default.refreshTokenRequestSchema.safeParse(refreshRequest);
            if (!requestValidation.success) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid refresh token request: ${validation_1.default.formatZodError(requestValidation.error)}`, { details: requestValidation.error.format() }, 400);
            }
            const response = await this.httpClient.post('/v2/auth/login/sms', {
                refresh_token: tokenData.refreshToken
            });
            // Validate token data
            const newTokenData = {
                apiToken: response.data.api_token,
                refreshToken: response.data.refresh_token,
                expiresAt: token_store_1.default.calculateExpiryTime()
            };
            const tokenValidation = auth_schema_2.default.tokenDataSchema.safeParse(newTokenData);
            if (!tokenValidation.success) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, `Invalid token data: ${validation_1.default.formatZodError(tokenValidation.error)}`, { details: tokenValidation.error.format() }, 401);
            }
            // Update stored tokens
            token_store_1.default.storeToken(userId, newTokenData);
            logger_1.default.info(`Token refreshed for user: ${userId}`);
            return response.data.api_token;
        }
        catch (error) {
            logger_1.default.error(`Token refresh error for user ${userId}: ${error.message}`);
            token_store_1.default.removeToken(userId); // Remove invalid token
            if (error instanceof error_handler_1.ApiError) {
                throw error;
            }
            throw new error_handler_1.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, `Token refresh failed: ${error.message}`, error.response?.data, 401);
        }
    }
    /**
     * Get valid token for a user
     * @param userId - User ID
     * @returns Valid API token
     */
    async getValidToken(userId) {
        // Validate user ID
        const userIdResult = user_schema_1.default.userIdSchema.safeParse(userId);
        if (!userIdResult.success) {
            throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid user ID: ${validation_1.default.formatZodError(userIdResult.error)}`, { details: userIdResult.error.format() }, 400);
        }
        const tokenData = token_store_1.default.getToken(userId);
        if (!tokenData || token_store_1.default.isTokenExpired(userId)) {
            return await this.refreshToken(userId);
        }
        return tokenData.apiToken;
    }
    /**
     * Remove token for a user
     * @param userId - User ID
     * @returns Success status
     */
    removeToken(userId) {
        // Validate user ID
        const userIdResult = user_schema_1.default.userIdSchema.safeParse(userId);
        if (!userIdResult.success) {
            logger_1.default.warn(`Invalid user ID for token removal: ${userId}`);
            return false;
        }
        return token_store_1.default.removeToken(userId);
    }
}
// Export singleton instance
exports.default = new AuthenticationService();
//# sourceMappingURL=authentication.js.map