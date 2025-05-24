/**
 * Request Handler Service
 * Processes incoming requests and forwards them to the Tinder API
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { z } from 'zod';
import config from '../config';
import logger from '../utils/logger';
import { ApiError } from '../utils/error-handler';
import { ErrorCodes, ClientRequest } from '../types';
import authService from './authentication';
import cacheManager from './cache-manager';
import rateLimiter from './rate-limiter';
import validationService from '../utils/validation';
import { schemaRegistry } from '../schemas/registry';
import baseSchema from '../schemas/common/base.schema';
import { sanitizeRequestBody } from '../utils/sanitizer';

/**
 * UUID regex pattern for validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Client request schema
 */
const clientRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  endpoint: z.string().min(1),
  headers: z.record(z.string(), z.unknown()).optional(),
  body: z.any().optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  userId: z.string().regex(UUID_REGEX, 'Invalid UUID format').optional()
});

/**
 * Endpoint-specific schemas
 */
const endpointSchemas: Record<string, z.ZodType> = {
  '/v2/auth/sms/send': schemaRegistry.getSchema('auth.sms.request') || z.any(),
  '/v2/auth/sms/validate': schemaRegistry.getSchema('auth.otpVerification.request') || z.any(),
  '/v2/auth/login/sms': schemaRegistry.getSchema('auth.refreshToken.request') || z.any(),
  '/v2/auth/login/facebook': schemaRegistry.getSchema('auth.facebook.request') || z.any(),
  '/v2/auth/verify-captcha': z.object({
    captcha_input: z.string().min(1),
    vendor: z.enum(['arkose', 'recaptcha'])
  }),
  '/like': schemaRegistry.getSchema('interaction.like.request') || z.any(),
  '/pass': schemaRegistry.getSchema('interaction.pass.request') || z.any(),
  '/superlike': schemaRegistry.getSchema('interaction.superLike.request') || z.any(),
  '/boost': z.object({}), // Boost endpoint doesn't require body
  '/user': z.object({}), // GET user profile doesn't require body
  '/v2/recs/core': z.object({}) // GET recommendations doesn't require body
};

/**
 * Request Handler class
 * Processes client requests and forwards them to Tinder API
 */
class RequestHandler {
  private baseUrl: string;
  private httpClient: AxiosInstance;

