# Tinder API MCP Server Integration Testing

This document provides instructions for running the integration tests for the Tinder API MCP server.

## Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Git

## Setup

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/your-organization/tinder-api-mcp-server.git
   cd tinder-api-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file to set the required environment variables, especially:
   - `TOKEN_SECRET` (required for security)

## Running Integration Tests

### Using the Test Script

We've provided a shell script that automates the integration testing process:

```bash
# Make the script executable
chmod +x run-integration-tests.sh

# Run the integration tests
./run-integration-tests.sh
```

The script will:
1. Check dependencies
2. Run all integration tests
3. Generate a test report in the `test-reports` directory

### Running Tests Manually

If you prefer to run tests manually, you can use the following npm commands:

```bash
# Run all tests
npm test

# Run only integration tests
npm test -- --testPathPattern="integration"

# Run specific test files
npm test -- --testPathPattern="authentication"

# Run tests with coverage report
npm test -- --coverage
```

## Test Configuration

The integration tests are configured in `integration-test-config.js`. This file sets up:

- Test environment (Node.js)
- Test timeouts
- Coverage configuration
- Test reporters
- Module mapping

## Test Structure

The integration tests are organized as follows:

- `src/__tests__/integration/`: Integration tests that test multiple components together
- `src/__tests__/services/`: Tests for individual services
- `src/__tests__/utils/`: Tests for utility functions
- `src/__tests__/routes/`: Tests for API routes

## Mocking

External dependencies are mocked in `src/__tests__/setup.js`. This includes:

- Environment variables
- Axios HTTP client
- Node-cache
- Winston logger

## Test Reports

Test reports are generated in the `test-reports` directory. The reports include:

- Test results (pass/fail)
- Code coverage
- Test execution time

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: There are known TypeScript errors in the codebase related to the Zod library. These do not affect the runtime behavior but should be fixed in a separate task.

2. **Test Timeouts**: If tests are timing out, you can increase the timeout in `integration-test-config.js`.

3. **Authentication Failures**: Ensure that `TOKEN_SECRET` is set in your `.env` file.

4. **Missing Dependencies**: If you encounter errors about missing dependencies, run `npm install` to ensure all dependencies are installed.

### Getting Help

If you encounter issues running the integration tests, please:

1. Check the error messages and logs
2. Consult the troubleshooting section in the main documentation
3. Contact the development team

## Continuous Integration

These tests are also run in the CI/CD pipeline. The configuration can be found in the project's CI configuration files.

## Next Steps

After running the integration tests, you can:

1. Review the test report in `test-reports/`
2. Fix any failing tests
3. Improve test coverage for areas with low coverage
4. Add new tests for new features