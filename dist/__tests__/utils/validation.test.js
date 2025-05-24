"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validation_1 = require("../../utils/validation");
const error_handler_1 = require("../../utils/error-handler");
const types_1 = require("../../types");
const registry_1 = require("../../schemas/registry");
const logger_1 = __importDefault(require("../../utils/logger"));
// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('../../schemas/registry');
describe('Validation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('getInstance', () => {
        it('should return the singleton instance', () => {
            // Act
            const instance1 = validation_1.ValidationService.getInstance();
            const instance2 = validation_1.ValidationService.getInstance();
            // Assert
            expect(instance1).toBe(instance2);
            expect(instance1).toBe(validation_1.validationService);
        });
    });
    describe('validate', () => {
        it('should validate data against a schema from registry', () => {
            // Arrange
            const schemaId = 'test.schema';
            const data = { name: 'John Doe' };
            const validatedData = { name: 'JOHN DOE' }; // Transformed data
            // Mock schema registry
            registry_1.schemaRegistry.safeValidate.mockReturnValue({
                success: true,
                data: validatedData
            });
            // Act
            const result = validation_1.validationService.validate(schemaId, data);
            // Assert
            expect(registry_1.schemaRegistry.safeValidate).toHaveBeenCalledWith(schemaId, data);
            expect(result).toEqual({
                success: true,
                data: validatedData
            });
        });
        it('should return validation errors when validation fails', () => {
            // Arrange
            const schemaId = 'test.schema';
            const data = { age: 'not-a-number' };
            const mockError = new zod_1.z.ZodError([
                {
                    code: zod_1.z.ZodIssueCode.invalid_type,
                    expected: 'number',
                    received: 'string',
                    path: ['age'],
                    message: 'Expected number, received string'
                }
            ]);
            // Mock schema registry
            registry_1.schemaRegistry.safeValidate.mockReturnValue({
                success: false,
                error: mockError
            });
            // Mock formatZodError
            jest.spyOn(validation_1.validationService, 'formatZodError').mockReturnValue('age: Expected number, received string');
            // Act
            const result = validation_1.validationService.validate(schemaId, data);
            // Assert
            expect(registry_1.schemaRegistry.safeValidate).toHaveBeenCalledWith(schemaId, data);
            expect(result).toEqual({
                success: false,
                errors: mockError,
                errorMessage: 'age: Expected number, received string'
            });
            expect(validation_1.validationService.formatZodError).toHaveBeenCalledWith(mockError);
        });
        it('should handle validation timeout', async () => {
            // Arrange
            const schemaId = 'test.schema';
            const data = { name: 'John Doe' };
            // Mock setTimeout to trigger timeout immediately
            jest.useFakeTimers();
            // Act
            const validatePromise = validation_1.validationService.validate(schemaId, data, { timeout: 100 });
            // Advance timers to trigger timeout
            jest.advanceTimersByTime(101);
            // Assert
            await expect(validatePromise).rejects.toThrow('Validation timeout exceeded');
            // Restore timers
            jest.useRealTimers();
        });
        it('should validate data size before schema validation', () => {
            // Arrange
            const schemaId = 'test.schema';
            const largeString = 'a'.repeat(1000001); // Exceeds maxStringLength
            // Spy on validateDataSize
            const validateDataSizeSpy = jest.spyOn(validation_1.validationService, 'validateDataSize');
            validateDataSizeSpy.mockImplementation(() => {
                throw new Error('Input string exceeds maximum allowed length');
            });
            // Act
            const result = validation_1.validationService.validate(schemaId, largeString);
            // Assert
            expect(validateDataSizeSpy).toHaveBeenCalledWith(largeString);
            expect(result).toEqual({
                success: false,
                errorMessage: 'Input string exceeds maximum allowed length'
            });
            // Restore spy
            validateDataSizeSpy.mockRestore();
        });
        it('should validate nesting depth before schema validation', () => {
            // Arrange
            const schemaId = 'test.schema';
            const deeplyNestedData = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 'too deep' } } } } } } } } } } };
            // Spy on validateNestingDepth
            const validateNestingDepthSpy = jest.spyOn(validation_1.validationService, 'validateNestingDepth');
            validateNestingDepthSpy.mockImplementation(() => {
                throw new Error('Input exceeds maximum nesting depth of 10');
            });
            // Act
            const result = validation_1.validationService.validate(schemaId, deeplyNestedData);
            // Assert
            expect(validateNestingDepthSpy).toHaveBeenCalledWith(deeplyNestedData, 10);
            expect(result).toEqual({
                success: false,
                errorMessage: 'Input exceeds maximum nesting depth of 10'
            });
            // Restore spy
            validateNestingDepthSpy.mockRestore();
        });
        it('should handle errors during validation', () => {
            // Arrange
            const schemaId = 'test.schema';
            const data = { name: 'John Doe' };
            // Mock schema registry to throw error
            registry_1.schemaRegistry.safeValidate.mockImplementation(() => {
                throw new Error('Unexpected error');
            });
            // Act
            const result = validation_1.validationService.validate(schemaId, data);
            // Assert
            expect(registry_1.schemaRegistry.safeValidate).toHaveBeenCalledWith(schemaId, data);
            expect(result).toEqual({
                success: false,
                errorMessage: 'Unexpected error'
            });
            expect(logger_1.default.error).toHaveBeenCalled();
        });
    });
    describe('validateWithSchema', () => {
        it('should validate data against a schema directly', () => {
            // Arrange
            const schema = zod_1.z.object({
                name: zod_1.z.string().transform(val => val.toUpperCase())
            });
            const data = { name: 'John Doe' };
            // Act
            const result = validation_1.validationService.validateWithSchema(schema, data);
            // Assert
            expect(result).toEqual({
                success: true,
                data: { name: 'JOHN DOE' }
            });
        });
        it('should return validation errors when validation fails', () => {
            // Arrange
            const schema = zod_1.z.object({
                age: zod_1.z.number()
            });
            const data = { age: 'not-a-number' };
            // Mock formatZodError
            jest.spyOn(validation_1.validationService, 'formatZodError').mockReturnValue('age: Expected number, received string');
            // Act
            const result = validation_1.validationService.validateWithSchema(schema, data);
            // Assert
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errorMessage).toBe('age: Expected number, received string');
            expect(validation_1.validationService.formatZodError).toHaveBeenCalled();
        });
        it('should handle validation timeout', async () => {
            // Arrange
            const schema = zod_1.z.object({
                name: zod_1.z.string()
            });
            const data = { name: 'John Doe' };
            // Mock setTimeout to trigger timeout immediately
            jest.useFakeTimers();
            // Act
            const validatePromise = validation_1.validationService.validateWithSchema(schema, data, { timeout: 100 });
            // Advance timers to trigger timeout
            jest.advanceTimersByTime(101);
            // Assert
            await expect(validatePromise).rejects.toThrow('Validation timeout exceeded');
            // Restore timers
            jest.useRealTimers();
        });
        it('should validate data size before schema validation', () => {
            // Arrange
            const schema = zod_1.z.string();
            const largeString = 'a'.repeat(1000001); // Exceeds maxStringLength
            // Spy on validateDataSize
            const validateDataSizeSpy = jest.spyOn(validation_1.validationService, 'validateDataSize');
            validateDataSizeSpy.mockImplementation(() => {
                throw new Error('Input string exceeds maximum allowed length');
            });
            // Act
            const result = validation_1.validationService.validateWithSchema(schema, largeString);
            // Assert
            expect(validateDataSizeSpy).toHaveBeenCalledWith(largeString);
            expect(result).toEqual({
                success: false,
                errorMessage: 'Input string exceeds maximum allowed length'
            });
            // Restore spy
            validateDataSizeSpy.mockRestore();
        });
        it('should handle errors during validation', () => {
            // Arrange
            const schema = zod_1.z.object({
                name: zod_1.z.string()
            });
            const data = { name: 'John Doe' };
            // Mock schema.safeParse to throw error
            jest.spyOn(schema, 'safeParse').mockImplementation(() => {
                throw new Error('Unexpected error');
            });
            // Act
            const result = validation_1.validationService.validateWithSchema(schema, data);
            // Assert
            expect(result).toEqual({
                success: false,
                errorMessage: 'Unexpected error'
            });
            expect(logger_1.default.error).toHaveBeenCalled();
        });
    });
    describe('formatZodError', () => {
        it('should format Zod error into readable message', () => {
            // Arrange
            const error = new zod_1.z.ZodError([
                {
                    code: zod_1.z.ZodIssueCode.invalid_type,
                    expected: 'number',
                    received: 'string',
                    path: ['age'],
                    message: 'Expected number, received string'
                },
                {
                    code: zod_1.z.ZodIssueCode.too_small,
                    minimum: 3,
                    type: 'string',
                    inclusive: true,
                    path: ['name'],
                    message: 'String must contain at least 3 character(s)'
                }
            ]);
            // Act
            const result = validation_1.validationService.formatZodError(error);
            // Assert
            expect(result).toBe('age: Expected number, received string; name: String must contain at least 3 character(s)');
        });
        it('should handle empty path in Zod error', () => {
            // Arrange
            const error = new zod_1.z.ZodError([
                {
                    code: zod_1.z.ZodIssueCode.custom,
                    path: [],
                    message: 'Invalid input'
                }
            ]);
            // Act
            const result = validation_1.validationService.formatZodError(error);
            // Assert
            expect(result).toBe('Invalid input');
        });
    });
    describe('createValidationMiddleware', () => {
        it('should create middleware that validates request data', () => {
            // Arrange
            const schemaId = 'test.schema';
            const req = {
                body: { name: 'John Doe' }
            };
            const res = {};
            const next = jest.fn();
            // Mock validate method
            jest.spyOn(validation_1.validationService, 'validate').mockReturnValue({
                success: true,
                data: { name: 'JOHN DOE' }
            });
            // Act
            const middleware = validation_1.validationService.createValidationMiddleware(schemaId);
            middleware(req, res, next);
            // Assert
            expect(validation_1.validationService.validate).toHaveBeenCalledWith(schemaId, req.body, {});
            expect(req.body).toEqual({ name: 'JOHN DOE' });
            expect(next).toHaveBeenCalledWith();
        });
        it('should pass error to next when validation fails', () => {
            // Arrange
            const schemaId = 'test.schema';
            const req = {
                body: { age: 'not-a-number' }
            };
            const res = {};
            const next = jest.fn();
            // Mock validate method
            jest.spyOn(validation_1.validationService, 'validate').mockReturnValue({
                success: false,
                errorMessage: 'age: Expected number, received string'
            });
            // Act
            const middleware = validation_1.validationService.createValidationMiddleware(schemaId);
            middleware(req, res, next);
            // Assert
            expect(validation_1.validationService.validate).toHaveBeenCalledWith(schemaId, req.body, {});
            expect(next).toHaveBeenCalledWith(expect.any(error_handler_1.ApiError));
            expect(next.mock.calls[0][0]).toBeInstanceOf(error_handler_1.ApiError);
            expect(next.mock.calls[0][0].code).toBe(types_1.ErrorCodes.VALIDATION_ERROR);
            expect(next.mock.calls[0][0].message).toBe('Validation failed for body');
            expect(next.mock.calls[0][0].details).toEqual({ details: 'age: Expected number, received string' });
        });
        it('should validate different request parts', () => {
            // Arrange
            const schemaId = 'query.schema';
            const req = {
                query: { sort: 'asc' }
            };
            const res = {};
            const next = jest.fn();
            // Mock validate method
            jest.spyOn(validation_1.validationService, 'validate').mockReturnValue({
                success: true,
                data: { sort: 'asc' }
            });
            // Act
            const middleware = validation_1.validationService.createValidationMiddleware(schemaId, 'query');
            middleware(req, res, next);
            // Assert
            expect(validation_1.validationService.validate).toHaveBeenCalledWith(schemaId, req.query, {});
            expect(req.query).toEqual({ sort: 'asc' });
            expect(next).toHaveBeenCalledWith();
        });
    });
    describe('createSchemaValidationMiddleware', () => {
        it('should create middleware that validates request data with schema', () => {
            // Arrange
            const schema = zod_1.z.object({
                name: zod_1.z.string().transform(val => val.toUpperCase())
            });
            const req = {
                body: { name: 'John Doe' }
            };
            const res = {};
            const next = jest.fn();
            // Mock validateWithSchema method
            jest.spyOn(validation_1.validationService, 'validateWithSchema').mockReturnValue({
                success: true,
                data: { name: 'JOHN DOE' }
            });
            // Act
            const middleware = validation_1.validationService.createSchemaValidationMiddleware(schema);
            middleware(req, res, next);
            // Assert
            expect(validation_1.validationService.validateWithSchema).toHaveBeenCalledWith(schema, req.body, {});
            expect(req.body).toEqual({ name: 'JOHN DOE' });
            expect(next).toHaveBeenCalledWith();
        });
        it('should pass error to next when validation fails', () => {
            // Arrange
            const schema = zod_1.z.object({
                age: zod_1.z.number()
            });
            const req = {
                body: { age: 'not-a-number' }
            };
            const res = {};
            const next = jest.fn();
            // Mock validateWithSchema method
            jest.spyOn(validation_1.validationService, 'validateWithSchema').mockReturnValue({
                success: false,
                errorMessage: 'age: Expected number, received string'
            });
            // Act
            const middleware = validation_1.validationService.createSchemaValidationMiddleware(schema);
            middleware(req, res, next);
            // Assert
            expect(validation_1.validationService.validateWithSchema).toHaveBeenCalledWith(schema, req.body, {});
            expect(next).toHaveBeenCalledWith(expect.any(error_handler_1.ApiError));
            expect(next.mock.calls[0][0]).toBeInstanceOf(error_handler_1.ApiError);
            expect(next.mock.calls[0][0].code).toBe(types_1.ErrorCodes.VALIDATION_ERROR);
        });
    });
    describe('validateDataSize', () => {
        it('should throw error when string exceeds maximum length', () => {
            // Arrange
            const largeString = 'a'.repeat(1000001); // Exceeds default maxStringLength (1000000)
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateDataSize(largeString);
            }).toThrow('Input string exceeds maximum allowed length');
        });
        it('should throw error when array exceeds maximum length', () => {
            // Arrange
            const largeArray = Array(10001).fill('item'); // Exceeds default maxArrayLength (10000)
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateDataSize(largeArray);
            }).toThrow('Input array exceeds maximum allowed length');
        });
        it('should throw error when object has too many properties', () => {
            // Arrange
            const largeObject = {};
            for (let i = 0; i < 1001; i++) { // Exceeds default max properties (1000)
                largeObject[`key${i}`] = `value${i}`;
            }
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateDataSize(largeObject);
            }).toThrow('Input object exceeds maximum allowed properties');
        });
        it('should not throw error for valid data', () => {
            // Arrange
            const validData = {
                name: 'John Doe',
                age: 30,
                email: 'john@example.com'
            };
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateDataSize(validData);
            }).not.toThrow();
        });
    });
    describe('validateNestingDepth', () => {
        it('should throw error when nesting depth exceeds maximum', () => {
            // Arrange
            const deeplyNestedData = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 'too deep' } } } } } } } } } } };
            const maxDepth = 5;
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateNestingDepth(deeplyNestedData, maxDepth);
            }).toThrow(`Input exceeds maximum nesting depth of ${maxDepth}`);
        });
        it('should not throw error for valid nesting depth', () => {
            // Arrange
            const validData = { a: { b: { c: 'valid' } } };
            const maxDepth = 5;
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateNestingDepth(validData, maxDepth);
            }).not.toThrow();
        });
        it('should handle arrays in nested objects', () => {
            // Arrange
            const nestedArrayData = { a: { b: [{ c: 'item1' }, { c: 'item2' }] } };
            const maxDepth = 5;
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateNestingDepth(nestedArrayData, maxDepth);
            }).not.toThrow();
        });
        it('should handle deeply nested arrays', () => {
            // Arrange
            const deeplyNestedArray = [[[[[[[[['too deep']]]]]]]]];
            const maxDepth = 5;
            // Act & Assert
            expect(() => {
                validation_1.validationService.validateNestingDepth(deeplyNestedArray, maxDepth);
            }).toThrow(`Input exceeds maximum nesting depth of ${maxDepth}`);
        });
    });
});
//# sourceMappingURL=validation.test.js.map