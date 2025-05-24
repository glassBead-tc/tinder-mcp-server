"use strict";
/**
 * Authentication Routes
 * Handles authentication-related endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const error_handler_1 = require("../utils/error-handler");
const authentication_1 = __importDefault(require("../services/authentication"));
const validation_middleware_1 = require("../middleware/validation-middleware");
const base_schema_1 = __importDefault(require("../schemas/common/base.schema"));
// Create router
const router = express_1.default.Router();
/**
 * Send SMS verification code
 * POST /mcp/auth/sms/send
 */
router.post('/sms/send', (0, validation_middleware_1.validateBody)('auth.sms.request'), async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const result = await authentication_1.default.authenticateWithSMS(phoneNumber);
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
 * Validate SMS verification code
 * POST /mcp/auth/sms/validate
 */
router.post('/sms/validate', (0, validation_middleware_1.validateBody)('auth.otpVerification.request'), async (req, res) => {
    try {
        const { phoneNumber, otpCode } = req.body;
        const result = await authentication_1.default.authenticateWithSMS(phoneNumber, otpCode);
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
 * Authenticate with Facebook
 * POST /mcp/auth/facebook
 */
router.post('/facebook', (0, validation_middleware_1.validateBody)('auth.facebook.request'), async (req, res) => {
    try {
        const { accessToken } = req.body;
        const result = await authentication_1.default.authenticateWithFacebook(accessToken);
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
 * Verify CAPTCHA
 * POST /mcp/auth/captcha
 */
router.post('/captcha', (0, validation_middleware_1.validateBody)(
// Inline schema for CAPTCHA verification
zod_1.z.object({
    captchaInput: base_schema_1.default.nonEmptyString,
    vendor: base_schema_1.default.nonEmptyString.refine((val) => ['arkose', 'recaptcha'].includes(val), { message: 'Vendor must be either "arkose" or "recaptcha"' })
})), async (req, res) => {
    try {
        const { captchaInput, vendor } = req.body;
        const result = await authentication_1.default.verifyCaptcha(captchaInput, vendor);
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
 * Refresh authentication token
 * POST /mcp/auth/refresh
 */
router.post('/refresh', (0, validation_middleware_1.validateBody)('auth.refreshToken.request'), async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'User ID is required in x-user-id header'
                }
            });
        }
        const token = await authentication_1.default.refreshToken(userId);
        res.json({
            success: true,
            data: {
                token,
                refreshToken: refreshToken,
                expiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
            }
        });
    }
    catch (error) {
        return (0, error_handler_1.handleHttpError)(res, error);
    }
});
/**
 * Logout
 * POST /mcp/auth/logout
 */
router.post('/logout', (0, validation_middleware_1.validateBody)('auth.logout.request'), async (req, res) => {
    try {
        // We're not using sessionId and allSessions yet, but they're validated by the schema
        // const { sessionId, allSessions } = req.body;
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'User ID is required in x-user-id header'
                }
            });
        }
        // For now, just remove the token
        const success = authentication_1.default.removeToken(userId);
        res.json({
            success: true,
            data: {
                status: success ? 'success' : 'error',
                message: success ? 'Successfully logged out' : 'Failed to logout'
            }
        });
    }
    catch (error) {
        return (0, error_handler_1.handleHttpError)(res, error);
    }
});
/**
 * Password reset request
 * POST /mcp/auth/password-reset
 */
router.post('/password-reset', (0, validation_middleware_1.validateBody)('auth.passwordReset.request'), async (req, res) => {
    try {
        const { email } = req.body;
        // In a real implementation, this would send a password reset email
        // For now, just log the request
        logger_1.default.info(`Password reset requested for email: ${email}`);
        res.json({
            success: true,
            data: {
                status: 'success',
                message: 'Password reset instructions sent to your email'
            }
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
/**
 * Password reset confirmation
 * POST /mcp/auth/password-reset/confirm
 */
router.post('/password-reset/confirm', (0, validation_middleware_1.validateBody)('auth.passwordReset.confirm'), async (req, res) => {
    try {
        const { token } = req.body;
        // In a real implementation, this would verify the token and update the password
        // For now, just log the request
        logger_1.default.info(`Password reset confirmation with token: ${token.substring(0, 8)}...`);
        res.json({
            success: true,
            data: {
                status: 'success',
                message: 'Password has been reset successfully'
            }
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map