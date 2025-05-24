/**
 * User Routes
 * Handles user-related endpoints
 */

import express, { Request, Response, Router } from 'express';
import { handleHttpError } from '../utils/error-handler';
import requestHandler from '../services/request-handler';
import { ApiError } from '../utils/error-handler';
import { ErrorCodes } from '../types';

// Create router
const router: Router = express.Router();

/**
 * Get user profile
 * GET /mcp/user/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authUserId = req.headers['x-auth-user-id'] as string;
    
    if (!authUserId) {
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        'Authentication required',
        null,
        401
      );
    }
    
    const result = await requestHandler.processRequest({
      method: 'GET',
      endpoint: `/user/${userId}`,
      userId: authUserId
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleHttpError(res, error as Error);
  }
});

/**
 * Get user recommendations
 * GET /mcp/user/recommendations
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const authUserId = req.headers['x-auth-user-id'] as string;
    
    if (!authUserId) {
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        'Authentication required',
        null,
        401
      );
    }
    
    const result = await requestHandler.processRequest({
      method: 'GET',
      endpoint: '/v2/recs/core',
      userId: authUserId
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleHttpError(res, error as Error);
  }
});

/**
 * Update user profile
 * PUT /mcp/user/profile
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const authUserId = req.headers['x-auth-user-id'] as string;
    
    if (!authUserId) {
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        'Authentication required',
        null,
        401
      );
    }
    
    const profileData = req.body;
    
    const result = await requestHandler.processRequest({
      method: 'PUT',
      endpoint: '/profile',
      userId: authUserId,
      body: profileData
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleHttpError(res, error as Error);
  }
});

/**
 * Get user matches
 * GET /mcp/user/matches
 */
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const authUserId = req.headers['x-auth-user-id'] as string;
    
    if (!authUserId) {
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        'Authentication required',
        null,
        401
      );
    }
    
    const result = await requestHandler.processRequest({
      method: 'GET',
      endpoint: '/v2/matches',
      userId: authUserId,
      params: {
        count: req.query.count || 60,
        message: req.query.message || 1
      }
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleHttpError(res, error as Error);
  }
});

export default router;