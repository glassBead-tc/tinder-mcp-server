"use strict";
/**
 * Authentication Data Schemas
 *
 * Defines validation schemas for authentication-related data.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetSchema = exports.sessionSchema = exports.otpSchema = exports.twoFactorDataSchema = exports.twoFactorMethodSchema = exports.oauthTokenSchema = exports.oauthProviderSchema = exports.tokenDataSchema = void 0;
exports.registerAuthDataSchemas = registerAuthDataSchemas;
const zod_1 = require("zod");
const registry_1 = require("../registry");
const base_schema_1 = __importDefault(require("./base.schema"));
const user_schema_1 = __importDefault(require("./user.schema"));
/**
 * Token data schema
 */
exports.tokenDataSchema = zod_1.z.object({
    apiToken: zod_1.z.string().min(1),
    refreshToken: zod_1.z.string().min(1),
    expiresAt: zod_1.z.number().int().positive()
});
/**
 * OAuth provider schema
 */
exports.oauthProviderSchema = zod_1.z.enum([
    'facebook',
    'google',
    'apple'
]);
/**
 * OAuth token schema
 */
exports.oauthTokenSchema = zod_1.z.object({
    provider: exports.oauthProviderSchema,
    providerUserId: zod_1.z.string().min(1),
    accessToken: zod_1.z.string().min(1),
    refreshToken: zod_1.z.string().optional(),
    expiresAt: zod_1.z.number().int().optional(),
    scope: zod_1.z.string().optional(),
    tokenType: zod_1.z.string().optional()
});
/**
 * Two-factor authentication method schema
 */
exports.twoFactorMethodSchema = zod_1.z.enum([
    'sms',
    'app',
    'email'
]);
/**
 * Two-factor authentication data schema
 */
exports.twoFactorDataSchema = zod_1.z.object({
    userId: user_schema_1.default.userIdSchema,
    method: exports.twoFactorMethodSchema,
    secret: zod_1.z.string().optional(), // For TOTP apps
    verified: zod_1.z.boolean().default(false),
    backupCodes: zod_1.z.array(zod_1.z.string()).optional(),
    lastUsed: base_schema_1.default.dateTimeString.optional()
});
/**
 * OTP (One-Time Password) schema
 */
exports.otpSchema = zod_1.z.object({
    userId: user_schema_1.default.userIdSchema,
    phoneNumber: user_schema_1.default.phoneNumberSchema.optional(),
    email: user_schema_1.default.userEmailSchema.optional(),
    code: zod_1.z.string().length(6).regex(/^\d+$/, {
        message: 'OTP must contain only digits'
    }),
    purpose: zod_1.z.enum(['login', 'verification', 'password_reset']),
    expiresAt: zod_1.z.number().int().positive(),
    attempts: zod_1.z.number().int().nonnegative().default(0),
    maxAttempts: zod_1.z.number().int().positive().default(3),
    verified: zod_1.z.boolean().default(false)
});
/**
 * Session schema
 */
exports.sessionSchema = zod_1.z.object({
    sessionId: base_schema_1.default.uuidString,
    userId: user_schema_1.default.userIdSchema,
    deviceInfo: zod_1.z.object({
        userAgent: zod_1.z.string().optional(),
        ip: zod_1.z.string().optional(),
        deviceId: zod_1.z.string().optional(),
        deviceType: zod_1.z.enum(['mobile', 'tablet', 'desktop', 'other']).optional(),
        osName: zod_1.z.string().optional(),
        osVersion: zod_1.z.string().optional(),
        browserName: zod_1.z.string().optional(),
        browserVersion: zod_1.z.string().optional()
    }).optional(),
    createdAt: base_schema_1.default.dateTimeString,
    expiresAt: base_schema_1.default.dateTimeString,
    lastActiveAt: base_schema_1.default.dateTimeString,
    isActive: zod_1.z.boolean().default(true)
});
/**
 * Password reset schema
 */
exports.passwordResetSchema = zod_1.z.object({
    userId: user_schema_1.default.userIdSchema,
    token: zod_1.z.string().min(32),
    expiresAt: zod_1.z.number().int().positive(),
    used: zod_1.z.boolean().default(false),
    createdAt: base_schema_1.default.dateTimeString
});
/**
 * Register schemas with the registry
 */
function registerAuthDataSchemas() {
    registry_1.schemaRegistry.register('auth.tokenData', exports.tokenDataSchema, 'common', 'Token data schema');
    registry_1.schemaRegistry.register('auth.oauthProvider', exports.oauthProviderSchema, 'common', 'OAuth provider schema');
    registry_1.schemaRegistry.register('auth.oauthToken', exports.oauthTokenSchema, 'common', 'OAuth token schema');
    registry_1.schemaRegistry.register('auth.twoFactorMethod', exports.twoFactorMethodSchema, 'common', 'Two-factor authentication method schema');
    registry_1.schemaRegistry.register('auth.twoFactorData', exports.twoFactorDataSchema, 'common', 'Two-factor authentication data schema');
    registry_1.schemaRegistry.register('auth.otp', exports.otpSchema, 'common', 'OTP schema');
    registry_1.schemaRegistry.register('auth.session', exports.sessionSchema, 'common', 'Session schema');
    registry_1.schemaRegistry.register('auth.passwordReset', exports.passwordResetSchema, 'common', 'Password reset schema');
}
// Export schemas
exports.default = {
    tokenDataSchema: exports.tokenDataSchema,
    oauthProviderSchema: exports.oauthProviderSchema,
    oauthTokenSchema: exports.oauthTokenSchema,
    twoFactorMethodSchema: exports.twoFactorMethodSchema,
    twoFactorDataSchema: exports.twoFactorDataSchema,
    otpSchema: exports.otpSchema,
    sessionSchema: exports.sessionSchema,
    passwordResetSchema: exports.passwordResetSchema,
    registerAuthDataSchemas
};
//# sourceMappingURL=auth.schema.js.map