/**
 * Sanitizer Utility
 * Provides functions to sanitize user input and prevent injection attacks
 */
import { z } from 'zod';
/**
 * Sanitization options
 */
export interface SanitizationOptions {
    /**
     * Maximum string length
     */
    maxStringLength?: number;
    /**
     * Maximum object depth
     */
    maxObjectDepth?: number;
    /**
     * Remove HTML tags
     */
    stripHtml?: boolean;
    /**
     * Remove script tags specifically
     */
    stripScripts?: boolean;
    /**
     * Escape special characters
     */
    escapeSpecialChars?: boolean;
    /**
     * Allowed object keys (whitelist)
     */
    allowedKeys?: string[];
    /**
     * Disallowed object keys (blacklist)
     */
    disallowedKeys?: string[];
}
/**
 * Sanitizer class
 */
export declare class Sanitizer {
    private options;
    constructor(options?: SanitizationOptions);
    /**
     * Sanitize any value
     * @param value - Value to sanitize
     * @param currentDepth - Current object depth (for recursion)
     * @returns Sanitized value
     */
    sanitize(value: any, currentDepth?: number): any;
    /**
     * Sanitize string value
     * @param str - String to sanitize
     * @returns Sanitized string
     */
    private sanitizeString;
    /**
     * Sanitize array
     * @param arr - Array to sanitize
     * @param currentDepth - Current object depth
     * @returns Sanitized array
     */
    private sanitizeArray;
    /**
     * Sanitize object
     * @param obj - Object to sanitize
     * @param currentDepth - Current object depth
     * @returns Sanitized object
     */
    private sanitizeObject;
    /**
     * Create a sanitization schema for Zod
     * @returns Zod schema with sanitization
     */
    createSanitizationSchema(): z.ZodType;
}
/**
 * Default sanitizer instance
 */
export declare const defaultSanitizer: Sanitizer;
/**
 * Sanitize function using default options
 * @param value - Value to sanitize
 * @returns Sanitized value
 */
export declare function sanitize(value: any): any;
/**
 * Create custom sanitizer with options
 * @param options - Sanitization options
 * @returns Sanitizer instance
 */
export declare function createSanitizer(options: SanitizationOptions): Sanitizer;
/**
 * Sanitize request body for API calls
 * @param body - Request body
 * @returns Sanitized body
 */
export declare function sanitizeRequestBody(body: any): any;
declare const _default: {
    Sanitizer: typeof Sanitizer;
    defaultSanitizer: Sanitizer;
    sanitize: typeof sanitize;
    createSanitizer: typeof createSanitizer;
    sanitizeRequestBody: typeof sanitizeRequestBody;
};
export default _default;
