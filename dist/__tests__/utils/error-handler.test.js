"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_handler_1 = require("../../utils/error-handler");
const types_1 = require("../../types");
const logger_1 = __importDefault(require("../../utils/logger"));
// Mock dependencies
jest.mock('../../utils/logger');
describe('Error Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('ApiError', () => {
        it('should create an ApiError with all properties', () => {
            // Arrange
            const code = types_1.ErrorCodes.VALIDATION_ERROR;
            const message = 'Validation failed';
            const details = { field: 'username', error: 'Required' };
            const statusCode = 400;
            // Act
            const error = new error_handler_1.ApiError(code, message, details, statusCode);
            // Assert
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(error_handler_1.ApiError);
            expect(error.code).toBe(code);
            expect(error.message).toBe(message);
            expect(error.details).toEqual(details);
            expect(error.statusCode).toBe(statusCode);
            expect(error.name).toBe('ApiError');
        });
        it('should create an ApiError with default values', () => {
            // Arrange
            const code = types_1.ErrorCodes.UNKNOWN_ERROR;
            const message = 'Unknown error';
            // Act
            const error = new error_handler_1.ApiError(code, message);
            // Assert
            expect(error.code).toBe(code);
            expect(error.message).toBe(message);
            expect(error.details).toBeNull();
            expect(error.statusCode).toBeUndefined();
        });
        it('should work with instanceof checks', () => {
            // Arrange
            const error = new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'Validation failed');
            // Act & Assert
            expect(error instanceof error_handler_1.ApiError).toBe(true);
            expect(error instanceof Error).toBe(true);
        });
    });
    describe('handleApiError', () => {
        it('should handle API error responses', () => {
            // Arrange
            const error = {
                response: {
                    status: 401,
                    data: {
                        error: 'Unauthorized',
                        message: 'Invalid token'
                    }
                }
            };
            const request = { endpoint: '/user/123', method: 'GET' };
            // Act
            const result = (0, error_handler_1.handleApiError)(error, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code: types_1.ErrorCodes.AUTHENTICATION_FAILED,
                    message: 'Unauthorized',
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
            expect(logger_1.default.error).toHaveBeenCalled();
        });
        it('should handle API error responses with different error formats', () => {
            // Arrange
            const error = {
                response: {
                    status: 400,
                    data: {
                        status: 'error',
                        message: 'Bad request'
                    }
                }
            };
            const request = { endpoint: '/user/123', method: 'GET' };
            // Act
            const result = (0, error_handler_1.handleApiError)(error, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code: types_1.ErrorCodes.VALIDATION_ERROR,
                    message: 'Bad request',
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
        it('should handle network errors', () => {
            // Arrange
            const error = {
                request: {},
                message: 'Network error'
            };
            const request = { endpoint: '/user/123', method: 'GET' };
            // Act
            const result = (0, error_handler_1.handleApiError)(error, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code: types_1.ErrorCodes.NETWORK_ERROR,
                    message: 'Network error, no response received',
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
        it('should handle rate limit errors', () => {
            // Arrange
            const error = {
                message: 'Too many requests, rate limit exceeded'
            };
            const request = { endpoint: '/user/123', method: 'GET' };
            // Act
            const result = (0, error_handler_1.handleApiError)(error, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code: types_1.ErrorCodes.UNKNOWN_ERROR,
                    message: 'An unknown error occurred',
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
        it('should handle validation errors', () => {
            // Arrange
            const error = {
                message: 'validation failed for field'
            };
            const request = { endpoint: '/user/123', method: 'GET' };
            // Act
            const result = (0, error_handler_1.handleApiError)(error, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code: types_1.ErrorCodes.VALIDATION_ERROR,
                    message: 'validation failed for field',
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
        it('should handle unknown errors', () => {
            // Arrange
            const error = new Error('Something went wrong');
            const request = { endpoint: '/user/123', method: 'GET' };
            // Act
            const result = (0, error_handler_1.handleApiError)(error, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code: types_1.ErrorCodes.UNKNOWN_ERROR,
                    message: 'An unknown error occurred',
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
    });
    describe('createErrorResponse', () => {
        it('should create an error response with all properties', () => {
            // Arrange
            const code = types_1.ErrorCodes.VALIDATION_ERROR;
            const message = 'Validation failed';
            const request = { endpoint: '/user/123' };
            // Act
            const result = (0, error_handler_1.createErrorResponse)(code, message, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code,
                    message,
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
        it('should create an error response without request', () => {
            // Arrange
            const code = types_1.ErrorCodes.UNKNOWN_ERROR;
            const message = 'Unknown error';
            // Act
            const result = (0, error_handler_1.createErrorResponse)(code, message);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code,
                    message,
                    endpoint: undefined,
                    timestamp: expect.any(Number)
                }
            });
        });
        it('should use url from request if endpoint is not available', () => {
            // Arrange
            const code = types_1.ErrorCodes.VALIDATION_ERROR;
            const message = 'Validation failed';
            const request = { url: '/user/123' };
            // Act
            const result = (0, error_handler_1.createErrorResponse)(code, message, request);
            // Assert
            expect(result).toEqual({
                success: false,
                error: {
                    code,
                    message,
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
    });
    describe('logError', () => {
        it('should log error with request details', () => {
            // Arrange
            const error = new Error('Something went wrong');
            const request = {
                endpoint: '/user/123',
                method: 'GET',
                userId: 'user-456'
            };
            // Act
            (0, error_handler_1.logError)(error, request);
            // Assert
            expect(logger_1.default.error).toHaveBeenCalledWith({
                timestamp: expect.any(String),
                endpoint: '/user/123',
                method: 'GET',
                userId: 'user-456',
                error: 'Something went wrong',
                stack: error.stack
            });
        });
        it('should log error without request details', () => {
            // Arrange
            const error = new Error('Something went wrong');
            // Act
            (0, error_handler_1.logError)(error);
            // Assert
            expect(logger_1.default.error).toHaveBeenCalledWith({
                timestamp: expect.any(String),
                endpoint: undefined,
                method: undefined,
                userId: undefined,
                error: 'Something went wrong',
                stack: error.stack
            });
        });
    });
    describe('handleHttpError', () => {
        it('should handle ApiError and send response', () => {
            // Arrange
            const error = new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'Validation failed', { field: 'username', error: 'Required' }, 400);
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                req: { url: '/user/123' }
            };
            // Act
            (0, error_handler_1.handleHttpError)(res, error);
            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: types_1.ErrorCodes.VALIDATION_ERROR,
                    message: 'Validation failed',
                    endpoint: '/user/123',
                    timestamp: expect.any(Number)
                }
            });
        });
        it('should handle regular Error and send response', () => {
            // Arrange
            const error = new Error('Something went wrong');
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                req: { url: '/user/123' }
            };
            // Act
            (0, error_handler_1.handleHttpError)(res, error);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: expect.objectContaining({
                    code: types_1.ErrorCodes.UNKNOWN_ERROR,
                    message: 'An unknown error occurred',
                    endpoint: '/user/123'
                })
            });
        });
        it('should use statusCode from ApiError', () => {
            // Arrange
            const error = new error_handler_1.ApiError(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', null, 429);
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                req: { url: '/user/123' }
            };
            // Act
            (0, error_handler_1.handleHttpError)(res, error);
            // Assert
            expect(res.status).toHaveBeenCalledWith(429);
        });
    });
});
//# sourceMappingURL=error-handler.test.js.map