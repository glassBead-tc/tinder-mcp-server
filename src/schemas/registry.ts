/**
 * Schema Registry
 *
 * A centralized registry for managing Zod schemas across the application.
 * Provides functionality to register, retrieve, and validate against schemas.
 */

import { z } from "zod";
import logger from "../utils/logger";

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
class SchemaRegistry {
  private schemas: Map<SchemaId, SchemaRegistryEntry>;
  private static instance: SchemaRegistry;

  private constructor() {
    this.schemas = new Map<SchemaId, SchemaRegistryEntry>();
    logger.info("Schema Registry initialized");
  }

  /**
   * Get the singleton instance of the schema registry
   */
  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

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
  private validateSchemaId(id: SchemaId): void {
    // Schema ID must be a non-empty string
    if (!id || typeof id !== "string") {
      throw new Error("Schema ID must be a non-empty string");
    }

    // Schema ID must follow a valid pattern (alphanumeric, dots, underscores, hyphens)
    const validIdPattern = /^[a-zA-Z0-9._-]+$/;
    if (!validIdPattern.test(id)) {
      throw new Error(
        "Schema ID contains invalid characters (only alphanumeric, dots, underscores, and hyphens are allowed)"
      );
    }

    // Schema ID must not be too long (prevent DoS attacks)
    if (id.length > 100) {
      throw new Error("Schema ID exceeds maximum length (100 characters)");
    }
  }

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
  public register<T extends z.ZodType>(
    id: SchemaId,
    schema: T,
    category: SchemaCategory = "custom",
    options?: SchemaRegistrationOptions | string,
    version?: string
  ): SchemaRegistryEntry {
    // Validate schema ID
    this.validateSchemaId(id);

    // Handle backward compatibility
    let registrationOptions: SchemaRegistrationOptions = {};
    if (typeof options === "string") {
      registrationOptions = {
        description: options,
        version: version,
        allowOverwrite: false,
      };
    } else if (options) {
      registrationOptions = options;
    }

    // Check if schema already exists
    if (this.schemas.has(id) && !registrationOptions.allowOverwrite) {
      const error = new Error(
        `Schema with ID "${id}" already exists and overwriting is not allowed`
      );
      logger.error(error.message);
      throw error;
    }

    const entry: SchemaRegistryEntry = {
      id,
      schema,
      category,
      description:
        typeof options === "string" ? options : registrationOptions.description,
      version: registrationOptions.version || version,
    };

    this.schemas.set(id, entry);
    logger.debug(`Registered schema: ${id} (${category})`);

    return entry;
  }

  /**
   * Get a schema by ID
   *
   * @param id - Schema ID
   * @returns The schema or undefined if not found
   */
  public getSchema(id: SchemaId): z.ZodType | undefined {
    const entry = this.schemas.get(id);
    return entry?.schema;
  }

  /**
   * Get a schema entry by ID
   *
   * @param id - Schema ID
   * @returns The schema entry or undefined if not found
   */
  public getSchemaEntry(id: SchemaId): SchemaRegistryEntry | undefined {
    return this.schemas.get(id);
  }

  /**
   * Check if a schema exists
   *
   * @param id - Schema ID
   * @returns True if the schema exists
   */
  public hasSchema(id: SchemaId): boolean {
    return this.schemas.has(id);
  }

  /**
   * Remove a schema from the registry
   *
   * @param id - Schema ID
   * @returns True if the schema was removed
   */
  public removeSchema(id: SchemaId): boolean {
    return this.schemas.delete(id);
  }

  /**
   * Get all schemas in a category
   *
   * @param category - Schema category
   * @returns Array of schema entries in the category
   */
  public getSchemasByCategory(category: SchemaCategory): SchemaRegistryEntry[] {
    return Array.from(this.schemas.values()).filter(
      (entry) => entry.category === category
    );
  }

  /**
   * Get all schema IDs
   *
   * @returns Array of all schema IDs
   */
  public getAllSchemaIds(): SchemaId[] {
    return Array.from(this.schemas.keys());
  }

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
  public validate<T>(id: SchemaId, data: unknown): T {
    // Validate schema ID
    this.validateSchemaId(id);

    const schema = this.getSchema(id);

    if (!schema) {
      throw new Error(`Schema with ID "${id}" not found`);
    }

    return schema.parse(data) as T;
  }

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
  public safeValidate<T>(
    id: SchemaId,
    data: unknown
  ): {
    success: boolean;
    data?: T;
    error?: z.ZodError;
  } {
    try {
      // Validate schema ID
      this.validateSchemaId(id);

      const schema = this.getSchema(id);

      if (!schema) {
        return {
          success: false,
          error: new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              path: [],
              message: `Schema with ID "${id}" not found`,
              input: data,
            },
          ]),
        };
      }

      const result = schema.safeParse(data);

      if (result.success) {
        return { success: true, data: result.data as T };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Handle schema ID validation errors
      return {
        success: false,
        error: new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: [],
            message:
              error instanceof Error
                ? error.message
                : "Unknown schema validation error",
            input: data,
          },
        ]),
      };
    }
  }
}

// Export the singleton instance
export const schemaRegistry = SchemaRegistry.getInstance();

// Export default for convenience
export default schemaRegistry;
