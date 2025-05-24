/**
 * Authentication Schema
 * 
 * Defines validation schemas for authentication-related API endpoints.
 */

import { z } from 'zod';
import { schemaRegistry } from '../registry';
import { userEmailSchema, userPasswordSchema, phoneNumberSchema, userIdSchema } from '../common/user.schema';
import baseSchema from '../common/base.schema';
import authDataSchema from '../common/auth.schema';

/**
 * Login request schema
 */
export const loginRequestSchema = z.object({
  email: userEmailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional().default(false),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceType: z.enum(['mobile', 'tablet', 'desktop', 'other']).optional(),
    osName: z.string().optional(),
    osVersion: z.string().optional(),
    browserName: z.string().optional(),
    browserVersion: z.string().optional()
  }).optional()
});

/**
 * Login response schema
 */
export const loginResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  user: z.object({
    id: userIdSchema,
    email: userEmailSchema,
    name: z.string(),
    phoneNumber: phoneNumberSchema.optional(),
    profileComplete: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional()
  }),
  sessionId: baseSchema.uuidString.optional()
});

/**
 * Refresh token request schema
 */
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceType: z.enum(['mobile', 'tablet', 'desktop', 'other']).optional()
  }).optional()
});

/**
 * Refresh token response schema
 */
export const refreshTokenResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number()
});

/**
 * SMS request schema
 */
export const smsRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  purpose: z.enum(['login', 'verification', 'password_reset']).default('login')
});

/**
 * SMS response schema
 */
export const smsResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  otpLength: z.number().int().positive(),
  expiresIn: z.number().int().positive(), // seconds
  attemptsRemaining: z.number().int().nonnegative().optional()
});

/**
 * OTP verification request schema
 */
export const otpVerificationRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, {
    message: 'OTP must contain only digits'
  }),
  purpose: z.enum(['login', 'verification', 'password_reset']).default('login')
});

/**
 * OTP verification response schema
 */
export const otpVerificationResponseSchema = z.object({
  status: z.enum(['verified', 'invalid', 'expired']),
  token: z.string().optional(), // Only provided if verified
  userId: userIdSchema.optional(),
  isNewUser: z.boolean().optional()
});

/**
 * Facebook auth request schema
 */
export const facebookAuthRequestSchema = z.object({
  accessToken: z.string().min(1, { message: 'Facebook access token is required' }),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceType: z.enum(['mobile', 'tablet', 'desktop', 'other']).optional()
  }).optional()
});

/**
 * Facebook auth response schema
 */
export const facebookAuthResponseSchema = z.object({
  status: z.enum(['authenticated', 'onboarding_required']),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  onboardingToken: z.string().optional(),
  userId: userIdSchema.optional(),
  isNewUser: z.boolean().optional()
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: userEmailSchema
});

/**
 * Password reset response schema
 */
export const passwordResetResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string()
});

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: userPasswordSchema,
  confirmPassword: z.string().min(1, { message: 'Confirm password is required' })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Password reset confirmation response schema
 */
export const passwordResetConfirmResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string()
});

/**
 * Logout request schema
 */
export const logoutRequestSchema = z.object({
  sessionId: baseSchema.uuidString.optional(),
  allSessions: z.boolean().optional().default(false)
});

/**
 * Logout response schema
 */
export const logoutResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string()
});

/**
 * Two-factor setup request schema
 */
export const twoFactorSetupRequestSchema = z.object({
  method: authDataSchema.twoFactorMethodSchema,
  phoneNumber: phoneNumberSchema.optional(), // Required for SMS
  email: userEmailSchema.optional() // Required for email
});

/**
 * Two-factor setup response schema
 */
export const twoFactorSetupResponseSchema = z.object({
  status: z.enum(['setup_initiated', 'error']),
  secret: z.string().optional(), // For TOTP apps
  qrCodeUrl: z.string().optional(), // For TOTP apps
  backupCodes: z.array(z.string()).optional(),
  message: z.string()
});

/**
 * Two-factor verification request schema
 */
