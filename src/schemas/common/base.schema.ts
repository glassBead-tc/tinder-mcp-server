/**
 * Base Schemas
 * 
 * Defines base validation schemas for primitive types with custom validations.
 * These schemas can be reused across the application.
 */

import { z } from 'zod';
import { schemaRegistry } from '../registry';

/**
 * String schemas
 */
export const nonEmptyString = z.string().min(1, { message: 'Value cannot be empty' });

export const trimmedString = z.string().trim()
  .transform(val => val.trim());

export const emailString = z.string()
  .email({ message: 'Invalid email address format' })
  .trim()
  .toLowerCase();

export const urlString = z.string()
  .url({ message: 'Invalid URL format' })
  .trim();

export const uuidString = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID format' }
);

export const phoneString = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +12125551234)'
  });

/**
 * Number schemas
 */
export const positiveNumber = z.number().positive({ message: 'Value must be positive' });

export const nonNegativeNumber = z.number().nonnegative({ message: 'Value cannot be negative' });

export const integerNumber = z.number().int({ message: 'Value must be an integer' });

export const positiveInteger = z.number().int().positive();

export const nonNegativeInteger = z.number().int().nonnegative();

export const percentageNumber = z.number()
  .min(0, { message: 'Percentage cannot be less than 0' })
  .max(100, { message: 'Percentage cannot be greater than 100' });

/**
 * Date schemas
 */
export const dateString = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' });

export const dateTimeString = z.string()
  .datetime({ message: 'Invalid ISO date-time format' });

export const pastDate = z.date()
  .refine((date) => date < new Date(), { message: 'Date must be in the past' });

export const futureDate = z.date()
  .refine((date) => date > new Date(), { message: 'Date must be in the future' });

/**
 * Boolean schemas
 */
export const booleanSchema = z.boolean();

export const stringToBoolean = z.union([
  z.boolean(),
  z.string().transform((val) => {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
    throw new Error('Invalid boolean string');
  })
]);

/**
 * Array schemas
 */
/**
 * Default size limits for security
 */
export const DEFAULT_LIMITS = {
  MAX_ARRAY_LENGTH: 1000,
  MAX_STRING_LENGTH: 100000, // 100KB
  MAX_OBJECT_KEYS: 1000,
  MAX_NESTING_DEPTH: 10
};

/**
 * Array schemas with size limits for security
 */
export const nonEmptyArray = <T extends z.ZodTypeAny>(schema: T, maxLength = DEFAULT_LIMITS.MAX_ARRAY_LENGTH) =>
  z.array(schema)
    .min(1, { message: 'Array cannot be empty' })
    .max(maxLength, { message: `Array cannot contain more than ${maxLength} items` });

export const uniqueArray = <T extends z.ZodTypeAny>(schema: T, maxLength = DEFAULT_LIMITS.MAX_ARRAY_LENGTH) =>
  z.array(schema)
    .max(maxLength, { message: `Array cannot contain more than ${maxLength} items` })
    .refine(
      (items) => new Set(items).size === items.length,
      { message: 'Array must contain unique items' }
    );

/**
 * Bounded array with explicit size limits
 */
export const boundedArray = <T extends z.ZodTypeAny>(
  schema: T,
  minLength = 0,
  maxLength = DEFAULT_LIMITS.MAX_ARRAY_LENGTH
) =>
  z.array(schema)
    .min(minLength, { message: `Array must contain at least ${minLength} items` })
    .max(maxLength, { message: `Array cannot contain more than ${maxLength} items` });

/**
 * String schemas with size limits for security
 */
export const boundedString = (
  minLength = 0,
  maxLength = DEFAULT_LIMITS.MAX_STRING_LENGTH
) =>
  z.string()
    .min(minLength, { message: `String must be at least ${minLength} characters long` })
    .max(maxLength, { message: `String cannot be longer than ${maxLength} characters` });

/**
 * Object schema with key limits for security
 */
export const limitedObject = <T extends z.ZodRawShape>(
  shape: T,
  maxKeys = DEFAULT_LIMITS.MAX_OBJECT_KEYS
) =>
  z.object(shape).refine(
    (obj) => Object.keys(obj).length <= maxKeys,
    { message: `Object cannot have more than ${maxKeys} properties` }
  );

/**
 * Register schemas with the registry
 */
export function registerBaseSchemas() {
  schemaRegistry.register('base.string.nonEmpty', nonEmptyString, 'common', 'Non-empty string schema');
  schemaRegistry.register('base.string.trimmed', trimmedString, 'common', 'Trimmed string schema');
  schemaRegistry.register('base.string.email', emailString, 'common', 'Email string schema');
  schemaRegistry.register('base.string.url', urlString, 'common', 'URL string schema');
  schemaRegistry.register('base.string.uuid', uuidString, 'common', 'UUID string schema');
  schemaRegistry.register('base.string.phone', phoneString, 'common', 'Phone string schema');
  
  schemaRegistry.register('base.number.positive', positiveNumber, 'common', 'Positive number schema');
  schemaRegistry.register('base.number.nonNegative', nonNegativeNumber, 'common', 'Non-negative number schema');
  schemaRegistry.register('base.number.integer', integerNumber, 'common', 'Integer number schema');
  schemaRegistry.register('base.number.positiveInteger', positiveInteger, 'common', 'Positive integer schema');
  schemaRegistry.register('base.number.nonNegativeInteger', nonNegativeInteger, 'common', 'Non-negative integer schema');
  schemaRegistry.register('base.number.percentage', percentageNumber, 'common', 'Percentage number schema');
  
  schemaRegistry.register('base.date.dateString', dateString, 'common', 'Date string schema (YYYY-MM-DD)');
  schemaRegistry.register('base.date.dateTimeString', dateTimeString, 'common', 'Date-time string schema (ISO format)');
  schemaRegistry.register('base.date.past', pastDate, 'common', 'Past date schema');
  schemaRegistry.register('base.date.future', futureDate, 'common', 'Future date schema');
  
  schemaRegistry.register('base.boolean', booleanSchema, 'common', 'Boolean schema');
  schemaRegistry.register('base.boolean.fromString', stringToBoolean, 'common', 'String to boolean schema');
}

// Export schemas
export default {
  nonEmptyString,
  trimmedString,
  emailString,
  urlString,
  uuidString,
  phoneString,
  positiveNumber,
  nonNegativeNumber,
  integerNumber,
  positiveInteger,
  nonNegativeInteger,
  percentageNumber,
  dateString,
  dateTimeString,
  pastDate,
  futureDate,
  booleanSchema,
  stringToBoolean,
  nonEmptyArray,
  uniqueArray,
  registerBaseSchemas
};