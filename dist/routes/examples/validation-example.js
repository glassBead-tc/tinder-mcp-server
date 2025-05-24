"use strict";
/**
 * Validation Example Route
 *
 * Example route demonstrating how to use the validation middleware.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_middleware_1 = require("../../middleware/validation-middleware");
const auth_schema_1 = require("../../schemas/api/auth.schema");
const user_schema_1 = require("../../schemas/common/user.schema");
const zod_1 = require("zod");
const error_handler_1 = require("../../utils/error-handler");
const types_1 = require("../../types");
// Create router
const router = express_1.default.Router();
// Example query schema
const paginationSchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).default('10'),
    sort: zod_1.z.enum(['asc', 'desc']).default('asc')
});
/**
 * @route POST /api/examples/login
 * @desc Example login route with body validation
 * @access Public
 */
router.post('/login', (0, validation_middleware_1.validateBody)(auth_schema_1.loginRequestSchema), (req, res) => {
    // Body is already validated and typed
    const { email, password, rememberMe } = req.body;
    // Example response
    res.json({
        success: true,
        message: 'Validation passed',
        data: {
            email,
            rememberMe: rememberMe || false,
            timestamp: new Date().toISOString()
        }
    });
});
/**
 * @route GET /api/examples/users
 * @desc Example users route with query validation
 * @access Public
 */
router.get('/users', (0, validation_middleware_1.validateQuery)(paginationSchema), (req, res) => {
    // Query is already validated and typed
    const { page, limit, sort } = req.query;
    // Example response
    res.json({
        success: true,
        message: 'Validation passed',
        data: {
            page,
            limit,
            sort,
            results: [],
            timestamp: new Date().toISOString()
        }
    });
});
/**
 * @route GET /api/examples/users/:userId
 * @desc Example user detail route with param validation
 * @access Public
 */
router.get('/users/:userId', (0, validation_middleware_1.validateParams)(zod_1.z.object({ userId: user_schema_1.userIdSchema })), (req, res) => {
    // Params are already validated and typed
    const { userId } = req.params;
    // Example response
    res.json({
        success: true,
        message: 'Validation passed',
        data: {
            userId,
            timestamp: new Date().toISOString()
        }
    });
});
/**
 * @route POST /api/examples/complex
 * @desc Example route with multiple validations
 * @access Public
 */
router.post('/complex/:userId', (0, validation_middleware_1.validateParams)(zod_1.z.object({ userId: user_schema_1.userIdSchema })), (0, validation_middleware_1.validateQuery)(paginationSchema), (0, validation_middleware_1.validateBody)(zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    email: zod_1.z.string().email(),
    tags: zod_1.z.array(zod_1.z.string()).min(1).max(5)
})), (req, res) => {
    // All request parts are validated
    const { userId } = req.params;
    const { page, limit, sort } = req.query;
    const { name, email, tags } = req.body;
    // Example response
    res.json({
        success: true,
        message: 'All validations passed',
        data: {
            userId,
            pagination: { page, limit, sort },
            user: { name, email, tags },
            timestamp: new Date().toISOString()
        }
    });
});
/**
 * @route POST /api/examples/error-handling
 * @desc Example route demonstrating error handling
 * @access Public
 */
router.post('/error-handling', (req, res) => {
    try {
        // Manual validation example
        const schema = zod_1.z.object({
            id: zod_1.z.string().uuid(),
            value: zod_1.z.number().positive()
        });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: result.error.format() }, 400);
        }
        res.json({
            success: true,
            data: result.data
        });
    }
    catch (error) {
        // Pass error to Express error handler
        if (error instanceof error_handler_1.ApiError) {
            res.status(error.statusCode || 500).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: {
                    code: types_1.ErrorCodes.UNKNOWN_ERROR,
                    message: 'An unexpected error occurred'
                }
            });
        }
    }
});
exports.default = router;
//# sourceMappingURL=validation-example.js.map