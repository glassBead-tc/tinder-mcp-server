/**
 * Configuration module
 * Loads environment variables and provides configuration settings
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Tinder API configuration interface
 */
interface TinderApiConfig {
  BASE_URL: string;
  IMAGES_URL: string;
  STATS_URL: string;
  TIMEOUT: number;
  MAX_RETRIES: number;
}

/**
 * Cache configuration interface
 */
interface CacheConfig {
  TTL: number;
  CHECK_PERIOD: number;
}

/**
 * Rate limit configuration interface
 */
interface RateLimitConfig {
  WINDOW_MS: number;
  MAX_REQUESTS: number;
}

/**
 * Security configuration interface
 */
interface SecurityConfig {
  TOKEN_SECRET: string;
  TOKEN_EXPIRY: string;
}

/**
 * Application configuration interface
 */
interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  TINDER_API: TinderApiConfig;
  CACHE: CacheConfig;
  RATE_LIMIT: RateLimitConfig;
  SECURITY: SecurityConfig;
  LOG_LEVEL: string;
}

/**
 * Parse environment variable as integer with fallback
 * @param value - Environment variable value
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed integer or default value
 */
const parseIntEnv = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Application configuration
 */
const config: AppConfig = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseIntEnv(process.env.PORT, 3000),
  
  // Tinder API configuration
  TINDER_API: {
    BASE_URL: process.env.TINDER_API_BASE_URL || 'https://api.gotinder.com',
    IMAGES_URL: process.env.TINDER_IMAGES_URL || 'https://images-ssl.gotinder.com',
    STATS_URL: process.env.TINDER_STATS_URL || 'https://etl.tindersparks.com',
    TIMEOUT: parseIntEnv(process.env.TINDER_API_TIMEOUT, 30000), // 30 seconds
    MAX_RETRIES: parseIntEnv(process.env.TINDER_API_MAX_RETRIES, 3),
  },
  
  // Cache configuration
  CACHE: {
    TTL: parseIntEnv(process.env.CACHE_TTL, 300), // 5 minutes
    CHECK_PERIOD: parseIntEnv(process.env.CACHE_CHECK_PERIOD, 60), // 1 minute
  },
  
  // Rate limiting configuration
  RATE_LIMIT: {
    WINDOW_MS: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 60000), // 1 minute
    MAX_REQUESTS: parseIntEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },
  
  // Security configuration
  SECURITY: {
    // CRITICAL SECURITY FIX: Remove default token secret to prevent security vulnerabilities
    // A missing TOKEN_SECRET will now throw an error during startup
    TOKEN_SECRET: process.env.TOKEN_SECRET ? process.env.TOKEN_SECRET : (() => {
      throw new Error('TOKEN_SECRET environment variable is required for security. Please set it in your .env file.');
    })(),
    TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || '24h',
  },
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export default config;