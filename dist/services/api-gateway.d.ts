/**
 * API Gateway Service
 * Handles MCP server tools and resources
 */
import { McpTool, McpResource } from '../types';
/**
 * API Gateway class
 * Manages MCP server tools and resources
 */
declare class ApiGateway {
    private tools;
    private resources;
    constructor();
    /**
     * Register available tools
     */
    private registerTools;
    /**
     * Register available resources
     */
    private registerResources;
    /**
     * Register a tool
     * @param tool - Tool to register
     */
    registerTool(tool: McpTool): void;
    /**
     * Register a resource
     * @param resource - Resource to register
     */
    registerResource(resource: McpResource): void;
    /**
     * Execute a tool
     * @param toolName - Name of the tool to execute
     * @param params - Tool parameters
     * @returns Tool execution result
     */
    executeTool(toolName: string, params: any): Promise<any>;
    /**
     * Get a resource
     * @param resourceId - Resource ID
     * @returns Resource data
     */
    getResource(resourceId: string): Promise<any>;
    /**
     * Get all available tools
     * @returns List of available tools
     */
    getAvailableTools(): Array<{
        name: string;
        description: string;
    }>;
    /**
     * Get all available resources
     * @returns List of available resources
     */
    getAvailableResources(): Array<{
        id: string;
        type: string;
    }>;
}
declare const _default: ApiGateway;
export default _default;
