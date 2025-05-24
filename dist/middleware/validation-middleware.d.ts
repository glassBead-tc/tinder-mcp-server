/**
 * Validation Middleware
 *
 * Express middleware for request validation using Zod schemas.
 * Provides middleware factories for validating different parts of a request.
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SchemaId } from '../schemas/registry';
/**
 * Validation options
 */
export interface ValidationOptions {
    stripUnknown?: boolean;
    abortEarly?: boolean;
    contextual?: Record<string, any>;
    /**
     * Maximum depth for nested objects (prevents deep nesting attacks)
     * Default: 10
     */
    maxDepth?: number;
    /**
     * Timeout in milliseconds for validation operations (prevents DoS attacks)
     * Default: 1000 (1 second)
     */
    timeout?: number;
    /**
     * Maximum array length allowed
     * Default: 1000
     */
    maxArrayLength?: number;
    /**
     * Maximum string length allowed
     * Default: 100000 (100KB)
     */
    maxStringLength?: number;
    /**
     * Enable rate limiting for validation failures
     * Default: true
     */
    enableRateLimiting?: boolean;
}
/**
 * Default validation options
 */
export declare const DEFAULT_VALIDATION_OPTIONS: ValidationOptions;
/**
 * Default security headers schema
 * Validates common security headers to prevent header injection attacks
 */
export declare const DEFAULT_SECURITY_HEADERS_SCHEMA: z.ZodObject<{
    'content-type': z.ZodOptional<z.ZodString>;
    host: z.ZodOptional<z.ZodString>;
    'user-agent': z.ZodOptional<z.ZodString>;
    authorization: z.ZodOptional<z.ZodString>;
}, Record<string, unknown>, Record<string, unknown>>;
/**
 * Request part to validate
 */
export type RequestPart = 'body' | 'query' | 'params' | 'headers' | 'cookies';
/**
 * Create middleware to validate a request part using a schema ID
 *
 * @param schemaId - Schema ID from registry
 * @param requestPart - Request part to validate
 * @param options - Validation options
 * @returns Express middleware
 */
export declare function validateWithSchemaId(schemaId: SchemaId, requestPart?: RequestPart, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create middleware to validate a request part using a Zod schema
 *
 * @param schema - Zod schema
 * @param requestPart - Request part to validate
 * @param options - Validation options
 * @returns Express middleware
 */
export declare function validateWithSchema(schema: z.ZodType, requestPart?: RequestPart, options?: ValidationOptions): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Create middleware to validate request body
 *
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export declare function validateBody(schema: z.ZodType | SchemaId, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create middleware to validate request query parameters
 *
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export declare function validateQuery(schema: z.ZodType | SchemaId, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create middleware to validate request path parameters
 *
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export declare function validateParams(schema: z.ZodType | SchemaId, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create middleware to validate request headers
 *
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export declare function validateHeaders(schema: z.ZodType | SchemaId, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create middleware to validate multiple parts of a request
 *
 * @param validations - Object mapping request parts to schemas or schema IDs
 * @param options - Validation options
 * @returns Express middleware
 */
/**
 * Create middleware to validate multiple parts of a request
 * Always includes header validation for security
 *
 * @param validations - Object mapping request parts to schemas or schema IDs
 * @param options - Validation options
 * @returns Express middleware
 */
export declare function validateRequest(validations: Partial<Record<RequestPart, z.ZodType | SchemaId>>, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    validateWithSchemaId: typeof validateWithSchemaId;
    validateWithSchema: typeof validateWithSchema;
    validateBody: typeof validateBody;
    validateQuery: typeof validateQuery;
    validateParams: typeof validateParams;
    validateHeaders: typeof validateHeaders;
    validateRequest: typeof validateRequest;
};
export default _default;
