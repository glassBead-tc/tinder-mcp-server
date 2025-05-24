/**
 * Validation Example Route
 * 
 * Example route demonstrating how to use the validation middleware.
 */

import express, { Request, Response, Router } from 'express';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation-middleware';
import { loginRequestSchema } from '../../schemas/api/auth.schema';
import { userIdSchema } from '../../schemas/common/user.schema';
import { z } from 'zod';
import { ApiError } from '../../utils/error-handler';
import { ErrorCodes } from '../../types';

// Create router
const router: Router = express.Router();

// Example query schema
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  sort: z.enum(['asc', 'desc']).default('asc')
});

/**
 * @route POST /api/examples/login
 * @desc Example login route with body validation
 * @access Public
 */
router.post('/login', 
  validateBody(loginRequestSchema),
  (req: Request, res: Response) => {
    // Body is already validated and typed
    const { email, password, rememberMe } = req.body;
    
    // Example response
    res.json({
      success: true,
      message: 'Validation passed',
      data: {
        email,
        rememberMe: rememberMe || false,
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route GET /api/examples/users
 * @desc Example users route with query validation
 * @access Public
 */
router.get('/users',
  validateQuery(paginationSchema),
  (req: Request, res: Response) => {
    // Query is already validated and typed
    const { page, limit, sort } = req.query;
    
    // Example response
    res.json({
      success: true,
      message: 'Validation passed',
      data: {
        page,
        limit,
        sort,
        results: [],
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route GET /api/examples/users/:userId
 * @desc Example user detail route with param validation
 * @access Public
 */
router.get('/users/:userId',
  validateParams(z.object({ userId: userIdSchema })),
  (req: Request, res: Response) => {
    // Params are already validated and typed
    const { userId } = req.params;
    
    // Example response
    res.json({
      success: true,
      message: 'Validation passed',
      data: {
        userId,
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route POST /api/examples/complex
 * @desc Example route with multiple validations
 * @access Public
 */
router.post('/complex/:userId',
  validateParams(z.object({ userId: userIdSchema })),
  validateQuery(paginationSchema),
  validateBody(z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    tags: z.array(z.string()).min(1).max(5)
  })),
  (req: Request, res: Response) => {
    // All request parts are validated
    const { userId } = req.params;
    const { page, limit, sort } = req.query;
    const { name, email, tags } = req.body;
    
    // Example response
    res.json({
      success: true,
      message: 'All validations passed',
      data: {
        userId,
        pagination: { page, limit, sort },
        user: { name, email, tags },
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * @route POST /api/examples/error-handling
 * @desc Example route demonstrating error handling
 * @access Public
 */
router.post('/error-handling',
  (req: Request, res: Response) => {
    try {
      // Manual validation example
      const schema = z.object({
        id: z.string().uuid(),
        value: z.number().positive()
      });
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        throw new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Validation failed',
          { errors: result.error.format() },
          400
        );
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      // Pass error to Express error handler
      if (error instanceof ApiError) {
        res.status(error.statusCode || 500).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: ErrorCodes.UNKNOWN_ERROR,
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  }
);

export default router;