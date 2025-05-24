# Tinder API MCP Server Specification

## 1. API Overview

The Tinder API provides programmatic access to Tinder's core functionality, including user authentication, profile management, swiping (like/pass), messaging, and other features. This document outlines the requirements for an MCP server that will interface with the Tinder API.

### 1.1 Base URLs

The Tinder API uses several base URLs for different types of operations:

- **Main API**: `https://api.gotinder.com` - Primary endpoint for most operations
- **Statistics**: `https://etl.tindersparks.com` - Analytics and statistics
- **Images**: `https://images-ssl.gotinder.com` - Image handling and processing

## 2. Key Endpoints and Data Structures

### 2.1 Authentication Endpoints

#### 2.1.1 SMS Authentication Flow

1. **Send Verification Code**
   - Endpoint: `POST /v2/auth/sms/send`
   - Purpose: Sends a verification code to the user's phone number
   - Request Body: `{ "phone_number": "XXYYZZZZZZZZZ" }`
   - Response: Contains `otp_length` and confirmation of SMS sent

2. **Validate Verification Code**
   - Endpoint: `POST /v2/auth/sms/validate`
   - Purpose: Validates the OTP code sent to the user's phone
   - Request Body: `{ "otp_code": "123456", "phone_number": "XXYYZZZZZZZZZ", "is_update": false }`
   - Response: Contains `refresh_token` if validation is successful

3. **Login with SMS**
   - Endpoint: `POST /v2/auth/login/sms`
   - Purpose: Exchanges refresh token for API token
   - Request Body: `{ "refresh_token": "xxxx.xxxx.xxxx-xxxx" }`
   - Response: Contains `api_token`, `refresh_token`, and user ID

#### 2.1.2 Facebook Authentication Flow

1. **Login with Facebook**
   - Endpoint: `POST /v2/auth/login/facebook`
   - Purpose: Authenticates user with Facebook token
   - Request Body: `{ "token": "facebook-token" }`
   - Response: Contains `onboarding_token` or `api_token` depending on whether the user is new

#### 2.1.3 CAPTCHA Verification

1. **Verify CAPTCHA**
   - Endpoint: `POST /v2/auth/verify-captcha`
   - Purpose: Verifies CAPTCHA response for security
   - Request Body: `{ "captcha_input": "...", "vendor": "arkose|recaptcha" }`
   - Response: Confirmation of successful verification

### 2.2 Core Functionality Endpoints

#### 2.2.1 User Interactions

1. **Like User**
   - Endpoint: `GET /like/{user_id}`
   - Purpose: Likes a user profile
   - Headers: Requires `X-Auth-Token`
   - Response: Contains match status and remaining likes

2. **Super Like User**
   - Endpoint: `POST /like/{user_id}/super`
   - Purpose: Super likes a user profile
   - Headers: Requires `X-Auth-Token`
   - Response: Contains match status and remaining super likes

3. **Pass (Dislike) User**
   - Endpoint: `GET /pass/{user_id}`
   - Purpose: Passes on a user profile
   - Headers: Requires `X-Auth-Token`
   - Response: Confirmation of pass action

4. **Boost Profile**
   - Endpoint: `POST /boost`
   - Purpose: Boosts user's profile visibility
   - Headers: Requires `X-Auth-Token`
   - Response: Contains boost duration and status

#### 2.2.2 User Data

1. **Get User Profile**
   - Endpoint: `GET /user/{user_id}`
   - Purpose: Retrieves a user's profile information
   - Headers: Requires `X-Auth-Token`
   - Response: Contains detailed user profile data

2. **Get Recommendations**
   - Endpoint: `GET /v2/recs/core`
   - Purpose: Retrieves potential matches for the user
   - Headers: Requires `X-Auth-Token`
   - Response: Contains array of recommended user profiles

### 2.3 Key Data Structures

#### 2.3.1 User Profile

```json
{
  "_id": "57dd1e83f5bec39f48194e1d",
  "bio": "User bio text",
  "birth_date": "1984-05-22T15:11:58.587Z",
  "name": "User name",
  "photos": [
    {
      "id": "d127a410-ff04-4188-a646-0c7f76e967a8",
      "url": "https://images-ssl.gotinder.com/57dd1e83f5bec39f48194e1d/1080x1080_d127a410-ff04-4188-a646-0c7f76e967a8.jpg",
      "processedFiles": [
        {
          "url": "https://images-ssl.gotinder.com/57dd1e83f5bec39f48194e1d/640x640_d127a410-ff04-4188-a646-0c7f76e967a8.jpg",
          "height": 640,
          "width": 640
        }
      ]
    }
  ],
  "gender": 1,
  "jobs": [],
  "schools": [],
  "distance_mi": 7591
}
```

