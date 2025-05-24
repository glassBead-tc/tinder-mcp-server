/**
 * Schema Initialization
 *
 * Initializes and registers all schemas with the schema registry.
 */
import { schemaRegistry, SchemaId, SchemaCategory, SchemaRegistrationOptions, SchemaRegistryEntry } from './registry';
import { z } from 'zod';
/**
 * Schema Registration Manager
 *
 * Provides a secure way to register schemas with consistent options
 * and prevents schema overwriting without explicit permission.
 */
declare class SchemaRegistrationManager {
    private registeredSchemas;
    private initialized;
    /**
     * Register a schema with security checks
     *
     * @param id - Schema ID
     * @param schema - Zod schema
     * @param category - Schema category
     * @param description - Schema description
     * @param options - Registration options
     * @returns The registered schema
     */
    registerSchema<T extends z.ZodType>(id: SchemaId, schema: T, category: SchemaCategory, description: string, options?: Partial<SchemaRegistrationOptions>): SchemaRegistryEntry;
    /**
     * Validate schema ID format to prevent injection attacks
     *
     * @param id - Schema ID to validate
     * @throws Error if schema ID is invalid
     */
    private validateSchemaId;
    /**
     * Initialize all schemas
     *
     * This function registers all schemas with the schema registry.
     * It should be called during application startup.
     */
    initializeSchemas(): void;
    /**
     * Check if schemas have been initialized
     *
     * @returns True if schemas have been initialized
     */
    isInitialized(): boolean;
    /**
     * Get all registered schema IDs
     *
     * @returns Array of registered schema IDs
     */
    getRegisteredSchemaIds(): SchemaId[];
}
declare const schemaManager: SchemaRegistrationManager;
declare function initializeSchemas(): void;
export { schemaRegistry, schemaManager, initializeSchemas };