export const twoFactorVerificationRequestSchema = z.object({
  userId: userIdSchema,
  method: authDataSchema.twoFactorMethodSchema,
  code: z.string().min(1, { message: 'Verification code is required' })
});

/**
 * Two-factor verification response schema
 */
export const twoFactorVerificationResponseSchema = z.object({
  status: z.enum(['verified', 'invalid', 'expired']),
  token: z.string().optional(), // Only provided if verified
  message: z.string()
});

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  status: z.literal('error'),
  code: z.number().int(),
  message: z.string(),
  details: z.any().optional()
});

/**
 * Register schemas with the registry
 */
export function registerAuthSchemas() {
  // Request schemas
  schemaRegistry.register('auth.login.request', loginRequestSchema, 'api', 'Login request schema');
  schemaRegistry.register('auth.refreshToken.request', refreshTokenRequestSchema, 'api', 'Refresh token request schema');
  schemaRegistry.register('auth.sms.request', smsRequestSchema, 'api', 'SMS request schema');
  schemaRegistry.register('auth.otpVerification.request', otpVerificationRequestSchema, 'api', 'OTP verification request schema');
  schemaRegistry.register('auth.facebook.request', facebookAuthRequestSchema, 'api', 'Facebook auth request schema');
  schemaRegistry.register('auth.passwordReset.request', passwordResetRequestSchema, 'api', 'Password reset request schema');
  schemaRegistry.register('auth.passwordReset.confirm', passwordResetConfirmSchema, 'api', 'Password reset confirmation schema');
  schemaRegistry.register('auth.logout.request', logoutRequestSchema, 'api', 'Logout request schema');
  schemaRegistry.register('auth.twoFactorSetup.request', twoFactorSetupRequestSchema, 'api', 'Two-factor setup request schema');
  schemaRegistry.register('auth.twoFactorVerification.request', twoFactorVerificationRequestSchema, 'api', 'Two-factor verification request schema');
  
  // Response schemas
  schemaRegistry.register('auth.login.response', loginResponseSchema, 'api', 'Login response schema');
  schemaRegistry.register('auth.refreshToken.response', refreshTokenResponseSchema, 'api', 'Refresh token response schema');
  schemaRegistry.register('auth.sms.response', smsResponseSchema, 'api', 'SMS response schema');
  schemaRegistry.register('auth.otpVerification.response', otpVerificationResponseSchema, 'api', 'OTP verification response schema');
  schemaRegistry.register('auth.facebook.response', facebookAuthResponseSchema, 'api', 'Facebook auth response schema');
  schemaRegistry.register('auth.passwordReset.response', passwordResetResponseSchema, 'api', 'Password reset response schema');
  schemaRegistry.register('auth.passwordReset.confirm.response', passwordResetConfirmResponseSchema, 'api', 'Password reset confirmation response schema');
  schemaRegistry.register('auth.logout.response', logoutResponseSchema, 'api', 'Logout response schema');
  schemaRegistry.register('auth.twoFactorSetup.response', twoFactorSetupResponseSchema, 'api', 'Two-factor setup response schema');
  schemaRegistry.register('auth.twoFactorVerification.response', twoFactorVerificationResponseSchema, 'api', 'Two-factor verification response schema');
  schemaRegistry.register('auth.error.response', errorResponseSchema, 'api', 'Error response schema');
}

// Export schemas
export default {
  // Request schemas
  loginRequestSchema,
  refreshTokenRequestSchema,
  smsRequestSchema,
  otpVerificationRequestSchema,
  facebookAuthRequestSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  logoutRequestSchema,
  twoFactorSetupRequestSchema,
  twoFactorVerificationRequestSchema,
  
  // Response schemas
  loginResponseSchema,
  refreshTokenResponseSchema,
  smsResponseSchema,
  otpVerificationResponseSchema,
  facebookAuthResponseSchema,
  passwordResetResponseSchema,
  passwordResetConfirmResponseSchema,
  logoutResponseSchema,
  twoFactorSetupResponseSchema,
  twoFactorVerificationResponseSchema,
  errorResponseSchema,
  
  // Register function
  registerAuthSchemas
};