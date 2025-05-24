"use strict";
/**
 * Authentication Schema
 *
 * Defines validation schemas for authentication-related API endpoints.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponseSchema = exports.twoFactorVerificationResponseSchema = exports.twoFactorVerificationRequestSchema = exports.twoFactorSetupResponseSchema = exports.twoFactorSetupRequestSchema = exports.logoutResponseSchema = exports.logoutRequestSchema = exports.passwordResetConfirmResponseSchema = exports.passwordResetConfirmSchema = exports.passwordResetResponseSchema = exports.passwordResetRequestSchema = exports.facebookAuthResponseSchema = exports.facebookAuthRequestSchema = exports.otpVerificationResponseSchema = exports.otpVerificationRequestSchema = exports.smsResponseSchema = exports.smsRequestSchema = exports.refreshTokenResponseSchema = exports.refreshTokenRequestSchema = exports.loginResponseSchema = exports.loginRequestSchema = void 0;
exports.registerAuthSchemas = registerAuthSchemas;
const zod_1 = require("zod");
const registry_1 = require("../registry");
const user_schema_1 = require("../common/user.schema");
const base_schema_1 = __importDefault(require("../common/base.schema"));
const auth_schema_1 = __importDefault(require("../common/auth.schema"));
/**
 * Login request schema
 */
exports.loginRequestSchema = zod_1.z.object({
    email: user_schema_1.userEmailSchema,
    password: zod_1.z.string().min(1, { message: 'Password is required' }),
    rememberMe: zod_1.z.boolean().optional().default(false),
    deviceInfo: zod_1.z.object({
        deviceId: zod_1.z.string().optional(),
        deviceType: zod_1.z.enum(['mobile', 'tablet', 'desktop', 'other']).optional(),
        osName: zod_1.z.string().optional(),
        osVersion: zod_1.z.string().optional(),
        browserName: zod_1.z.string().optional(),
        browserVersion: zod_1.z.string().optional()
    }).optional()
});
/**
 * Login response schema
 */
exports.loginResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    expiresAt: zod_1.z.number(),
    user: zod_1.z.object({
        id: user_schema_1.userIdSchema,
        email: user_schema_1.userEmailSchema,
        name: zod_1.z.string(),
        phoneNumber: user_schema_1.phoneNumberSchema.optional(),
        profileComplete: zod_1.z.boolean().optional(),
        emailVerified: zod_1.z.boolean().optional(),
        phoneVerified: zod_1.z.boolean().optional(),
        twoFactorEnabled: zod_1.z.boolean().optional()
    }),
    sessionId: base_schema_1.default.uuidString.optional()
});
/**
 * Refresh token request schema
 */
exports.refreshTokenRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, { message: 'Refresh token is required' }),
    deviceInfo: zod_1.z.object({
        deviceId: zod_1.z.string().optional(),
        deviceType: zod_1.z.enum(['mobile', 'tablet', 'desktop', 'other']).optional()
    }).optional()
});
/**
 * Refresh token response schema
 */
exports.refreshTokenResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    expiresAt: zod_1.z.number()
});
/**
 * SMS request schema
 */
exports.smsRequestSchema = zod_1.z.object({
    phoneNumber: user_schema_1.phoneNumberSchema,
    purpose: zod_1.z.enum(['login', 'verification', 'password_reset']).default('login')
});
/**
 * SMS response schema
 */
exports.smsResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['success', 'error']),
    otpLength: zod_1.z.number().int().positive(),
    expiresIn: zod_1.z.number().int().positive(), // seconds
    attemptsRemaining: zod_1.z.number().int().nonnegative().optional()
});
/**
 * OTP verification request schema
 */
exports.otpVerificationRequestSchema = zod_1.z.object({
    phoneNumber: user_schema_1.phoneNumberSchema,
    otp: zod_1.z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, {
        message: 'OTP must contain only digits'
    }),
    purpose: zod_1.z.enum(['login', 'verification', 'password_reset']).default('login')
});
/**
 * OTP verification response schema
 */
exports.otpVerificationResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['verified', 'invalid', 'expired']),
    token: zod_1.z.string().optional(), // Only provided if verified
    userId: user_schema_1.userIdSchema.optional(),
    isNewUser: zod_1.z.boolean().optional()
});
/**
 * Facebook auth request schema
 */