#### 2.3.2 Authentication Tokens

```json
{
  "api_token": "e98e29d5-bbc1-4037-ada6-39a1864f6e05",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9.NTUxMTk1NDkyMzkxMA.jZe8SqoRx5nY80ouRwchnmHBdo9MGcYpcwZDtxJLn5E"
}
```

## 3. MCP Server Requirements

### 3.1 Core Requirements

1. **Authentication Management**
   - Support multiple authentication methods (SMS, Facebook)
   - Securely store and manage authentication tokens
   - Handle token refresh and expiration
   - Implement proper error handling for authentication failures

2. **Request Handling**
   - Process incoming requests from clients
   - Validate request parameters
   - Transform requests to match Tinder API requirements
   - Handle rate limiting and throttling

3. **Response Processing**
   - Parse and validate API responses
   - Transform responses to a consistent format for clients
   - Handle error responses appropriately
   - Cache responses when appropriate

4. **Security**
   - Implement secure storage for tokens and credentials
   - Use HTTPS for all communications
   - Implement proper authentication for client requests
   - Sanitize input and output data

### 3.2 Technical Requirements

1. **Performance**
   - Handle concurrent requests efficiently
   - Implement connection pooling for API requests
   - Optimize for low latency
   - Implement appropriate caching strategies

2. **Reliability**
   - Implement retry mechanisms for failed requests
   - Handle API downtime gracefully
   - Implement circuit breakers for API endpoints
   - Provide fallback mechanisms when possible

3. **Scalability**
   - Design for horizontal scalability
   - Implement stateless architecture where possible
   - Use efficient data structures and algorithms
   - Optimize resource usage

4. **Monitoring and Logging**
   - Log all API requests and responses
   - Monitor API usage and performance
   - Track rate limits and quota usage
   - Implement alerting for critical issues

## 4. Potential Challenges and Considerations

### 4.1 Rate Limiting

The Tinder API implements rate limiting on several endpoints:

1. **Like Rate Limiting**
   - Standard users are limited to 100 likes per 12-hour period
   - When limit is reached, `likes_remaining` will be 0 and `rate_limited_until` timestamp is provided

2. **Super Like Rate Limiting**
   - Limited number of super likes per day (typically 5)
   - Tracked via `super_likes.remaining` and `super_likes.resets_at`

3. **Boost Rate Limiting**
   - Limited number of boosts (typically 1 per 30 days for free users)
   - Tracked via `boost_remaining` and `boost_reset_at`

4. **General API Rate Limiting**
   - Too many requests result in HTTP 429 responses
   - Error code 41205 with message "Failed rate limiter check"

### 4.2 Authentication Challenges

1. **Token Management**
   - API tokens expire and need to be refreshed
   - Different authentication flows for new vs. existing users
   - Need to handle token invalidation scenarios

2. **CAPTCHA Requirements**
   - New user registration may require CAPTCHA verification
   - Multiple CAPTCHA vendors supported (Arkose Labs, reCAPTCHA)
   - CAPTCHA challenges may change over time

### 4.3 API Stability Considerations

1. **Versioning**
   - API endpoints may change between versions
   - Need to handle backward compatibility

2. **Undocumented Fields**
   - Many fields are marked as "TODO" in the documentation
   - Response structures may contain unexpected fields

3. **Error Handling**
   - Inconsistent error formats across endpoints
   - Some errors use `status` while others use `statusCode`

## 5. High-Level Pseudocode

### 5.1 MCP Server Architecture

```
module TinderMCPServer
  // Core components
  AuthenticationManager
  RequestProcessor
  ResponseHandler
  RateLimitManager
  CacheManager
  ErrorHandler
  
  // Configuration
  Config {
    API_BASE_URL: "https://api.gotinder.com",
    IMAGES_BASE_URL: "https://images-ssl.gotinder.com",
    STATS_BASE_URL: "https://etl.tindersparks.com",
    DEFAULT_TIMEOUT: 30000,  // 30 seconds
    MAX_RETRIES: 3,
    CACHE_TTL: 300,  // 5 minutes
  }
  
  // Entry point
  function start()
    initializeComponents()
    startServer()
  end
end
```

