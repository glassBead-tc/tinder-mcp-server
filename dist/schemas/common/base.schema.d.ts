/**
 * Base Schemas
 *
 * Defines base validation schemas for primitive types with custom validations.
 * These schemas can be reused across the application.
 */
import { z } from 'zod';
/**
 * String schemas
 */
export declare const nonEmptyString: z.ZodString;
export declare const trimmedString: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const emailString: z.ZodString;
export declare const urlString: z.ZodString;
export declare const uuidString: z.ZodString;
export declare const phoneString: z.ZodString;
/**
 * Number schemas
 */
export declare const positiveNumber: z.ZodNumber;
export declare const nonNegativeNumber: z.ZodNumber;
export declare const integerNumber: z.ZodNumber;
export declare const positiveInteger: z.ZodNumber;
export declare const nonNegativeInteger: z.ZodNumber;
export declare const percentageNumber: z.ZodNumber;
/**
 * Date schemas
 */
export declare const dateString: z.ZodString;
export declare const dateTimeString: z.ZodString;
export declare const pastDate: z.ZodDate;
export declare const futureDate: z.ZodDate;
/**
 * Boolean schemas
 */
export declare const booleanSchema: z.ZodBoolean;
export declare const stringToBoolean: z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>]>;
/**
 * Array schemas
 */
/**
 * Default size limits for security
 */
export declare const DEFAULT_LIMITS: {
    MAX_ARRAY_LENGTH: number;
    MAX_STRING_LENGTH: number;
    MAX_OBJECT_KEYS: number;
    MAX_NESTING_DEPTH: number;
};
/**
 * Array schemas with size limits for security
 */
export declare const nonEmptyArray: <T extends z.ZodTypeAny>(schema: T, maxLength?: number) => z.ZodArray<T>;
export declare const uniqueArray: <T extends z.ZodTypeAny>(schema: T, maxLength?: number) => z.ZodArray<T>;
/**
 * Bounded array with explicit size limits
 */
export declare const boundedArray: <T extends z.ZodTypeAny>(schema: T, minLength?: number, maxLength?: number) => z.ZodArray<T>;
/**
 * String schemas with size limits for security
 */
export declare const boundedString: (minLength?: number, maxLength?: number) => z.ZodString;
/**
 * Object schema with key limits for security
 */
export declare const limitedObject: <T extends z.ZodRawShape>(shape: T, maxKeys?: number) => z.ZodObject<{ -readonly [P in keyof T]: T[P]; }, {}, {}>;
/**
 * Register schemas with the registry
 */
export declare function registerBaseSchemas(): void;
declare const _default: {
    nonEmptyString: z.ZodString;
    trimmedString: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    emailString: z.ZodString;
    urlString: z.ZodString;
    uuidString: z.ZodString;
    phoneString: z.ZodString;
    positiveNumber: z.ZodNumber;
    nonNegativeNumber: z.ZodNumber;
    integerNumber: z.ZodNumber;
    positiveInteger: z.ZodNumber;
    nonNegativeInteger: z.ZodNumber;
    percentageNumber: z.ZodNumber;
    dateString: z.ZodString;
    dateTimeString: z.ZodString;
    pastDate: z.ZodDate;
    futureDate: z.ZodDate;
    booleanSchema: z.ZodBoolean;
    stringToBoolean: z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>]>;
    nonEmptyArray: <T extends z.ZodTypeAny>(schema: T, maxLength?: number) => z.ZodArray<T>;
    uniqueArray: <T extends z.ZodTypeAny>(schema: T, maxLength?: number) => z.ZodArray<T>;
    registerBaseSchemas: typeof registerBaseSchemas;
};
export default _default;
