"use strict";
/**
 * Error handler utility
 * Provides error handling functionality for the application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.handleApiError = handleApiError;
exports.createErrorResponse = createErrorResponse;
exports.logError = logError;
exports.handleHttpError = handleHttpError;
const logger_1 = __importDefault(require("./logger"));
const config_1 = __importDefault(require("../config"));
const types_1 = require("../types");
/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(code, message, details = null, statusCode) {
        super(message);
        this.code = code;
        this.details = details;
        this.statusCode = statusCode;
        this.name = 'ApiError';
        // Ensure instanceof works correctly in TypeScript
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
/**
 * Handle API errors
 * @param error - The error object
 * @param request - The request object
 * @returns Standardized error response
 */
function handleApiError(error, request) {
    // Log error for debugging
    logError(error, request);
    // Determine error type and create standardized response
    if (error.response) {
        // API returned an error response
        const statusCode = error.response.status || error.response.statusCode || 500;
        let errorMessage = '';
        // Extract error message from various response formats
        if (error.response.data) {
            if (error.response.data.error && typeof error.response.data.error === 'string') {
                errorMessage = error.response.data.error;
            }
            else if (error.response.data.error && error.response.data.error.message) {
                errorMessage = error.response.data.error.message;
            }
            else if (error.response.data.status && error.response.data.message) {
                errorMessage = error.response.data.message;
            }
        }
        // Map HTTP status codes to internal error codes
        let errorCode;
        switch (statusCode) {
            case 401:
                errorCode = types_1.ErrorCodes.AUTHENTICATION_FAILED;
                break;
            case 429:
                errorCode = types_1.ErrorCodes.RATE_LIMIT_EXCEEDED;
                break;
            case 400:
                errorCode = types_1.ErrorCodes.VALIDATION_ERROR;
                break;
            default:
                errorCode = types_1.ErrorCodes.API_ERROR;
        }
        return createErrorResponse(errorCode, errorMessage || 'API Error', request);
    }
    else if (error.request) {
        // Request was made but no response received
        return createErrorResponse(types_1.ErrorCodes.NETWORK_ERROR, 'Network error, no response received', request);
    }
    else if (error.message && error.message.includes('rate limit')) {
        // Rate limit error
        return createErrorResponse(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, error.message, request);
    }
    else if (error.message && error.message.includes('validation')) {
        // Validation error
        return createErrorResponse(types_1.ErrorCodes.VALIDATION_ERROR, error.message, request);
    }
    else {
        // Unknown error
        return createErrorResponse(types_1.ErrorCodes.UNKNOWN_ERROR, 'An unknown error occurred', request);
    }
}
/**
 * Create standardized error response
 * @param code - Error code
 * @param message - Error message
 * @param request - Request object
 * @returns Standardized error response
 */
function createErrorResponse(code, message, request) {
    return {
        success: false,
        error: {
            code: code,
            message: message,
            endpoint: request?.endpoint || request?.url,
            timestamp: Date.now()
        }
    };
}
/**
 * Log error for monitoring and debugging
 * @param error - Error object
 * @param request - Request object
 */
function logError(error, request) {
    // SECURITY FIX: Only include stack traces in non-production environments
    const errorLog = {
        timestamp: new Date().toISOString(),
        endpoint: request?.endpoint || request?.url,
        method: request?.method,
        userId: request?.userId,
        error: error.message
    };
    // Only include stack trace in non-production environments
    if (config_1.default.NODE_ENV !== 'production') {
        errorLog.stack = error.stack;
    }
    logger_1.default.error(errorLog);
}
/**
 * Handle HTTP errors for Express responses
 * @param res - Express response object
 * @param error - Error object
 */
function handleHttpError(res, error) {
    const statusCode = error.statusCode || 500;
    const errorResponse = error instanceof ApiError
        ? createErrorResponse(error.code, error.message, { url: res.req.url })
        : handleApiError(error, { url: res.req.url });
    res.status(statusCode).json(errorResponse);
}
exports.default = {
    ErrorCodes: types_1.ErrorCodes,
    ApiError,
    handleApiError,
    createErrorResponse,
    logError,
    handleHttpError
};
//# sourceMappingURL=error-handler.js.map