### 5.2 Authentication Flow

```
module AuthenticationManager
  // Token storage - never hardcode actual secrets
  TokenStore {
    // In-memory map for active sessions
    activeTokens: Map<userId, {
      apiToken: string,
      refreshToken: string,
      expiresAt: timestamp
    }>
    
    // Methods for secure token management
    getToken(userId)
    storeToken(userId, tokenData)
    removeToken(userId)
    isTokenExpired(userId)
  }
  
  // SMS Authentication
  async function authenticateWithSMS(phoneNumber, otpCode = null)
    if (otpCode == null)
      // Step 1: Request OTP
      response = await sendRequest({
        method: "POST",
        url: "/v2/auth/sms/send",
        body: { phone_number: phoneNumber }
      })
      
      return {
        status: "otp_sent",
        otpLength: response.data.otp_length
      }
    else
      // Step 2: Validate OTP
      validateResponse = await sendRequest({
        method: "POST",
        url: "/v2/auth/sms/validate",
        body: {
          otp_code: otpCode,
          phone_number: phoneNumber,
          is_update: false
        }
      })
      
      // Step 3: Login with refresh token
      loginResponse = await sendRequest({
        method: "POST",
        url: "/v2/auth/login/sms",
        body: {
          refresh_token: validateResponse.data.refresh_token
        }
      })
      
      // Store tokens securely
      TokenStore.storeToken(loginResponse.data._id, {
        apiToken: loginResponse.data.api_token,
        refreshToken: loginResponse.data.refresh_token,
        expiresAt: calculateExpiryTime()
      })
      
      return {
        status: "authenticated",
        userId: loginResponse.data._id,
        isNewUser: loginResponse.data.is_new_user
      }
    end
  end
  
  // Facebook Authentication
  async function authenticateWithFacebook(facebookToken)
    response = await sendRequest({
      method: "POST",
      url: "/v2/auth/login/facebook",
      body: { token: facebookToken }
    })
    
    if (response.data.is_new_user)
      return {
        status: "onboarding_required",
        onboardingToken: response.data.onboarding_token
      }
    else
      // Store tokens securely
      TokenStore.storeToken(response.data._id, {
        apiToken: response.data.api_token,
        refreshToken: response.data.refresh_token,
        expiresAt: calculateExpiryTime()
      })
      
      return {
        status: "authenticated",
        userId: response.data._id
      }
    end
  end
  
  // Token refresh logic
  async function refreshToken(userId)
    tokenData = TokenStore.getToken(userId)
    
    if (!tokenData)
      throw new Error("No token found for user")
    end
    
    response = await sendRequest({
      method: "POST",
      url: "/v2/auth/login/sms",
      body: { refresh_token: tokenData.refreshToken }
    })
    
    // Update stored tokens
    TokenStore.storeToken(userId, {
      apiToken: response.data.api_token,
      refreshToken: response.data.refresh_token,
      expiresAt: calculateExpiryTime()
    })
    
    return tokenData.apiToken
  end
  
  // Helper function to calculate token expiry
  function calculateExpiryTime()
    // Default to 24 hours if not specified by API
    return Date.now() + (24 * 60 * 60 * 1000)
  end
end
```

### 5.3 Request Processing

