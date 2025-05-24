/**
 * Authentication Data Schemas
 * 
 * Defines validation schemas for authentication-related data.
 */

import { z } from 'zod';
import { schemaRegistry } from '../registry';
import baseSchema from './base.schema';
import userSchema from './user.schema';

/**
 * Token data schema
 */
export const tokenDataSchema = z.object({
  apiToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive()
});

/**
 * OAuth provider schema
 */
export const oauthProviderSchema = z.enum([
  'facebook', 
  'google', 
  'apple'
]);

/**
 * OAuth token schema
 */
export const oauthTokenSchema = z.object({
  provider: oauthProviderSchema,
  providerUserId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.number().int().optional(),
  scope: z.string().optional(),
  tokenType: z.string().optional()
});

/**
 * Two-factor authentication method schema
 */
export const twoFactorMethodSchema = z.enum([
  'sms',
  'app',
  'email'
]);

/**
 * Two-factor authentication data schema
 */
export const twoFactorDataSchema = z.object({
  userId: userSchema.userIdSchema,
  method: twoFactorMethodSchema,
  secret: z.string().optional(), // For TOTP apps
  verified: z.boolean().default(false),
  backupCodes: z.array(z.string()).optional(),
  lastUsed: baseSchema.dateTimeString.optional()
});

/**
 * OTP (One-Time Password) schema
 */
export const otpSchema = z.object({
  userId: userSchema.userIdSchema,
  phoneNumber: userSchema.phoneNumberSchema.optional(),
  email: userSchema.userEmailSchema.optional(),
  code: z.string().length(6).regex(/^\d+$/, {
    message: 'OTP must contain only digits'
  }),
  purpose: z.enum(['login', 'verification', 'password_reset']),
  expiresAt: z.number().int().positive(),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(3),
  verified: z.boolean().default(false)
});

/**
 * Session schema
 */
export const sessionSchema = z.object({
  sessionId: baseSchema.uuidString,
  userId: userSchema.userIdSchema,
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    deviceId: z.string().optional(),
    deviceType: z.enum(['mobile', 'tablet', 'desktop', 'other']).optional(),
    osName: z.string().optional(),
    osVersion: z.string().optional(),
    browserName: z.string().optional(),
    browserVersion: z.string().optional()
  }).optional(),
  createdAt: baseSchema.dateTimeString,
  expiresAt: baseSchema.dateTimeString,
  lastActiveAt: baseSchema.dateTimeString,
  isActive: z.boolean().default(true)
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  userId: userSchema.userIdSchema,
  token: z.string().min(32),
  expiresAt: z.number().int().positive(),
  used: z.boolean().default(false),
  createdAt: baseSchema.dateTimeString
});

/**
 * Register schemas with the registry
 */
export function registerAuthDataSchemas() {
  schemaRegistry.register('auth.tokenData', tokenDataSchema, 'common', 'Token data schema');
  schemaRegistry.register('auth.oauthProvider', oauthProviderSchema, 'common', 'OAuth provider schema');
  schemaRegistry.register('auth.oauthToken', oauthTokenSchema, 'common', 'OAuth token schema');
  schemaRegistry.register('auth.twoFactorMethod', twoFactorMethodSchema, 'common', 'Two-factor authentication method schema');
  schemaRegistry.register('auth.twoFactorData', twoFactorDataSchema, 'common', 'Two-factor authentication data schema');
  schemaRegistry.register('auth.otp', otpSchema, 'common', 'OTP schema');
  schemaRegistry.register('auth.session', sessionSchema, 'common', 'Session schema');
  schemaRegistry.register('auth.passwordReset', passwordResetSchema, 'common', 'Password reset schema');
}

// Export schemas
export default {
  tokenDataSchema,
  oauthProviderSchema,
  oauthTokenSchema,
  twoFactorMethodSchema,
  twoFactorDataSchema,
  otpSchema,
  sessionSchema,
  passwordResetSchema,
  registerAuthDataSchemas
};