exports.facebookAuthRequestSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, { message: 'Facebook access token is required' }),
    deviceInfo: zod_1.z.object({
        deviceId: zod_1.z.string().optional(),
        deviceType: zod_1.z.enum(['mobile', 'tablet', 'desktop', 'other']).optional()
    }).optional()
});
/**
 * Facebook auth response schema
 */
exports.facebookAuthResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['authenticated', 'onboarding_required']),
    token: zod_1.z.string().optional(),
    refreshToken: zod_1.z.string().optional(),
    expiresAt: zod_1.z.number().optional(),
    onboardingToken: zod_1.z.string().optional(),
    userId: user_schema_1.userIdSchema.optional(),
    isNewUser: zod_1.z.boolean().optional()
});
/**
 * Password reset request schema
 */
exports.passwordResetRequestSchema = zod_1.z.object({
    email: user_schema_1.userEmailSchema
});
/**
 * Password reset response schema
 */
exports.passwordResetResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['success', 'error']),
    message: zod_1.z.string()
});
/**
 * Password reset confirmation schema
 */
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, { message: 'Reset token is required' }),
    password: user_schema_1.userPasswordSchema,
    confirmPassword: zod_1.z.string().min(1, { message: 'Confirm password is required' })
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
});
/**
 * Password reset confirmation response schema
 */
exports.passwordResetConfirmResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['success', 'error']),
    message: zod_1.z.string()
});
/**
 * Logout request schema
 */
exports.logoutRequestSchema = zod_1.z.object({
    sessionId: base_schema_1.default.uuidString.optional(),
    allSessions: zod_1.z.boolean().optional().default(false)
});
/**
 * Logout response schema
 */
exports.logoutResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['success', 'error']),
    message: zod_1.z.string()
});
/**
 * Two-factor setup request schema
 */
exports.twoFactorSetupRequestSchema = zod_1.z.object({
    method: auth_schema_1.default.twoFactorMethodSchema,
    phoneNumber: user_schema_1.phoneNumberSchema.optional(), // Required for SMS
    email: user_schema_1.userEmailSchema.optional() // Required for email
});
/**
 * Two-factor setup response schema
 */
exports.twoFactorSetupResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['setup_initiated', 'error']),
    secret: zod_1.z.string().optional(), // For TOTP apps
    qrCodeUrl: zod_1.z.string().optional(), // For TOTP apps
    backupCodes: zod_1.z.array(zod_1.z.string()).optional(),
    message: zod_1.z.string()
});
/**
 * Two-factor verification request schema
 */
exports.twoFactorVerificationRequestSchema = zod_1.z.object({
    userId: user_schema_1.userIdSchema,
    method: auth_schema_1.default.twoFactorMethodSchema,
    code: zod_1.z.string().min(1, { message: 'Verification code is required' })
});
/**
 * Two-factor verification response schema
 */
exports.twoFactorVerificationResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['verified', 'invalid', 'expired']),
    token: zod_1.z.string().optional(), // Only provided if verified
    message: zod_1.z.string()
});
/**
 * Error response schema
 */
exports.errorResponseSchema = zod_1.z.object({
    status: zod_1.z.literal('error'),
    code: zod_1.z.number().int(),
    message: zod_1.z.string(),
    details: zod_1.z.any().optional()
});
/**
 * Register schemas with the registry
 */
