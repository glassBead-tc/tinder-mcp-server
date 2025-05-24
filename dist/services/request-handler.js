"use strict";
/**
 * Request Handler Service
 * Processes incoming requests and forwards them to the Tinder API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const error_handler_1 = require("../utils/error-handler");
const types_1 = require("../types");
const authentication_1 = __importDefault(require("./authentication"));
const cache_manager_1 = __importDefault(require("./cache-manager"));
const rate_limiter_1 = __importDefault(require("./rate-limiter"));
const validation_1 = __importDefault(require("../utils/validation"));
const registry_1 = require("../schemas/registry");
const base_schema_1 = __importDefault(require("../schemas/common/base.schema"));
const sanitizer_1 = require("../utils/sanitizer");
/**
 * UUID regex pattern for validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Client request schema
 */
const clientRequestSchema = zod_1.z.object({
    method: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    endpoint: zod_1.z.string().min(1),
    headers: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    body: zod_1.z.any().optional(),
    params: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()])).optional(),
    userId: zod_1.z.string().regex(UUID_REGEX, 'Invalid UUID format').optional()
});
/**
 * Endpoint-specific schemas
 */
const endpointSchemas = {
    '/v2/auth/sms/send': registry_1.schemaRegistry.getSchema('auth.sms.request') || zod_1.z.any(),
    '/v2/auth/sms/validate': registry_1.schemaRegistry.getSchema('auth.otpVerification.request') || zod_1.z.any(),
    '/v2/auth/login/sms': registry_1.schemaRegistry.getSchema('auth.refreshToken.request') || zod_1.z.any(),
    '/v2/auth/login/facebook': registry_1.schemaRegistry.getSchema('auth.facebook.request') || zod_1.z.any(),
    '/v2/auth/verify-captcha': zod_1.z.object({
        captcha_input: zod_1.z.string().min(1),
        vendor: zod_1.z.enum(['arkose', 'recaptcha'])
    }),
    '/like': registry_1.schemaRegistry.getSchema('interaction.like.request') || zod_1.z.any(),
    '/pass': registry_1.schemaRegistry.getSchema('interaction.pass.request') || zod_1.z.any(),
    '/superlike': registry_1.schemaRegistry.getSchema('interaction.superLike.request') || zod_1.z.any(),
    '/boost': zod_1.z.object({}), // Boost endpoint doesn't require body
    '/user': zod_1.z.object({}), // GET user profile doesn't require body
    '/v2/recs/core': zod_1.z.object({}) // GET recommendations doesn't require body
};
/**
 * Request Handler class
 * Processes client requests and forwards them to Tinder API
 */
