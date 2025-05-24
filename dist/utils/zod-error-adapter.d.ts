/**
 * Zod Error Adapter
 *
 * Converts Zod validation errors to API errors.
 * Provides utilities for formatting and handling Zod errors.
 */
import { z } from 'zod';
import { ApiError } from './error-handler';
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
export declare const DEFAULT_SENSITIVE_FIELDS: string[];
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
export declare class ZodErrorAdapter {
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
    static toApiError(error: z.ZodError, message?: string, statusCode?: number, options?: ErrorFormatOptions): ApiError;
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
    static formatZodError(error: z.ZodError, options?: ErrorFormatOptions): FormattedValidationError[];
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
    private static isSensitivePath;
    /**
     * Sanitize error message for sensitive fields
     *
     * @param message - Original error message
     * @returns Sanitized error message
     */
    private static sanitizeErrorMessage;
    /**
     * Perform constant-time comparison of strings
     * Helps prevent timing attacks when comparing sensitive values
     *
     * @param a - First string
     * @param b - Second string
     * @returns True if strings are equal
     */
    static constantTimeCompare(a: string, b: string): boolean;
    private static getIssueDetails;
    /**
     * Create a simple error message from a Zod error
     *
     * @param error - Zod error
     * @returns Simple error message
     */
    static createErrorMessage(error: z.ZodError): string;
}
export default ZodErrorAdapter;
