/**
 * Authentication Service
 * Handles authentication with the Tinder API
 */
import { SmsAuthResult, FacebookAuthResult, CaptchaVerificationResult } from '../types';
/**
 * Authentication service class
 * Manages authentication flows with Tinder API
 */
declare class AuthenticationService {
    private baseUrl;
    private httpClient;
    constructor();
    /**
     * Authenticate with SMS
     * @param phoneNumber - User's phone number
     * @param otpCode - OTP code (if available)
     * @returns Authentication result
     */
    authenticateWithSMS(phoneNumber: string, otpCode?: string | null): Promise<SmsAuthResult>;
    /**
     * Authenticate with Facebook
     * @param facebookToken - Facebook access token
     * @returns Authentication result
     */
    authenticateWithFacebook(facebookToken: string): Promise<FacebookAuthResult>;
    /**
     * Verify CAPTCHA
     * @param captchaInput - CAPTCHA response
     * @param vendor - CAPTCHA vendor (arkose|recaptcha)
     * @returns Verification result
     */
    verifyCaptcha(captchaInput: string, vendor: string): Promise<CaptchaVerificationResult>;
    /**
     * Refresh authentication token
     * @param userId - User ID
     * @returns New API token
     */
    refreshToken(userId: string): Promise<string>;
    /**
     * Get valid token for a user
     * @param userId - User ID
     * @returns Valid API token
     */
    getValidToken(userId: string): Promise<string>;
    /**
     * Remove token for a user
     * @param userId - User ID
     * @returns Success status
     */
    removeToken(userId: string): boolean;
}
declare const _default: AuthenticationService;
export default _default;
