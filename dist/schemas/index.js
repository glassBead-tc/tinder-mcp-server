"use strict";
/**
 * Schema Initialization
 *
 * Initializes and registers all schemas with the schema registry.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaManager = exports.schemaRegistry = void 0;
exports.initializeSchemas = initializeSchemas;
const registry_1 = require("./registry");
Object.defineProperty(exports, "schemaRegistry", { enumerable: true, get: function () { return registry_1.schemaRegistry; } });
const user_schema_1 = require("./common/user.schema");
const base_schema_1 = require("./common/base.schema");
const auth_schema_1 = require("./common/auth.schema");
const auth_schema_2 = require("./api/auth.schema");
const interaction_schema_1 = require("./api/interaction.schema");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Schema Registration Manager
 *
 * Provides a secure way to register schemas with consistent options
 * and prevents schema overwriting without explicit permission.
 */
class SchemaRegistrationManager {
    constructor() {
        this.registeredSchemas = new Set();
        this.initialized = false;
    }
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
    registerSchema(id, schema, category, description, options = {}) {
        // Validate schema ID format
        this.validateSchemaId(id);
        // Check if schema already exists
        const exists = this.registeredSchemas.has(id) || registry_1.schemaRegistry.hasSchema(id);
        if (exists && !options.allowOverwrite) {
            const error = new Error(`Schema with ID "${id}" already exists and overwriting is not allowed`);
            logger_1.default.error(error.message);
            throw error;
        }
        // Set default options
        const registrationOptions = {
            allowOverwrite: options.allowOverwrite || false,
            version: options.version || '1.0.0',
            description: description
        };
        // Register schema
        const result = registry_1.schemaRegistry.register(id, schema, category, registrationOptions);
        // Track registered schema
        this.registeredSchemas.add(id);
        return result;
    }
    /**
     * Validate schema ID format to prevent injection attacks
     *
     * @param id - Schema ID to validate
     * @throws Error if schema ID is invalid
     */
    validateSchemaId(id) {
        // Schema ID must be a non-empty string
        if (!id || typeof id !== 'string') {
            throw new Error('Schema ID must be a non-empty string');
        }
        // Schema ID must follow a valid pattern (alphanumeric, dots, underscores, hyphens)
        const validIdPattern = /^[a-zA-Z0-9._-]+$/;
        if (!validIdPattern.test(id)) {
            throw new Error('Schema ID contains invalid characters (only alphanumeric, dots, underscores, and hyphens are allowed)');
        }
        // Schema ID must not be too long (prevent DoS attacks)
        if (id.length > 100) {
            throw new Error('Schema ID exceeds maximum length (100 characters)');
        }
    }
    /**
     * Initialize all schemas
     *
     * This function registers all schemas with the schema registry.
     * It should be called during application startup.
     */
    initializeSchemas() {
        if (this.initialized) {
            logger_1.default.warn('Schemas already initialized');
            return;
        }
        logger_1.default.info('Initializing schemas...');
        try {
            // Register common schemas
            (0, base_schema_1.registerBaseSchemas)();
            (0, user_schema_1.registerUserSchemas)();
            (0, auth_schema_1.registerAuthDataSchemas)();
            // Register API schemas
            (0, auth_schema_2.registerAuthSchemas)();
            (0, interaction_schema_1.registerInteractionSchemas)();
            // Log registered schemas
            const schemaIds = registry_1.schemaRegistry.getAllSchemaIds();
            logger_1.default.info(`Registered ${schemaIds.length} schemas`);
            // Log schemas by category
            const apiSchemas = registry_1.schemaRegistry.getSchemasByCategory('api');
            const commonSchemas = registry_1.schemaRegistry.getSchemasByCategory('common');
            const internalSchemas = registry_1.schemaRegistry.getSchemasByCategory('internal');
            const customSchemas = registry_1.schemaRegistry.getSchemasByCategory('custom');
            logger_1.default.debug(`API Schemas: ${apiSchemas.length}`);
            logger_1.default.debug(`Common Schemas: ${commonSchemas.length}`);
            logger_1.default.debug(`Internal Schemas: ${internalSchemas.length}`);
            logger_1.default.debug(`Custom Schemas: ${customSchemas.length}`);
            this.initialized = true;
        }
        catch (error) {
            logger_1.default.error('Error initializing schemas:', error);
            throw new Error('Failed to initialize schemas');
        }
    }
    /**
     * Check if schemas have been initialized
     *
     * @returns True if schemas have been initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get all registered schema IDs
     *
     * @returns Array of registered schema IDs
     */
    getRegisteredSchemaIds() {
        return Array.from(this.registeredSchemas);
    }
}
// Create singleton instance
const schemaManager = new SchemaRegistrationManager();
exports.schemaManager = schemaManager;
// Function to initialize schemas (for backward compatibility)
function initializeSchemas() {
    schemaManager.initializeSchemas();
}
//# sourceMappingURL=index.js.map