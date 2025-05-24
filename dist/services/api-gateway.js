"use strict";
/**
 * API Gateway Service
 * Handles MCP server tools and resources
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const error_handler_1 = require("../utils/error-handler");
const types_1 = require("../types");
const request_handler_1 = __importDefault(require("./request-handler"));
const authentication_1 = __importDefault(require("./authentication"));
const cache_manager_1 = __importDefault(require("./cache-manager"));
const rate_limiter_1 = __importDefault(require("./rate-limiter"));
/**
 * API Gateway class
 * Manages MCP server tools and resources
 */
class ApiGateway {
    constructor() {
        this.tools = new Map();
        this.resources = new Map();
        // Register tools
        this.registerTools();
        // Register resources
        this.registerResources();
        logger_1.default.info('API Gateway initialized');
    }
    /**
     * Register available tools
     */
    registerTools() {
        // Authentication tools
        this.registerTool({
            name: 'authenticate_sms',
            description: 'Authenticate user with SMS',
            execute: async (params) => {
                const { phoneNumber, otpCode } = params;
                return await authentication_1.default.authenticateWithSMS(phoneNumber, otpCode);
            }
        });
        this.registerTool({
            name: 'authenticate_facebook',
            description: 'Authenticate user with Facebook',
            execute: async (params) => {
                const { facebookToken } = params;
                return await authentication_1.default.authenticateWithFacebook(facebookToken);
            }
        });
        this.registerTool({
            name: 'verify_captcha',
            description: 'Verify CAPTCHA response',
            execute: async (params) => {
                const { captchaInput, vendor } = params;
                return await authentication_1.default.verifyCaptcha(captchaInput, vendor);
            }
        });
        // User interaction tools
        this.registerTool({
            name: 'like_user',
            description: 'Like a user profile',
            execute: async (params) => {
                const { userId, targetUserId } = params;
                return await request_handler_1.default.processRequest({
                    method: 'GET',
                    endpoint: `/like/${targetUserId}`,
                    userId: userId
                });
            }
        });
        this.registerTool({
            name: 'super_like_user',
            description: 'Super like a user profile',
            execute: async (params) => {
                const { userId, targetUserId } = params;
                return await request_handler_1.default.processRequest({
                    method: 'POST',
                    endpoint: `/like/${targetUserId}/super`,
                    userId: userId
                });
            }
        });
        this.registerTool({
            name: 'pass_user',
            description: 'Pass on a user profile',
            execute: async (params) => {
                const { userId, targetUserId } = params;
                return await request_handler_1.default.processRequest({
                    method: 'GET',
                    endpoint: `/pass/${targetUserId}`,
                    userId: userId
                });
            }
        });
        this.registerTool({
            name: 'boost_profile',
            description: 'Boost user profile visibility',
            execute: async (params) => {
                const { userId } = params;
                return await request_handler_1.default.processRequest({
                    method: 'POST',
                    endpoint: '/boost',
                    userId: userId
                });
            }
        });
        // User data tools
        this.registerTool({
            name: 'get_user_profile',
            description: 'Get user profile information',
            execute: async (params) => {
                const { userId, targetUserId } = params;
                return await request_handler_1.default.processRequest({
                    method: 'GET',
                    endpoint: `/user/${targetUserId || userId}`,
                    userId: userId
                });
            }
        });
        this.registerTool({
            name: 'get_recommendations',
            description: 'Get potential matches',
            execute: async (params) => {
                const { userId } = params;
                return await request_handler_1.default.processRequest({
                    method: 'GET',
                    endpoint: '/v2/recs/core',
                    userId: userId
                });
            }
        });
        // Cache management tools
        this.registerTool({
            name: 'clear_cache',
            description: 'Clear cache',
            execute: async () => {
                await cache_manager_1.default.clear();
                return { success: true, message: 'Cache cleared' };
            }
        });
        // Rate limit tools
        this.registerTool({
            name: 'get_rate_limits',
            description: 'Get rate limit information',
            execute: async (params) => {
                const { userId } = params;
                const userLimits = userId ? rate_limiter_1.default.getUserRateLimits(userId) : null;
                const globalLimits = rate_limiter_1.default.getGlobalRateLimits();
                return {
                    userLimits,
                    globalLimits
                };
            }
        });
    }
    /**
     * Register available resources
     */
    registerResources() {
        // API documentation resource
        this.registerResource({
            id: 'api-docs',
            type: 'documentation',
            data: {
                title: 'Tinder API Documentation',
                version: '1.0.0',
                description: 'Documentation for the Tinder API MCP Server',
                endpoints: [
                    {
                        path: '/v2/auth/sms/send',
                        method: 'POST',
                        description: 'Send SMS verification code'
                    },
                    {
                        path: '/v2/auth/sms/validate',
                        method: 'POST',
                        description: 'Validate SMS verification code'
                    },
                    {
                        path: '/v2/auth/login/sms',
                        method: 'POST',
                        description: 'Login with SMS'
                    },
                    {
                        path: '/v2/auth/login/facebook',
                        method: 'POST',
                        description: 'Login with Facebook'
                    },
                    {
                        path: '/v2/auth/verify-captcha',
                        method: 'POST',
                        description: 'Verify CAPTCHA'
                    },
                    {
                        path: '/like/{user_id}',
                        method: 'GET',
                        description: 'Like a user'
                    },
                    {
                        path: '/like/{user_id}/super',
                        method: 'POST',
                        description: 'Super like a user'
                    },
                    {
                        path: '/pass/{user_id}',
                        method: 'GET',
                        description: 'Pass on a user'
                    },
                    {
                        path: '/boost',
                        method: 'POST',
                        description: 'Boost profile'
                    },
                    {
                        path: '/user/{user_id}',
                        method: 'GET',
                        description: 'Get user profile'
                    },
                    {
                        path: '/v2/recs/core',
                        method: 'GET',
                        description: 'Get recommendations'
                    }
                ]
            }
        });
        // Server status resource
        this.registerResource({
            id: 'server-status',
            type: 'status',
            data: {
                status: 'online',
                version: '1.0.0',
                uptime: () => process.uptime()
            }
        });
    }
    /**
     * Register a tool
     * @param tool - Tool to register
     */
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        logger_1.default.info(`Registered tool: ${tool.name}`);
    }
    /**
     * Register a resource
     * @param resource - Resource to register
     */
    registerResource(resource) {
        this.resources.set(resource.id, resource);
        logger_1.default.info(`Registered resource: ${resource.id}`);
    }
    /**
     * Execute a tool
     * @param toolName - Name of the tool to execute
     * @param params - Tool parameters
     * @returns Tool execution result
     */
    async executeTool(toolName, params) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Tool not found: ${toolName}`, null, 404);
        }
        logger_1.default.info(`Executing tool: ${toolName}`);
        try {
            return await tool.execute(params);
        }
        catch (error) {
            logger_1.default.error(`Tool execution error: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get a resource
     * @param resourceId - Resource ID
     * @returns Resource data
     */
    async getResource(resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Resource not found: ${resourceId}`, null, 404);
        }
        logger_1.default.info(`Accessing resource: ${resourceId}`);
        // Handle dynamic data
        const data = { ...resource.data };
        // Process any function values
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'function') {
                data[key] = data[key]();
            }
        });
        return {
            id: resource.id,
            type: resource.type,
            data
        };
    }
    /**
     * Get all available tools
     * @returns List of available tools
     */
    getAvailableTools() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description
        }));
    }
    /**
     * Get all available resources
     * @returns List of available resources
     */
    getAvailableResources() {
        return Array.from(this.resources.values()).map(resource => ({
            id: resource.id,
            type: resource.type
        }));
    }
}
// Export singleton instance
exports.default = new ApiGateway();
//# sourceMappingURL=api-gateway.js.map