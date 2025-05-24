"use strict";
/**
 * End-to-End Integration Tests
 *
 * Tests the complete flow of the MCP server, from authentication to API requests.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = __importDefault(require("../../services/authentication"));
const request_handler_1 = __importDefault(require("../../services/request-handler"));
const cache_manager_1 = __importDefault(require("../../services/cache-manager"));
const rate_limiter_1 = __importDefault(require("../../services/rate-limiter"));
const error_handler_1 = require("../../utils/error-handler");
const auth_1 = __importDefault(require("../../routes/auth"));
const user_1 = __importDefault(require("../../routes/user"));
const interaction_1 = __importDefault(require("../../routes/interaction"));
// Mock dependencies
jest.mock('../../services/authentication');
jest.mock('../../services/request-handler');
jest.mock('../../utils/token-store');
jest.mock('../../services/cache-manager');
jest.mock('../../services/rate-limiter');
jest.mock('../../utils/logger');
describe('End-to-End Integration Tests', () => {
    let app;
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        jest.clearAllMocks();
        // Create a new Express app for each test
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Register routes
        app.use('/mcp/auth', auth_1.default);
        app.use('/mcp/user', user_1.default);
        app.use('/mcp/interaction', interaction_1.default);
        // Error handling middleware
        app.use((err, req, res, next) => {
            (0, error_handler_1.handleHttpError)(res, err);
        });
        // Create mock request/response objects
        mockRequest = {
            body: {},
            query: {},
            params: {},
            headers: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
    });
    describe('Complete User Flow', () => {
        it('should handle the complete user flow from authentication to API requests', async () => {
            // Step 1: SMS Authentication - Request OTP
            authentication_1.default.authenticateWithSMS.mockResolvedValueOnce({
                status: 'otp_sent',
                otpLength: 6
            });
            // Execute step 1
            const phoneNumber = '+1234567890';
            await auth_1.default.sendSmsOtp({ ...mockRequest, body: { phoneNumber } }, mockResponse, mockNext);
            // Verify step 1
            expect(authentication_1.default.authenticateWithSMS).toHaveBeenCalledWith(phoneNumber, null);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    status: 'otp_sent',
                    otpLength: 6
                }
            });
            // Step 2: SMS Authentication - Validate OTP
            authentication_1.default.authenticateWithSMS.mockResolvedValueOnce({
                status: 'authenticated',
                userId: 'user-123',
                isNewUser: false
            });
            // Execute step 2
            const otpCode = '123456';
            await auth_1.default.validateSmsOtp({ ...mockRequest, body: { phoneNumber, otpCode } }, mockResponse, mockNext);
            // Verify step 2
            expect(authentication_1.default.authenticateWithSMS).toHaveBeenCalledWith(phoneNumber, otpCode);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    status: 'authenticated',
                    userId: 'user-123',
                    isNewUser: false
                }
            });
            // Step 3: Get User Profile
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                _id: 'user-123',
                name: 'Test User',
                bio: 'Test bio',
                photos: []
            });
            // Execute step 3
            const userId = 'user-123';
            await user_1.default.getUserProfile({ ...mockRequest, params: { userId } }, mockResponse, mockNext);
            // Verify step 3
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                endpoint: '/user/user-123',
                userId: 'user-123'
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    _id: 'user-123',
                    name: 'Test User',
                    bio: 'Test bio',
                    photos: []
                }
            });
            // Step 4: Get Recommendations
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                data: [
                    { _id: 'user-1', name: 'User 1' },
                    { _id: 'user-2', name: 'User 2' }
                ]
            });
            // Execute step 4
            await user_1.default.getRecommendations({ ...mockRequest, query: { userId } }, mockResponse, mockNext);
            // Verify step 4
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                endpoint: '/v2/recs/core',
                userId: 'user-123'
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            // Step 5: Like a User
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                match: false,
                likes_remaining: 99
            });
            // Execute step 5
            const targetUserId = 'target-456';
            await interaction_1.default.likeUser({ ...mockRequest, body: { userId, targetUserId } }, mockResponse, mockNext);
            // Verify step 5
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                endpoint: '/like/target-456',
                userId: 'user-123'
            }));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    match: false,
                    likes_remaining: 99
                }
            });
        });
    });
    describe('Caching Integration', () => {
        it('should cache and retrieve responses', async () => {
            // Setup
            const userId = 'user-123';
            const cacheKey = '/user/user-123::user-123';
            const cachedData = {
                _id: 'user-123',
                name: 'Test User',
                bio: 'Cached bio',
                photos: []
            };
            // Mock cache hit
            cache_manager_1.default.get.mockResolvedValueOnce(cachedData);
            // Execute request
            await user_1.default.getUserProfile({ ...mockRequest, params: { userId } }, mockResponse, mockNext);
            // Verify cache was checked and used
            expect(cache_manager_1.default.get).toHaveBeenCalled();
            expect(request_handler_1.default.processRequest).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: cachedData
            });
            // Mock cache miss and subsequent cache set
            cache_manager_1.default.get.mockResolvedValueOnce(null);
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                _id: 'user-123',
                name: 'Test User',
                bio: 'Fresh bio',
                photos: []
            });
            // Reset mocks
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();
            // Execute request again
            await user_1.default.getUserProfile({ ...mockRequest, params: { userId } }, mockResponse, mockNext);
            // Verify cache was checked, missed, and then set
            expect(cache_manager_1.default.get).toHaveBeenCalled();
            expect(request_handler_1.default.processRequest).toHaveBeenCalled();
            expect(cache_manager_1.default.set).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
    });
    describe('Rate Limiting Integration', () => {
        it('should check rate limits before processing requests', async () => {
            // Setup
            const userId = 'user-123';
            const targetUserId = 'target-456';
            // Mock rate limit check
            rate_limiter_1.default.checkRateLimit.mockResolvedValueOnce(undefined);
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                match: false,
                likes_remaining: 99
            });
            // Execute request
            await interaction_1.default.likeUser({ ...mockRequest, body: { userId, targetUserId } }, mockResponse, mockNext);
            // Verify rate limit was checked
            expect(rate_limiter_1.default.checkRateLimit).toHaveBeenCalledWith('/like/target-456', 'user-123');
            expect(request_handler_1.default.processRequest).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            // Mock rate limit exceeded
            rate_limiter_1.default.checkRateLimit.mockRejectedValueOnce({
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded',
                statusCode: 429
            });
            // Reset mocks
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();
            // Execute request again
            await interaction_1.default.likeUser({ ...mockRequest, body: { userId, targetUserId } }, mockResponse, mockNext);
            // Verify rate limit was checked and request was rejected
            expect(rate_limiter_1.default.checkRateLimit).toHaveBeenCalled();
            expect(request_handler_1.default.processRequest).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('Error Handling Integration', () => {
        it('should handle and format errors consistently', async () => {
            // Setup - authentication error
            authentication_1.default.authenticateWithSMS.mockRejectedValueOnce({
                code: 'AUTHENTICATION_FAILED',
                message: 'Invalid OTP code',
                statusCode: 401
            });
            // Execute request
            await auth_1.default.validateSmsOtp({ ...mockRequest, body: { phoneNumber: '+1234567890', otpCode: '123456' } }, mockResponse, mockNext);
            // Verify error was passed to next middleware
            expect(mockNext).toHaveBeenCalled();
            // Setup - validation error
            request_handler_1.default.processRequest.mockRejectedValueOnce({
                code: 'VALIDATION_ERROR',
                message: 'Invalid request parameters',
                statusCode: 400
            });
            // Reset mocks
            mockNext.mockClear();
            // Execute request
            await user_1.default.getUserProfile({ ...mockRequest, params: { userId: 'invalid-id' } }, mockResponse, mockNext);
            // Verify error was passed to next middleware
            expect(mockNext).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=end-to-end-integration.test.js.map