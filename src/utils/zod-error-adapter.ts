/**
 * Zod Error Adapter
 * 
 * Converts Zod validation errors to API errors.
 * Provides utilities for formatting and handling Zod errors.
 */

import { z } from 'zod';
import { ApiError } from './error-handler';
import { ErrorCodes } from '../types';
import logger from './logger';

/**
 * Error format options
 */
export interface ErrorFormatOptions {
  includePathInMessage?: boolean;
  flattenErrors?: boolean;
  prefixFieldName?: boolean;
  /**
   * Sanitize sensitive fields in error messages
   * Default: true
   */
  sanitizeSensitiveFields?: boolean;
  /**
   * Fields to treat as sensitive (passwords, tokens, etc.)
   */
  sensitiveFields?: string[];
}

/**
 * Default sensitive fields that should be sanitized in error messages
 */
export const DEFAULT_SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'apiKey', 'key', 'auth',
  'credential', 'pin', 'otp', 'cvv', 'ssn', 'hash', 'salt'
];

/**
 * Formatted validation error
 */
export interface FormattedValidationError {
  path: (string | number)[];
  message: string;
  code: z.ZodIssueCode;
  details?: Record<string, any>;
}

/**
 * Zod Error Adapter class
 */
export class ZodErrorAdapter {
  /**
   * Convert a Zod error to an API error
   * 
   * @param error - Zod error
   * @param message - Optional custom message
   * @param statusCode - HTTP status code (default: 400)
   * @returns API error
   */
  /**
   * Convert a Zod error to an API error with sanitized messages
   *
   * @param error - Zod error
   * @param message - Optional custom message
   * @param statusCode - HTTP status code (default: 400)
   * @param options - Error format options
   * @returns API error
   */
  public static toApiError(
    error: z.ZodError,
    message: string = 'Validation failed',
    statusCode: number = 400,
    options: ErrorFormatOptions = {}
  ): ApiError {
    // Set default options
    const mergedOptions: ErrorFormatOptions = {
      sanitizeSensitiveFields: true,
      sensitiveFields: DEFAULT_SENSITIVE_FIELDS,
      ...options
    };
    
    const formattedErrors = this.formatZodError(error, mergedOptions);
    
    return new ApiError(
      ErrorCodes.VALIDATION_ERROR,
      message,
      { validationErrors: formattedErrors },
      statusCode
    );
  }

  /**
   * Format a Zod error into a structured object
   * 
   * @param error - Zod error
   * @param options - Format options
   * @returns Formatted validation errors
   */
  /**
   * Format a Zod error into a structured object with sanitized messages
   *
   * @param error - Zod error
   * @param options - Format options
   * @returns Formatted validation errors
   */
  public static formatZodError(
    error: z.ZodError,
    options: ErrorFormatOptions = {}
  ): FormattedValidationError[] {
    // Set default options
    const {
      includePathInMessage = true,
      flattenErrors = true,
      sanitizeSensitiveFields = true,
      sensitiveFields = DEFAULT_SENSITIVE_FIELDS
    } = options;
    
    try {
      return error.errors.map(issue => {
        const path = issue.path;
        const pathString = path.join('.');
        
        // Check if this is a sensitive field
        const isSensitiveField = sanitizeSensitiveFields &&
          this.isSensitivePath(path, sensitiveFields);
        
        // Sanitize message if it's a sensitive field
        let message = issue.message;
        if (isSensitiveField) {
          message = this.sanitizeErrorMessage(message);
        }
        
        if (includePathInMessage && pathString) {
          message = `${pathString}: ${message}`;
        }
        
        return {
          path: path,
          message: message,
          code: issue.code,
          // Sanitize details for sensitive fields
          details: isSensitiveField ? undefined : this.getIssueDetails(issue)
        };
      });
    } catch (err) {
      logger.error('Error formatting Zod error:', err);
      return [{
        path: [],
        message: 'Error processing validation errors',
        code: z.ZodIssueCode.custom
      }];
    }
  }

