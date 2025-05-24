/**
 * Validation Service
 * 
 * Provides validation functionality using Zod schemas.
 * Integrates with the schema registry and error handling system.
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error-handler';
import { ErrorCodes } from '../types';
import { schemaRegistry, SchemaId } from '../schemas/registry';
import logger from './logger';

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
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  stripUnknown: false,
  abortEarly: false,
  maxDepth: 10,
  timeout: 1000
};

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
export class ValidationService {
  private static instance: ValidationService;

  private constructor() {
    logger.info('Validation Service initialized');
  }

  /**
   * Get the singleton instance of the validation service
   */
  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate data against a schema
   * 
   * @param schemaId - Schema ID from registry
   * @param data - Data to validate
   * @param options - Validation options
   * @returns Validation result
   */
  public validate<T = any>(
    schemaId: SchemaId,
    data: unknown,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    // Merge with default options
    const mergedOptions = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
    
    try {
      // Apply timeout to prevent DoS attacks
      const timeoutPromise = new Promise<ValidationResult<T>>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Validation timeout exceeded (${mergedOptions.timeout}ms)`));
        }, mergedOptions.timeout);
      });
      
      // Perform validation with timeout
      const validationPromise = new Promise<ValidationResult<T>>((resolve) => {
        // Check data size before validation
        this.validateDataSize(data);
        
        // Check nesting depth before validation
        this.validateNestingDepth(data, mergedOptions.maxDepth!);
        
        const result = schemaRegistry.safeValidate<T>(schemaId, data);
        
        if (result.success) {
          resolve({ success: true, data: result.data });
        } else {
          resolve({
            success: false,
            errors: result.error,
            errorMessage: this.formatZodError(result.error!)
          });
        }
      });
      
      // Race between validation and timeout
      return Promise.race([validationPromise, timeoutPromise]) as Promise<ValidationResult<T>> as unknown as ValidationResult<T>;
    } catch (error) {
      logger.error(`Validation error for schema ${schemaId}:`, error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Validate data against a schema directly (without using registry)
   * 
   * @param schema - Zod schema
   * @param data - Data to validate
   * @param options - Validation options
   * @returns Validation result
   */
  public validateWithSchema<T = any>(
    schema: z.ZodType,
    data: unknown,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    // Merge with default options
    const mergedOptions = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
    
    try {
      // Apply timeout to prevent DoS attacks
      const timeoutPromise = new Promise<ValidationResult<T>>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Validation timeout exceeded (${mergedOptions.timeout}ms)`));
        }, mergedOptions.timeout);
      });
      
      // Perform validation with timeout
      const validationPromise = new Promise<ValidationResult<T>>((resolve) => {
        // Check data size before validation
        this.validateDataSize(data);
        
        // Check nesting depth before validation
        this.validateNestingDepth(data, mergedOptions.maxDepth!);
        
        const result = schema.safeParse(data);
        
        if (result.success) {
          resolve({ success: true, data: result.data as T });
        } else {
          resolve({
            success: false,
            errors: result.error,
            errorMessage: this.formatZodError(result.error)
          });
        }
      });
      
      // Race between validation and timeout
      return Promise.race([validationPromise, timeoutPromise]) as Promise<ValidationResult<T>> as unknown as ValidationResult<T>;
    } catch (error) {
      logger.error('Validation error:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Format Zod error into a readable message
   * 
   * @param error - Zod error
   * @returns Formatted error message
   */
  public formatZodError(error: z.ZodError): string {
    return error.issues
      .map(issue => {
        const path = issue.path.join('.');
        const prefix = path ? `${path}: ` : '';
        return `${prefix}${issue.message}`;
      })
      .join('; ');
  }

  /**
   * Create a validation middleware for Express routes
   * 
   * @param schemaId - Schema ID from registry
   * @param target - Request property to validate
   * @param options - Validation options
   * @returns Express middleware function
   */
  public createValidationMiddleware(
    schemaId: SchemaId,
    target: ValidationTarget = 'body',
    options: ValidationOptions = {}
  ) {
    return (req: Request, _res: Response, next: NextFunction) => {
      const data = req[target as keyof Request];
      const result = this.validate(schemaId, data, options);
      
      if (result.success) {
        // Replace the request data with the validated data
        (req[target as keyof Request] as any) = result.data;
        next();
      } else {
        const error = new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Validation failed for ${target}`,
          { details: result.errorMessage },
          400
        );
        next(error);
      }
    };
  }

  /**
   * Create a validation middleware using a schema directly
   * 
   * @param schema - Zod schema
   * @param target - Request property to validate
   * @param options - Validation options
   * @returns Express middleware function
   */
  public createSchemaValidationMiddleware(
    schema: z.ZodType,
    target: ValidationTarget = 'body',
    options: ValidationOptions = {}
  ) {
    return (req: Request, _res: Response, next: NextFunction) => {
      const data = req[target as keyof Request];
      const result = this.validateWithSchema(schema, data, options);
      
      if (result.success) {
        // Replace the request data with the validated data
        (req[target as keyof Request] as any) = result.data;
        next();
      } else {
        const error = new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Validation failed for ${target}`,
          { details: result.errorMessage },
          400
        );
        next(error);
      }
    };
  }
  /**
   * Validate data size to prevent memory-based DoS attacks
   *
   * @param data - Data to validate
   * @throws Error if data exceeds size limits
   */
  private validateDataSize(data: unknown): void {
    // Check string length
    if (typeof data === 'string' && data.length > 1000000) { // 1MB limit for strings
      throw new Error('Input string exceeds maximum allowed length');
    }
    
    // Check array length
    if (Array.isArray(data) && data.length > 10000) { // 10K items limit for arrays
      throw new Error('Input array exceeds maximum allowed length');
    }
    
    // Check object size
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data as object);
      if (keys.length > 1000) { // 1K properties limit for objects
        throw new Error('Input object exceeds maximum allowed properties');
      }
    }
  }
  
  /**
   * Validate nesting depth to prevent deep nesting attacks
   *
   * @param data - Data to validate
   * @param maxDepth - Maximum allowed depth
   * @param currentDepth - Current depth (used internally)
   * @throws Error if data exceeds maximum depth
   */
  private validateNestingDepth(data: unknown, maxDepth: number, currentDepth: number = 0): void {
    if (currentDepth > maxDepth) {
      throw new Error(`Input exceeds maximum nesting depth of ${maxDepth}`);
    }
    
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        for (const item of data) {
          this.validateNestingDepth(item, maxDepth, currentDepth + 1);
        }
      } else {
        for (const key in data as object) {
          this.validateNestingDepth((data as any)[key], maxDepth, currentDepth + 1);
        }
      }
    }
  }
}

// Export the singleton instance
export const validationService = ValidationService.getInstance();

// Export default for convenience
export default validationService;