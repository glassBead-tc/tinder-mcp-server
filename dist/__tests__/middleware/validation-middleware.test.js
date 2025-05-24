"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation-middleware");
const registry_1 = require("../../schemas/registry");
const error_handler_1 = require("../../utils/error-handler");
const types_1 = require("../../types");
const zod_error_adapter_1 = require("../../utils/zod-error-adapter");
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
            return new error_handler_1.ApiError(types_1.ErrorCodes.VALIDATION_ERROR, message || 'Validation failed', { details: 'Mock validation error' }, statusCode || 400);
        })
    }
}));
describe('Validation Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
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
            const mockSchema = zod_1.z.object({ name: zod_1.z.string() });
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockSchema);
            const middleware = (0, validation_middleware_1.validateWithSchemaId)('user.schema');
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('user.schema');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next() with error when schema does not exist', () => {
            registry_1.schemaRegistry.getSchema.mockReturnValue(undefined);
            const middleware = (0, validation_middleware_1.validateWithSchemaId)('nonexistent.schema');
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('nonexistent.schema');
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                code: types_1.ErrorCodes.VALIDATION_ERROR,
                message: 'Validation schema "nonexistent.schema" not found',
                statusCode: 500
            }));
        });
        it('should validate different request parts based on the requestPart parameter', () => {
            const mockSchema = zod_1.z.object({ sort: zod_1.z.string() });
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockSchema);
            const middleware = (0, validation_middleware_1.validateWithSchemaId)('query.schema', 'query');
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('query.schema');
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    describe('validateWithSchema', () => {
        it('should call next() when validation passes', () => {
            const schema = zod_1.z.object({ name: zod_1.z.string() });
            const middleware = (0, validation_middleware_1.validateWithSchema)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should replace request data with validated data', () => {
            const schema = zod_1.z.object({ name: zod_1.z.string().transform(val => val.toUpperCase()) });
            const middleware = (0, validation_middleware_1.validateWithSchema)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockReq.body).toEqual({ name: 'JOHN DOE' });
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next() with error when validation fails', () => {
            const schema = zod_1.z.object({ age: zod_1.z.number() });
            const middleware = (0, validation_middleware_1.validateWithSchema)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(zod_error_adapter_1.ZodErrorAdapter.toApiError).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                code: types_1.ErrorCodes.VALIDATION_ERROR,
                message: 'Validation failed for body'
            }));
        });
        it('should call next() with error when request part is undefined', () => {
            const schema = zod_1.z.object({ name: zod_1.z.string() });
            mockReq = { query: {} }; // No body
            const middleware = (0, validation_middleware_1.validateWithSchema)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                code: types_1.ErrorCodes.VALIDATION_ERROR,
                message: 'Request body is required'
            }));
        });
        it('should handle exceptions during validation', () => {
            const schema = zod_1.z.object({ name: zod_1.z.string() });
            const mockError = new Error('Test error');
            // Mock safeParse to throw an error
            jest.spyOn(schema, 'safeParse').mockImplementation(() => {
                throw mockError;
            });
            const middleware = (0, validation_middleware_1.validateWithSchema)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                code: types_1.ErrorCodes.VALIDATION_ERROR,
                message: 'Validation error: Test error'
            }));
        });
    });
    describe('validateBody', () => {
        it('should call validateWithSchemaId when schema is a string', () => {
            const mockSchema = zod_1.z.object({ name: zod_1.z.string() });
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockSchema);
            const middleware = (0, validation_middleware_1.validateBody)('user.schema');
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('user.schema');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call validateWithSchema when schema is a ZodType', () => {
            const schema = zod_1.z.object({ name: zod_1.z.string() });
            const middleware = (0, validation_middleware_1.validateBody)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    describe('validateQuery', () => {
        it('should call validateWithSchemaId when schema is a string', () => {
            const mockSchema = zod_1.z.object({ sort: zod_1.z.string() });
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockSchema);
            const middleware = (0, validation_middleware_1.validateQuery)('query.schema');
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('query.schema');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call validateWithSchema when schema is a ZodType', () => {
            const schema = zod_1.z.object({ sort: zod_1.z.string() });
            const middleware = (0, validation_middleware_1.validateQuery)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    describe('validateParams', () => {
        it('should call validateWithSchemaId when schema is a string', () => {
            const mockSchema = zod_1.z.object({ id: zod_1.z.string() });
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockSchema);
            const middleware = (0, validation_middleware_1.validateParams)('params.schema');
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('params.schema');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call validateWithSchema when schema is a ZodType', () => {
            const schema = zod_1.z.object({ id: zod_1.z.string() });
            const middleware = (0, validation_middleware_1.validateParams)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    describe('validateHeaders', () => {
        it('should call validateWithSchemaId when schema is a string', () => {
            const mockSchema = zod_1.z.object({ 'content-type': zod_1.z.string() });
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockSchema);
            const middleware = (0, validation_middleware_1.validateHeaders)('headers.schema');
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('headers.schema');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call validateWithSchema when schema is a ZodType', () => {
            const schema = zod_1.z.object({ 'content-type': zod_1.z.string() });
            const middleware = (0, validation_middleware_1.validateHeaders)(schema);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    describe('validateRequest', () => {
        it('should validate multiple request parts and call next() when all pass', () => {
            const bodySchema = zod_1.z.object({ name: zod_1.z.string() });
            const querySchema = zod_1.z.object({ sort: zod_1.z.string() });
            const middleware = (0, validation_middleware_1.validateRequest)({
                body: bodySchema,
                query: querySchema
            });
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next() with error when any validation fails', () => {
            const bodySchema = zod_1.z.object({ name: zod_1.z.string() });
            const querySchema = zod_1.z.object({ page: zod_1.z.number() }); // Will fail
            const middleware = (0, validation_middleware_1.validateRequest)({
                body: bodySchema,
                query: querySchema
            });
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                code: types_1.ErrorCodes.VALIDATION_ERROR
            }));
        });
        it('should support a mix of schema IDs and ZodTypes', () => {
            const bodySchema = zod_1.z.object({ name: zod_1.z.string() });
            const mockQuerySchema = zod_1.z.object({ sort: zod_1.z.string() });
            registry_1.schemaRegistry.getSchema.mockReturnValue(mockQuerySchema);
            const middleware = (0, validation_middleware_1.validateRequest)({
                body: bodySchema,
                query: 'query.schema'
            });
            middleware(mockReq, mockRes, mockNext);
            expect(registry_1.schemaRegistry.getSchema).toHaveBeenCalledWith('query.schema');
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should stop validation chain on first error', () => {
            const bodySchema = zod_1.z.object({ age: zod_1.z.number() }); // Will fail
            const querySchema = zod_1.z.object({ page: zod_1.z.number() }); // Should not be checked
            const middleware = (0, validation_middleware_1.validateRequest)({
                body: bodySchema,
                query: querySchema
            });
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                code: types_1.ErrorCodes.VALIDATION_ERROR,
                message: 'Validation failed for body'
            }));
            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=validation-middleware.test.js.map