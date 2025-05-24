/**
 * Tinder API MCP Server
 * Main entry point
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger from './utils/logger';
import { handleHttpError } from './utils/error-handler';
import apiGateway from './services/api-gateway';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import interactionRoutes from './routes/interaction';

// Initialize Express app
const app: Express = express();

// Apply middleware
// SECURITY FIX: Enhanced Helmet configuration with explicit XSS protection and HSTS
app.use(helmet({
  // Enforce HTTPS with HSTS headers
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  // Enhanced XSS protection
  xssFilter: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Restrict script sources
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      // Report violations to endpoint (optional)
      reportUri: '/report-violation'
    }
  },
  // Prevent MIME type sniffing
  noSniff: true
}));

// Redirect HTTP to HTTPS in production
if (config.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(cors()); // CORS support
app.use(express.json({
  // Additional protection against JSON-based attacks
  limit: '100kb' // Limit request body size
})); // Parse JSON request body

// Add route for CSP violation reports
app.post('/report-violation', (req, res) => {
  if (req.body) {
    logger.warn('CSP Violation:', req.body);
  }
  res.status(204).end();
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// MCP server routes
app.use('/mcp/auth', authRoutes);
app.use('/mcp/user', userRoutes);
app.use('/mcp/interaction', interactionRoutes);

// MCP server tools endpoint
app.post('/mcp/tools', async (req: Request, res: Response) => {
  try {
    const { tool, params } = req.body;
    const result = await apiGateway.executeTool(tool, params);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleHttpError(res, error as Error);
  }
});

// MCP server resources endpoint
app.get('/mcp/resources/:resourceId', async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const result = await apiGateway.getResource(resourceId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleHttpError(res, error as Error);
  }
});

// MCP server info endpoint
app.get('/mcp/info', async (_req: Request, res: Response) => {
  try {
    const tools = apiGateway.getAvailableTools();
    const resources = apiGateway.getAvailableResources();
    
    res.json({
      success: true,
      data: {
        name: 'Tinder API MCP Server',
        version: '1.0.0',
        tools,
        resources
      }
    });
  } catch (error) {
    handleHttpError(res, error as Error);
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  handleHttpError(res, err);
});

// Start the server
const PORT = config.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Tinder API MCP Server running on port ${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

// Export app for testing
export default app;