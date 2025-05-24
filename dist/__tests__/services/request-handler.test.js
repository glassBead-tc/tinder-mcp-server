"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const request_handler_1 = __importDefault(require("../../services/request-handler"));
const authentication_1 = __importDefault(require("../../services/authentication"));
const cache_manager_1 = __importDefault(require("../../services/cache-manager"));
const rate_limiter_1 = __importDefault(require("../../services/rate-limiter"));
const logger_1 = __importDefault(require("../../utils/logger"));
const error_handler_1 = require("../../utils/error-handler");
const types_1 = require("../../types");
const validation_1 = __importDefault(require("../../utils/validation"));
const registry_1 = require("../../schemas/registry");
// Mock dependencies
jest.mock('axios');
jest.mock('../../services/authentication');
jest.mock('../../services/cache-manager');
jest.mock('../../services/rate-limiter');
jest.mock('../../utils/logger');
jest.mock('../../utils/validation');
jest.mock('../../schemas/registry');
describe('Request Handler', () => {
    // Mock axios instance
    const mockAxiosCreate = axios_1.default.create;
    const mockAxiosInstance = jest.fn();
    // Sample client request
    const sampleRequest = {
        method: 'GET',
        endpoint: '/user/123',
        userId: 'user-456'
    };
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock axios
        mockAxiosCreate.mockReturnValue(mockAxiosInstance);
        mockAxiosInstance.mockResolvedValue({
            data: { success: true }
        });
        // Mock auth service
        authentication_1.default.getValidToken.mockResolvedValue('mock-token');
        // Mock rate limiter
        rate_limiter_1.default.checkRateLimit.mockResolvedValue(undefined);
        rate_limiter_1.default.updateRateLimits.mockReturnValue(undefined);
        // Mock cache manager
        cache_manager_1.default.get.mockResolvedValue(null);
        cache_manager_1.default.set.mockResolvedValue(true);
        // Mock validation service
        validation_1.default.formatZodError.mockReturnValue('Validation error');
    });
    describe('processRequest', () => {
        it('should process GET request successfully', async () => {
            // Act
            const result = await request_handler_1.default.processRequest(sampleRequest);
            // Assert
            expect(rate_limiter_1.default.checkRateLimit).toHaveBeenCalledWith(sampleRequest.endpoint, sampleRequest.userId);
            expect(authentication_1.default.getValidToken).toHaveBeenCalledWith(sampleRequest.userId);
            expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                url: '/user/123',
                headers: expect.objectContaining({
                    'X-Auth-Token': 'mock-token'
                })
            }));
            expect(result).toEqual({ success: true });
            expect(logger_1.default.info).toHaveBeenCalledWith(`Sending GET request to /user/123`);
        });
        it('should process POST request successfully', async () => {
            // Arrange
            const postRequest = {
                method: 'POST',
                endpoint: '/like/123',
                body: { rating: 5 },
                userId: 'user-456'
            };
            // Act
            const result = await request_handler_1.default.processRequest(postRequest);
            // Assert
            expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
                method: 'POST',
                url: '/like/123',
                data: { rating: 5 }
            }));
            expect(result).toEqual({ success: true });
        });
        it('should return cached response for GET requests if available', async () => {
            // Arrange
            const cachedResponse = { success: true, cached: true };
            cache_manager_1.default.get.mockResolvedValueOnce(cachedResponse);
            // Act
            const result = await request_handler_1.default.processRequest(sampleRequest);
            // Assert
            expect(cache_manager_1.default.get).toHaveBeenCalled();
            expect(mockAxiosInstance).not.toHaveBeenCalled();
            expect(result).toEqual(cachedResponse);
            expect(logger_1.default.debug).toHaveBeenCalledWith(`Cache hit for /user/123`);
        });
        it('should cache response for GET requests', async () => {
            // Arrange
            const response = {
                data: { success: true }
            };
            mockAxiosInstance.mockResolvedValueOnce(response);
            // Act
            await request_handler_1.default.processRequest(sampleRequest);
            // Assert
            expect(cache_manager_1.default.set).toHaveBeenCalledWith(expect.any(String), response.data);
        });
        it('should not add auth token for public endpoints', async () => {
            // Arrange
            const publicRequest = {
                method: 'POST',
                endpoint: '/v2/auth/sms/send',
                body: { phone_number: '+1234567890' }
            };
            // Act
            await request_handler_1.default.processRequest(publicRequest);
            // Assert
            expect(authentication_1.default.getValidToken).not.toHaveBeenCalled();
            expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
                headers: expect.not.objectContaining({
                    'X-Auth-Token': expect.anything()
                })
            }));
        });
        it('should validate request structure', async () => {
            // Arrange
            const invalidRequest = {
                // Missing required 'method' field
                endpoint: '/user/123'
            };
            // Mock validation failure
            const mockClientRequestSchema = {
                safeParse: jest.fn().mockReturnValue({
                    success: false,
                    error: {
                        format: () => ({ errors: [{ message: 'Method is required' }] })
                    }
                })
            };
            jest.spyOn(zod_1.z, 'object').mockReturnValueOnce(mockClientRequestSchema);
            // Act & Assert
            await expect(request_handler_1.default.processRequest(invalidRequest))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance).not.toHaveBeenCalled();
        });
        it('should validate request body against endpoint-specific schema', async () => {
            // Arrange
            const postRequest = {
                method: 'POST',
                endpoint: '/like/123',
                body: { invalid: true },
                userId: 'user-456'
            };
            // Mock schema registry
            const mockSchema = {
                safeParse: jest.fn().mockReturnValue({
                    success: false,
                    error: {
                        format: () => ({ errors: [{ message: 'Invalid request body' }] })
                    }
                })
            };
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockSchema);
            // Act & Assert
            await expect(request_handler_1.default.processRequest(postRequest))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance).not.toHaveBeenCalled();
        });
        it('should handle API error responses', async () => {
            // Arrange
            const errorResponse = {
                response: {
                    status: 401,
                    data: {
                        error: 'Unauthorized',
                        message: 'Invalid token'
                    }
                }
            };
            mockAxiosInstance.mockRejectedValueOnce(errorResponse);
            // Act & Assert
            await expect(request_handler_1.default.processRequest(sampleRequest))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(authentication_1.default.removeToken).toHaveBeenCalledWith(sampleRequest.userId);
        });
        it('should handle network errors', async () => {
            // Arrange
            const networkError = {
                code: 'ECONNABORTED',
                message: 'Request timeout'
            };
            mockAxiosInstance.mockRejectedValueOnce(networkError);
            // Act & Assert
            await expect(request_handler_1.default.processRequest(sampleRequest))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(logger_1.default.error).toHaveBeenCalled();
        });
        it('should handle rate limit errors', async () => {
            // Arrange
            rate_limiter_1.default.checkRateLimit.mockRejectedValueOnce(new error_handler_1.ApiError(types_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', { resetAt: Date.now() + 60000 }, 429));
            // Act & Assert
            await expect(request_handler_1.default.processRequest(sampleRequest))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance).not.toHaveBeenCalled();
        });
        it('should update rate limits from response', async () => {
            // Arrange
            const response = {
                data: { success: true },
                headers: {
                    'x-rate-limit-remaining': '10',
                    'x-rate-limit-reset': '60'
                }
            };
            mockAxiosInstance.mockResolvedValueOnce(response);
            // Act
            await request_handler_1.default.processRequest(sampleRequest);
            // Assert
            expect(rate_limiter_1.default.updateRateLimits).toHaveBeenCalledWith(sampleRequest.endpoint, response, sampleRequest.userId);
        });
        it('should add standard headers to request', async () => {
            // Act
            await request_handler_1.default.processRequest(sampleRequest);
            // Assert
            expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
                headers: expect.objectContaining({
                    'app-version': expect.any(String),
                    'platform': 'web',
                    'content-type': 'application/json',
                    'x-supported-image-formats': expect.any(String)
                })
            }));
        });
        it('should implement retry logic for 5xx errors', async () => {
            // Arrange
            const serverError = {
                response: {
                    status: 503,
                    data: {
                        error: 'Service Unavailable'
                    }
                },
                config: {}
            };
            // First call fails, second succeeds
            mockAxiosInstance
                .mockRejectedValueOnce(serverError)
                .mockResolvedValueOnce({
                data: { success: true, retried: true }
            });
            // Mock setTimeout
            jest.useFakeTimers();
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = jest.fn((callback) => {
                callback();
                return 1;
            });
            // Act
            const result = await request_handler_1.default.processRequest(sampleRequest);
            // Assert
            expect(mockAxiosInstance).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ success: true, retried: true });
            // Restore setTimeout
            global.setTimeout = originalSetTimeout;
            jest.useRealTimers();
        });
    });
    describe('validateRequest', () => {
        it('should validate user ID for like endpoint', async () => {
            // Arrange
            const likeRequest = {
                method: 'GET',
                endpoint: '/like/invalid-id',
                userId: 'user-456'
            };
            // Mock UUID validation failure
            const mockUuidSchema = {
                safeParse: jest.fn().mockReturnValue({
                    success: false,
                    error: {
                        format: () => ({ errors: [{ message: 'Invalid UUID format' }] })
                    }
                })
            };
            jest.spyOn(zod_1.z, 'object').mockReturnValueOnce({
                safeParse: jest.fn().mockReturnValue({ success: true })
            });
            // Mock base schema
            jest.mock('../../schemas/common/base.schema', () => ({
                uuidString: mockUuidSchema
            }));
            // Act & Assert
            await expect(request_handler_1.default.processRequest(likeRequest))
                .rejects.toThrow(error_handler_1.ApiError);
            expect(mockAxiosInstance).not.toHaveBeenCalled();
        });
    });
    describe('isCacheable', () => {
        it('should cache user profile requests', async () => {
            // Arrange
            const userRequest = {
                method: 'GET',
                endpoint: '/user/123',
                userId: 'user-456'
            };
            // Act
            await request_handler_1.default.processRequest(userRequest);
            // Assert
            expect(cache_manager_1.default.set).toHaveBeenCalled();
        });
        it('should cache recommendation requests', async () => {
            // Arrange
            const recsRequest = {
                method: 'GET',
                endpoint: '/v2/recs/core',
                userId: 'user-456'
            };
            // Act
            await request_handler_1.default.processRequest(recsRequest);
            // Assert
            expect(cache_manager_1.default.set).toHaveBeenCalled();
        });
        it('should not cache non-GET requests', async () => {
            // Arrange
            const postRequest = {
                method: 'POST',
                endpoint: '/like/123',
                body: { rating: 5 },
                userId: 'user-456'
            };
            // Act
            await request_handler_1.default.processRequest(postRequest);
            // Assert
            expect(cache_manager_1.default.set).not.toHaveBeenCalled();
        });
        it('should not cache non-cacheable endpoints', async () => {
            // Arrange
            const nonCacheableRequest = {
                method: 'GET',
                endpoint: '/matches/123',
                userId: 'user-456'
            };
            // Act
            await request_handler_1.default.processRequest(nonCacheableRequest);
            // Assert
            expect(cache_manager_1.default.set).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=request-handler.test.js.map