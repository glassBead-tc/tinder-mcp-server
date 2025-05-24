/**
 * Request Handler Service
 * Processes incoming requests and forwards them to the Tinder API
 */
import { ClientRequest } from '../types';
/**
 * Request Handler class
 * Processes client requests and forwards them to Tinder API
 */
declare class RequestHandler {
    private baseUrl;
    private httpClient;
    constructor();
    /**
     * Process client request and forward to Tinder API
     * @param clientRequest - Client request object
     * @returns API response
     */
    processRequest(clientRequest: ClientRequest): Promise<any>;
    /**
     * Validate client request structure
     * @param request - Client request
     * @throws {ApiError} If validation fails
     */
    private validateRequest;
    /**
     * Validate request body against endpoint-specific schema
     * @param request - Client request
     * @throws {ApiError} If validation fails
     */
    private validateRequestBody;
    /**
     * Find schema for endpoint
     * @param endpoint - API endpoint
     * @returns Schema or undefined
     */
    private findSchemaForEndpoint;
    /**
     * Check if endpoint requires authentication
     * @param endpoint - API endpoint
     * @returns True if authentication is required
     */
    private requiresAuthentication;
    /**
     * Add standard headers to request
     * @param request - Client request
     */
    private addStandardHeaders;
    /**
     * Check if endpoint response is cacheable
     * @param endpoint - API endpoint
     * @returns True if cacheable
     */
    private isCacheable;
    /**
     * Generate cache key for request
     * @param request - Client request
     * @returns Cache key
     */
    private getCacheKey;
    /**
     * Map HTTP status code to internal error code
     * @param statusCode - HTTP status code
     * @returns Internal error code
     */
    private mapStatusCodeToErrorCode;
}
declare const _default: RequestHandler;
export default _default;
