import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { schemaRegistry } from '../../schemas/registry';
import { validationService } from '../../utils/validation';
import { ZodErrorAdapter } from '../../utils/zod-error-adapter';
import { validateBody, validateRequest } from '../../middleware/validation-middleware';
import { ApiError } from '../../utils/error-handler';
import { ErrorCodes } from '../../types';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}));

describe('Validation Integration Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset the registry before each test
    const schemasMap = (schemaRegistry as any).schemas;
    if (schemasMap) {
      schemasMap.clear();
    }

    mockReq = {
      body: {},
      query: {},
      params: {},
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('Happy Path - Valid Data', () => {
    it('should validate a request with a registered schema', () => {
      // 1. Register a schema
      const userSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number().min(18)
      });
      
      schemaRegistry.register('user.create', userSchema, 'api', 'User creation schema');
      
      // 2. Set up valid request data
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody('user.create');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed validation
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockReq.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      });
    });

    it('should validate multiple parts of a request', () => {
      // 1. Register schemas
      const bodySchema = z.object({
        name: z.string(),
        email: z.string().email()
      });
      
      const querySchema = z.object({
        page: z.string().transform(val => parseInt(val, 10)),
        limit: z.string().transform(val => parseInt(val, 10))
      });
      
      const paramsSchema = z.object({
        id: z.string().uuid()
      });
      
      schemaRegistry.register('user.body', bodySchema, 'api');
      schemaRegistry.register('user.query', querySchema, 'api');
      schemaRegistry.register('user.params', paramsSchema, 'api');
      
      // 2. Set up valid request data
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      mockReq.query = {
        page: '1',
        limit: '10'
      };
      
      mockReq.params = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      // 3. Create and execute middleware
      const middleware = validateRequest({
        body: 'user.body',
        query: 'user.query',
        params: 'user.params'
      });
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed validation
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(ApiError));
      
      // 5. Verify data transformations were applied
      expect(mockReq.query).toEqual({
        page: 1,
        limit: 10
      });
    });

    it('should validate and transform data', () => {
      // 1. Create a schema with transformations
      const userSchema = z.object({
        name: z.string().transform(val => val.trim()),
        email: z.string().email().toLowerCase(),
        role: z.enum(['user', 'admin']).default('user'),
        createdAt: z.string().datetime().transform(val => new Date(val))
      });
      
      // 2. Set up request data
      mockReq.body = {
        name: '  John Doe  ',
        email: 'JOHN@EXAMPLE.COM',
        createdAt: '2023-01-01T12:00:00Z'
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody(userSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed validation and applied transformations
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: expect.any(Date)
      });
      expect(mockReq.body.createdAt.getFullYear()).toBe(2023);
    });
  });

  describe('Error Handling - Invalid Data', () => {
    it('should reject invalid data and return appropriate error', () => {
      // 1. Register a schema
      const userSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number().min(18)
      });
      
      schemaRegistry.register('user.create', userSchema, 'api');
      
      // 2. Set up invalid request data
      mockReq.body = {
        name: 'John Doe',
        email: 'not-an-email',
        age: 16
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody('user.create');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware failed validation with appropriate error
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed for body'
      }));
    });

    it('should handle missing required fields', () => {
      // 1. Create a schema with required fields
      const userSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(8)
      });
      
      // 2. Set up incomplete request data
      mockReq.body = {
        name: 'John Doe'
        // Missing email and password
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody(userSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware failed validation
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR
      }));
    });

    it('should handle type errors', () => {
      // 1. Create a schema with specific types
      const productSchema = z.object({
        id: z.number(),
        name: z.string(),
        price: z.number().positive(),
        inStock: z.boolean()
      });
      
      // 2. Set up request data with wrong types
      mockReq.body = {
        id: '123', // Should be number
        name: 'Product',
        price: 'free', // Should be number
        inStock: 'yes' // Should be boolean
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody(productSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware failed validation
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR
      }));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects when schema allows', () => {
      // 1. Create a schema where all fields are optional
      const optionalSchema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        age: z.number().optional()
      });
      
      // 2. Set up empty request data
      mockReq.body = {};
      
      // 3. Create and execute middleware
      const middleware = validateBody(optionalSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed validation
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle null values according to schema definition', () => {
      // 1. Create a schema with nullable fields
      const nullableSchema = z.object({
        name: z.string(),
        email: z.string().email().nullable(),
        phone: z.string().nullable().optional()
      });
      
      // 2. Set up request data with null values
      mockReq.body = {
        name: 'John Doe',
        email: null,
        phone: null
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody(nullableSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed validation
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({
        name: 'John Doe',
        email: null,
        phone: null
      });
    });

    it('should handle deeply nested objects', () => {
      // 1. Create a schema with nested objects
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            address: z.object({
              street: z.string(),
              city: z.string(),
              zipCode: z.string()
            })
          }),
          settings: z.object({
            notifications: z.boolean(),
            theme: z.enum(['light', 'dark'])
          })
        })
      });
      
      // 2. Set up request data with nested objects
      mockReq.body = {
        user: {
          profile: {
            name: 'John Doe',
            address: {
              street: '123 Main St',
              city: 'New York',
              zipCode: '10001'
            }
          },
          settings: {
            notifications: true,
            theme: 'dark'
          }
        }
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody(nestedSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed validation
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle arrays of objects', () => {
      // 1. Create a schema with an array of objects
      const arraySchema = z.object({
        products: z.array(z.object({
          id: z.number(),
          name: z.string(),
          price: z.number().positive()
        }))
      });
      
      // 2. Set up request data with an array
      mockReq.body = {
        products: [
          { id: 1, name: 'Product 1', price: 10.99 },
          { id: 2, name: 'Product 2', price: 20.99 },
          { id: 3, name: 'Product 3', price: 30.99 }
        ]
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody(arraySchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed validation
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Integration with Error Handling System', () => {
    it('should integrate with the API error handling system', () => {
      // 1. Create a schema
      const userSchema = z.object({
        name: z.string(),
        email: z.string().email()
      });
      
      // 2. Set up invalid request data
      mockReq.body = {
        name: 'John Doe',
        email: 'not-an-email'
      };
      
      // 3. Create and execute middleware
      const middleware = validateBody(userSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 4. Verify middleware passed an ApiError to next()
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeDefined();
    });

    it('should use ZodErrorAdapter to format errors', () => {
      // 1. Create a schema
      const userSchema = z.object({
        name: z.string(),
        email: z.string().email()
      });
      
      // 2. Set up invalid request data
      mockReq.body = {
        name: 'John Doe',
        email: 'not-an-email'
      };
      
      // 3. Spy on ZodErrorAdapter.toApiError
      const toApiErrorSpy = jest.spyOn(ZodErrorAdapter, 'toApiError');
      
      // 4. Create and execute middleware
      const middleware = validateBody(userSchema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // 5. Verify ZodErrorAdapter was used
      expect(toApiErrorSpy).toHaveBeenCalled();
    });
  });
});