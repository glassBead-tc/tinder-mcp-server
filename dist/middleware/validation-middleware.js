"use strict";
/**
 * Validation Middleware
 *
 * Express middleware for request validation using Zod schemas.
 * Provides middleware factories for validating different parts of a request.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SECURITY_HEADERS_SCHEMA = exports.DEFAULT_VALIDATION_OPTIONS = void 0;
exports.validateWithSchemaId = validateWithSchemaId;
exports.validateWithSchema = validateWithSchema;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
exports.validateHeaders = validateHeaders;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const error_handler_1 = require("../utils/error-handler");
const types_1 = require("../types");
const registry_1 = require("../schemas/registry");
const zod_error_adapter_1 = require("../utils/zod-error-adapter");
const logger_1 = __importDefault(require("../utils/logger"));
const rate_limiter_1 = __importDefault(require("../services/rate-limiter"));
/**
 * Default validation options
 */
exports.DEFAULT_VALIDATION_OPTIONS = {
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
exports.DEFAULT_SECURITY_HEADERS_SCHEMA = zod_1.z.object({
    // Restrict content types
    'content-type': zod_1.z.string().optional()
        .refine(val => !val || val.length < 100, {
        message: 'Content-Type header too long'
    })
        .refine(val => !val || /^[a-zA-Z0-9\/\.\-\+]+(?:; .*)?$/.test(val), {
        message: 'Invalid Content-Type header format'
    }),
    // Prevent header injection
    'host': zod_1.z.string().optional()
        .refine(val => !val || val.length < 255, {
        message: 'Host header too long'
    })
        .refine(val => !val || /^[a-zA-Z0-9\.\-:]+$/.test(val), {
        message: 'Invalid Host header format'
    }),
    // Validate user agent
    'user-agent': zod_1.z.string().optional()
        .refine(val => !val || val.length < 1000, {
        message: 'User-Agent header too long'
    }),
    // Validate authorization header
    'authorization': zod_1.z.string().optional()
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
 * Create middleware to validate a request part using a schema ID
 *
 * @param schemaId - Schema ID from registry
 * @param requestPart - Request part to validate
 * @param options - Validation options
 * @returns Express middleware
 */
function validateWithSchemaId(schemaId, requestPart = 'body', options = {}) {
    return (req, res, next) => {
        const schema = registry_1.schemaRegistry.getSchema(schemaId);
        if (!schema) {
            logger_1.default.error(`Schema with ID "${schemaId}" not found`);
            return next(new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Validation schema "${schemaId}" not found`, null, 500));
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
function validateWithSchema(schema, requestPart = 'body', options = {}) {
    // Merge with default options
    const mergedOptions = { ...exports.DEFAULT_VALIDATION_OPTIONS, ...options };
    return (req, _res, next) => {
        try {
            // Get the data to validate
            const data = req[requestPart];
            if (data === undefined) {
                logger_1.default.warn(`Request ${requestPart} is undefined`);
                return next(new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Request ${requestPart} is required`, null, 400));
            }
            // Get client identifier for rate limiting (IP address or user ID)
            const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
            const userId = req.user?.id || 'anonymous';
            const identifier = userId !== 'anonymous' ? userId : clientIp;
            const endpoint = req.path;
            // Check if client is rate limited due to excessive validation failures
            if (mergedOptions.enableRateLimiting &&
                rate_limiter_1.default.isValidationRateLimited(identifier, endpoint)) {
                logger_1.default.warn(`Validation rate limit exceeded for ${identifier} on ${endpoint}`);
                return next(new error_handler_1.ApiError(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Too many validation failures. Please try again later.', {
                    resetAt: Date.now() + 15 * 60 * 1000 // 15 minutes block
                }, 429));
            }
            // Validate data size before schema validation
            if (!validateDataSize(data, mergedOptions)) {
                // Track validation failure for rate limiting
                if (mergedOptions.enableRateLimiting) {
                    rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
                }
                return next(new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_SIZE_EXCEEDED, 'Input data exceeds size limits', {
                    maxArrayLength: mergedOptions.maxArrayLength,
                    maxStringLength: mergedOptions.maxStringLength
                }, 400));
            }
            // Validate nesting depth before schema validation
            if (!validateNestingDepth(data, mergedOptions.maxDepth)) {
                // Track validation failure for rate limiting
                if (mergedOptions.enableRateLimiting) {
                    rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
                }
                return next(new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_DEPTH_EXCEEDED, `Input exceeds maximum nesting depth of ${mergedOptions.maxDepth}`, null, 400));
            }
            // Apply timeout to prevent DoS attacks
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_TIMEOUT, `Validation timeout exceeded (${mergedOptions.timeout}ms)`, null, 400));
                }, mergedOptions.timeout);
            });
            // Perform validation with timeout
            const validationPromise = new Promise((resolve, reject) => {
                try {
                    const result = schema.safeParse(data);
                    if (result.success) {
                        // Replace the request data with the validated data
                        req[requestPart] = result.data;
                        resolve();
                    }
                    else {
                        // Track validation failure for rate limiting
                        if (mergedOptions.enableRateLimiting) {
                            rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
                        }
                        // Convert Zod error to API error
                        const apiError = zod_error_adapter_1.ZodErrorAdapter.toApiError(result.error, `Validation failed for ${requestPart}`, 400);
                        reject(apiError);
                    }
                }
                catch (error) {
                    // Track validation failure for rate limiting
                    if (mergedOptions.enableRateLimiting) {
                        rate_limiter_1.default.trackValidationFailure(identifier, endpoint);
                    }
                    logger_1.default.error(`Validation middleware error:`, error);
                    reject(new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`, null, 400));
                }
            });
            // Race between validation and timeout
            Promise.race([validationPromise, timeoutPromise])
                .then(() => next())
                .catch(error => next(error));
        }
        catch (error) {
            logger_1.default.error(`Validation middleware error:`, error);
            return next(new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`, null, 400));
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
function validateDataSize(data, options) {
    // Check string length
    if (typeof data === 'string' && data.length > options.maxStringLength) {
        return false;
    }
    // Check array length
    if (Array.isArray(data) && data.length > options.maxArrayLength) {
        return false;
    }
    // Check object size
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        if (keys.length > options.maxArrayLength) {
            return false;
        }
        // Recursively check object properties
        for (const key in data) {
            if (!validateDataSize(data[key], options)) {
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
function validateNestingDepth(data, maxDepth, currentDepth = 0) {
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
        }
        else {
            for (const key in data) {
                if (!validateNestingDepth(data[key], maxDepth, currentDepth + 1)) {
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
function validateBody(schema, options = {}) {
    if (typeof schema === 'string') {
        return validateWithSchemaId(schema, 'body', options);
    }
    else {
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
function validateQuery(schema, options = {}) {
    if (typeof schema === 'string') {
        return validateWithSchemaId(schema, 'query', options);
    }
    else {
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
function validateParams(schema, options = {}) {
    if (typeof schema === 'string') {
        return validateWithSchemaId(schema, 'params', options);
    }
    else {
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
function validateHeaders(schema, options = {}) {
    if (typeof schema === 'string') {
        return validateWithSchemaId(schema, 'headers', options);
    }
    else {
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
function validateRequest(validations, options = {}) {
    return (req, res, next) => {
        // Ensure headers validation is included
        const validationsWithHeaders = { ...validations };
        // If headers validation is not provided, add default security headers validation
        if (!validationsWithHeaders.headers) {
            validationsWithHeaders.headers = exports.DEFAULT_SECURITY_HEADERS_SCHEMA;
        }
        // Create an array of middleware functions
        const middlewares = Object.entries(validationsWithHeaders).map(([part, schema]) => {
            const requestPart = part;
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
            }
            else {
                return validateWithSchema(schema, requestPart, enhancedOptions);
            }
        });
        // Execute middleware functions in sequence
        const executeMiddleware = (index) => {
            if (index >= middlewares.length) {
                return next();
            }
            middlewares[index](req, res, (err) => {
                if (err) {
                    return next(err);
                }
                executeMiddleware(index + 1);
            });
        };
        executeMiddleware(0);
    };
}
exports.default = {
    validateWithSchemaId,
    validateWithSchema,
    validateBody,
    validateQuery,
    validateParams,
    validateHeaders,
    validateRequest
};
//# sourceMappingURL=validation-middleware.js.map