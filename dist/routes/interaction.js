"use strict";
/**
 * Interaction Routes
 * Handles user interaction endpoints
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
 * Like a user
 * POST /mcp/interaction/like/:targetUserId
 */
router.post('/like/:targetUserId', async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'GET',
            endpoint: `/like/${targetUserId}`,
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
 * Super like a user
 * POST /mcp/interaction/superlike/:targetUserId
 */
router.post('/superlike/:targetUserId', async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'POST',
            endpoint: `/like/${targetUserId}/super`,
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
 * Pass on a user
 * POST /mcp/interaction/pass/:targetUserId
 */
router.post('/pass/:targetUserId', async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'GET',
            endpoint: `/pass/${targetUserId}`,
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
 * Boost profile
 * POST /mcp/interaction/boost
 */
router.post('/boost', async (req, res) => {
    try {
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'POST',
            endpoint: '/boost',
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
 * Send message
 * POST /mcp/interaction/message/:matchId
 */
router.post('/message/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { message } = req.body;
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        if (!message) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'Message content is required', null, 400);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'POST',
            endpoint: `/user/matches/${matchId}`,
            userId: authUserId,
            body: {
                message
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
/**
 * Get messages for a match
 * GET /mcp/interaction/messages/:matchId
 */
router.get('/messages/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const authUserId = req.headers['x-auth-user-id'];
        if (!authUserId) {
            throw new error_handler_2.ApiError(types_1.ErrorCodes.AUTHENTICATION_FAILED, 'Authentication required', null, 401);
        }
        const result = await request_handler_1.default.processRequest({
            method: 'GET',
            endpoint: `/v2/matches/${matchId}/messages`,
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
exports.default = router;
//# sourceMappingURL=interaction.js.map