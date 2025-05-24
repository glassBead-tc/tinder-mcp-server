"use strict";
/**
 * Sanitizer Utility
 * Provides functions to sanitize user input and prevent injection attacks
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSanitizer = exports.Sanitizer = void 0;
exports.sanitize = sanitize;
exports.createSanitizer = createSanitizer;
exports.sanitizeRequestBody = sanitizeRequestBody;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("./logger"));
/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS = {
    maxStringLength: 10000,
    maxObjectDepth: 10,
    stripHtml: true,
    stripScripts: true,
    escapeSpecialChars: true,
    disallowedKeys: ['__proto__', 'constructor', 'prototype']
};
/**
 * Sanitizer class
 */
class Sanitizer {
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Sanitize any value
     * @param value - Value to sanitize
     * @param currentDepth - Current object depth (for recursion)
     * @returns Sanitized value
     */
    sanitize(value, currentDepth = 0) {
        // Check object depth
        if (currentDepth > this.options.maxObjectDepth) {
            logger_1.default.warn('Maximum object depth exceeded during sanitization');
            return null;
        }
        // Handle different types
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value === 'string') {
            return this.sanitizeString(value);
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }
        if (Array.isArray(value)) {
            return this.sanitizeArray(value, currentDepth);
        }
        if (typeof value === 'object') {
            return this.sanitizeObject(value, currentDepth);
        }
        // For functions and other types, return null
        return null;
    }
    /**
     * Sanitize string value
     * @param str - String to sanitize
     * @returns Sanitized string
     */
    sanitizeString(str) {
        let sanitized = str;
        // Enforce maximum length
        if (this.options.maxStringLength && sanitized.length > this.options.maxStringLength) {
            sanitized = sanitized.substring(0, this.options.maxStringLength);
            logger_1.default.debug('String truncated during sanitization');
        }
        // Strip HTML tags
        if (this.options.stripHtml) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }
        // Strip script tags specifically
        if (this.options.stripScripts) {
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            sanitized = sanitized.replace(/javascript:/gi, '');
            sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        }
        // Escape special characters
        if (this.options.escapeSpecialChars) {
            sanitized = sanitized
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }
        return sanitized;
    }
    /**
     * Sanitize array
     * @param arr - Array to sanitize
     * @param currentDepth - Current object depth
     * @returns Sanitized array
     */
    sanitizeArray(arr, currentDepth) {
        return arr.map(item => this.sanitize(item, currentDepth + 1));
    }
    /**
     * Sanitize object
     * @param obj - Object to sanitize
     * @param currentDepth - Current object depth
     * @returns Sanitized object
     */
    sanitizeObject(obj, currentDepth) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Check disallowed keys
            if (this.options.disallowedKeys?.includes(key)) {
                logger_1.default.warn(`Disallowed key "${key}" removed during sanitization`);
                continue;
            }
            // Check allowed keys if whitelist is specified
            if (this.options.allowedKeys && !this.options.allowedKeys.includes(key)) {
                logger_1.default.debug(`Key "${key}" not in allowed list, removed during sanitization`);
                continue;
            }
            // Sanitize the key itself
            const sanitizedKey = this.sanitizeString(key);
            // Sanitize the value
            sanitized[sanitizedKey] = this.sanitize(value, currentDepth + 1);
        }
        return sanitized;
    }
    /**
     * Create a sanitization schema for Zod
     * @returns Zod schema with sanitization
     */
    createSanitizationSchema() {
        return zod_1.z.any().transform((val) => this.sanitize(val));
    }
}
exports.Sanitizer = Sanitizer;
/**
 * Default sanitizer instance
 */
exports.defaultSanitizer = new Sanitizer();
/**
 * Sanitize function using default options
 * @param value - Value to sanitize
 * @returns Sanitized value
 */
function sanitize(value) {
    return exports.defaultSanitizer.sanitize(value);
}
/**
 * Create custom sanitizer with options
 * @param options - Sanitization options
 * @returns Sanitizer instance
 */
function createSanitizer(options) {
    return new Sanitizer(options);
}
/**
 * Sanitize request body for API calls
 * @param body - Request body
 * @returns Sanitized body
 */
function sanitizeRequestBody(body) {
    const apiSanitizer = new Sanitizer({
        maxStringLength: 5000,
        maxObjectDepth: 5,
        stripHtml: true,
        stripScripts: true,
        escapeSpecialChars: false, // Don't escape for API calls
        disallowedKeys: ['__proto__', 'constructor', 'prototype', 'eval', 'Function']
    });
    return apiSanitizer.sanitize(body);
}
exports.default = {
    Sanitizer,
    defaultSanitizer: exports.defaultSanitizer,
    sanitize,
    createSanitizer,
    sanitizeRequestBody
};
//# sourceMappingURL=sanitizer.js.map