/**
 * Schema Registry
 *
 * A centralized registry for managing Zod schemas across the application.
 * Provides functionality to register, retrieve, and validate against schemas.
 */
import { z } from "zod";
/**
 * Schema registry type definitions
 */
export type SchemaId = string;
export type SchemaCategory = "api" | "common" | "internal" | "custom";
/**
 * Schema registration options
 */
export interface SchemaRegistrationOptions {
    /**
     * Allow overwriting an existing schema
     * Default: false
     */
    allowOverwrite?: boolean;
    /**
     * Schema version
     */
    version?: string;
    /**
     * Schema description
     */
    description?: string;
}
/**
 * Schema registry entry interface
 */
export interface SchemaRegistryEntry {
    id: SchemaId;
    schema: z.ZodType;
    category: SchemaCategory;
    description?: string;
    version?: string;
}
/**
 * Schema registry class
 */
declare class SchemaRegistry {
    private schemas;
    private static instance;
    private constructor();
    /**
     * Get the singleton instance of the schema registry
     */
    static getInstance(): SchemaRegistry;
    /**
     * Register a schema with the registry
     *
     * @param id - Unique identifier for the schema
     * @param schema - Zod schema
     * @param category - Schema category
     * @param description - Optional description
     * @param version - Optional version
     * @returns The registered schema entry
     */
    /**
     * Validate a schema ID to prevent injection attacks
     *
     * @param id - Schema ID to validate
     * @throws Error if the schema ID is invalid
     */
    private validateSchemaId;
    /**
     * Register a schema with the registry
     *
     * @param id - Unique identifier for the schema
     * @param schema - Zod schema
     * @param category - Schema category
     * @param options - Registration options or description (for backward compatibility)
     * @param version - Optional version (for backward compatibility)
     * @returns The registered schema entry
     * @throws Error if schema ID is invalid or if attempting to overwrite without permission
     */
    register<T extends z.ZodType>(id: SchemaId, schema: T, category?: SchemaCategory, options?: SchemaRegistrationOptions | string, version?: string): SchemaRegistryEntry;
    /**
     * Get a schema by ID
     *
     * @param id - Schema ID
     * @returns The schema or undefined if not found
     */
    getSchema(id: SchemaId): z.ZodType | undefined;
    /**
     * Get a schema entry by ID
     *
     * @param id - Schema ID
     * @returns The schema entry or undefined if not found
     */
    getSchemaEntry(id: SchemaId): SchemaRegistryEntry | undefined;
    /**
     * Check if a schema exists
     *
     * @param id - Schema ID
     * @returns True if the schema exists
     */
    hasSchema(id: SchemaId): boolean;
    /**
     * Remove a schema from the registry
     *
     * @param id - Schema ID
     * @returns True if the schema was removed
     */
    removeSchema(id: SchemaId): boolean;
    /**
     * Get all schemas in a category
     *
     * @param category - Schema category
     * @returns Array of schema entries in the category
     */
    getSchemasByCategory(category: SchemaCategory): SchemaRegistryEntry[];
    /**
     * Get all schema IDs
     *
     * @returns Array of all schema IDs
     */
    getAllSchemaIds(): SchemaId[];
    /**
     * Validate data against a schema
     *
     * @param id - Schema ID
     * @param data - Data to validate
     * @returns Parsed data or throws an error
     */
    /**
     * Validate data against a schema
     *
     * @param id - Schema ID
     * @param data - Data to validate
     * @returns Parsed data or throws an error
     * @throws Error if schema not found or validation fails
     */
    validate<T>(id: SchemaId, data: unknown): T;
    /**
     * Safe validate data against a schema
     *
     * @param id - Schema ID
     * @param data - Data to validate
     * @returns Result object with success flag and parsed data or error
     */
    /**
     * Safe validate data against a schema
     *
     * @param id - Schema ID
     * @param data - Data to validate
     * @returns Result object with success flag and parsed data or error
     */
    safeValidate<T>(id: SchemaId, data: unknown): {
        success: boolean;
        data?: T;
        error?: z.ZodError;
    };
}
export declare const schemaRegistry: SchemaRegistry;
export default schemaRegistry;
