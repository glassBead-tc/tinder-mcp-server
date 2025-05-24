"use strict";
/**
 * User Schema
 *
 * Defines validation schemas for user-related data.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAuthDataSchema = exports.userLoginSchema = exports.updateUserSchema = exports.createUserSchema = exports.userPreferencesSchema = exports.userProfileSchema = exports.photoSchema = exports.locationSchema = exports.genderSchema = exports.phoneNumberSchema = exports.userPasswordSchema = exports.userEmailSchema = exports.userNameSchema = exports.userIdSchema = void 0;
exports.registerUserSchemas = registerUserSchemas;
const zod_1 = require("zod");
const registry_1 = require("../registry");
const base_schema_1 = __importDefault(require("./base.schema"));
/**
 * User ID schema
 */
exports.userIdSchema = base_schema_1.default.uuidString;
/**
 * User name schema
 */
exports.userNameSchema = zod_1.z.string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(50, { message: 'Name must be at most 50 characters long' })
    .trim();
/**
 * User email schema
 */
exports.userEmailSchema = base_schema_1.default.emailString;
/**
 * User password schema
 */
exports.userPasswordSchema = zod_1.z.string()
    .min(12, { message: 'Password must be at least 12 characters long' })
    .max(64, { message: 'Password must be at most 64 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' })
    // Ensure at least 3 character categories are used (uppercase, lowercase, numbers, special)
    .refine((password) => {
    let categories = 0;
    if (/[A-Z]/.test(password))
        categories++;
    if (/[a-z]/.test(password))
        categories++;
    if (/[0-9]/.test(password))
        categories++;
    if (/[^A-Za-z0-9]/.test(password))
        categories++;
    return categories >= 3;
}, { message: 'Password must use at least 3 of: uppercase, lowercase, numbers, and special characters' })
    // Prevent common password patterns
    .refine((password) => {
    // Check for sequential characters
    const sequential = '01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < sequential.length - 3; i++) {
        const seq = sequential.substring(i, i + 4);
        if (password.includes(seq))
            return false;
    }
    // Check for repeated characters
    for (let i = 0; i < password.length - 2; i++) {
        if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
            return false;
        }
    }
    return true;
}, { message: 'Password cannot contain sequential or repeated character patterns' })
    // Prevent common passwords
    .refine((password) => {
    const commonPasswords = [
        'password', 'admin', '123456', 'qwerty', 'welcome',
        'letmein', 'monkey', 'abc123', 'football', 'iloveyou'
    ];
    return !commonPasswords.some(common => password.toLowerCase().includes(common));
}, { message: 'Password contains a common password pattern' });
/**
 * Phone number schema
 */
exports.phoneNumberSchema = base_schema_1.default.phoneString;
/**
 * Gender schema
 */
exports.genderSchema = zod_1.z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
/**
 * Location schema
 */
exports.locationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    name: zod_1.z.string().max(100).optional(),
    city: zod_1.z.string().max(50).optional(),
    country: zod_1.z.string().max(50).optional(),
    postalCode: zod_1.z.string().max(20).optional()
});
/**
 * Photo schema
 */
exports.photoSchema = zod_1.z.object({
    id: base_schema_1.default.uuidString,
    url: base_schema_1.default.urlString,
    isMain: zod_1.z.boolean().default(false),
    processedFiles: zod_1.z.array(zod_1.z.object({
        url: base_schema_1.default.urlString,
        height: base_schema_1.default.positiveInteger,
        width: base_schema_1.default.positiveInteger
    })).optional()
});
/**
 * User profile schema
 */
