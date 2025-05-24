/**
 * Integration Test Configuration
 * 
 * This file configures the integration tests for the Tinder API MCP server.
 * It sets up the test environment, mocks external dependencies, and provides
 * utility functions for testing.
 */

module.exports = {
  // Test environment configuration
  testEnvironment: 'node',
  
  // Test timeout (in milliseconds)
  testTimeout: 30000,
  
  // Test paths
  testMatch: [
    '**/src/__tests__/**/*.test.ts',
    '**/src/__tests__/integration/**/*.test.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/types/**/*'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Mock configuration
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Module name mapper
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Test reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-reports',
      outputName: 'junit.xml'
    }]
  ],
  
  // Verbose output
  verbose: true
};