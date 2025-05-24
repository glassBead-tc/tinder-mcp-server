# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Run
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run dev` - Start development server with hot reload (ts-node-dev)
- `npm start` - Start production server (requires build first)

### Testing
- `npm test` - Run all tests with Jest
- `npm test -- --testPathPattern="integration"` - Run only integration tests
- `npm test -- --testPathPattern="<pattern>"` - Run tests matching pattern
- `npm test -- --coverage` - Run tests with coverage report
- `./run-integration-tests.sh` - Run integration tests with automated reporting

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files
- `npm run format` - Format code with Prettier

## Architecture Overview

This is a Model Context Protocol (MCP) server for the Tinder API built with Express.js and TypeScript.

### Key Components

1. **API Gateway** (`src/services/api-gateway.ts`): Central hub that manages MCP tools and resources. Registers all available tools (authenticate_sms, like_user, get_recommendations, etc.) and executes them on demand.

2. **Request Handler** (`src/services/request-handler.ts`): Processes and forwards API requests to the actual Tinder API, handling validation, transformation, and response processing.

3. **Authentication Service** (`src/services/authentication.ts`): Manages SMS and Facebook authentication flows, token generation, and CAPTCHA verification.

4. **Rate Limiter** (`src/services/rate-limiter.ts`): Implements both user-level and global rate limiting to prevent API abuse.

5. **Cache Manager** (`src/services/cache-manager.ts`): In-memory caching using node-cache for efficient response caching.

### Request Flow

1. Client sends request to MCP endpoint (e.g., `/mcp/tools` or route endpoints)
2. Request goes through security middleware (Helmet, CORS, JSON limits)
3. Route handler validates request using Zod schemas
4. Service layer processes the request (auth, rate limiting, caching)
5. Request Handler forwards to Tinder API if needed
6. Response is cached and returned to client

### Important Configuration

- Environment variables are loaded from `.env` file (see `.env.example`)
- `TOKEN_SECRET` must be set for JWT authentication
- Server enforces HTTPS in production with automatic HTTP->HTTPS redirect
- Request body size limited to 100kb for security

### Testing Structure

- Unit tests: `src/__tests__/<component>/*.test.ts`
- Integration tests: `src/__tests__/integration/*.test.ts`
- Test setup and mocks: `src/__tests__/setup.js`
- Coverage threshold: 70% for all metrics

### Schema Validation

The project uses Zod for runtime validation with schemas organized in:
- `src/schemas/api/` - API endpoint schemas
- `src/schemas/common/` - Shared schemas
- `src/schemas/registry.ts` - Central schema registry