/**
 * Authentication Routes
 * Handles authentication-related endpoints
 */

import express, { Request, Response, Router } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';
import { handleHttpError } from '../utils/error-handler';
import authService from '../services/authentication';
import { validateBody } from '../middleware/validation-middleware';
import baseSchema from '../schemas/common/base.schema';

// Create router
const router: Router = express.Router();

/**
 * Send SMS verification code
 * POST /mcp/auth/sms/send
 */
router.post(
  '/sms/send',
  validateBody('auth.sms.request'),
  async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;
      
      const result = await authService.authenticateWithSMS(phoneNumber);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleHttpError(res, error as Error);
    }
  }
);

/**
 * Validate SMS verification code
 * POST /mcp/auth/sms/validate
 */
router.post(
  '/sms/validate',
  validateBody('auth.otpVerification.request'),
  async (req: Request, res: Response) => {
    try {
      const { phoneNumber, otpCode } = req.body;
      
      const result = await authService.authenticateWithSMS(phoneNumber, otpCode);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleHttpError(res, error as Error);
    }
  }
);

/**
 * Authenticate with Facebook
 * POST /mcp/auth/facebook
 */
router.post(
  '/facebook',
  validateBody('auth.facebook.request'),
  async (req: Request, res: Response) => {
    try {
      const { accessToken } = req.body;
      
      const result = await authService.authenticateWithFacebook(accessToken);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleHttpError(res, error as Error);
    }
  }
);

/**
 * Verify CAPTCHA
 * POST /mcp/auth/captcha
 */
router.post(
  '/captcha',
  validateBody(
    // Inline schema for CAPTCHA verification
    z.object({
      captchaInput: baseSchema.nonEmptyString,
      vendor: baseSchema.nonEmptyString.refine(
        (val: string) => ['arkose', 'recaptcha'].includes(val),
        { message: 'Vendor must be either "arkose" or "recaptcha"' }
      )
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const { captchaInput, vendor } = req.body;
      
      const result = await authService.verifyCaptcha(captchaInput, vendor);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleHttpError(res, error as Error);
    }
  }
);

/**
 * Refresh authentication token
 * POST /mcp/auth/refresh
 */
router.post(
  '/refresh',
  validateBody('auth.refreshToken.request'),
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required in x-user-id header'
          }
        });
      }
      
      const token = await authService.refreshToken(userId);
      
      res.json({
        success: true,
        data: {
          token,
          refreshToken: refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
        }
      });
    } catch (error) {
      return handleHttpError(res, error as Error);
    }
  }
);

/**
 * Logout
 * POST /mcp/auth/logout
 */
router.post(
  '/logout',
  validateBody('auth.logout.request'),
  async (req: Request, res: Response) => {
    try {
      // We're not using sessionId and allSessions yet, but they're validated by the schema
      // const { sessionId, allSessions } = req.body;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User ID is required in x-user-id header'
          }
        });
      }
      
      // For now, just remove the token
      const success = authService.removeToken(userId);
      
      res.json({
        success: true,
        data: {
          status: success ? 'success' : 'error',
          message: success ? 'Successfully logged out' : 'Failed to logout'
        }
      });
    } catch (error) {
      return handleHttpError(res, error as Error);
    }
  }
);

/**
 * Password reset request
 * POST /mcp/auth/password-reset
 */
router.post(
  '/password-reset',
  validateBody('auth.passwordReset.request'),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      // In a real implementation, this would send a password reset email
      // For now, just log the request
      logger.info(`Password reset requested for email: ${email}`);
      
      res.json({
        success: true,
        data: {
          status: 'success',
          message: 'Password reset instructions sent to your email'
        }
      });
    } catch (error) {
      handleHttpError(res, error as Error);
    }
  }
);

/**
 * Password reset confirmation
 * POST /mcp/auth/password-reset/confirm
 */
router.post(
  '/password-reset/confirm',
  validateBody('auth.passwordReset.confirm'),
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      // In a real implementation, this would verify the token and update the password
      // For now, just log the request
      logger.info(`Password reset confirmation with token: ${token.substring(0, 8)}...`);
      
      res.json({
        success: true,
        data: {
          status: 'success',
          message: 'Password has been reset successfully'
        }
      });
    } catch (error) {
      handleHttpError(res, error as Error);
    }
  }
);

export default router;