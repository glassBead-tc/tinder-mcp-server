"use strict";
/**
 * Zod Error Adapter
 *
 * Converts Zod validation errors to API errors.
 * Provides utilities for formatting and handling Zod errors.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodErrorAdapter = exports.DEFAULT_SENSITIVE_FIELDS = void 0;
const zod_1 = require("zod");
const error_handler_1 = require("./error-handler");
const types_1 = require("../types");
const logger_1 = __importDefault(require("./logger"));
/**
 * Default sensitive fields that should be sanitized in error messages
 */
exports.DEFAULT_SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'apiKey', 'key', 'auth',
    'credential', 'pin', 'otp', 'cvv', 'ssn', 'hash', 'salt'
];
/**
 * Zod Error Adapter class
 */
class ZodErrorAdapter {
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
    static toApiError(error, message = 'Validation failed', statusCode = 400, options = {}) {
        // Set default options
        const mergedOptions = {
            sanitizeSensitiveFields: true,
            sensitiveFields: exports.DEFAULT_SENSITIVE_FIELDS,
            ...options
        };
        const formattedErrors = this.formatZodError(error, mergedOptions);
        return new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, message, { validationErrors: formattedErrors }, statusCode);
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
    static formatZodError(error, options = {}) {
        // Set default options
        const { includePathInMessage = true, flattenErrors = true, sanitizeSensitiveFields = true, sensitiveFields = exports.DEFAULT_SENSITIVE_FIELDS } = options;
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
        }
        catch (err) {
            logger_1.default.error('Error formatting Zod error:', err);
            return [{
                    path: [],
                    message: 'Error processing validation errors',
                    code: zod_1.z.ZodIssueCode.custom
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
    static isSensitivePath(path, sensitiveFields) {
        if (!path || path.length === 0)
            return false;
        // Convert path to string for easier checking
        const pathString = path.join('.').toLowerCase();
        // Check if any sensitive field name is in the path
        return sensitiveFields.some(field => pathString.includes(field.toLowerCase()));
    }
    /**
     * Sanitize error message for sensitive fields
     *
     * @param message - Original error message
     * @returns Sanitized error message
     */
    static sanitizeErrorMessage(message) {
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
    static constantTimeCompare(a, b) {
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
    static getIssueDetails(issue) {
        const details = {};
        switch (issue.code) {
            case zod_1.z.ZodIssueCode.invalid_type:
                details.expectedType = issue.expected;
                details.receivedType = issue.received;
                break;
            case zod_1.z.ZodIssueCode.invalid_literal:
                details.expected = issue.expected;
                break;
            case zod_1.z.ZodIssueCode.unrecognized_keys:
                details.keys = issue.keys;
                break;
            case zod_1.z.ZodIssueCode.invalid_union:
                details.unionErrors = issue.unionErrors.map(e => this.formatZodError(e));
                break;
            case zod_1.z.ZodIssueCode.invalid_enum_value:
                details.options = issue.options;
                details.received = issue.received;
                break;
            case zod_1.z.ZodIssueCode.invalid_arguments:
                if ('argumentsError' in issue && issue.argumentsError) {
                    details.argumentsError = this.formatZodError(issue.argumentsError);
                }
                break;
            case zod_1.z.ZodIssueCode.invalid_return_type:
                if ('returnTypeError' in issue && issue.returnTypeError) {
                    details.returnTypeError = this.formatZodError(issue.returnTypeError);
                }
                break;
            case zod_1.z.ZodIssueCode.too_small:
                if ('minimum' in issue) {
                    details.minimum = issue.minimum;
                    details.type = issue.type;
                    details.inclusive = issue.inclusive;
                    if ('exact' in issue)
                        details.exact = issue.exact;
                }
                break;
            case zod_1.z.ZodIssueCode.too_big:
                if ('maximum' in issue) {
                    details.maximum = issue.maximum;
                    details.type = issue.type;
                    details.inclusive = issue.inclusive;
                    if ('exact' in issue)
                        details.exact = issue.exact;
                }
                break;
            default:
                // For other issue types, include any non-standard properties
                Object.keys(issue).forEach(key => {
                    if (!['code', 'path', 'message'].includes(key)) {
                        details[key] = issue[key];
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
    static createErrorMessage(error) {
        return error.errors
            .map(err => {
            const path = err.path.join('.');
            const prefix = path ? `${path}: ` : '';
            return `${prefix}${err.message}`;
        })
            .join('; ');
    }
}
exports.ZodErrorAdapter = ZodErrorAdapter;
exports.default = ZodErrorAdapter;
//# sourceMappingURL=zod-error-adapter.js.map