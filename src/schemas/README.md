# Zod 4 Validation Integration

This directory contains the Zod 4 validation integration for the Tinder API MCP Server. Zod is a TypeScript-first schema validation library with a focus on developer experience.

## Directory Structure

```
src/schemas/
├── api/              # API-specific schemas
├── common/           # Common/shared schemas
├── registry.ts       # Schema registry
├── index.ts          # Schema initialization
└── README.md         # This file
```

## Schema Registry

The Schema Registry (`registry.ts`) provides a centralized registry for managing Zod schemas across the application. It allows you to:

- Register schemas with unique IDs
- Retrieve schemas by ID
- Validate data against registered schemas
- Organize schemas by category

## Validation Service

The Validation Service (`src/utils/validation.ts`) provides utilities for validating data using Zod schemas. It integrates with the Schema Registry and provides:

- Methods for validating data against schemas
- Error handling and formatting
- Integration with the application's error handling system

## Zod Error Adapter

The Zod Error Adapter (`src/utils/zod-error-adapter.ts`) converts Zod validation errors to the application's API error format. It provides:

- Conversion of Zod errors to API errors
- Formatting of Zod errors for better readability
- Detailed error information for debugging

## Validation Middleware

The Validation Middleware (`src/middleware/validation-middleware.ts`) provides Express middleware for validating request data using Zod schemas. It includes:

- Middleware for validating request body, query parameters, path parameters, and headers
- Integration with the Schema Registry
- Error handling and formatting

## Usage

### Defining Schemas

Create schema files in the appropriate directory:

```typescript
// src/schemas/common/user.schema.ts
import { z } from 'zod';
import { schemaRegistry } from '../registry';

// Define schemas
export const userEmailSchema = z.string()
  .email({ message: 'Invalid email address' })
  .trim()
  .toLowerCase();

// Register schemas with the registry
export function registerUserSchemas() {
  schemaRegistry.register('user.email', userEmailSchema, 'common', 'User email schema');
}

// Export schemas
export default {
  userEmailSchema,
  registerUserSchemas
};
```

### Initializing Schemas

Initialize all schemas during application startup:

```typescript
// src/index.ts
import { initializeSchemas } from './schemas';

// Initialize schemas
initializeSchemas();
```

### Using Validation Middleware

Use the validation middleware in your routes:

```typescript
// src/routes/user.ts
import express from 'express';
import { validateBody } from '../middleware/validation-middleware';
import { createUserSchema } from '../schemas/common/user.schema';

const router = express.Router();

router.post('/users',
  validateBody(createUserSchema),
  (req, res) => {
    // Request body is validated and typed
    const { name, email } = req.body;
    // ...
  }
);

export default router;
```

### Direct Validation

Validate data directly using the validation service:

```typescript
import { validationService } from '../utils/validation';
import { schemaRegistry } from '../schemas/registry';

// Validate using schema ID
const result = validationService.validate('user.email', email);

// Validate using schema directly
const schema = schemaRegistry.getSchema('user.email');
if (schema) {
  const result = validationService.validateWithSchema(schema, email);
  // ...
}
```

## Best Practices

1. **Organize schemas logically**: Place common/shared schemas in the `common` directory and API-specific schemas in the `api` directory.

2. **Use descriptive schema IDs**: Schema IDs should be descriptive and follow a consistent naming convention (e.g., `entity.action`).

3. **Provide helpful error messages**: Include custom error messages in your schemas to provide clear feedback to users.

4. **Reuse schema components**: Define reusable schema components and compose them to create more complex schemas.

5. **Register all schemas**: Register all schemas with the registry to enable centralized management and validation.

6. **Use middleware for validation**: Use the validation middleware to validate request data in your routes.

7. **Handle validation errors gracefully**: Use the error handling system to provide clear error messages to users.

## Installation

To install Zod 4, run the following command:

```bash
npm run install-zod
```

Or use the installation script:

```bash
./install-zod.sh