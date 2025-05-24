#!/bin/bash

# Script to install TypeScript type definitions

echo "Installing TypeScript type definitions..."

# Install type definitions for dependencies
npm install --save-dev @types/node @types/express @types/cors @types/helmet @types/winston @types/node-cache @types/jsonwebtoken @types/dotenv

echo "Type definitions installed successfully!"