  /**
   * Get detailed information from a Zod issue
   * 
   * @param issue - Zod issue
   * @returns Issue details
   */
  /**
   * Check if a path contains sensitive information
   *
   * @param path - Path to check
   * @param sensitiveFields - List of sensitive field names
   * @returns True if the path contains sensitive information
   */
  private static isSensitivePath(path: (string | number)[], sensitiveFields: string[]): boolean {
    if (!path || path.length === 0) return false;
    
    // Convert path to string for easier checking
    const pathString = path.join('.').toLowerCase();
    
    // Check if any sensitive field name is in the path
    return sensitiveFields.some(field =>
      pathString.includes(field.toLowerCase())
    );
  }
  
  /**
   * Sanitize error message for sensitive fields
   *
   * @param message - Original error message
   * @returns Sanitized error message
   */
  private static sanitizeErrorMessage(message: string): string {
    // Replace specific values with generic message
    return 'Invalid value provided for sensitive field';
  }
  
  /**
   * Perform constant-time comparison of strings
   * Helps prevent timing attacks when comparing sensitive values
   *
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal
   */
  public static constantTimeCompare(a: string, b: string): boolean {
    // If lengths are different, strings are not equal
    // But still perform the comparison to maintain constant time
    const result = a.length === b.length;
    
    // Calculate maximum length to compare
    const len = Math.max(a.length, b.length);
    
    // Perform constant-time comparison
    let diff = 0;
    for (let i = 0; i < len; i++) {
      // XOR the character codes (will be 0 if equal)
      diff |= (a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length));
    }
    
    // Return true only if lengths match and all characters match
    return result && diff === 0;
  }
  
  private static getIssueDetails(issue: z.ZodIssue): Record<string, any> | undefined {
    const details: Record<string, any> = {};
    
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        details.expectedType = issue.expected;
        details.receivedType = issue.received;
        break;
        
      case z.ZodIssueCode.invalid_literal:
        details.expected = issue.expected;
        break;
        
      case z.ZodIssueCode.unrecognized_keys:
        details.keys = issue.keys;
        break;
        
      case z.ZodIssueCode.invalid_union:
        details.unionErrors = issue.unionErrors.map(e => 
          this.formatZodError(e)
        );
        break;
        
      case z.ZodIssueCode.invalid_enum_value:
        details.options = issue.options;
        details.received = issue.received;
        break;
        
      case z.ZodIssueCode.invalid_arguments:
        if ('argumentsError' in issue && issue.argumentsError) {
          details.argumentsError = this.formatZodError(issue.argumentsError);
        }
        break;

      case z.ZodIssueCode.invalid_return_type:
        if ('returnTypeError' in issue && issue.returnTypeError) {
          details.returnTypeError = this.formatZodError(issue.returnTypeError);
        }
        break;
        
      case z.ZodIssueCode.too_small:
        if ('minimum' in issue) {
          details.minimum = issue.minimum;
          details.type = issue.type;
          details.inclusive = issue.inclusive;
          if ('exact' in issue) details.exact = issue.exact;
        }
        break;
        
      case z.ZodIssueCode.too_big:
        if ('maximum' in issue) {
          details.maximum = issue.maximum;
          details.type = issue.type;
          details.inclusive = issue.inclusive;
          if ('exact' in issue) details.exact = issue.exact;
        }
        break;
        
      default:
        // For other issue types, include any non-standard properties
        Object.keys(issue).forEach(key => {
          if (!['code', 'path', 'message'].includes(key)) {
            details[key] = (issue as any)[key];
          }
        });
    }
    
    return Object.keys(details).length > 0 ? details : undefined;
  }

  /**
   * Create a simple error message from a Zod error
   * 
   * @param error - Zod error
   * @returns Simple error message
   */
  public static createErrorMessage(error: z.ZodError): string {
    return error.errors
      .map(err => {
        const path = err.path.join('.');
        const prefix = path ? `${path}: ` : '';
        return `${prefix}${err.message}`;
      })
      .join('; ');
  }
}

export default ZodErrorAdapter;