"use strict";
/**
 * Base Schemas
 *
 * Defines base validation schemas for primitive types with custom validations.
 * These schemas can be reused across the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.limitedObject = exports.boundedString = exports.boundedArray = exports.uniqueArray = exports.nonEmptyArray = exports.DEFAULT_LIMITS = exports.stringToBoolean = exports.booleanSchema = exports.futureDate = exports.pastDate = exports.dateTimeString = exports.dateString = exports.percentageNumber = exports.nonNegativeInteger = exports.positiveInteger = exports.integerNumber = exports.nonNegativeNumber = exports.positiveNumber = exports.phoneString = exports.uuidString = exports.urlString = exports.emailString = exports.trimmedString = exports.nonEmptyString = void 0;
exports.registerBaseSchemas = registerBaseSchemas;
const zod_1 = require("zod");
const registry_1 = require("../registry");
/**
 * String schemas
 */
exports.nonEmptyString = zod_1.z.string().min(1, { message: 'Value cannot be empty' });
exports.trimmedString = zod_1.z.string().trim()
    .transform(val => val.trim());
exports.emailString = zod_1.z.string()
    .email({ message: 'Invalid email address format' })
    .trim()
    .toLowerCase();
exports.urlString = zod_1.z.string()
    .url({ message: 'Invalid URL format' })
    .trim();
exports.uuidString = zod_1.z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: 'Invalid UUID format' });
exports.phoneString = zod_1.z.string()
    .regex(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +12125551234)'
});
/**
 * Number schemas
 */
exports.positiveNumber = zod_1.z.number().positive({ message: 'Value must be positive' });
exports.nonNegativeNumber = zod_1.z.number().nonnegative({ message: 'Value cannot be negative' });
exports.integerNumber = zod_1.z.number().int({ message: 'Value must be an integer' });
exports.positiveInteger = zod_1.z.number().int().positive();
exports.nonNegativeInteger = zod_1.z.number().int().nonnegative();
exports.percentageNumber = zod_1.z.number()
    .min(0, { message: 'Percentage cannot be less than 0' })
    .max(100, { message: 'Percentage cannot be greater than 100' });
/**
 * Date schemas
 */
exports.dateString = zod_1.z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' });
exports.dateTimeString = zod_1.z.string()
    .datetime({ message: 'Invalid ISO date-time format' });
exports.pastDate = zod_1.z.date()
    .refine((date) => date < new Date(), { message: 'Date must be in the past' });
exports.futureDate = zod_1.z.date()
    .refine((date) => date > new Date(), { message: 'Date must be in the future' });
/**
 * Boolean schemas
 */
exports.booleanSchema = zod_1.z.boolean();
exports.stringToBoolean = zod_1.z.union([
    zod_1.z.boolean(),
    zod_1.z.string().transform((val) => {
        if (val.toLowerCase() === 'true')
            return true;
        if (val.toLowerCase() === 'false')
            return false;
        throw new Error('Invalid boolean string');
    })
]);
/**
 * Array schemas
 */
/**
 * Default size limits for security
 */
exports.DEFAULT_LIMITS = {
    MAX_ARRAY_LENGTH: 1000,
    MAX_STRING_LENGTH: 100000, // 100KB
    MAX_OBJECT_KEYS: 1000,
    MAX_NESTING_DEPTH: 10
};
/**
 * Array schemas with size limits for security
 */
const nonEmptyArray = (schema, maxLength = exports.DEFAULT_LIMITS.MAX_ARRAY_LENGTH) => zod_1.z.array(schema)
    .min(1, { message: 'Array cannot be empty' })
    .max(maxLength, { message: `Array cannot contain more than ${maxLength} items` });
exports.nonEmptyArray = nonEmptyArray;
const uniqueArray = (schema, maxLength = exports.DEFAULT_LIMITS.MAX_ARRAY_LENGTH) => zod_1.z.array(schema)
    .max(maxLength, { message: `Array cannot contain more than ${maxLength} items` })
    .refine((items) => new Set(items).size === items.length, { message: 'Array must contain unique items' });
exports.uniqueArray = uniqueArray;
/**
 * Bounded array with explicit size limits
 */
