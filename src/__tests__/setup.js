/**
 * Test Setup
 * 
 * This file sets up the test environment for the Tinder API MCP server.
 * It mocks external dependencies and provides utility functions for testing.
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.TINDER_API_BASE_URL = 'https://api.gotinder.com';
process.env.TINDER_IMAGES_URL = 'https://images-ssl.gotinder.com';
process.env.TINDER_STATS_URL = 'https://etl.tindersparks.com';
process.env.TINDER_API_TIMEOUT = '5000';
process.env.TINDER_API_MAX_RETRIES = '2';
process.env.CACHE_TTL = '60';
process.env.CACHE_CHECK_PERIOD = '30';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '50';
process.env.TOKEN_SECRET = 'test-secret-key';
process.env.TOKEN_EXPIRY = '1h';
process.env.LOG_LEVEL = 'error';

// Mock axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };
  return mockAxios;
});

// Mock node-cache
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushAll: jest.fn(),
    getStats: jest.fn(),
    keys: jest.fn(),
    has: jest.fn()
  }));
});

// Mock winston logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Global test utilities
global.testUtils = {
  // Create a mock Express request
  createMockRequest: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides
  }),
  
  // Create a mock Express response
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Create a mock Express next function
  createMockNext: () => jest.fn(),
  
  // Create a mock token data
  createMockTokenData: (overrides = {}) => ({
    apiToken: 'mock-api-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000,
    ...overrides
  }),
  
  // Create a mock API response
  createMockApiResponse: (data = {}, status = 200) => ({
    data,
    status,
    headers: {}
  }),
  
  // Create a mock API error
  createMockApiError: (message = 'API Error', status = 400, data = {}) => {
    const error = new Error(message);
    error.response = {
      data,
      status
    };
    return error;
  }
};

// Global beforeEach for all tests
beforeEach(() => {
  jest.clearAllMocks();
});