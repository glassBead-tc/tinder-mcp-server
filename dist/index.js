"use strict";
/**
 * Tinder API MCP Server
 * Main entry point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const error_handler_1 = require("./utils/error-handler");
const api_gateway_1 = __importDefault(require("./services/api-gateway"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const interaction_1 = __importDefault(require("./routes/interaction"));
// Initialize Express app
const app = (0, express_1.default)();
// Apply middleware
// SECURITY FIX: Enhanced Helmet configuration with explicit XSS protection and HSTS
app.use((0, helmet_1.default)({
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
if (config_1.default.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        }
        else {
            next();
        }
    });
}
app.use((0, cors_1.default)()); // CORS support
app.use(express_1.default.json({
    // Additional protection against JSON-based attacks
    limit: '100kb' // Limit request body size
})); // Parse JSON request body
// Add route for CSP violation reports
app.post('/report-violation', (req, res) => {
    if (req.body) {
        logger_1.default.warn('CSP Violation:', req.body);
    }
    res.status(204).end();
});
// Request logging middleware
app.use((req, _res, next) => {
    logger_1.default.info(`${req.method} ${req.url}`);
    next();
});
// MCP server routes
app.use('/mcp/auth', auth_1.default);
app.use('/mcp/user', user_1.default);
app.use('/mcp/interaction', interaction_1.default);
// MCP server tools endpoint
app.post('/mcp/tools', async (req, res) => {
    try {
        const { tool, params } = req.body;
        const result = await api_gateway_1.default.executeTool(tool, params);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
// MCP server resources endpoint
app.get('/mcp/resources/:resourceId', async (req, res) => {
    try {
        const { resourceId } = req.params;
        const result = await api_gateway_1.default.getResource(resourceId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
// MCP server info endpoint
app.get('/mcp/info', async (_req, res) => {
    try {
        const tools = api_gateway_1.default.getAvailableTools();
        const resources = api_gateway_1.default.getAvailableResources();
        res.json({
            success: true,
            data: {
                name: 'Tinder API MCP Server',
                version: '1.0.0',
                tools,
                resources
            }
        });
    }
    catch (error) {
        (0, error_handler_1.handleHttpError)(res, error);
    }
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    (0, error_handler_1.handleHttpError)(res, err);
});
// Start the server
const PORT = config_1.default.PORT || 3000;
app.listen(PORT, () => {
    logger_1.default.info(`Tinder API MCP Server running on port ${PORT}`);
    logger_1.default.info(`Environment: ${config_1.default.NODE_ENV}`);
});
// Export app for testing
exports.default = app;
//# sourceMappingURL=index.js.map