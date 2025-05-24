/**
 * User Schema
 * 
 * Defines validation schemas for user-related data.
 */

import { z } from 'zod';
import { schemaRegistry } from '../registry';
import baseSchema from './base.schema';

/**
 * User ID schema
 */
export const userIdSchema = baseSchema.uuidString;

/**
 * User name schema
 */
export const userNameSchema = z.string()
  .min(2, { message: 'Name must be at least 2 characters long' })
  .max(50, { message: 'Name must be at most 50 characters long' })
  .trim();

/**
 * User email schema
 */
export const userEmailSchema = baseSchema.emailString;

/**
 * User password schema
 */
export const userPasswordSchema = z.string()
  .min(12, { message: 'Password must be at least 12 characters long' })
  .max(64, { message: 'Password must be at most 64 characters long' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' })
  // Ensure at least 3 character categories are used (uppercase, lowercase, numbers, special)
  .refine(
    (password) => {
      let categories = 0;
      if (/[A-Z]/.test(password)) categories++;
      if (/[a-z]/.test(password)) categories++;
      if (/[0-9]/.test(password)) categories++;
      if (/[^A-Za-z0-9]/.test(password)) categories++;
      return categories >= 3;
    },
    { message: 'Password must use at least 3 of: uppercase, lowercase, numbers, and special characters' }
  )
  // Prevent common password patterns
  .refine(
    (password) => {
      // Check for sequential characters
      const sequential = '01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < sequential.length - 3; i++) {
        const seq = sequential.substring(i, i + 4);
        if (password.includes(seq)) return false;
      }
      
      // Check for repeated characters
      for (let i = 0; i < password.length - 2; i++) {
        if (password[i] === password[i+1] && password[i] === password[i+2]) {
          return false;
        }
      }
      
      return true;
    },
    { message: 'Password cannot contain sequential or repeated character patterns' }
  )
  // Prevent common passwords
  .refine(
    (password) => {
      const commonPasswords = [
        'password', 'admin', '123456', 'qwerty', 'welcome',
        'letmein', 'monkey', 'abc123', 'football', 'iloveyou'
      ];
      return !commonPasswords.some(common =>
        password.toLowerCase().includes(common)
      );
    },
    { message: 'Password contains a common password pattern' }
  );

/**
 * Phone number schema
 */
export const phoneNumberSchema = baseSchema.phoneString;

/**
 * Gender schema
 */
export const genderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

/**
 * Location schema
 */
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional()
});

/**
 * Photo schema
 */
export const photoSchema = z.object({
  id: baseSchema.uuidString,
  url: baseSchema.urlString,
  isMain: z.boolean().default(false),
  processedFiles: z.array(z.object({
    url: baseSchema.urlString,
    height: baseSchema.positiveInteger,
    width: baseSchema.positiveInteger
  })).optional()
});

/**
 * User profile schema
 */
export const userProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  birthDate: baseSchema.dateString.optional(),
  gender: genderSchema.optional(),
  location: z.union([z.string().max(100), locationSchema]).optional(),
  interests: z.array(z.string()).max(20).optional(),
  photos: z.array(photoSchema).max(9).optional(),
  occupation: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  relationshipGoals: z.enum([
    'casual', 'relationship', 'marriage', 'not_sure'
  ]).optional(),
  height: z.number().int().min(120).max(250).optional(), // Height in cm
  drinking: z.enum(['never', 'rarely', 'socially', 'frequently']).optional(),
  smoking: z.enum(['never', 'socially', 'regularly']).optional(),
  children: z.enum(['have', 'dont_have', 'want_someday', 'dont_want']).optional(),
  zodiacSign: z.enum([
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ]).optional(),
  lastActive: baseSchema.dateTimeString.optional()
});

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
  ageRange: z.object({
    min: z.number().int().min(18).max(100),
    max: z.number().int().min(18).max(100)
  }).refine(data => data.min <= data.max, {
    message: "Minimum age must be less than or equal to maximum age",
    path: ["min"]
  }),
  distanceMax: z.number().int().positive().max(100), // Distance in miles/km
  genderPreference: z.array(genderSchema).min(1),
  hideProfile: z.boolean().default(false),
  showOnlyInAgeRange: z.boolean().default(true),
  autoplayVideos: z.boolean().default(true),
  notifications: z.object({
    matches: z.boolean().default(true),
    messages: z.boolean().default(true),
    likes: z.boolean().default(true)
  })
});

/**
 * User creation schema
 */
export const createUserSchema = z.object({
  name: userNameSchema,
  email: userEmailSchema,
  password: userPasswordSchema,
  phoneNumber: phoneNumberSchema.optional(),
  profile: userProfileSchema.optional(),
  preferences: userPreferencesSchema.optional()
});

/**
 * User update schema
 */
export const updateUserSchema = z.object({
  name: userNameSchema.optional(),
  email: userEmailSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  profile: userProfileSchema.optional(),
  preferences: userPreferencesSchema.optional()
});

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: userEmailSchema,
  password: z.string().min(1, { message: 'Password is required' })
});

/**
 * User authentication data schema
 */
export const userAuthDataSchema = z.object({
  userId: userIdSchema,
  email: userEmailSchema,
  phoneNumber: phoneNumberSchema.optional(),
  passwordHash: z.string(),
  passwordSalt: z.string(),
  lastLogin: baseSchema.dateTimeString.optional(),
  failedLoginAttempts: z.number().int().nonnegative().default(0),
  accountLocked: z.boolean().default(false),
  accountLockedUntil: baseSchema.dateTimeString.optional(),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  twoFactorMethod: z.enum(['sms', 'app', 'email']).optional()
});

/**
 * Register schemas with the registry
 */
export function registerUserSchemas() {
  schemaRegistry.register('user.id', userIdSchema, 'common', 'User ID schema');
  schemaRegistry.register('user.name', userNameSchema, 'common', 'User name schema');
  schemaRegistry.register('user.email', userEmailSchema, 'common', 'User email schema');
  schemaRegistry.register('user.password', userPasswordSchema, 'common', 'User password schema');
  schemaRegistry.register('user.phoneNumber', phoneNumberSchema, 'common', 'Phone number schema');
  schemaRegistry.register('user.gender', genderSchema, 'common', 'Gender schema');
  schemaRegistry.register('user.location', locationSchema, 'common', 'Location schema');
  schemaRegistry.register('user.photo', photoSchema, 'common', 'Photo schema');
  schemaRegistry.register('user.profile', userProfileSchema, 'common', 'User profile schema');
  schemaRegistry.register('user.preferences', userPreferencesSchema, 'common', 'User preferences schema');
  schemaRegistry.register('user.create', createUserSchema, 'api', 'Create user schema');
  schemaRegistry.register('user.update', updateUserSchema, 'api', 'Update user schema');
  schemaRegistry.register('user.login', userLoginSchema, 'api', 'User login schema');
  schemaRegistry.register('user.authData', userAuthDataSchema, 'common', 'User authentication data schema');
}

// Export schemas
export default {
  userIdSchema,
  userNameSchema,
  userEmailSchema,
  userPasswordSchema,
  phoneNumberSchema,
  genderSchema,
  locationSchema,
  photoSchema,
  userProfileSchema,
  userPreferencesSchema,
  createUserSchema,
  updateUserSchema,
  userLoginSchema,
  userAuthDataSchema,
  registerUserSchemas
};