/**
 * Interaction Routes
 * Handles user interaction endpoints
 */

import express, { Request, Response, Router } from 'express';
import { handleHttpError } from '../utils/error-handler';
import requestHandler from '../services/request-handler';
import { ApiError } from '../utils/error-handler';
import { ErrorCodes } from '../types';

// Create router
const router: Router = express.Router();

/**
 * Like a user
 * POST /mcp/interaction/like/:targetUserId
 */
router.post('/like/:targetUserId', async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
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
      endpoint: `/like/${targetUserId}`,
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
 * Super like a user
 * POST /mcp/interaction/superlike/:targetUserId
 */
router.post('/superlike/:targetUserId', async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
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
      method: 'POST',
      endpoint: `/like/${targetUserId}/super`,
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
 * Pass on a user
 * POST /mcp/interaction/pass/:targetUserId
 */
router.post('/pass/:targetUserId', async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
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
      endpoint: `/pass/${targetUserId}`,
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
 * Boost profile
 * POST /mcp/interaction/boost
 */
router.post('/boost', async (req: Request, res: Response) => {
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
      method: 'POST',
      endpoint: '/boost',
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
 * Send message
 * POST /mcp/interaction/message/:matchId
 */
router.post('/message/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { message } = req.body;
    const authUserId = req.headers['x-auth-user-id'] as string;
    
    if (!authUserId) {
      throw new ApiError(
        ErrorCodes.AUTHENTICATION_FAILED,
        'Authentication required',
        null,
        401
      );
    }
    
    if (!message) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Message content is required',
        null,
        400
      );
    }
    
    const result = await requestHandler.processRequest({
      method: 'POST',
      endpoint: `/user/matches/${matchId}`,
      userId: authUserId,
      body: {
        message
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

/**
 * Get messages for a match
 * GET /mcp/interaction/messages/:matchId
 */
router.get('/messages/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
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
      endpoint: `/v2/matches/${matchId}/messages`,
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

export default router;