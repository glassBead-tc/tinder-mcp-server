import { z } from 'zod';
import { schemaRegistry, SchemaId, SchemaCategory } from '../../schemas/registry';

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}));

describe('Schema Registry', () => {
  // Reset the registry before each test
  beforeEach(() => {
    // Access the private schemas Map and clear it
    // This is a bit hacky but necessary for testing the singleton
    const schemasMap = (schemaRegistry as any).schemas;
    schemasMap.clear();
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      // Get the singleton instance twice
      const instance1 = schemaRegistry;
      const instance2 = schemaRegistry;
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a schema and return the entry', () => {
      const testSchema = z.object({ name: z.string() });
      const entry = schemaRegistry.register('test.schema', testSchema, 'api', 'Test schema');
      
      expect(entry).toEqual({
        id: 'test.schema',
        schema: testSchema,
        category: 'api',
        description: 'Test schema',
        version: undefined
      });
    });

    it('should log a warning when overwriting an existing schema', () => {
      const logger = require('../../utils/logger');
      const testSchema1 = z.object({ name: z.string() });
      const testSchema2 = z.object({ email: z.string().email() });
      
      schemaRegistry.register('duplicate.schema', testSchema1);
      schemaRegistry.register('duplicate.schema', testSchema2);
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Schema with ID "duplicate.schema" already exists and will be overwritten'
      );
    });

    it('should use default category when not provided', () => {
      const testSchema = z.object({ name: z.string() });
      const entry = schemaRegistry.register('default.category', testSchema);
      
      expect(entry.category).toBe('custom');
    });
  });

  describe('getSchema', () => {
    it('should return the schema for a valid ID', () => {
      const testSchema = z.object({ name: z.string() });
      schemaRegistry.register('get.schema', testSchema);
      
      const retrievedSchema = schemaRegistry.getSchema('get.schema');
      expect(retrievedSchema).toBe(testSchema);
    });

    it('should return undefined for an invalid ID', () => {
      const retrievedSchema = schemaRegistry.getSchema('nonexistent.schema');
      expect(retrievedSchema).toBeUndefined();
    });
  });

  describe('getSchemaEntry', () => {
    it('should return the full entry for a valid ID', () => {
      const testSchema = z.object({ name: z.string() });
      const originalEntry = schemaRegistry.register(
        'get.entry', 
        testSchema, 
        'api', 
        'Test description', 
        '1.0.0'
      );
      
      const retrievedEntry = schemaRegistry.getSchemaEntry('get.entry');
      expect(retrievedEntry).toEqual(originalEntry);
    });

    it('should return undefined for an invalid ID', () => {
      const retrievedEntry = schemaRegistry.getSchemaEntry('nonexistent.entry');
      expect(retrievedEntry).toBeUndefined();
    });
  });

  describe('hasSchema', () => {
    it('should return true for an existing schema', () => {
      const testSchema = z.object({ name: z.string() });
      schemaRegistry.register('has.schema', testSchema);
      
      expect(schemaRegistry.hasSchema('has.schema')).toBe(true);
    });

    it('should return false for a non-existing schema', () => {
      expect(schemaRegistry.hasSchema('nonexistent.schema')).toBe(false);
    });
  });

  describe('removeSchema', () => {
    it('should remove an existing schema and return true', () => {
      const testSchema = z.object({ name: z.string() });
      schemaRegistry.register('remove.schema', testSchema);
      
      const result = schemaRegistry.removeSchema('remove.schema');
      expect(result).toBe(true);
      expect(schemaRegistry.hasSchema('remove.schema')).toBe(false);
    });

    it('should return false when trying to remove a non-existing schema', () => {
      const result = schemaRegistry.removeSchema('nonexistent.schema');
      expect(result).toBe(false);
    });
  });

  describe('getSchemasByCategory', () => {
    beforeEach(() => {
      // Register schemas with different categories
      schemaRegistry.register('api.schema1', z.object({ id: z.number() }), 'api');
      schemaRegistry.register('api.schema2', z.object({ name: z.string() }), 'api');
      schemaRegistry.register('common.schema', z.object({ email: z.string() }), 'common');
    });

    it('should return all schemas in a specific category', () => {
      const apiSchemas = schemaRegistry.getSchemasByCategory('api');
      
      expect(apiSchemas.length).toBe(2);
      expect(apiSchemas[0].id).toBe('api.schema1');
      expect(apiSchemas[1].id).toBe('api.schema2');
    });

    it('should return an empty array for a category with no schemas', () => {
      const internalSchemas = schemaRegistry.getSchemasByCategory('internal');
      expect(internalSchemas).toEqual([]);
    });
  });

  describe('getAllSchemaIds', () => {
    beforeEach(() => {
      schemaRegistry.register('schema1', z.object({ id: z.number() }));
      schemaRegistry.register('schema2', z.object({ name: z.string() }));
      schemaRegistry.register('schema3', z.object({ email: z.string() }));
    });

    it('should return all registered schema IDs', () => {
      const ids = schemaRegistry.getAllSchemaIds();
      
      expect(ids.length).toBe(3);
      expect(ids).toContain('schema1');
      expect(ids).toContain('schema2');
      expect(ids).toContain('schema3');
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email()
      });
      
      schemaRegistry.register('user.schema', userSchema);
    });

    it('should validate valid data against a schema', () => {
      const validData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const result = schemaRegistry.validate('user.schema', validData);
      expect(result).toEqual(validData);
    });

    it('should throw an error for invalid data', () => {
      const invalidData = {
        id: 'not-a-number',
        name: 'John Doe',
        email: 'invalid-email'
      };
      
      expect(() => {
        schemaRegistry.validate('user.schema', invalidData);
      }).toThrow();
    });

    it('should throw an error for a non-existing schema', () => {
      expect(() => {
        schemaRegistry.validate('nonexistent.schema', {});
      }).toThrow('Schema with ID "nonexistent.schema" not found');
    });
  });

  describe('safeValidate', () => {
    beforeEach(() => {
      const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email()
      });
      
      schemaRegistry.register('user.schema', userSchema);
    });

    it('should return success and data for valid input', () => {
      const validData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const result = schemaRegistry.safeValidate('user.schema', validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.error).toBeUndefined();
    });

    it('should return failure and error for invalid input', () => {
      const invalidData = {
        id: 'not-a-number',
        name: 'John Doe',
        email: 'invalid-email'
      };
      
      const result = schemaRegistry.safeValidate('user.schema', invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it('should return failure for a non-existing schema', () => {
      const result = schemaRegistry.safeValidate('nonexistent.schema', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.issues[0].message).toBe('Schema with ID "nonexistent.schema" not found');
    });
  });
});