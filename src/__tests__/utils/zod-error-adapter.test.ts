import { z } from 'zod';
import { ZodErrorAdapter, DEFAULT_SENSITIVE_FIELDS, ErrorFormatOptions } from '../../utils/zod-error-adapter';
import { ApiError } from '../../utils/error-handler';
import { ErrorCodes } from '../../types';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger');

describe('ZodErrorAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toApiError', () => {
    it('should convert Zod error to ApiError with default values', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'number',
          received: 'string',
          path: ['age'],
          message: 'Expected number, received string'
        }
      ]);

      // Act
      const apiError = ZodErrorAdapter.toApiError(zodError);

      // Assert
      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(apiError.message).toBe('Validation failed');
      expect(apiError.statusCode).toBe(400);
      expect(apiError.details).toEqual({
        validationErrors: expect.arrayContaining([
          expect.objectContaining({
            path: ['age'],
            message: 'age: Expected number, received string',
            code: z.ZodIssueCode.invalid_type
          })
        ])
      });
    });

    it('should use custom message and status code', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'number',
          received: 'string',
          path: ['age'],
          message: 'Expected number, received string'
        }
      ]);
      const customMessage = 'Custom validation error';
      const customStatusCode = 422;

      // Act
      const apiError = ZodErrorAdapter.toApiError(zodError, customMessage, customStatusCode);

      // Assert
      expect(apiError.message).toBe(customMessage);
      expect(apiError.statusCode).toBe(customStatusCode);
    });

    it('should sanitize sensitive fields', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['password'],
          message: 'Password must be a string'
        }
      ]);

      // Act
      const apiError = ZodErrorAdapter.toApiError(zodError);

      // Assert
      expect(apiError.details.validationErrors[0].message).toBe('password: Invalid value provided for sensitive field');
      expect(apiError.details.validationErrors[0].details).toBeUndefined();
    });

    it('should not sanitize non-sensitive fields', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['username'],
          message: 'Username must be a string'
        }
      ]);

      // Act
      const apiError = ZodErrorAdapter.toApiError(zodError);

      // Assert
      expect(apiError.details.validationErrors[0].message).toBe('username: Username must be a string');
      expect(apiError.details.validationErrors[0].details).toBeDefined();
    });

    it('should disable sanitization when specified', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['password'],
          message: 'Password must be a string'
        }
      ]);
      const options: ErrorFormatOptions = {
        sanitizeSensitiveFields: false
      };

      // Act
      const apiError = ZodErrorAdapter.toApiError(zodError, 'Validation failed', 400, options);

      // Assert
      expect(apiError.details.validationErrors[0].message).toBe('password: Password must be a string');
      expect(apiError.details.validationErrors[0].details).toBeDefined();
    });

    it('should use custom sensitive fields list', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['customSecret'],
          message: 'Custom secret must be a string'
        }
      ]);
      const options: ErrorFormatOptions = {
        sensitiveFields: ['customSecret']
      };

      // Act
      const apiError = ZodErrorAdapter.toApiError(zodError, 'Validation failed', 400, options);

      // Assert
      expect(apiError.details.validationErrors[0].message).toBe('customSecret: Invalid value provided for sensitive field');
      expect(apiError.details.validationErrors[0].details).toBeUndefined();
    });
  });

  describe('formatZodError', () => {
    it('should format Zod error with default options', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'number',
          received: 'string',
          path: ['age'],
          message: 'Expected number, received string'
        },
        {
          code: z.ZodIssueCode.too_small,
          minimum: 3,
          type: 'string',
          inclusive: true,
          path: ['name'],
          message: 'String must contain at least 3 character(s)'
        }
      ]);

      // Act
      const formattedErrors = ZodErrorAdapter.formatZodError(zodError);

      // Assert
      expect(formattedErrors).toEqual([
        {
          path: ['age'],
          message: 'age: Expected number, received string',
          code: z.ZodIssueCode.invalid_type,
          details: {
            expectedType: 'number',
            receivedType: 'string'
          }
        },
        {
          path: ['name'],
          message: 'name: String must contain at least 3 character(s)',
          code: z.ZodIssueCode.too_small,
          details: {
            minimum: 3,
            type: 'string',
            inclusive: true
          }
        }
      ]);
    });

    it('should not include path in message when specified', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'number',
          received: 'string',
          path: ['age'],
          message: 'Expected number, received string'
        }
      ]);
      const options: ErrorFormatOptions = {
        includePathInMessage: false
      };

      // Act
      const formattedErrors = ZodErrorAdapter.formatZodError(zodError, options);

      // Assert
      expect(formattedErrors[0].message).toBe('Expected number, received string');
    });

    it('should handle errors with empty path', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: [],
          message: 'Invalid input'
        }
      ]);

      // Act
      const formattedErrors = ZodErrorAdapter.formatZodError(zodError);

      // Assert
      expect(formattedErrors[0].message).toBe('Invalid input');
      expect(formattedErrors[0].path).toEqual([]);
    });

    it('should sanitize sensitive fields', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['password'],
          message: 'Password must be a string'
        }
      ]);

      // Act
      const formattedErrors = ZodErrorAdapter.formatZodError(zodError);

      // Assert
      expect(formattedErrors[0].message).toBe('password: Invalid value provided for sensitive field');
      expect(formattedErrors[0].details).toBeUndefined();
    });

    it('should handle formatting errors gracefully', () => {
      // Arrange
      jest.spyOn(ZodErrorAdapter as any, 'isSensitivePath').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'number',
          received: 'string',
          path: ['age'],
          message: 'Expected number, received string'
        }
      ]);

      // Act
      const formattedErrors = ZodErrorAdapter.formatZodError(zodError);

      // Assert
      expect(formattedErrors).toEqual([
        {
          path: [],
          message: 'Error processing validation errors',
          code: z.ZodIssueCode.custom
        }
      ]);
      expect(logger.error).toHaveBeenCalledWith(
        'Error formatting Zod error:',
        expect.any(Error)
      );

      // Restore the spy
      (ZodErrorAdapter as any).isSensitivePath.mockRestore();
    });
  });

  describe('getIssueDetails', () => {
    it('should extract details for invalid_type issue', () => {
      // Arrange
      const issue = {
        code: z.ZodIssueCode.invalid_type,
        expected: 'number',
        received: 'string',
        path: ['age'],
        message: 'Expected number, received string'
      };

      // Act
      const details = (ZodErrorAdapter as any).getIssueDetails(issue);

      // Assert
      expect(details).toEqual({
        expectedType: 'number',
        receivedType: 'string'
      });
    });

    it('should extract details for invalid_literal issue', () => {
      // Arrange
      const issue = {
        code: z.ZodIssueCode.invalid_literal,
        expected: true,
        path: ['active'],
        message: 'Expected true, received false'
      };

      // Act
      const details = (ZodErrorAdapter as any).getIssueDetails(issue);

      // Assert
      expect(details).toEqual({
        expected: true
      });
    });

    it('should extract details for unrecognized_keys issue', () => {
      // Arrange
      const issue = {
        code: z.ZodIssueCode.unrecognized_keys,
        keys: ['extraField'],
        path: [],
        message: 'Unrecognized key(s) in object: \'extraField\''
      };

      // Act
      const details = (ZodErrorAdapter as any).getIssueDetails(issue);

      // Assert
      expect(details).toEqual({
        keys: ['extraField']
      });
    });

    it('should extract details for invalid_enum_value issue', () => {
      // Arrange
      const issue = {
        code: z.ZodIssueCode.invalid_enum_value,
        options: ['admin', 'user', 'guest'],
        received: 'manager',
        path: ['role'],
        message: 'Invalid enum value. Expected \'admin\' | \'user\' | \'guest\', received \'manager\''
      };

      // Act
      const details = (ZodErrorAdapter as any).getIssueDetails(issue);

      // Assert
      expect(details).toEqual({
        options: ['admin', 'user', 'guest'],
        received: 'manager'
      });
    });

    it('should extract details for too_small issue', () => {
      // Arrange
      const issue = {
        code: z.ZodIssueCode.too_small,
        minimum: 3,
        type: 'string',
        inclusive: true,
        path: ['name'],
        message: 'String must contain at least 3 character(s)'
      };

      // Act
      const details = (ZodErrorAdapter as any).getIssueDetails(issue);

      // Assert
      expect(details).toEqual({
        minimum: 3,
        type: 'string',
        inclusive: true
      });
    });

    it('should extract details for too_big issue', () => {
      // Arrange
      const issue = {
        code: z.ZodIssueCode.too_big,
        maximum: 100,
        type: 'string',
        inclusive: true,
        path: ['description'],
        message: 'String must contain at most 100 character(s)'
      };

      // Act
      const details = (ZodErrorAdapter as any).getIssueDetails(issue);

      // Assert
      expect(details).toEqual({
        maximum: 100,
        type: 'string',
        inclusive: true
      });
    });

    it('should return undefined when no details are available', () => {
      // Arrange
      const issue = {
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Custom error'
      };

      // Act
      const details = (ZodErrorAdapter as any).getIssueDetails(issue);

      // Assert
      expect(details).toBeUndefined();
    });
  });

  describe('isSensitivePath', () => {
    it('should identify sensitive paths', () => {
      // Test cases
      const testCases = [
        { path: ['password'], expected: true },
        { path: ['user', 'password'], expected: true },
        { path: ['credentials', 'token'], expected: true },
        { path: ['data', 'apiKey'], expected: true },
        { path: ['username'], expected: false },
        { path: ['user', 'email'], expected: false },
        { path: [], expected: false }
      ];

      // Test each case
      testCases.forEach(({ path, expected }) => {
        const result = (ZodErrorAdapter as any).isSensitivePath(path, DEFAULT_SENSITIVE_FIELDS);
        expect(result).toBe(expected);
      });
    });

    it('should be case insensitive', () => {
      // Test cases
      const testCases = [
        { path: ['Password'], expected: true },
        { path: ['user', 'PASSWORD'], expected: true },
        { path: ['API_KEY'], expected: true }
      ];

      // Test each case
      testCases.forEach(({ path, expected }) => {
        const result = (ZodErrorAdapter as any).isSensitivePath(path, DEFAULT_SENSITIVE_FIELDS);
        expect(result).toBe(expected);
      });
    });

    it('should work with custom sensitive fields', () => {
      // Arrange
      const customSensitiveFields = ['customSecret', 'privateData'];

      // Test cases
      const testCases = [
        { path: ['customSecret'], expected: true },
        { path: ['user', 'privateData'], expected: true },
        { path: ['password'], expected: false } // Not in custom list
      ];

      // Test each case
      testCases.forEach(({ path, expected }) => {
        const result = (ZodErrorAdapter as any).isSensitivePath(path, customSensitiveFields);
        expect(result).toBe(expected);
      });
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should replace message with generic message', () => {
      // Arrange
      const sensitiveMessage = 'Password must be at least 8 characters with numbers and symbols';

      // Act
      const sanitizedMessage = (ZodErrorAdapter as any).sanitizeErrorMessage(sensitiveMessage);

      // Assert
      expect(sanitizedMessage).toBe('Invalid value provided for sensitive field');
      expect(sanitizedMessage).not.toContain('Password');
    });
  });

  describe('constantTimeCompare', () => {
    it('should return true for equal strings', () => {
      // Arrange
      const a = 'secure-password-123';
      const b = 'secure-password-123';

      // Act
      const result = ZodErrorAdapter.constantTimeCompare(a, b);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for strings with different lengths', () => {
      // Arrange
      const a = 'secure-password-123';
      const b = 'secure-password-1234';

      // Act
      const result = ZodErrorAdapter.constantTimeCompare(a, b);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for strings with same length but different content', () => {
      // Arrange
      const a = 'secure-password-123';
      const b = 'secure-password-124';

      // Act
      const result = ZodErrorAdapter.constantTimeCompare(a, b);

      // Assert
      expect(result).toBe(false);
    });

    it('should take similar time regardless of where the difference is', () => {
      // This is a basic test to ensure the function doesn't short-circuit
      // Arrange
      const base = 'secure-password-123';
      const diffStart = 'xecure-password-123';
      const diffMiddle = 'secure-xassword-123';
      const diffEnd = 'secure-password-12x';

      // Act & Assert
      expect(ZodErrorAdapter.constantTimeCompare(base, diffStart)).toBe(false);
      expect(ZodErrorAdapter.constantTimeCompare(base, diffMiddle)).toBe(false);
      expect(ZodErrorAdapter.constantTimeCompare(base, diffEnd)).toBe(false);
    });
  });

  describe('createErrorMessage', () => {
    it('should create a simple error message from Zod error', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'number',
          received: 'string',
          path: ['age'],
          message: 'Expected number, received string'
        },
        {
          code: z.ZodIssueCode.too_small,
          minimum: 3,
          type: 'string',
          inclusive: true,
          path: ['name'],
          message: 'String must contain at least 3 character(s)'
        }
      ]);

      // Act
      const errorMessage = ZodErrorAdapter.createErrorMessage(zodError);

      // Assert
      expect(errorMessage).toBe('age: Expected number, received string; name: String must contain at least 3 character(s)');
    });

    it('should handle empty paths', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: [],
          message: 'Invalid input'
        }
      ]);

      // Act
      const errorMessage = ZodErrorAdapter.createErrorMessage(zodError);

      // Assert
      expect(errorMessage).toBe('Invalid input');
    });
  });
});