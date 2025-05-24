"use strict";
/**
 * API Endpoints Integration Tests
 *
 * Tests the integration between routes, request handler, and authentication.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const auth_1 = __importDefault(require("../../routes/auth"));
const user_1 = __importDefault(require("../../routes/user"));
const interaction_1 = __importDefault(require("../../routes/interaction"));
const error_handler_1 = require("../../utils/error-handler");
const authentication_1 = __importDefault(require("../../services/authentication"));
const request_handler_1 = __importDefault(require("../../services/request-handler"));
// Mock dependencies
jest.mock('../../services/authentication');
jest.mock('../../services/request-handler');
jest.mock('../../utils/logger');
describe('API Endpoints Integration Tests', () => {
    let app;
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
    });
    describe('Authentication Endpoints', () => {
        it('should handle SMS authentication request', async () => {
            // Mock authentication service
            authentication_1.default.authenticateWithSMS.mockResolvedValueOnce({
                status: 'otp_sent',
                otpLength: 6
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/auth/sms/send')
                .send({ phoneNumber: '+1234567890' });
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    status: 'otp_sent',
                    otpLength: 6
                }
            });
            expect(authentication_1.default.authenticateWithSMS).toHaveBeenCalledWith('+1234567890', null);
        });
        it('should handle SMS validation request', async () => {
            // Mock authentication service
            authentication_1.default.authenticateWithSMS.mockResolvedValueOnce({
                status: 'authenticated',
                userId: 'user-123',
                isNewUser: false
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/auth/sms/validate')
                .send({
                phoneNumber: '+1234567890',
                otpCode: '123456'
            });
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    status: 'authenticated',
                    userId: 'user-123',
                    isNewUser: false
                }
            });
            expect(authentication_1.default.authenticateWithSMS).toHaveBeenCalledWith('+1234567890', '123456');
        });
        it('should handle Facebook authentication request', async () => {
            // Mock authentication service
            authentication_1.default.authenticateWithFacebook.mockResolvedValueOnce({
                status: 'authenticated',
                userId: 'user-123'
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/auth/facebook')
                .send({ facebookToken: 'mock-facebook-token' });
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    status: 'authenticated',
                    userId: 'user-123'
                }
            });
            expect(authentication_1.default.authenticateWithFacebook).toHaveBeenCalledWith('mock-facebook-token');
        });
        it('should handle authentication errors', async () => {
            // Mock authentication service to throw error
            authentication_1.default.authenticateWithSMS.mockRejectedValueOnce(new Error('Authentication failed'));
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/auth/sms/send')
                .send({ phoneNumber: '+1234567890' });
            // Verify response
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
    describe('User Endpoints', () => {
        it('should get user profile', async () => {
            // Mock request handler
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                _id: 'user-123',
                name: 'Test User',
                bio: 'Test bio',
                photos: []
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .get('/mcp/user/user-123')
                .set('Authorization', 'Bearer mock-token');
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    _id: 'user-123',
                    name: 'Test User',
                    bio: 'Test bio',
                    photos: []
                }
            });
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                endpoint: '/user/user-123',
                userId: 'user-123'
            }));
        });
        it('should get recommendations', async () => {
            // Mock request handler
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                data: [
                    { _id: 'user-1', name: 'User 1' },
                    { _id: 'user-2', name: 'User 2' }
                ]
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .get('/mcp/user/recommendations')
                .set('Authorization', 'Bearer mock-token')
                .query({ userId: 'user-123' });
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    data: [
                        { _id: 'user-1', name: 'User 1' },
                        { _id: 'user-2', name: 'User 2' }
                    ]
                }
            });
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                endpoint: '/v2/recs/core',
                userId: 'user-123'
            }));
        });
    });
    describe('Interaction Endpoints', () => {
        it('should like a user', async () => {
            // Mock request handler
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                match: false,
                likes_remaining: 99
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/interaction/like')
                .send({
                userId: 'user-123',
                targetUserId: 'target-456'
            });
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    match: false,
                    likes_remaining: 99
                }
            });
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                endpoint: '/like/target-456',
                userId: 'user-123'
            }));
        });
        it('should pass on a user', async () => {
            // Mock request handler
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                status: 'success'
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/interaction/pass')
                .send({
                userId: 'user-123',
                targetUserId: 'target-456'
            });
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    status: 'success'
                }
            });
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                endpoint: '/pass/target-456',
                userId: 'user-123'
            }));
        });
        it('should super like a user', async () => {
            // Mock request handler
            request_handler_1.default.processRequest.mockResolvedValueOnce({
                match: true,
                super_likes: {
                    remaining: 4,
                    resets_at: '2023-01-01T00:00:00Z'
                }
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/interaction/superlike')
                .send({
                userId: 'user-123',
                targetUserId: 'target-456'
            });
            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    match: true,
                    super_likes: {
                        remaining: 4,
                        resets_at: '2023-01-01T00:00:00Z'
                    }
                }
            });
            expect(request_handler_1.default.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                method: 'POST',
                endpoint: '/like/target-456/super',
                userId: 'user-123'
            }));
        });
    });
    describe('Error Handling', () => {
        it('should handle validation errors', async () => {
            // Make request with invalid data
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/auth/sms/send')
                .send({}); // Missing required phoneNumber
            // Verify response
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
        it('should handle rate limit errors', async () => {
            // Mock request handler to throw rate limit error
            request_handler_1.default.processRequest.mockRejectedValueOnce({
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded',
                statusCode: 429
            });
            // Make request
            const response = await (0, supertest_1.default)(app)
                .post('/mcp/interaction/like')
                .send({
                userId: 'user-123',
                targetUserId: 'target-456'
            });
            // Verify response
            expect(response.status).toBe(429);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });
    });
});
//# sourceMappingURL=api-endpoints-integration.test.js.map