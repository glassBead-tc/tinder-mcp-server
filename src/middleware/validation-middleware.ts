/**
 * Validation Middleware
 * 
 * Express middleware for request validation using Zod schemas.
 * Provides middleware factories for validating different parts of a request.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/error-handler';
import { ErrorCodes } from '../types';
import { schemaRegistry, SchemaId } from '../schemas/registry';
import { ZodErrorAdapter } from '../utils/zod-error-adapter';
import logger from '../utils/logger';
import rateLimiter from '../services/rate-limiter';

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
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  stripUnknown: false,
  abortEarly: false,
  maxDepth: 10,
  timeout: 1000,
  maxArrayLength: 1000,
  maxStringLength: 100000,
  enableRateLimiting: true
};

/**
 * Default security headers schema
 * Validates common security headers to prevent header injection attacks
 */
export const DEFAULT_SECURITY_HEADERS_SCHEMA = z.object({
  // Restrict content types
  'content-type': z.string().optional()
    .refine(val => !val || val.length < 100, {
      message: 'Content-Type header too long'
    })
    .refine(val => !val || /^[a-zA-Z0-9\/\.\-\+]+(?:; .*)?$/.test(val), {
      message: 'Invalid Content-Type header format'
    }),
  
  // Prevent header injection
  'host': z.string().optional()
    .refine(val => !val || val.length < 255, {
      message: 'Host header too long'
    })
    .refine(val => !val || /^[a-zA-Z0-9\.\-:]+$/.test(val), {
      message: 'Invalid Host header format'
    }),
  
  // Validate user agent
  'user-agent': z.string().optional()
    .refine(val => !val || val.length < 1000, {
      message: 'User-Agent header too long'
    }),
  
  // Validate authorization header
  'authorization': z.string().optional()
    .refine(val => !val || val.length < 2000, {
      message: 'Authorization header too long'
    })
    // SECURITY FIX: Added length limit to regex pattern to prevent ReDoS attacks
    .refine(val => !val || /^(Bearer|Basic|Digest|Token) [a-zA-Z0-9\._\-\/\+\=]{1,1024}$/.test(val), {
      message: 'Invalid Authorization header format'
    }),
  
  // Allow other headers
}).passthrough();

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
export function validateWithSchemaId(
  schemaId: SchemaId,
  requestPart: RequestPart = 'body',
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemaRegistry.getSchema(schemaId);
    
    if (!schema) {
      logger.error(`Schema with ID "${schemaId}" not found`);
      return next(new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Validation schema "${schemaId}" not found`,
        null,
        500
      ));
    }
    
    return validateWithSchema(schema, requestPart, options)(req, res, next);
  };
}

/**
 * Create middleware to validate a request part using a Zod schema
 * 
 * @param schema - Zod schema
 * @param requestPart - Request part to validate
 * @param options - Validation options
 * @returns Express middleware
 */
export function validateWithSchema(
  schema: z.ZodType,
  requestPart: RequestPart = 'body',
  options: ValidationOptions = {}
) {
  // Merge with default options
  const mergedOptions = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Get the data to validate
      const data = req[requestPart as keyof Request];
      
      if (data === undefined) {
        logger.warn(`Request ${requestPart} is undefined`);
        return next(new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Request ${requestPart} is required`,
          null,
          400
        ));
      }
      
      // Get client identifier for rate limiting (IP address or user ID)
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const userId = (req as any).user?.id || 'anonymous';
      const identifier = userId !== 'anonymous' ? userId : clientIp;
      const endpoint = req.path;
      
      // Check if client is rate limited due to excessive validation failures
      if (mergedOptions.enableRateLimiting &&
          rateLimiter.isValidationRateLimited(identifier, endpoint)) {
        logger.warn(`Validation rate limit exceeded for ${identifier} on ${endpoint}`);
        return next(new ApiError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Too many validation failures. Please try again later.',
          {
            resetAt: Date.now() + 15 * 60 * 1000 // 15 minutes block
          },
          429
        ));
      }
      
      // Validate data size before schema validation
      if (!validateDataSize(data, mergedOptions)) {
        // Track validation failure for rate limiting
        if (mergedOptions.enableRateLimiting) {
          rateLimiter.trackValidationFailure(identifier, endpoint);
        }
        
        return next(new ApiError(
          ErrorCodes.VALIDATION_SIZE_EXCEEDED,
          'Input data exceeds size limits',
          {
            maxArrayLength: mergedOptions.maxArrayLength,
            maxStringLength: mergedOptions.maxStringLength
          },
          400
        ));
      }
      
      // Validate nesting depth before schema validation
      if (!validateNestingDepth(data, mergedOptions.maxDepth!)) {
        // Track validation failure for rate limiting
        if (mergedOptions.enableRateLimiting) {
          rateLimiter.trackValidationFailure(identifier, endpoint);
        }
        
        return next(new ApiError(
          ErrorCodes.VALIDATION_DEPTH_EXCEEDED,
          `Input exceeds maximum nesting depth of ${mergedOptions.maxDepth}`,
          null,
          400
        ));
      }
      
      // Apply timeout to prevent DoS attacks
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new ApiError(
            ErrorCodes.VALIDATION_TIMEOUT,
            `Validation timeout exceeded (${mergedOptions.timeout}ms)`,
            null,
            400
          ));
        }, mergedOptions.timeout);
      });
      
      // Perform validation with timeout
      const validationPromise = new Promise<void>((resolve, reject) => {
        try {
          const result = schema.safeParse(data);
          
          if (result.success) {
            // Replace the request data with the validated data
            (req[requestPart as keyof Request] as any) = result.data;
            resolve();
          } else {
            // Track validation failure for rate limiting
            if (mergedOptions.enableRateLimiting) {
              rateLimiter.trackValidationFailure(identifier, endpoint);
            }
            
            // Convert Zod error to API error
            const apiError = ZodErrorAdapter.toApiError(
              result.error,
              `Validation failed for ${requestPart}`,
              400
            );
            
            reject(apiError);
          }
        } catch (error) {
          // Track validation failure for rate limiting
          if (mergedOptions.enableRateLimiting) {
            rateLimiter.trackValidationFailure(identifier, endpoint);
          }
          
          logger.error(`Validation middleware error:`, error);
          reject(new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            null,
            400
          ));
        }
      });
      
      // Race between validation and timeout
      Promise.race([validationPromise, timeoutPromise])
        .then(() => next())
        .catch(error => next(error));
    } catch (error) {
      logger.error(`Validation middleware error:`, error);
      return next(new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        null,
        400
      ));
    }
  };
}

