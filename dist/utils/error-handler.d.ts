/**
 * Error handler utility
 * Provides error handling functionality for the application
 */
import { Response } from 'express';
import { ErrorCodes, ErrorResponse } from '../types';
/**
 * Custom error class for API errors
 */
export declare class ApiError extends Error {
    code: ErrorCodes;
    details: any;
    statusCode?: number;
    constructor(code: ErrorCodes, message: string, details?: any, statusCode?: number);
}
/**
 * Request-like object for error handling
 */
interface RequestLike {
    endpoint?: string;
    url?: string;
    method?: string;
    userId?: string;
}
/**
 * Error with response property from Axios
 */
interface ErrorWithResponse extends Error {
    response?: {
        status?: number;
        statusCode?: number;
        data?: any;
    };
    request?: any;
    config?: any;
}
/**
 * Handle API errors
 * @param error - The error object
 * @param request - The request object
 * @returns Standardized error response
 */
export declare function handleApiError(error: ErrorWithResponse, request: RequestLike): ErrorResponse;
/**
 * Create standardized error response
 * @param code - Error code
 * @param message - Error message
 * @param request - Request object
 * @returns Standardized error response
 */
export declare function createErrorResponse(code: ErrorCodes, message: string, request?: RequestLike): ErrorResponse;
/**
 * Log error for monitoring and debugging
 * @param error - Error object
 * @param request - Request object
 */
export declare function logError(error: Error, request?: RequestLike): void;
/**
 * Handle HTTP errors for Express responses
 * @param res - Express response object
 * @param error - Error object
 */
export declare function handleHttpError(res: Response, error: Error | ApiError): void;
declare const _default: {
    ErrorCodes: typeof ErrorCodes;
    ApiError: typeof ApiError;
    handleApiError: typeof handleApiError;
    createErrorResponse: typeof createErrorResponse;
    logError: typeof logError;
    handleHttpError: typeof handleHttpError;
};
export default _default;