```
module RequestProcessor
  // Process client requests and forward to Tinder API
  async function processRequest(clientRequest)
    // Validate request
    validateRequest(clientRequest)
    
    // Check rate limits
    RateLimitManager.checkRateLimit(clientRequest.endpoint, clientRequest.userId)
    
    // Check if authentication is required
    if (requiresAuthentication(clientRequest.endpoint))
      // Get token or refresh if needed
      token = await getValidToken(clientRequest.userId)
      clientRequest.headers["X-Auth-Token"] = token
    end
    
    // Add standard headers
    addStandardHeaders(clientRequest)
    
    // Check cache for GET requests
    if (clientRequest.method === "GET" && isCacheable(clientRequest.endpoint))
      cachedResponse = CacheManager.get(getCacheKey(clientRequest))
      if (cachedResponse) return cachedResponse
    end
    
    // Send request to Tinder API
    try
      response = await sendRequest({
        method: clientRequest.method,
        url: clientRequest.endpoint,
        headers: clientRequest.headers,
        body: clientRequest.body,
        params: clientRequest.params
      })
      
      // Cache response if applicable
      if (clientRequest.method === "GET" && isCacheable(clientRequest.endpoint))
        CacheManager.set(getCacheKey(clientRequest), response)
      end
      
      // Update rate limit info
      RateLimitManager.updateRateLimits(clientRequest.endpoint, response)
      
      return ResponseHandler.processResponse(response)
    catch (error)
      return ErrorHandler.handleError(error, clientRequest)
    end
  end
  
  // Helper functions
  function validateRequest(request)
    // Validate required fields based on endpoint
    // Throw validation error if invalid
  end
  
  function requiresAuthentication(endpoint)
    // List of endpoints that require authentication
    return !endpoint.startsWith("/v2/auth")
  end
  
  async function getValidToken(userId)
    tokenData = AuthenticationManager.TokenStore.getToken(userId)
    
    if (!tokenData || AuthenticationManager.TokenStore.isTokenExpired(userId))
      return await AuthenticationManager.refreshToken(userId)
    end
    
    return tokenData.apiToken
  end
  
  function addStandardHeaders(request)
    // Add common headers required by Tinder API
    request.headers = {
      ...request.headers,
      "app-version": "1020345",
      "platform": "web",
      "content-type": "application/json",
      "x-supported-image-formats": "webp,jpeg"
    }
  end
  
  function isCacheable(endpoint)
    // List of endpoints that can be cached
    cacheableEndpoints = [
      "/user/",
      "/v2/recs/core"
    ]
    
    return cacheableEndpoints.some(e => endpoint.startsWith(e))
  end
  
  function getCacheKey(request)
    // Generate unique cache key based on endpoint and parameters
    return `${request.endpoint}:${JSON.stringify(request.params)}:${request.userId}`
  end
end
```

### 5.4 Rate Limit Management

```
module RateLimitManager
  // Store rate limit information per user and endpoint
  RateLimits = {
    // Map of user-specific rate limits
    userLimits: Map<userId, {
      likes: {
        remaining: number,
        resetAt: timestamp
      },
      superLikes: {
        remaining: number,
        resetAt: timestamp
      },
      boosts: {
        remaining: number,
        resetAt: timestamp
      }
    }>,
    
    // Global rate limit tracking
    globalLimits: {
      requestsPerMinute: 100,
      currentCount: 0,
      windowStart: timestamp
    }
  }
  
  // Check if request would exceed rate limits
  function checkRateLimit(endpoint, userId)
    // Reset counter if window has passed
    if (Date.now() - RateLimits.globalLimits.windowStart > 60000) {
      RateLimits.globalLimits.currentCount = 0
      RateLimits.globalLimits.windowStart = Date.now()
    }
    
    // Check global rate limit
    if (RateLimits.globalLimits.currentCount >= RateLimits.globalLimits.requestsPerMinute)
      throw new Error("Global rate limit exceeded")
    end
    
    // Increment counter
    RateLimits.globalLimits.currentCount++
    
    // Check user-specific limits
    if (userId && RateLimits.userLimits.has(userId))
      userLimit = RateLimits.userLimits.get(userId)
      
      // Check like limit
      if (endpoint === "/like/" && userLimit.likes.remaining <= 0 && Date.now() < userLimit.likes.resetAt)
        throw new Error("Like rate limit exceeded")
      end
      
      // Check super like limit
      if (endpoint === "/like/super" && userLimit.superLikes.remaining <= 0 && Date.now() < userLimit.superLikes.resetAt)
        throw new Error("Super like rate limit exceeded")
      end
      
      // Check boost limit
      if (endpoint === "/boost" && userLimit.boosts.remaining <= 0 && Date.now() < userLimit.boosts.resetAt)
        throw new Error("Boost rate limit exceeded")
      end
    end
  end
  
  // Update rate limit information based on API response
  function updateRateLimits(endpoint, response)
    if (!response.data) return
    
    userId = extractUserId(response)
    if (!userId) return
    
    // Initialize user limits if not exists
    if (!RateLimits.userLimits.has(userId))
      RateLimits.userLimits.set(userId, {
        likes: { remaining: 100, resetAt: Date.now() + 12 * 60 * 60 * 1000 },
        superLikes: { remaining: 5, resetAt: Date.now() + 24 * 60 * 60 * 1000 },
        boosts: { remaining: 1, resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }
      })
    end
    
    userLimit = RateLimits.userLimits.get(userId)
    
    // Update like limits
    if (endpoint === "/like/" && response.data.likes_remaining !== undefined)
      userLimit.likes.remaining = response.data.likes_remaining
      if (response.data.rate_limited_until)
        userLimit.likes.resetAt = response.data.rate_limited_until
      end
    end
    
    // Update super like limits
    if (endpoint === "/like/super" && response.data.super_likes)
      userLimit.superLikes.remaining = response.data.super_likes.remaining
      if (response.data.super_likes.resets_at)
        userLimit.superLikes.resetAt = new Date(response.data.super_likes.resets_at).getTime()
      end
    end
    
    // Update boost limits
    if (endpoint === "/boost")
      userLimit.boosts.remaining = response.data.remaining || 0
      if (response.data.resets_at)
        userLimit.boosts.resetAt = response.data.resets_at
      end
    end
    
    // Save updated limits
    RateLimits.userLimits.set(userId, userLimit)
  end
  
  // Helper to extract user ID from response
  function extractUserId(response)
    // Try to find user ID in various response formats
    if (response.data._id) return response.data._id
    if (response.data.user && response.data.user._id) return response.data.user._id
    return null
  end
end
```

