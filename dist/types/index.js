"use strict";
/**
 * Core type definitions for the Tinder API MCP Server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = void 0;
/**
 * Error codes enum
 */
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["AUTHENTICATION_FAILED"] = 1001] = "AUTHENTICATION_FAILED";
    ErrorCodes[ErrorCodes["RATE_LIMIT_EXCEEDED"] = 1002] = "RATE_LIMIT_EXCEEDED";
    ErrorCodes[ErrorCodes["VALIDATION_ERROR"] = 1003] = "VALIDATION_ERROR";
    ErrorCodes[ErrorCodes["VALIDATION_TIMEOUT"] = 1004] = "VALIDATION_TIMEOUT";
    ErrorCodes[ErrorCodes["VALIDATION_DEPTH_EXCEEDED"] = 1005] = "VALIDATION_DEPTH_EXCEEDED";
    ErrorCodes[ErrorCodes["VALIDATION_SIZE_EXCEEDED"] = 1006] = "VALIDATION_SIZE_EXCEEDED";
    ErrorCodes[ErrorCodes["SCHEMA_ERROR"] = 1007] = "SCHEMA_ERROR";
    ErrorCodes[ErrorCodes["API_ERROR"] = 1008] = "API_ERROR";
    ErrorCodes[ErrorCodes["NETWORK_ERROR"] = 1009] = "NETWORK_ERROR";
    ErrorCodes[ErrorCodes["UNKNOWN_ERROR"] = 9999] = "UNKNOWN_ERROR";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
//# sourceMappingURL=index.js.map