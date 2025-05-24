import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import {
  validateWithSchemaId,
  validateWithSchema,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  validateRequest
} from '../../middleware/validation-middleware';
import { schemaRegistry } from '../../schemas/registry';
import { ApiError } from '../../utils/error-handler';
import { ErrorCodes } from '../../types';
import { ZodErrorAdapter } from '../../utils/zod-error-adapter';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../schemas/registry', () => ({
  schemaRegistry: {
    getSchema: jest.fn()
  }
}));

jest.mock('../../utils/zod-error-adapter', () => ({
  ZodErrorAdapter: {
    toApiError: jest.fn().mockImplementation((error, message, statusCode) => {
      return new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        message || 'Validation failed',
        { details: 'Mock validation error' },
        statusCode || 400
      );
    })
  }
}));

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  
  beforeEach(() => {
    mockReq = {
      body: { name: 'John Doe' },
      query: { sort: 'asc' },
      params: { id: '123' },
      headers: { 'content-type': 'application/json' },
      cookies: { session: 'abc123' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });
  
  describe('validateWithSchemaId', () => {
    it('should call next() when schema exists and validation passes', () => {
      const mockSchema = z.object({ name: z.string() });
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockSchema);
      
      const middleware = validateWithSchemaId('user.schema');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('user.schema');
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should call next() with error when schema does not exist', () => {
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(undefined);
      
      const middleware = validateWithSchemaId('nonexistent.schema');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('nonexistent.schema');
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation schema "nonexistent.schema" not found',
        statusCode: 500
      }));
    });
    
    it('should validate different request parts based on the requestPart parameter', () => {
      const mockSchema = z.object({ sort: z.string() });
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockSchema);
      
      const middleware = validateWithSchemaId('query.schema', 'query');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('query.schema');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('validateWithSchema', () => {
    it('should call next() when validation passes', () => {
      const schema = z.object({ name: z.string() });
      
      const middleware = validateWithSchema(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should replace request data with validated data', () => {
      const schema = z.object({ name: z.string().transform(val => val.toUpperCase()) });
      
      const middleware = validateWithSchema(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockReq.body).toEqual({ name: 'JOHN DOE' });
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should call next() with error when validation fails', () => {
      const schema = z.object({ age: z.number() });
      
      const middleware = validateWithSchema(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(ZodErrorAdapter.toApiError).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed for body'
      }));
    });
    
    it('should call next() with error when request part is undefined', () => {
      const schema = z.object({ name: z.string() });
      mockReq = { query: {} }; // No body
      
      const middleware = validateWithSchema(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Request body is required'
      }));
    });
    
    it('should handle exceptions during validation', () => {
      const schema = z.object({ name: z.string() });
      const mockError = new Error('Test error');
      
      // Mock safeParse to throw an error
      jest.spyOn(schema, 'safeParse').mockImplementation(() => {
        throw mockError;
      });
      
      const middleware = validateWithSchema(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation error: Test error'
      }));
    });
  });
  
  describe('validateBody', () => {
    it('should call validateWithSchemaId when schema is a string', () => {
      const mockSchema = z.object({ name: z.string() });
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockSchema);
      
      const middleware = validateBody('user.schema');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('user.schema');
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should call validateWithSchema when schema is a ZodType', () => {
      const schema = z.object({ name: z.string() });
      
      const middleware = validateBody(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('validateQuery', () => {
    it('should call validateWithSchemaId when schema is a string', () => {
      const mockSchema = z.object({ sort: z.string() });
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockSchema);
      
      const middleware = validateQuery('query.schema');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('query.schema');
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should call validateWithSchema when schema is a ZodType', () => {
      const schema = z.object({ sort: z.string() });
      
      const middleware = validateQuery(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('validateParams', () => {
    it('should call validateWithSchemaId when schema is a string', () => {
      const mockSchema = z.object({ id: z.string() });
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockSchema);
      
      const middleware = validateParams('params.schema');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('params.schema');
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should call validateWithSchema when schema is a ZodType', () => {
      const schema = z.object({ id: z.string() });
      
      const middleware = validateParams(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('validateHeaders', () => {
    it('should call validateWithSchemaId when schema is a string', () => {
      const mockSchema = z.object({ 'content-type': z.string() });
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockSchema);
      
      const middleware = validateHeaders('headers.schema');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('headers.schema');
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should call validateWithSchema when schema is a ZodType', () => {
      const schema = z.object({ 'content-type': z.string() });
      
      const middleware = validateHeaders(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
  
  describe('validateRequest', () => {
    it('should validate multiple request parts and call next() when all pass', () => {
      const bodySchema = z.object({ name: z.string() });
      const querySchema = z.object({ sort: z.string() });
      
      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema
      });
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should call next() with error when any validation fails', () => {
      const bodySchema = z.object({ name: z.string() });
      const querySchema = z.object({ page: z.number() }); // Will fail
      
      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema
      });
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR
      }));
    });
    
    it('should support a mix of schema IDs and ZodTypes', () => {
      const bodySchema = z.object({ name: z.string() });
      const mockQuerySchema = z.object({ sort: z.string() });
      
      (schemaRegistry.getSchema as jest.Mock).mockReturnValue(mockQuerySchema);
      
      const middleware = validateRequest({
        body: bodySchema,
        query: 'query.schema'
      });
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(schemaRegistry.getSchema).toHaveBeenCalledWith('query.schema');
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should stop validation chain on first error', () => {
      const bodySchema = z.object({ age: z.number() }); // Will fail
      const querySchema = z.object({ page: z.number() }); // Should not be checked
      
      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema
      });
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed for body'
      }));
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});