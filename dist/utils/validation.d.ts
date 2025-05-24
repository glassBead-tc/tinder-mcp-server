/**
 * Validation Service
 *
 * Provides validation functionality using Zod schemas.
 * Integrates with the schema registry and error handling system.
 */
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { SchemaId } from '../schemas/registry';
/**
 * Validation options interface
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
}
/**
 * Default validation options
 */
export declare const DEFAULT_VALIDATION_OPTIONS: ValidationOptions;
/**
 * Validation target in a request
 */
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers' | 'cookies';
/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
    errorMessage?: string;
}
/**
 * Validation service class
 */
export declare class ValidationService {
    private static instance;
    private constructor();
    /**
     * Get the singleton instance of the validation service
     */
    static getInstance(): ValidationService;
    /**
     * Validate data against a schema
     *
     * @param schemaId - Schema ID from registry
     * @param data - Data to validate
     * @param options - Validation options
     * @returns Validation result
     */
    validate<T = any>(schemaId: SchemaId, data: unknown, options?: ValidationOptions): ValidationResult<T>;
    /**
     * Validate data against a schema directly (without using registry)
     *
     * @param schema - Zod schema
     * @param data - Data to validate
     * @param options - Validation options
     * @returns Validation result
     */
    validateWithSchema<T = any>(schema: z.ZodType, data: unknown, options?: ValidationOptions): ValidationResult<T>;
    /**
     * Format Zod error into a readable message
     *
     * @param error - Zod error
     * @returns Formatted error message
     */
    formatZodError(error: z.ZodError): string;
    /**
     * Create a validation middleware for Express routes
     *
     * @param schemaId - Schema ID from registry
     * @param target - Request property to validate
     * @param options - Validation options
     * @returns Express middleware function
     */
    createValidationMiddleware(schemaId: SchemaId, target?: ValidationTarget, options?: ValidationOptions): (req: Request, _res: Response, next: NextFunction) => void;
    /**
     * Create a validation middleware using a schema directly
     *
     * @param schema - Zod schema
     * @param target - Request property to validate
     * @param options - Validation options
     * @returns Express middleware function
     */
    createSchemaValidationMiddleware(schema: z.ZodType, target?: ValidationTarget, options?: ValidationOptions): (req: Request, _res: Response, next: NextFunction) => void;
    /**
     * Validate data size to prevent memory-based DoS attacks
     *
     * @param data - Data to validate
     * @throws Error if data exceeds size limits
     */
    private validateDataSize;
    /**
     * Validate nesting depth to prevent deep nesting attacks
     *
     * @param data - Data to validate
     * @param maxDepth - Maximum allowed depth
     * @param currentDepth - Current depth (used internally)
     * @throws Error if data exceeds maximum depth
     */
    private validateNestingDepth;
}
export declare const validationService: ValidationService;
export default validationService;
