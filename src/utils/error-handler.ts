/**
 * Error handler utility
 * Provides error handling functionality for the application
 */

import { Response } from 'express';
import logger from './logger';
import config from '../config';
import { ErrorCodes, ErrorResponse } from '../types';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  code: ErrorCodes;
  details: any;
  statusCode?: number;

  constructor(code: ErrorCodes, message: string, details: any = null, statusCode?: number) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    this.name = 'ApiError';
    
    // Ensure instanceof works correctly in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
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
export function handleApiError(error: ErrorWithResponse, request: RequestLike): ErrorResponse {
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
      } else if (error.response.data.error && error.response.data.error.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response.data.status && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }
    
    // Map HTTP status codes to internal error codes
    let errorCode: ErrorCodes;
    switch (statusCode) {
      case 401:
        errorCode = ErrorCodes.AUTHENTICATION_FAILED;
        break;
      case 429:
        errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED;
        break;
      case 400:
        errorCode = ErrorCodes.VALIDATION_ERROR;
        break;
      default:
        errorCode = ErrorCodes.API_ERROR;
    }
    
    return createErrorResponse(errorCode, errorMessage || 'API Error', request);
  } else if (error.request) {
    // Request was made but no response received
    return createErrorResponse(
      ErrorCodes.NETWORK_ERROR,
      'Network error, no response received',
      request
    );
  } else if (error.message && error.message.includes('rate limit')) {
    // Rate limit error
    return createErrorResponse(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      error.message,
      request
    );
  } else if (error.message && error.message.includes('validation')) {
    // Validation error
    return createErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      error.message,
      request
    );
  } else {
    // Unknown error
    return createErrorResponse(
      ErrorCodes.UNKNOWN_ERROR,
      'An unknown error occurred',
      request
    );
  }
}

/**
 * Create standardized error response
 * @param code - Error code
 * @param message - Error message
 * @param request - Request object
 * @returns Standardized error response
 */
export function createErrorResponse(
  code: ErrorCodes, 
  message: string, 
  request?: RequestLike
): ErrorResponse {
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
export function logError(error: Error, request?: RequestLike): void {
  // SECURITY FIX: Only include stack traces in non-production environments
  const errorLog: Record<string, any> = {
    timestamp: new Date().toISOString(),
    endpoint: request?.endpoint || request?.url,
    method: request?.method,
    userId: request?.userId,
    error: error.message
  };
  
  // Only include stack trace in non-production environments
  if (config.NODE_ENV !== 'production') {
    errorLog.stack = error.stack;
  }
  
  logger.error(errorLog);
}

/**
 * Handle HTTP errors for Express responses
 * @param res - Express response object
 * @param error - Error object
 */
export function handleHttpError(res: Response, error: Error | ApiError): void {
  const statusCode = (error as ApiError).statusCode || 500;
  const errorResponse = error instanceof ApiError
    ? createErrorResponse(error.code, error.message, { url: res.req.url })
    : handleApiError(error as ErrorWithResponse, { url: res.req.url });
  
  res.status(statusCode).json(errorResponse);
}

export default {
  ErrorCodes,
  ApiError,
  handleApiError,
  createErrorResponse,
  logError,
  handleHttpError
};