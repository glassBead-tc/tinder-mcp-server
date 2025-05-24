/**
 * Schema Initialization
 * 
 * Initializes and registers all schemas with the schema registry.
 */

import { schemaRegistry, SchemaId, SchemaCategory, SchemaRegistrationOptions, SchemaRegistryEntry } from './registry';
import { registerUserSchemas } from './common/user.schema';
import { registerBaseSchemas } from './common/base.schema';
import { registerAuthDataSchemas } from './common/auth.schema';
import { registerAuthSchemas } from './api/auth.schema';
import { registerInteractionSchemas } from './api/interaction.schema';
import logger from '../utils/logger';
import { z } from 'zod';

/**
 * Schema Registration Manager
 *
 * Provides a secure way to register schemas with consistent options
 * and prevents schema overwriting without explicit permission.
 */
class SchemaRegistrationManager {
  private registeredSchemas: Set<SchemaId> = new Set();
  private initialized: boolean = false;
  
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
  public registerSchema<T extends z.ZodType>(
    id: SchemaId,
    schema: T,
    category: SchemaCategory,
    description: string,
    options: Partial<SchemaRegistrationOptions> = {}
  ): SchemaRegistryEntry {
    // Validate schema ID format
    this.validateSchemaId(id);
    
    // Check if schema already exists
    const exists = this.registeredSchemas.has(id) || schemaRegistry.hasSchema(id);
    
    if (exists && !options.allowOverwrite) {
      const error = new Error(`Schema with ID "${id}" already exists and overwriting is not allowed`);
      logger.error(error.message);
      throw error;
    }
    
    // Set default options
    const registrationOptions: SchemaRegistrationOptions = {
      allowOverwrite: options.allowOverwrite || false,
      version: options.version || '1.0.0',
      description: description
    };
    
    // Register schema
    const result = schemaRegistry.register(id, schema, category, registrationOptions);
    
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
  private validateSchemaId(id: SchemaId): void {
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
  public initializeSchemas(): void {
    if (this.initialized) {
      logger.warn('Schemas already initialized');
      return;
    }
    
    logger.info('Initializing schemas...');
    
    try {
      // Register common schemas
      registerBaseSchemas();
      registerUserSchemas();
      registerAuthDataSchemas();
      
      // Register API schemas
      registerAuthSchemas();
      registerInteractionSchemas();
      
      // Log registered schemas
      const schemaIds = schemaRegistry.getAllSchemaIds();
      logger.info(`Registered ${schemaIds.length} schemas`);
      
      // Log schemas by category
      const apiSchemas = schemaRegistry.getSchemasByCategory('api');
      const commonSchemas = schemaRegistry.getSchemasByCategory('common');
      const internalSchemas = schemaRegistry.getSchemasByCategory('internal');
      const customSchemas = schemaRegistry.getSchemasByCategory('custom');
      
      logger.debug(`API Schemas: ${apiSchemas.length}`);
      logger.debug(`Common Schemas: ${commonSchemas.length}`);
      logger.debug(`Internal Schemas: ${internalSchemas.length}`);
      logger.debug(`Custom Schemas: ${customSchemas.length}`);
      
      this.initialized = true;
    } catch (error) {
      logger.error('Error initializing schemas:', error);
      throw new Error('Failed to initialize schemas');
    }
  }
  
  /**
   * Check if schemas have been initialized
   *
   * @returns True if schemas have been initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get all registered schema IDs
   *
   * @returns Array of registered schema IDs
   */
  public getRegisteredSchemaIds(): SchemaId[] {
    return Array.from(this.registeredSchemas);
  }
}

// Create singleton instance
const schemaManager = new SchemaRegistrationManager();

// Function to initialize schemas (for backward compatibility)
function initializeSchemas(): void {
  schemaManager.initializeSchemas();
}

// Export schema registry, manager, and initialization function
export { schemaRegistry, schemaManager, initializeSchemas };