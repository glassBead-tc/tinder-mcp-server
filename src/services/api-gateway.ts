/**
 * API Gateway Service
 * Handles MCP server tools and resources
 */

import logger from '../utils/logger';
import { ApiError } from '../utils/error-handler';
import { ErrorCodes, McpTool, McpResource } from '../types';
import requestHandler from './request-handler';
import authService from './authentication';
import cacheManager from './cache-manager';
import rateLimiter from './rate-limiter';

/**
 * API Gateway class
 * Manages MCP server tools and resources
 */
class ApiGateway {
  private tools: Map<string, McpTool>;
  private resources: Map<string, McpResource>;

  constructor() {
    this.tools = new Map<string, McpTool>();
    this.resources = new Map<string, McpResource>();
    
    // Register tools
    this.registerTools();
    
    // Register resources
    this.registerResources();
    
    logger.info('API Gateway initialized');
  }

  /**
   * Register available tools
   */
  private registerTools(): void {
    // Authentication tools
    this.registerTool({
      name: 'authenticate_sms',
      description: 'Authenticate user with SMS',
      execute: async (params: any) => {
        const { phoneNumber, otpCode } = params;
        return await authService.authenticateWithSMS(phoneNumber, otpCode);
      }
    });

    this.registerTool({
      name: 'authenticate_facebook',
      description: 'Authenticate user with Facebook',
      execute: async (params: any) => {
        const { facebookToken } = params;
        return await authService.authenticateWithFacebook(facebookToken);
      }
    });

    this.registerTool({
      name: 'verify_captcha',
      description: 'Verify CAPTCHA response',
      execute: async (params: any) => {
        const { captchaInput, vendor } = params;
        return await authService.verifyCaptcha(captchaInput, vendor);
      }
    });

    // User interaction tools
    this.registerTool({
      name: 'like_user',
      description: 'Like a user profile',
      execute: async (params: any) => {
        const { userId, targetUserId } = params;
        return await requestHandler.processRequest({
          method: 'GET',
          endpoint: `/like/${targetUserId}`,
          userId: userId
        });
      }
    });

    this.registerTool({
      name: 'super_like_user',
      description: 'Super like a user profile',
      execute: async (params: any) => {
        const { userId, targetUserId } = params;
        return await requestHandler.processRequest({
          method: 'POST',
          endpoint: `/like/${targetUserId}/super`,
          userId: userId
        });
      }
    });

    this.registerTool({
      name: 'pass_user',
      description: 'Pass on a user profile',
      execute: async (params: any) => {
        const { userId, targetUserId } = params;
        return await requestHandler.processRequest({
          method: 'GET',
          endpoint: `/pass/${targetUserId}`,
          userId: userId
        });
      }
    });

    this.registerTool({
      name: 'boost_profile',
      description: 'Boost user profile visibility',
      execute: async (params: any) => {
        const { userId } = params;
        return await requestHandler.processRequest({
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
      execute: async (params: any) => {
        const { userId, targetUserId } = params;
        return await requestHandler.processRequest({
          method: 'GET',
          endpoint: `/user/${targetUserId || userId}`,
          userId: userId
        });
      }
    });

    this.registerTool({
      name: 'get_recommendations',
      description: 'Get potential matches',
      execute: async (params: any) => {
        const { userId } = params;
        return await requestHandler.processRequest({
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
        await cacheManager.clear();
        return { success: true, message: 'Cache cleared' };
      }
    });

    // Rate limit tools
    this.registerTool({
      name: 'get_rate_limits',
      description: 'Get rate limit information',
      execute: async (params: any) => {
        const { userId } = params;
        const userLimits = userId ? rateLimiter.getUserRateLimits(userId) : null;
        const globalLimits = rateLimiter.getGlobalRateLimits();
        
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
  private registerResources(): void {
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
  public registerTool(tool: McpTool): void {
    this.tools.set(tool.name, tool);
    logger.info(`Registered tool: ${tool.name}`);
  }

  /**
   * Register a resource
   * @param resource - Resource to register
   */
  public registerResource(resource: McpResource): void {
    this.resources.set(resource.id, resource);
    logger.info(`Registered resource: ${resource.id}`);
  }

  /**
   * Execute a tool
   * @param toolName - Name of the tool to execute
   * @param params - Tool parameters
   * @returns Tool execution result
   */
  public async executeTool(toolName: string, params: any): Promise<any> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Tool not found: ${toolName}`,
        null,
        404
      );
    }
    
    logger.info(`Executing tool: ${toolName}`);
    
    try {
      return await tool.execute(params);
    } catch (error) {
      logger.error(`Tool execution error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get a resource
   * @param resourceId - Resource ID
   * @returns Resource data
   */
  public async getResource(resourceId: string): Promise<any> {
    const resource = this.resources.get(resourceId);
    
    if (!resource) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Resource not found: ${resourceId}`,
        null,
        404
      );
    }
    
    logger.info(`Accessing resource: ${resourceId}`);
    
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
  public getAvailableTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description
    }));
  }

  /**
   * Get all available resources
   * @returns List of available resources
   */
  public getAvailableResources(): Array<{ id: string; type: string }> {
    return Array.from(this.resources.values()).map(resource => ({
      id: resource.id,
      type: resource.type
    }));
  }
}

// Export singleton instance
export default new ApiGateway();