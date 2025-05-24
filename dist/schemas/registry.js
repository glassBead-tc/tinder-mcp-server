"use strict";
/**
 * Schema Registry
 *
 * A centralized registry for managing Zod schemas across the application.
 * Provides functionality to register, retrieve, and validate against schemas.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaRegistry = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Schema registry class
 */
class SchemaRegistry {
    constructor() {
        this.schemas = new Map();
        logger_1.default.info("Schema Registry initialized");
    }
    /**
     * Get the singleton instance of the schema registry
     */
    static getInstance() {
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
    validateSchemaId(id) {
        // Schema ID must be a non-empty string
        if (!id || typeof id !== "string") {
            throw new Error("Schema ID must be a non-empty string");
        }
        // Schema ID must follow a valid pattern (alphanumeric, dots, underscores, hyphens)
        const validIdPattern = /^[a-zA-Z0-9._-]+$/;
        if (!validIdPattern.test(id)) {
            throw new Error("Schema ID contains invalid characters (only alphanumeric, dots, underscores, and hyphens are allowed)");
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
    register(id, schema, category = "custom", options, version) {
        // Validate schema ID
        this.validateSchemaId(id);
        // Handle backward compatibility
        let registrationOptions = {};
        if (typeof options === "string") {
            registrationOptions = {
                description: options,
                version: version,
                allowOverwrite: false,
            };
        }
        else if (options) {
            registrationOptions = options;
        }
        // Check if schema already exists
        if (this.schemas.has(id) && !registrationOptions.allowOverwrite) {
            const error = new Error(`Schema with ID "${id}" already exists and overwriting is not allowed`);
            logger_1.default.error(error.message);
            throw error;
        }
        const entry = {
            id,
            schema,
            category,
            description: typeof options === "string" ? options : registrationOptions.description,
            version: registrationOptions.version || version,
        };
        this.schemas.set(id, entry);
        logger_1.default.debug(`Registered schema: ${id} (${category})`);
        return entry;
    }
    /**
     * Get a schema by ID
     *
     * @param id - Schema ID
     * @returns The schema or undefined if not found
     */
    getSchema(id) {
        const entry = this.schemas.get(id);
        return entry?.schema;
    }
    /**
     * Get a schema entry by ID
     *
     * @param id - Schema ID
     * @returns The schema entry or undefined if not found
     */
    getSchemaEntry(id) {
        return this.schemas.get(id);
    }
    /**
     * Check if a schema exists
     *
     * @param id - Schema ID
     * @returns True if the schema exists
     */
    hasSchema(id) {
        return this.schemas.has(id);
    }
    /**
     * Remove a schema from the registry
     *
     * @param id - Schema ID
     * @returns True if the schema was removed
     */
    removeSchema(id) {
        return this.schemas.delete(id);
    }
    /**
     * Get all schemas in a category
     *
     * @param category - Schema category
     * @returns Array of schema entries in the category
     */
    getSchemasByCategory(category) {
        return Array.from(this.schemas.values()).filter((entry) => entry.category === category);
    }
    /**
     * Get all schema IDs
     *
     * @returns Array of all schema IDs
     */
    getAllSchemaIds() {
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
    validate(id, data) {
        // Validate schema ID
        this.validateSchemaId(id);
        const schema = this.getSchema(id);
        if (!schema) {
            throw new Error(`Schema with ID "${id}" not found`);
        }
        return schema.parse(data);
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
    safeValidate(id, data) {
        try {
            // Validate schema ID
            this.validateSchemaId(id);
            const schema = this.getSchema(id);
            if (!schema) {
                return {
                    success: false,
                    error: new zod_1.z.ZodError([
                        {
                            code: zod_1.z.ZodIssueCode.custom,
                            path: [],
                            message: `Schema with ID "${id}" not found`,
                            input: data,
                        },
                    ]),
                };
            }
            const result = schema.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            }
            else {
                return { success: false, error: result.error };
            }
        }
        catch (error) {
            // Handle schema ID validation errors
            return {
                success: false,
                error: new zod_1.z.ZodError([
                    {
                        code: zod_1.z.ZodIssueCode.custom,
                        path: [],
                        message: error instanceof Error
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
exports.schemaRegistry = SchemaRegistry.getInstance();
// Export default for convenience
exports.default = exports.schemaRegistry;
//# sourceMappingURL=registry.js.map