exports.userProfileSchema = zod_1.z.object({
    bio: zod_1.z.string().max(500).optional(),
    birthDate: base_schema_1.default.dateString.optional(),
    gender: exports.genderSchema.optional(),
    location: zod_1.z.union([zod_1.z.string().max(100), exports.locationSchema]).optional(),
    interests: zod_1.z.array(zod_1.z.string()).max(20).optional(),
    photos: zod_1.z.array(exports.photoSchema).max(9).optional(),
    occupation: zod_1.z.string().max(100).optional(),
    education: zod_1.z.string().max(100).optional(),
    relationshipGoals: zod_1.z.enum([
        'casual', 'relationship', 'marriage', 'not_sure'
    ]).optional(),
    height: zod_1.z.number().int().min(120).max(250).optional(), // Height in cm
    drinking: zod_1.z.enum(['never', 'rarely', 'socially', 'frequently']).optional(),
    smoking: zod_1.z.enum(['never', 'socially', 'regularly']).optional(),
    children: zod_1.z.enum(['have', 'dont_have', 'want_someday', 'dont_want']).optional(),
    zodiacSign: zod_1.z.enum([
        'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
        'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ]).optional(),
    lastActive: base_schema_1.default.dateTimeString.optional()
});
/**
 * User preferences schema
 */
exports.userPreferencesSchema = zod_1.z.object({
    ageRange: zod_1.z.object({
        min: zod_1.z.number().int().min(18).max(100),
        max: zod_1.z.number().int().min(18).max(100)
    }).refine(data => data.min <= data.max, {
        message: "Minimum age must be less than or equal to maximum age",
        path: ["min"]
    }),
    distanceMax: zod_1.z.number().int().positive().max(100), // Distance in miles/km
    genderPreference: zod_1.z.array(exports.genderSchema).min(1),
    hideProfile: zod_1.z.boolean().default(false),
    showOnlyInAgeRange: zod_1.z.boolean().default(true),
    autoplayVideos: zod_1.z.boolean().default(true),
    notifications: zod_1.z.object({
        matches: zod_1.z.boolean().default(true),
        messages: zod_1.z.boolean().default(true),
        likes: zod_1.z.boolean().default(true)
    })
});
/**
 * User creation schema
 */
exports.createUserSchema = zod_1.z.object({
    name: exports.userNameSchema,
    email: exports.userEmailSchema,
    password: exports.userPasswordSchema,
    phoneNumber: exports.phoneNumberSchema.optional(),
    profile: exports.userProfileSchema.optional(),
    preferences: exports.userPreferencesSchema.optional()
});
/**
 * User update schema
 */
exports.updateUserSchema = zod_1.z.object({
    name: exports.userNameSchema.optional(),
    email: exports.userEmailSchema.optional(),
    phoneNumber: exports.phoneNumberSchema.optional(),
    profile: exports.userProfileSchema.optional(),
    preferences: exports.userPreferencesSchema.optional()
});
/**
 * User login schema
 */
exports.userLoginSchema = zod_1.z.object({
    email: exports.userEmailSchema,
    password: zod_1.z.string().min(1, { message: 'Password is required' })
});
/**
 * User authentication data schema
 */
exports.userAuthDataSchema = zod_1.z.object({
    userId: exports.userIdSchema,
    email: exports.userEmailSchema,
    phoneNumber: exports.phoneNumberSchema.optional(),
    passwordHash: zod_1.z.string(),
    passwordSalt: zod_1.z.string(),
    lastLogin: base_schema_1.default.dateTimeString.optional(),
    failedLoginAttempts: zod_1.z.number().int().nonnegative().default(0),
    accountLocked: zod_1.z.boolean().default(false),
    accountLockedUntil: base_schema_1.default.dateTimeString.optional(),
    emailVerified: zod_1.z.boolean().default(false),
    phoneVerified: zod_1.z.boolean().default(false),
    twoFactorEnabled: zod_1.z.boolean().default(false),
    twoFactorMethod: zod_1.z.enum(['sms', 'app', 'email']).optional()
});
/**
 * Register schemas with the registry
 */
function registerUserSchemas() {
    registry_1.schemaRegistry.register('user.id', exports.userIdSchema, 'common', 'User ID schema');
    registry_1.schemaRegistry.register('user.name', exports.userNameSchema, 'common', 'User name schema');
    registry_1.schemaRegistry.register('user.email', exports.userEmailSchema, 'common', 'User email schema');
    registry_1.schemaRegistry.register('user.password', exports.userPasswordSchema, 'common', 'User password schema');
    registry_1.schemaRegistry.register('user.phoneNumber', exports.phoneNumberSchema, 'common', 'Phone number schema');
    registry_1.schemaRegistry.register('user.gender', exports.genderSchema, 'common', 'Gender schema');
    registry_1.schemaRegistry.register('user.location', exports.locationSchema, 'common', 'Location schema');
    registry_1.schemaRegistry.register('user.photo', exports.photoSchema, 'common', 'Photo schema');
    registry_1.schemaRegistry.register('user.profile', exports.userProfileSchema, 'common', 'User profile schema');
    registry_1.schemaRegistry.register('user.preferences', exports.userPreferencesSchema, 'common', 'User preferences schema');
    registry_1.schemaRegistry.register('user.create', exports.createUserSchema, 'api', 'Create user schema');
    registry_1.schemaRegistry.register('user.update', exports.updateUserSchema, 'api', 'Update user schema');
    registry_1.schemaRegistry.register('user.login', exports.userLoginSchema, 'api', 'User login schema');
    registry_1.schemaRegistry.register('user.authData', exports.userAuthDataSchema, 'common', 'User authentication data schema');
}
// Export schemas
exports.default = {
    userIdSchema: exports.userIdSchema,
    userNameSchema: exports.userNameSchema,
    userEmailSchema: exports.userEmailSchema,
    userPasswordSchema: exports.userPasswordSchema,
    phoneNumberSchema: exports.phoneNumberSchema,
    genderSchema: exports.genderSchema,
    locationSchema: exports.locationSchema,
    photoSchema: exports.photoSchema,
    userProfileSchema: exports.userProfileSchema,
    userPreferencesSchema: exports.userPreferencesSchema,
    createUserSchema: exports.createUserSchema,
    updateUserSchema: exports.updateUserSchema,
    userLoginSchema: exports.userLoginSchema,
    userAuthDataSchema: exports.userAuthDataSchema,
    registerUserSchemas
};
//# sourceMappingURL=user.schema.js.map