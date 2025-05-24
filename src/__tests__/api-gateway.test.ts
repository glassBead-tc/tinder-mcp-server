/**
 * API Gateway Tests
 */

import apiGateway from '../services/api-gateway';

// Mock dependencies
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../services/request-handler', () => ({
  processRequest: jest.fn()
}));

jest.mock('../services/authentication', () => ({
  authenticateWithSMS: jest.fn(),
  authenticateWithFacebook: jest.fn(),
  verifyCaptcha: jest.fn(),
  refreshToken: jest.fn(),
  getValidToken: jest.fn(),
  removeToken: jest.fn()
}));

describe('API Gateway', () => {
  describe('getResource', () => {
    it('should return server-status resource', async () => {
      // Act
      const result = await apiGateway.getResource('server-status');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('server-status');
      expect(result.type).toBe('status');
      expect(result.data.status).toBe('online');
    });
    
    it('should throw error for non-existent resource', async () => {
      // Act & Assert
      await expect(apiGateway.getResource('non-existent')).rejects.toThrow();
    });
  });
  
  describe('getAvailableTools', () => {
    it('should return list of available tools', () => {
      // Act
      const tools = apiGateway.getAvailableTools();
      
      // Assert
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      
      // Check tool structure
      const tool = tools[0];
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
    });
  });
  
  describe('getAvailableResources', () => {
    it('should return list of available resources', () => {
      // Act
      const resources = apiGateway.getAvailableResources();
      
      // Assert
      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      
      // Check resource structure
      const resource = resources[0];
      expect(resource).toHaveProperty('id');
      expect(resource).toHaveProperty('type');
    });
  });
});