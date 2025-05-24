"use strict";
/**
 * User Routes
 * Handles user-related endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const error_handler_1 = require("../utils/error-handler");
const request_handler_1 = __importDefault(require("../services/request-handler"));
const error_handler_2 = require("../utils/error-handler");
const types_1 = require("../types");
// Create router
const router = express_1.default.Router();
/**
 * Get user profile
 * GET /mcp/user/:userId
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'GET',
            endpoint: `/user/${userId}`,
            userId: authUserId
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
/**
 * Get user recommendations
 * GET /mcp/user/recommendations
 */
router.get('/recommendations', async (req, res) => {
    try {
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'GET',
            endpoint: '/v2/recs/core',
            userId: authUserId
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
/**
 * Update user profile
 * PUT /mcp/user/profile
 */
router.put('/profile', async (req, res) => {
    try {
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const profileData = req.body;
        const result = await request_handler_1.default.processRequest({
            method: 'PUT',
            endpoint: '/profile',
            userId: authUserId,
            body: profileData
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
/**
 * Get user matches
 * GET /mcp/user/matches
 */
router.get('/matches', async (req, res) => {
    try {
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'GET',
            endpoint: '/v2/matches',
            userId: authUserId,
            params: {
                count: req.query.count || 60,
                message: req.query.message || 1
            }
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map