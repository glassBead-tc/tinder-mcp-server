# Tinder API MCP Server

A Model Context Protocol (MCP) server for the Tinder API, implemented in TypeScript.

## Overview

This MCP server provides a standardized interface for interacting with the Tinder API. It handles authentication, request processing, rate limiting, caching, and error handling, making it easier to build applications that integrate with Tinder.

## Features

- **Authentication Management**: Support for SMS and Facebook authentication methods
- **Request Handling**: Validation, transformation, and forwarding of API requests
- **Response Processing**: Parsing, validation, and transformation of API responses
- **Rate Limiting**: Protection against API rate limits
- **Caching**: Efficient caching of API responses
- **Error Handling**: Standardized error responses
- **Security**: Secure token storage and HTTPS communication

## Architecture

The server follows a modular architecture with the following components:

- **API Gateway**: Entry point for MCP tools and resources
- **Authentication Service**: Handles user authentication flows
- **Request Handler**: Processes and forwards API requests
- **Rate Limiter**: Manages API rate limits
- **Cache Manager**: Caches API responses
- **Error Handler**: Standardizes error responses

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tinder-api-mcp-server.git
   cd tinder-api-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration settings.

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run the production server:
   ```bash
   npm start
   ```

4. Run tests:
   ```bash
   npm test
   ```

## API Endpoints

### Authentication

- `POST /mcp/auth/sms/send`: Send SMS verification code
- `POST /mcp/auth/sms/validate`: Validate SMS verification code
- `POST /mcp/auth/facebook`: Authenticate with Facebook
- `POST /mcp/auth/captcha`: Verify CAPTCHA
- `POST /mcp/auth/refresh`: Refresh authentication token

### User

- `GET /mcp/user/:userId`: Get user profile
- `GET /mcp/user/recommendations`: Get user recommendations
- `PUT /mcp/user/profile`: Update user profile
- `GET /mcp/user/matches`: Get user matches

### Interaction

- `POST /mcp/interaction/like/:targetUserId`: Like a user
- `POST /mcp/interaction/superlike/:targetUserId`: Super like a user
- `POST /mcp/interaction/pass/:targetUserId`: Pass on a user
- `POST /mcp/interaction/boost`: Boost profile
- `POST /mcp/interaction/message/:matchId`: Send message
- `GET /mcp/interaction/messages/:matchId`: Get messages for a match

### MCP Tools and Resources

- `POST /mcp/tools`: Execute MCP tool
- `GET /mcp/resources/:resourceId`: Access MCP resource
- `GET /mcp/info`: Get server information

## MCP Tools

The server provides the following MCP tools:

- `authenticate_sms`: Authenticate user with SMS
- `authenticate_facebook`: Authenticate user with Facebook
- `verify_captcha`: Verify CAPTCHA response
- `like_user`: Like a user profile
- `super_like_user`: Super like a user profile
- `pass_user`: Pass on a user profile
- `boost_profile`: Boost user profile visibility
- `get_user_profile`: Get user profile information
- `get_recommendations`: Get potential matches
- `clear_cache`: Clear cache
- `get_rate_limits`: Get rate limit information

## MCP Resources

The server provides the following MCP resources:

- `api-docs`: API documentation
- `server-status`: Server status information

## Security Considerations

- Never hardcode secrets or API keys
- Use environment variables for sensitive information
- Implement proper authentication for all endpoints
- Use HTTPS for all communications
- Sanitize input and output data

## License

MIT