/**
 * Validate data size to prevent memory-based DoS attacks
 *
 * @param data - Data to validate
 * @param options - Validation options
 * @returns True if data size is within limits
 */
function validateDataSize(data: unknown, options: ValidationOptions): boolean {
  // Check string length
  if (typeof data === 'string' && data.length > options.maxStringLength!) {
    return false;
  }
  
  // Check array length
  if (Array.isArray(data) && data.length > options.maxArrayLength!) {
    return false;
  }
  
  // Check object size
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const keys = Object.keys(data as object);
    if (keys.length > options.maxArrayLength!) {
      return false;
    }
    
    // Recursively check object properties
    for (const key in data as object) {
      if (!validateDataSize((data as any)[key], options)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Validate nesting depth to prevent deep nesting attacks
 *
 * @param data - Data to validate
 * @param maxDepth - Maximum allowed depth
 * @param currentDepth - Current depth (used internally)
 * @returns True if nesting depth is within limits
 */
function validateNestingDepth(data: unknown, maxDepth: number, currentDepth: number = 0): boolean {
  if (currentDepth > maxDepth) {
    return false;
  }
  
  if (data && typeof data === 'object') {
    if (Array.isArray(data)) {
      for (const item of data) {
        if (!validateNestingDepth(item, maxDepth, currentDepth + 1)) {
          return false;
        }
      }
    } else {
      for (const key in data as object) {
        if (!validateNestingDepth((data as any)[key], maxDepth, currentDepth + 1)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Create middleware to validate request body
 * 
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export function validateBody(
  schema: z.ZodType | SchemaId,
  options: ValidationOptions = {}
) {
  if (typeof schema === 'string') {
    return validateWithSchemaId(schema, 'body', options);
  } else {
    return validateWithSchema(schema, 'body', options);
  }
}

/**
 * Create middleware to validate request query parameters
 * 
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export function validateQuery(
  schema: z.ZodType | SchemaId,
  options: ValidationOptions = {}
) {
  if (typeof schema === 'string') {
    return validateWithSchemaId(schema, 'query', options);
  } else {
    return validateWithSchema(schema, 'query', options);
  }
}

/**
 * Create middleware to validate request path parameters
 * 
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export function validateParams(
  schema: z.ZodType | SchemaId,
  options: ValidationOptions = {}
) {
  if (typeof schema === 'string') {
    return validateWithSchemaId(schema, 'params', options);
  } else {
    return validateWithSchema(schema, 'params', options);
  }
}

/**
 * Create middleware to validate request headers
 * 
 * @param schema - Zod schema or schema ID
 * @param options - Validation options
 * @returns Express middleware
 */
export function validateHeaders(
  schema: z.ZodType | SchemaId,
  options: ValidationOptions = {}
) {
  if (typeof schema === 'string') {
    return validateWithSchemaId(schema, 'headers', options);
  } else {
    return validateWithSchema(schema, 'headers', options);
  }
}

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
export function validateRequest(
  validations: Partial<Record<RequestPart, z.ZodType | SchemaId>>,
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure headers validation is included
    const validationsWithHeaders = { ...validations };
    
    // If headers validation is not provided, add default security headers validation
    if (!validationsWithHeaders.headers) {
      validationsWithHeaders.headers = DEFAULT_SECURITY_HEADERS_SCHEMA;
    }
    
    // Create an array of middleware functions
    const middlewares = Object.entries(validationsWithHeaders).map(
      ([part, schema]) => {
        const requestPart = part as RequestPart;
        
        // Apply constant-time validation for sensitive operations
        const isAuthEndpoint = req.path.includes('/auth') ||
                              req.path.includes('/login') ||
                              req.path.includes('/password');
        
        // Use enhanced options for sensitive endpoints
        const enhancedOptions = {
          ...options,
          // Enable constant-time validation for sensitive operations
          constantTimeValidation: isAuthEndpoint
        };
        
        if (typeof schema === 'string') {
          return validateWithSchemaId(schema, requestPart, enhancedOptions);
        } else {
          return validateWithSchema(schema, requestPart, enhancedOptions);
        }
      }
    );
    
    // Execute middleware functions in sequence
    const executeMiddleware = (index: number) => {
      if (index >= middlewares.length) {
        return next();
      }
      
      middlewares[index](req, res, (err: Error | null) => {
        if (err) {
          return next(err);
        }
        executeMiddleware(index + 1);
      });
    };
    
    executeMiddleware(0);
  };
}

export default {
  validateWithSchemaId,
  validateWithSchema,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  validateRequest
};