  constructor() {
    this.baseUrl = config.TINDER_API.BASE_URL;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: config.TINDER_API.TIMEOUT
    });
    
    // Configure retry logic
    this.httpClient.interceptors.response.use(null, async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { retry?: number; maxRetries?: number };
      
      // Only retry on network errors or 5xx errors
      if (!config || !config.retry || config.retry >= (config.maxRetries || 0) || 
          (error.response && error.response.status < 500)) {
        return Promise.reject(error);
      }
      
      // Set retry count
      config.retry = config.retry ? config.retry + 1 : 1;
      
      // Exponential backoff
      const delay = Math.pow(2, config.retry) * 1000;
      
      logger.info(`Retrying request to ${config.url} (attempt ${config.retry})`);
      
      // Delay and retry
      return new Promise(resolve => setTimeout(() => resolve(this.httpClient(config)), delay));
    });
  }

  /**
   * Process client request and forward to Tinder API
   * @param clientRequest - Client request object
   * @returns API response
   */
  public async processRequest(clientRequest: ClientRequest): Promise<any> {
    try {
      // Validate request structure
      this.validateRequest(clientRequest);
      
      // Check request body size
      if (clientRequest.body) {
        const bodySize = JSON.stringify(clientRequest.body).length;
        const maxSize = 100 * 1024; // 100KB
        if (bodySize > maxSize) {
          throw new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            `Request body size exceeds maximum allowed size of ${maxSize} bytes`,
            { size: bodySize, maxSize },
            413
          );
        }
      }
      
      // Sanitize request body and params to prevent injection attacks
      if (clientRequest.body) {
        clientRequest.body = sanitizeRequestBody(clientRequest.body);
      }
      if (clientRequest.params) {
        clientRequest.params = sanitizeRequestBody(clientRequest.params);
      }
      
      // Validate request body against endpoint-specific schema if available
      this.validateRequestBody(clientRequest);
      
      // Check rate limits
      await rateLimiter.checkRateLimit(clientRequest.endpoint, clientRequest.userId);
      
      // Check if authentication is required
      if (this.requiresAuthentication(clientRequest.endpoint) && clientRequest.userId) {
        // Get token or refresh if needed
        const token = await authService.getValidToken(clientRequest.userId);
        clientRequest.headers = clientRequest.headers || {};
        clientRequest.headers['X-Auth-Token'] = token;
      }
      
      // Add standard headers
      this.addStandardHeaders(clientRequest);
      
      // Check cache for GET requests
      if (clientRequest.method === 'GET' && this.isCacheable(clientRequest.endpoint)) {
        const cachedResponse = await cacheManager.get(this.getCacheKey(clientRequest));
        if (cachedResponse) {
          logger.debug(`Cache hit for ${clientRequest.endpoint}`);
          return cachedResponse;
        }
      }
      
      // Prepare request config
      const requestConfig: AxiosRequestConfig & { maxRetries?: number } = {
        method: clientRequest.method,
        url: clientRequest.endpoint,
        headers: clientRequest.headers,
        data: clientRequest.body,
        params: clientRequest.params,
        maxRetries: config.TINDER_API.MAX_RETRIES
      };
      
      // Send request to Tinder API
      logger.info(`Sending ${clientRequest.method} request to ${clientRequest.endpoint}`);
      const response = await this.httpClient(requestConfig);
      
      // Cache response if applicable
      if (clientRequest.method === 'GET' && this.isCacheable(clientRequest.endpoint)) {
        await cacheManager.set(this.getCacheKey(clientRequest), response.data);
      }
      
      // Update rate limit info
      rateLimiter.updateRateLimits(clientRequest.endpoint, response, clientRequest.userId);
      
      // Decrement rate limit counter for successful actions
      if (clientRequest.userId && response.status >= 200 && response.status < 300) {
        rateLimiter.decrementRateLimit(clientRequest.endpoint, clientRequest.userId);
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Request processing error: ${(error as Error).message}`);
      
      if ((error as AxiosError).response) {
        // Handle API error responses
        const statusCode = (error as AxiosError).response!.status;
        
        // Handle authentication errors
        if (statusCode === 401 && clientRequest.userId) {
          logger.warn(`Authentication failed for user ${clientRequest.userId}, removing token`);
          // Remove invalid token
          authService.removeToken(clientRequest.userId);
        }
        
        throw new ApiError(
          this.mapStatusCodeToErrorCode(statusCode),
          ((error as AxiosError).response!.data as any)?.message || 'API request failed',
          (error as AxiosError).response!.data,
          statusCode
        );
      } else if ((error as AxiosError).code === 'ECONNABORTED') {
        throw new ApiError(
          ErrorCodes.NETWORK_ERROR,
          'Request timeout',
          { timeout: config.TINDER_API.TIMEOUT },
          408
        );
      } else {
        throw error; // Re-throw other errors
      }
    }
  }

  /**
   * Validate client request structure
   * @param request - Client request
   * @throws {ApiError} If validation fails
   */
  private validateRequest(request: ClientRequest): void {
    // Use Zod to validate the request structure
    const result = clientRequestSchema.safeParse(request);
    
    if (!result.success) {
      const errorMessage = validationService.formatZodError(result.error);
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid request: ${errorMessage}`,
        { details: result.error.issues },
        400
      );
    }
    
    // Additional endpoint-specific validations
    if (request.endpoint.includes('/like/') && request.method === 'GET') {
      // Validate user ID for like endpoint
      const userId = request.endpoint.split('/like/')[1];
      if (!userId) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'User ID is required for like endpoint',
          null,
          400
        );
      }
      
      // Validate UUID format
      const uuidResult = baseSchema.uuidString.safeParse(userId);
      if (!uuidResult.success) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid user ID format',
          { details: uuidResult.error.issues },
          400
        );
      }
    }
  }

  /**
   * Validate request body against endpoint-specific schema
   * @param request - Client request
   * @throws {ApiError} If validation fails
   */
  private validateRequestBody(request: ClientRequest): void {
    // Skip validation for GET requests or if no body is provided
    if (request.method === 'GET' || !request.body) {
      return;
    }
    
    // Find matching schema for the endpoint
    const schema = this.findSchemaForEndpoint(request.endpoint);
    
    if (schema) {
      const result = schema.safeParse(request.body);
      
      if (!result.success) {
        const errorMessage = validationService.formatZodError(result.error);
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          `Invalid request body: ${errorMessage}`,
          { details: result.error.issues },
          400
        );
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
  private findSchemaForEndpoint(endpoint: string): z.ZodType | undefined {
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
  private requiresAuthentication(endpoint: string): boolean {
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
  private addStandardHeaders(request: ClientRequest): void {
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
  private isCacheable(endpoint: string): boolean {
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
  private getCacheKey(request: ClientRequest): string {
    return `${request.endpoint}:${JSON.stringify(request.params || {})}:${request.userId || 'anonymous'}`;
  }

  /**
   * Map HTTP status code to internal error code
   * @param statusCode - HTTP status code
   * @returns Internal error code
   */
  private mapStatusCodeToErrorCode(statusCode: number): ErrorCodes {
    switch (statusCode) {
      case 401:
        return ErrorCodes.AUTHENTICATION_FAILED;
      case 429:
        return ErrorCodes.RATE_LIMIT_EXCEEDED;
      case 400:
        return ErrorCodes.VALIDATION_ERROR;
      default:
        return ErrorCodes.API_ERROR;
    }
  }
}

// Export singleton instance
export default new RequestHandler();