class RequestHandler {
    constructor() {
        this.baseUrl = config_1.default.TINDER_API.BASE_URL;
        this.httpClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config_1.default.TINDER_API.TIMEOUT
        });
        // Configure retry logic
        this.httpClient.interceptors.response.use(null, async (error) => {
            const config = error.config;
            // Only retry on network errors or 5xx errors
            if (!config || !config.retry || config.retry >= (config.maxRetries || 0) ||
                (error.response && error.response.status < 500)) {
                return Promise.reject(error);
            }
            // Set retry count
            config.retry = config.retry ? config.retry + 1 : 1;
            // Exponential backoff
            const delay = Math.pow(2, config.retry) * 1000;
            logger_1.default.info(`Retrying request to ${config.url} (attempt ${config.retry})`);
            // Delay and retry
            return new Promise(resolve => setTimeout(() => resolve(this.httpClient(config)), delay));
        });
    }
    /**
     * Process client request and forward to Tinder API
     * @param clientRequest - Client request object
     * @returns API response
     */
    async processRequest(clientRequest) {
        try {
            // Validate request structure
            this.validateRequest(clientRequest);
            // Check request body size
            if (clientRequest.body) {
                const bodySize = JSON.stringify(clientRequest.body).length;
                const maxSize = 100 * 1024; // 100KB
                if (bodySize > maxSize) {
                    throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Request body size exceeds maximum allowed size of ${maxSize} bytes`, { size: bodySize, maxSize }, 413);
                }
            }
            // Sanitize request body and params to prevent injection attacks
            if (clientRequest.body) {
                clientRequest.body = (0, sanitizer_1.sanitizeRequestBody)(clientRequest.body);
            }
            if (clientRequest.params) {
                clientRequest.params = (0, sanitizer_1.sanitizeRequestBody)(clientRequest.params);
            }
            // Validate request body against endpoint-specific schema if available
            this.validateRequestBody(clientRequest);
            // Check rate limits
            await rate_limiter_1.default.checkRateLimit(clientRequest.endpoint, clientRequest.userId);
            // Check if authentication is required
            if (this.requiresAuthentication(clientRequest.endpoint) && clientRequest.userId) {
                // Get token or refresh if needed
                const token = await authentication_1.default.getValidToken(clientRequest.userId);
                clientRequest.headers = clientRequest.headers || {};
                clientRequest.headers['X-Auth-Token'] = token;
            }
            // Add standard headers
            this.addStandardHeaders(clientRequest);
            // Check cache for GET requests
            if (clientRequest.method === 'GET' && this.isCacheable(clientRequest.endpoint)) {
                const cachedResponse = await cache_manager_1.default.get(this.getCacheKey(clientRequest));
                if (cachedResponse) {
                    logger_1.default.debug(`Cache hit for ${clientRequest.endpoint}`);
                    return cachedResponse;
                }
            }
            // Prepare request config
            const requestConfig = {
                method: clientRequest.method,
                url: clientRequest.endpoint,
                headers: clientRequest.headers,
                data: clientRequest.body,
                params: clientRequest.params,
                maxRetries: config_1.default.TINDER_API.MAX_RETRIES
            };
            // Send request to Tinder API
            logger_1.default.info(`Sending ${clientRequest.method} request to ${clientRequest.endpoint}`);
            const response = await this.httpClient(requestConfig);
            // Cache response if applicable
            if (clientRequest.method === 'GET' && this.isCacheable(clientRequest.endpoint)) {
                await cache_manager_1.default.set(this.getCacheKey(clientRequest), response.data);
            }
            // Update rate limit info
            rate_limiter_1.default.updateRateLimits(clientRequest.endpoint, response, clientRequest.userId);
            // Decrement rate limit counter for successful actions
            if (clientRequest.userId && response.status >= 200 && response.status < 300) {
                rate_limiter_1.default.decrementRateLimit(clientRequest.endpoint, clientRequest.userId);
            }
            return response.data;
        }
        catch (error) {
            logger_1.default.error(`Request processing error: ${error.message}`);
            if (error.response) {
                // Handle API error responses
                const statusCode = error.response.status;
                // Handle authentication errors
                if (statusCode === 401 && clientRequest.userId) {
                    logger_1.default.warn(`Authentication failed for user ${clientRequest.userId}, removing token`);
                    // Remove invalid token
                    authentication_1.default.removeToken(clientRequest.userId);
                }
                throw new error_handler_1.ApiError(this.mapStatusCodeToErrorCode(statusCode), error.response.data?.message || 'API request failed', error.response.data, statusCode);
            }
            else if (error.code === 'ECONNABORTED') {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.NETWORK_ERROR, 'Request timeout', { timeout: config_1.default.TINDER_API.TIMEOUT }, 408);
            }
            else {
                throw error; // Re-throw other errors
            }
        }
    }
    /**
     * Validate client request structure
     * @param request - Client request
     * @throws {ApiError} If validation fails
     */
    validateRequest(request) {
        // Use Zod to validate the request structure
        const result = clientRequestSchema.safeParse(request);
        if (!result.success) {
            const errorMessage = validation_1.default.formatZodError(result.error);
            throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid request: ${errorMessage}`, { details: result.error.issues }, 400);
        }
        // Additional endpoint-specific validations
        if (request.endpoint.includes('/like/') && request.method === 'GET') {
            // Validate user ID for like endpoint
            const userId = request.endpoint.split('/like/')[1];
            if (!userId) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'User ID is required for like endpoint', null, 400);
            }
            // Validate UUID format
            const uuidResult = base_schema_1.default.uuidString.safeParse(userId);
            if (!uuidResult.success) {
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, 'Invalid user ID format', { details: uuidResult.error.issues }, 400);
            }
        }
    }
    /**
     * Validate request body against endpoint-specific schema
     * @param request - Client request
     * @throws {ApiError} If validation fails
     */
    validateRequestBody(request) {
        // Skip validation for GET requests or if no body is provided
        if (request.method === 'GET' || !request.body) {
            return;
        }
        // Find matching schema for the endpoint
        const schema = this.findSchemaForEndpoint(request.endpoint);
        if (schema) {
            const result = schema.safeParse(request.body);
            if (!result.success) {
                const errorMessage = validation_1.default.formatZodError(result.error);
                throw new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, `Invalid request body: ${errorMessage}`, { details: result.error.issues }, 400);
            }
            // Replace request body with validated data
            request.body = result.data;
        }
    }
    /**
     * Find schema for endpoint
     * @param endpoint - API endpoint
     * @returns Schema or undefined
     */
    findSchemaForEndpoint(endpoint) {
        // Check for exact match
        if (endpoint in endpointSchemas) {
            return endpointSchemas[endpoint];
        }
        // Check for pattern match
        for (const [pattern, schema] of Object.entries(endpointSchemas)) {
            if (endpoint.includes(pattern)) {
                return schema;
            }
        }
        return undefined;
    }
    /**
     * Check if endpoint requires authentication
     * @param endpoint - API endpoint
     * @returns True if authentication is required
     */
    requiresAuthentication(endpoint) {
        // List of endpoints that don't require authentication
        const publicEndpoints = [
            '/v2/auth/sms/send',
            '/v2/auth/sms/validate',
            '/v2/auth/login/sms',
            '/v2/auth/login/facebook',
            '/v2/auth/verify-captcha'
        ];
        return !publicEndpoints.some(e => endpoint.startsWith(e));
    }
    /**
     * Add standard headers to request
     * @param request - Client request
     */
    addStandardHeaders(request) {
        request.headers = {
            ...request.headers,
            'app-version': '1020345',
            'platform': 'web',
            'content-type': 'application/json',
            'x-supported-image-formats': 'webp,jpeg',
            'user-agent': 'Tinder/1020345 (web) MCP-Server/1.0.0'
        };
    }
    /**
     * Check if endpoint response is cacheable
     * @param endpoint - API endpoint
     * @returns True if cacheable
     */
    isCacheable(endpoint) {
        // List of endpoints that can be cached
        const cacheableEndpoints = [
            '/user/',
            '/v2/recs/core'
        ];
        return cacheableEndpoints.some(e => endpoint.startsWith(e));
    }
    /**
     * Generate cache key for request
     * @param request - Client request
     * @returns Cache key
     */
    getCacheKey(request) {
        return `${request.endpoint}:${JSON.stringify(request.params || {})}:${request.userId || 'anonymous'}`;
    }
    /**
     * Map HTTP status code to internal error code
     * @param statusCode - HTTP status code
     * @returns Internal error code
     */
    mapStatusCodeToErrorCode(statusCode) {
        switch (statusCode) {
            case 401:
                return types_1.ErrorCodes.AUTHENTICATION_FAILED;
            case 429:
                return types_1.ErrorCodes.RATE_LIMIT_EXCEEDED;
            case 400:
                return types_1.ErrorCodes.VALIDATION_ERROR;
            default:
                return types_1.ErrorCodes.API_ERROR;
        }
    }
}
// Export singleton instance
exports.default = new RequestHandler();
//# sourceMappingURL=request-handler.js.map