/**
 * Configuration module
 * Loads environment variables and provides configuration settings
 */
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
 * Application configuration
 */
declare const config: AppConfig;
export default config;