### 5.5 Error Handling

```
module ErrorHandler
  // Error codes and messages
  ErrorCodes = {
    AUTHENTICATION_FAILED: 1001,
    RATE_LIMIT_EXCEEDED: 1002,
    VALIDATION_ERROR: 1003,
    API_ERROR: 1004,
    NETWORK_ERROR: 1005,
    UNKNOWN_ERROR: 9999
  }
  
  // Handle errors from API or internal processing
  function handleError(error, request)
    // Log error for debugging
    logError(error, request)
    
    // Determine error type and create standardized response
    if (error.response) {
      // API returned an error response
      return handleApiError(error.response, request)
    } else if (error.request) {
      // Request was made but no response received
      return createErrorResponse(
        ErrorCodes.NETWORK_ERROR,
        "Network error, no response received",
        request
      )
    } else if (error.message.includes("rate limit")) {
      // Rate limit error
      return createErrorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        error.message,
        request
      )
    } else if (error.message.includes("validation")) {
      // Validation error
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.message,
        request
      )
    } else {
      // Unknown error
      return createErrorResponse(
        ErrorCodes.UNKNOWN_ERROR,
        "An unknown error occurred",
        request
      )
    }
  end
  
  // Handle API error responses
  function handleApiError(errorResponse, request)
    // Extract status code and error message
    statusCode = errorResponse.status || errorResponse.statusCode || 500
    errorMessage = ""
    
    // Extract error message from various response formats
    if (errorResponse.data) {
      if (errorResponse.data.error && typeof errorResponse.data.error === "string") {
        errorMessage = errorResponse.data.error
      } else if (errorResponse.data.error && errorResponse.data.error.message) {
        errorMessage = errorResponse.data.error.message
      } else if (errorResponse.data.status && errorResponse.data.message) {
        errorMessage = errorResponse.data.message
      }
    }
    
    // Map HTTP status codes to internal error codes
    let errorCode
    switch (statusCode) {
      case 401:
        errorCode = ErrorCodes.AUTHENTICATION_FAILED
        // Trigger token refresh if authentication failed
        if (request.userId) {
          AuthenticationManager.TokenStore.removeToken(request.userId)
        }
        break
      case 429:
        errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED
        break
      case 400:
        errorCode = ErrorCodes.VALIDATION_ERROR
        break
      default:
        errorCode = ErrorCodes.API_ERROR
    }
    
    return createErrorResponse(errorCode, errorMessage || "API Error", request)
  end
  
  // Create standardized error response
  function createErrorResponse(code, message, request)
    return {
      success: false,
      error: {
        code: code,
        message: message,
        endpoint: request.endpoint,
        timestamp: Date.now()
      }
    }
  end
  
  // Log error for monitoring and debugging
  function logError(error, request)
    // Log error details to monitoring system
    console.error({
      timestamp: new Date().toISOString(),
      endpoint: request.endpoint,
      method: request.method,
      userId: request.userId,
      error: error.message,
      stack: error.stack
    })
  end
end
```

## 6. Conclusion

This specification document provides a comprehensive overview of the Tinder API and the requirements for an MCP server that will interface with it. The document covers key endpoints, authentication methods, data structures, potential challenges, and high-level pseudocode for implementing the MCP server.

When implementing the MCP server, it's important to focus on security, reliability, and performance. The server should handle authentication securely, manage rate limits effectively, and provide a consistent interface for clients. By following the guidelines and pseudocode provided in this document, developers can create a robust MCP server that interfaces seamlessly with the Tinder API.