function registerAuthSchemas() {
    // Request schemas
    registry_1.schemaRegistry.register('auth.login.request', exports.loginRequestSchema, 'api', 'Login request schema');
    registry_1.schemaRegistry.register('auth.refreshToken.request', exports.refreshTokenRequestSchema, 'api', 'Refresh token request schema');
    registry_1.schemaRegistry.register('auth.sms.request', exports.smsRequestSchema, 'api', 'SMS request schema');
    registry_1.schemaRegistry.register('auth.otpVerification.request', exports.otpVerificationRequestSchema, 'api', 'OTP verification request schema');
    registry_1.schemaRegistry.register('auth.facebook.request', exports.facebookAuthRequestSchema, 'api', 'Facebook auth request schema');
    registry_1.schemaRegistry.register('auth.passwordReset.request', exports.passwordResetRequestSchema, 'api', 'Password reset request schema');
    registry_1.schemaRegistry.register('auth.passwordReset.confirm', exports.passwordResetConfirmSchema, 'api', 'Password reset confirmation schema');
    registry_1.schemaRegistry.register('auth.logout.request', exports.logoutRequestSchema, 'api', 'Logout request schema');
    registry_1.schemaRegistry.register('auth.twoFactorSetup.request', exports.twoFactorSetupRequestSchema, 'api', 'Two-factor setup request schema');
    registry_1.schemaRegistry.register('auth.twoFactorVerification.request', exports.twoFactorVerificationRequestSchema, 'api', 'Two-factor verification request schema');
    // Response schemas
    registry_1.schemaRegistry.register('auth.login.response', exports.loginResponseSchema, 'api', 'Login response schema');
    registry_1.schemaRegistry.register('auth.refreshToken.response', exports.refreshTokenResponseSchema, 'api', 'Refresh token response schema');
    registry_1.schemaRegistry.register('auth.sms.response', exports.smsResponseSchema, 'api', 'SMS response schema');
    registry_1.schemaRegistry.register('auth.otpVerification.response', exports.otpVerificationResponseSchema, 'api', 'OTP verification response schema');
    registry_1.schemaRegistry.register('auth.facebook.response', exports.facebookAuthResponseSchema, 'api', 'Facebook auth response schema');
    registry_1.schemaRegistry.register('auth.passwordReset.response', exports.passwordResetResponseSchema, 'api', 'Password reset response schema');
    registry_1.schemaRegistry.register('auth.passwordReset.confirm.response', exports.passwordResetConfirmResponseSchema, 'api', 'Password reset confirmation response schema');
    registry_1.schemaRegistry.register('auth.logout.response', exports.logoutResponseSchema, 'api', 'Logout response schema');
    registry_1.schemaRegistry.register('auth.twoFactorSetup.response', exports.twoFactorSetupResponseSchema, 'api', 'Two-factor setup response schema');
    registry_1.schemaRegistry.register('auth.twoFactorVerification.response', exports.twoFactorVerificationResponseSchema, 'api', 'Two-factor verification response schema');
    registry_1.schemaRegistry.register('auth.error.response', exports.errorResponseSchema, 'api', 'Error response schema');
}
// Export schemas
exports.default = {
    // Request schemas
    loginRequestSchema: exports.loginRequestSchema,
    refreshTokenRequestSchema: exports.refreshTokenRequestSchema,
    smsRequestSchema: exports.smsRequestSchema,
    otpVerificationRequestSchema: exports.otpVerificationRequestSchema,
    facebookAuthRequestSchema: exports.facebookAuthRequestSchema,
    passwordResetRequestSchema: exports.passwordResetRequestSchema,
    passwordResetConfirmSchema: exports.passwordResetConfirmSchema,
    logoutRequestSchema: exports.logoutRequestSchema,
    twoFactorSetupRequestSchema: exports.twoFactorSetupRequestSchema,
    twoFactorVerificationRequestSchema: exports.twoFactorVerificationRequestSchema,
    // Response schemas
    loginResponseSchema: exports.loginResponseSchema,
    refreshTokenResponseSchema: exports.refreshTokenResponseSchema,
    smsResponseSchema: exports.smsResponseSchema,
    otpVerificationResponseSchema: exports.otpVerificationResponseSchema,
    facebookAuthResponseSchema: exports.facebookAuthResponseSchema,
    passwordResetResponseSchema: exports.passwordResetResponseSchema,
    passwordResetConfirmResponseSchema: exports.passwordResetConfirmResponseSchema,
    logoutResponseSchema: exports.logoutResponseSchema,
    twoFactorSetupResponseSchema: exports.twoFactorSetupResponseSchema,
    twoFactorVerificationResponseSchema: exports.twoFactorVerificationResponseSchema,
    errorResponseSchema: exports.errorResponseSchema,
    // Register function
    registerAuthSchemas
};
//# sourceMappingURL=auth.schema.js.map