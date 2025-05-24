/**
 * Core type definitions for the Tinder API MCP Server
 */

/**
 * HTTP Method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Client request interface
 */
export interface ClientRequest {
  method: HttpMethod;
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  userId?: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    endpoint?: string;
    timestamp: number;
    details?: any;
  };
}

/**
 * Success response interface
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * API Response type
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Authentication token data interface
 */
export interface TokenData {
  apiToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * SMS Authentication result interface
 */
export interface SmsAuthResult {
  status: 'otp_sent' | 'authenticated';
  otpLength?: number;
  userId?: string;
  isNewUser?: boolean;
}

/**
 * Facebook Authentication result interface
 */
export interface FacebookAuthResult {
  status: 'onboarding_required' | 'authenticated';
  onboardingToken?: string;
  userId?: string;
}

/**
 * CAPTCHA verification result interface
 */
export interface CaptchaVerificationResult {
  status: 'verified';
  data: any;
}

/**
 * Rate limit data interface
 */
export interface RateLimitData {
  remaining: number;
  resetAt: number;
}

/**
 * User rate limits interface
 */
export interface UserRateLimits {
  likes: RateLimitData;
  superLikes: RateLimitData;
  boosts: RateLimitData;
}

/**
 * Global rate limits interface
 */
export interface GlobalRateLimits {
  requestsPerMinute: number;
  currentCount: number;
  windowStart: number;
}

/**
 * Validation failure tracking interface
 */
export interface ValidationFailureTracking {
  failures: number;
  lastFailure: number;
  ipAddress?: string;
  endpoint?: string;
  userId?: string;
}

/**
 * Validation rate limit interface
 */
export interface ValidationRateLimits {
  maxFailuresPerMinute: number;
  maxFailuresPerHour: number;
  blockDurationMs: number;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
}

/**
 * MCP Tool interface
 */
export interface McpTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

/**
 * MCP Resource interface
 */
export interface McpResource {
  id: string;
  type: string;
  data: any;
}

/**
 * User profile interface based on Tinder API
 */
export interface UserProfile {
  _id: string;
  bio?: string;
  birth_date?: string;
  name?: string;
  photos?: Array<{
    id: string;
    url: string;
    processedFiles?: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  }>;
  gender?: number;
  jobs?: any[];
  schools?: any[];
  distance_mi?: number;
}

/**
 * Error codes enum
 */
export enum ErrorCodes {
  AUTHENTICATION_FAILED = 1001,
  RATE_LIMIT_EXCEEDED = 1002,
  VALIDATION_ERROR = 1003,
  VALIDATION_TIMEOUT = 1004,
  VALIDATION_DEPTH_EXCEEDED = 1005,
  VALIDATION_SIZE_EXCEEDED = 1006,
  SCHEMA_ERROR = 1007,
  API_ERROR = 1008,
  NETWORK_ERROR = 1009,
  UNKNOWN_ERROR = 9999
}