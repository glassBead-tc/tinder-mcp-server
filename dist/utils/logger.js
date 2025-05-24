"use strict";
/**
 * Logger utility
 * Provides logging functionality for the application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("../config"));
/**
 * Sensitive data patterns to mask in logs
 * SECURITY FIX: Added data masking for sensitive information
 */
const sensitiveDataPatterns = [
    // Phone numbers (various formats)
    { pattern: /(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g, replacement: '[PHONE_REDACTED]' },
    // User IDs (assuming UUID format)
    { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, replacement: '[USER_ID_REDACTED]' },
    // Email addresses
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    // Authentication tokens (Bearer, JWT, etc.)
    { pattern: /(Bearer\s+)[a-zA-Z0-9\-_=]+\.[a-zA-Z0-9\-_=]+\.[a-zA-Z0-9\-_=]+/g, replacement: '$1[TOKEN_REDACTED]' },
    // Credit card numbers
    { pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: '[CREDIT_CARD_REDACTED]' },
    // Social security numbers
    { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, replacement: '[SSN_REDACTED]' },
];
/**
 * Mask sensitive data in log messages
 * @param message - Log message to mask
 * @returns Masked log message
 */
const maskSensitiveData = (message) => {
    // If message is not a string or object, return as is
    if (typeof message !== 'string' && typeof message !== 'object') {
        return message;
    }
    // Handle string messages
    if (typeof message === 'string') {
        let maskedMessage = message;
        sensitiveDataPatterns.forEach(({ pattern, replacement }) => {
            maskedMessage = maskedMessage.replace(pattern, replacement);
        });
        return maskedMessage;
    }
    // Handle objects (including errors)
    if (typeof message === 'object') {
        // Clone the object to avoid modifying the original
        const maskedObject = { ...message };
        // Recursively mask sensitive data in object properties
        Object.keys(maskedObject).forEach(key => {
            // Skip masking stack traces in non-production environments
            if (key === 'stack' && config_1.default.NODE_ENV !== 'production') {
                return;
            }
            if (typeof maskedObject[key] === 'string') {
                let maskedValue = maskedObject[key];
                sensitiveDataPatterns.forEach(({ pattern, replacement }) => {
                    maskedValue = maskedValue.replace(pattern, replacement);
                });
                maskedObject[key] = maskedValue;
            }
            else if (typeof maskedObject[key] === 'object' && maskedObject[key] !== null) {
                maskedObject[key] = maskSensitiveData(maskedObject[key]);
            }
        });
        return maskedObject;
    }
    return message;
};
/**
 * Define log format with sensitive data masking
 */
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
    // Mask sensitive data before logging
    const maskedMessage = maskSensitiveData(message);
    return `${timestamp} [${level.toUpperCase()}]: ${typeof maskedMessage === 'object'
        ? JSON.stringify(maskedMessage)
        : maskedMessage}`;
}));
/**
 * Production transports configuration
 */
const productionTransports = config_1.default.NODE_ENV === 'production'
    ? [
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),
        new winston_1.default.transports.File({
            filename: 'logs/combined.log'
        })
    ]
    : [];
/**
 * Create logger instance
 */
const logger = winston_1.default.createLogger({
    level: config_1.default.LOG_LEVEL,
    format: logFormat,
    transports: [
        // Console transport for all environments
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
        }),
        // File transports for production
        ...productionTransports
    ]
});
exports.default = logger;
//# sourceMappingURL=logger.js.map