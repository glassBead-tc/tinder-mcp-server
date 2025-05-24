/**
 * Sanitizer Utility
 * Provides functions to sanitize user input and prevent injection attacks
 */

import { z } from 'zod';
import logger from './logger';

/**
 * Sanitization options
 */
export interface SanitizationOptions {
  /**
   * Maximum string length
   */
  maxStringLength?: number;
  
  /**
   * Maximum object depth
   */
  maxObjectDepth?: number;
  
  /**
   * Remove HTML tags
   */
  stripHtml?: boolean;
  
  /**
   * Remove script tags specifically
   */
  stripScripts?: boolean;
  
  /**
   * Escape special characters
   */
  escapeSpecialChars?: boolean;
  
  /**
   * Allowed object keys (whitelist)
   */
  allowedKeys?: string[];
  
  /**
   * Disallowed object keys (blacklist)
   */
  disallowedKeys?: string[];
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: SanitizationOptions = {
  maxStringLength: 10000,
  maxObjectDepth: 10,
  stripHtml: true,
  stripScripts: true,
  escapeSpecialChars: true,
  disallowedKeys: ['__proto__', 'constructor', 'prototype']
};

/**
 * Sanitizer class
 */
export class Sanitizer {
  private options: SanitizationOptions;

  constructor(options: SanitizationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Sanitize any value
   * @param value - Value to sanitize
   * @param currentDepth - Current object depth (for recursion)
   * @returns Sanitized value
   */
  public sanitize(value: any, currentDepth: number = 0): any {
    // Check object depth
    if (currentDepth > this.options.maxObjectDepth!) {
      logger.warn('Maximum object depth exceeded during sanitization');
      return null;
    }

    // Handle different types
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return this.sanitizeArray(value, currentDepth);
    }

    if (typeof value === 'object') {
      return this.sanitizeObject(value, currentDepth);
    }

    // For functions and other types, return null
    return null;
  }

  /**
   * Sanitize string value
   * @param str - String to sanitize
   * @returns Sanitized string
   */
  private sanitizeString(str: string): string {
    let sanitized = str;

    // Enforce maximum length
    if (this.options.maxStringLength && sanitized.length > this.options.maxStringLength) {
      sanitized = sanitized.substring(0, this.options.maxStringLength);
      logger.debug('String truncated during sanitization');
    }

    // Strip HTML tags
    if (this.options.stripHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Strip script tags specifically
    if (this.options.stripScripts) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    }

    // Escape special characters
    if (this.options.escapeSpecialChars) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    return sanitized;
  }

  /**
   * Sanitize array
   * @param arr - Array to sanitize
   * @param currentDepth - Current object depth
   * @returns Sanitized array
   */
  private sanitizeArray(arr: any[], currentDepth: number): any[] {
    return arr.map(item => this.sanitize(item, currentDepth + 1));
  }

  /**
   * Sanitize object
   * @param obj - Object to sanitize
   * @param currentDepth - Current object depth
   * @returns Sanitized object
   */
  private sanitizeObject(obj: any, currentDepth: number): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check disallowed keys
      if (this.options.disallowedKeys?.includes(key)) {
        logger.warn(`Disallowed key "${key}" removed during sanitization`);
        continue;
      }

      // Check allowed keys if whitelist is specified
      if (this.options.allowedKeys && !this.options.allowedKeys.includes(key)) {
        logger.debug(`Key "${key}" not in allowed list, removed during sanitization`);
        continue;
      }

      // Sanitize the key itself
      const sanitizedKey = this.sanitizeString(key);

      // Sanitize the value
      sanitized[sanitizedKey] = this.sanitize(value, currentDepth + 1);
    }

    return sanitized;
  }

  /**
   * Create a sanitization schema for Zod
   * @returns Zod schema with sanitization
   */
  public createSanitizationSchema(): z.ZodType {
    return z.any().transform((val) => this.sanitize(val));
  }
}

/**
 * Default sanitizer instance
 */
export const defaultSanitizer = new Sanitizer();

/**
 * Sanitize function using default options
 * @param value - Value to sanitize
 * @returns Sanitized value
 */
export function sanitize(value: any): any {
  return defaultSanitizer.sanitize(value);
}

/**
 * Create custom sanitizer with options
 * @param options - Sanitization options
 * @returns Sanitizer instance
 */
export function createSanitizer(options: SanitizationOptions): Sanitizer {
  return new Sanitizer(options);
}

/**
 * Sanitize request body for API calls
 * @param body - Request body
 * @returns Sanitized body
 */
export function sanitizeRequestBody(body: any): any {
  const apiSanitizer = new Sanitizer({
    maxStringLength: 5000,
    maxObjectDepth: 5,
    stripHtml: true,
    stripScripts: true,
    escapeSpecialChars: false, // Don't escape for API calls
    disallowedKeys: ['__proto__', 'constructor', 'prototype', 'eval', 'Function']
  });

  return apiSanitizer.sanitize(body);
}

export default {
  Sanitizer,
  defaultSanitizer,
  sanitize,
  createSanitizer,
  sanitizeRequestBody
};