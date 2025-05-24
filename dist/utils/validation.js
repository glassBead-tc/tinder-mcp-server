"use strict";
/**
 * Validation Service
 *
 * Provides validation functionality using Zod schemas.
 * Integrates with the schema registry and error handling system.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationService = exports.ValidationService = exports.DEFAULT_VALIDATION_OPTIONS = void 0;
const error_handler_1 = require("./error-handler");
const types_1 = require("../types");
const registry_1 = require("../schemas/registry");
const logger_1 = __importDefault(require("./logger"));
/**
 * Default validation options
 */
exports.DEFAULT_VALIDATION_OPTIONS = {
    stripUnknown: false,
    abortEarly: false,
    maxDepth: 10,
    timeout: 1000
};
/**
 * Validation service class
 */
class ValidationService {
    constructor() {
        logger_1.default.info('Validation Service initialized');
    }
    /**
     * Get the singleton instance of the validation service
     */
    static getInstance() {
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
    validate(schemaId, data, options = {}) {
        // Merge with default options
        const mergedOptions = { ...exports.DEFAULT_VALIDATION_OPTIONS, ...options };
        try {
            // Apply timeout to prevent DoS attacks
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Validation timeout exceeded (${mergedOptions.timeout}ms)`));
                }, mergedOptions.timeout);
            });
            // Perform validation with timeout
            const validationPromise = new Promise((resolve) => {
                // Check data size before validation
                this.validateDataSize(data);
                // Check nesting depth before validation
                this.validateNestingDepth(data, mergedOptions.maxDepth);
                const result = registry_1.schemaRegistry.safeValidate(schemaId, data);
                if (result.success) {
                    resolve({ success: true, data: result.data });
                }
                else {
                    resolve({
                        success: false,
                        errors: result.error,
                        errorMessage: this.formatZodError(result.error)
                    });
                }
            });
            // Race between validation and timeout
            return Promise.race([validationPromise, timeoutPromise]);
        }
        catch (error) {
            logger_1.default.error(`Validation error for schema ${schemaId}:`, error);
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
    validateWithSchema(schema, data, options = {}) {
        // Merge with default options
        const mergedOptions = { ...exports.DEFAULT_VALIDATION_OPTIONS, ...options };
        try {
            // Apply timeout to prevent DoS attacks
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Validation timeout exceeded (${mergedOptions.timeout}ms)`));
                }, mergedOptions.timeout);
            });
            // Perform validation with timeout
            const validationPromise = new Promise((resolve) => {
                // Check data size before validation
                this.validateDataSize(data);
                // Check nesting depth before validation
                this.validateNestingDepth(data, mergedOptions.maxDepth);
                const result = schema.safeParse(data);
                if (result.success) {
                    resolve({ success: true, data: result.data });
                }
                else {
                    resolve({
                        success: false,
                        errors: result.error,
                        errorMessage: this.formatZodError(result.error)
                    });
                }
            });
            // Race between validation and timeout
            return Promise.race([validationPromise, timeoutPromise]);
        }
        catch (error) {
            logger_1.default.error('Validation error:', error);
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
    formatZodError(error) {
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
    createValidationMiddleware(schemaId, target = 'body', options = {}) {
        return (req, _res, next) => {
            const data = req[target];
            const result = this.validate(schemaId, data, options);
            if (result.success) {
                // Replace the request data with the validated data
                req[target] = result.data;
                next();
            }
            else {
                const error = new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Validation failed for ${target}`, { details: result.errorMessage }, 400);
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
    createSchemaValidationMiddleware(schema, target = 'body', options = {}) {
        return (req, _res, next) => {
            const data = req[target];
            const result = this.validateWithSchema(schema, data, options);
            if (result.success) {
                // Replace the request data with the validated data
                req[target] = result.data;
                next();
            }
            else {
                const error = new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Validation failed for ${target}`, { details: result.errorMessage }, 400);
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
    validateDataSize(data) {
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
            const keys = Object.keys(data);
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
    validateNestingDepth(data, maxDepth, currentDepth = 0) {
        if (currentDepth > maxDepth) {
            throw new Error(`Input exceeds maximum nesting depth of ${maxDepth}`);
        }
        if (data && typeof data === 'object') {
            if (Array.isArray(data)) {
                for (const item of data) {
                    this.validateNestingDepth(item, maxDepth, currentDepth + 1);
                }
            }
            else {
                for (const key in data) {
                    this.validateNestingDepth(data[key], maxDepth, currentDepth + 1);
                }
            }
        }
    }
}
exports.ValidationService = ValidationService;
// Export the singleton instance
exports.validationService = ValidationService.getInstance();
// Export default for convenience
exports.default = exports.validationService;
//# sourceMappingURL=validation.js.map