const boundedArray = (schema, minLength = 0, maxLength = exports.DEFAULT_LIMITS.MAX_ARRAY_LENGTH) => zod_1.z.array(schema)
    .min(minLength, { message: `Array must contain at least ${minLength} items` })
    .max(maxLength, { message: `Array cannot contain more than ${maxLength} items` });
exports.boundedArray = boundedArray;
/**
 * String schemas with size limits for security
 */
const boundedString = (minLength = 0, maxLength = exports.DEFAULT_LIMITS.MAX_STRING_LENGTH) => zod_1.z.string()
    .min(minLength, { message: `String must be at least ${minLength} characters long` })
    .max(maxLength, { message: `String cannot be longer than ${maxLength} characters` });
exports.boundedString = boundedString;
/**
 * Object schema with key limits for security
 */
const limitedObject = (shape, maxKeys = exports.DEFAULT_LIMITS.MAX_OBJECT_KEYS) => zod_1.z.object(shape).refine((obj) => Object.keys(obj).length <= maxKeys, { message: `Object cannot have more than ${maxKeys} properties` });
exports.limitedObject = limitedObject;
/**
 * Register schemas with the registry
 */
function registerBaseSchemas() {
    registry_1.schemaRegistry.register('base.string.nonEmpty', exports.nonEmptyString, 'common', 'Non-empty string schema');
    registry_1.schemaRegistry.register('base.string.trimmed', exports.trimmedString, 'common', 'Trimmed string schema');
    registry_1.schemaRegistry.register('base.string.email', exports.emailString, 'common', 'Email string schema');
    registry_1.schemaRegistry.register('base.string.url', exports.urlString, 'common', 'URL string schema');
    registry_1.schemaRegistry.register('base.string.uuid', exports.uuidString, 'common', 'UUID string schema');
    registry_1.schemaRegistry.register('base.string.phone', exports.phoneString, 'common', 'Phone string schema');
    registry_1.schemaRegistry.register('base.number.positive', exports.positiveNumber, 'common', 'Positive number schema');
    registry_1.schemaRegistry.register('base.number.nonNegative', exports.nonNegativeNumber, 'common', 'Non-negative number schema');
    registry_1.schemaRegistry.register('base.number.integer', exports.integerNumber, 'common', 'Integer number schema');
    registry_1.schemaRegistry.register('base.number.positiveInteger', exports.positiveInteger, 'common', 'Positive integer schema');
    registry_1.schemaRegistry.register('base.number.nonNegativeInteger', exports.nonNegativeInteger, 'common', 'Non-negative integer schema');
    registry_1.schemaRegistry.register('base.number.percentage', exports.percentageNumber, 'common', 'Percentage number schema');
    registry_1.schemaRegistry.register('base.date.dateString', exports.dateString, 'common', 'Date string schema (YYYY-MM-DD)');
    registry_1.schemaRegistry.register('base.date.dateTimeString', exports.dateTimeString, 'common', 'Date-time string schema (ISO format)');
    registry_1.schemaRegistry.register('base.date.past', exports.pastDate, 'common', 'Past date schema');
    registry_1.schemaRegistry.register('base.date.future', exports.futureDate, 'common', 'Future date schema');
    registry_1.schemaRegistry.register('base.boolean', exports.booleanSchema, 'common', 'Boolean schema');
    registry_1.schemaRegistry.register('base.boolean.fromString', exports.stringToBoolean, 'common', 'String to boolean schema');
}
// Export schemas
exports.default = {
    nonEmptyString: exports.nonEmptyString,
    trimmedString: exports.trimmedString,
    emailString: exports.emailString,
    urlString: exports.urlString,
    uuidString: exports.uuidString,
    phoneString: exports.phoneString,
    positiveNumber: exports.positiveNumber,
    nonNegativeNumber: exports.nonNegativeNumber,
    integerNumber: exports.integerNumber,
    positiveInteger: exports.positiveInteger,
    nonNegativeInteger: exports.nonNegativeInteger,
    percentageNumber: exports.percentageNumber,
    dateString: exports.dateString,
    dateTimeString: exports.dateTimeString,
    pastDate: exports.pastDate,
    futureDate: exports.futureDate,
    booleanSchema: exports.booleanSchema,
    stringToBoolean: exports.stringToBoolean,
    nonEmptyArray: exports.nonEmptyArray,
    uniqueArray: exports.uniqueArray,
    registerBaseSchemas
};
//# sourceMappingURL=base.schema.js.map