#!/bin/bash

# Installation script for Zod 4
echo "Installing Zod 4..."

# Install Zod 4 beta
npm install zod@4.0.0-beta.1

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo "Zod 4 installed successfully!"
  echo "You can now use Zod for validation in your project."
else
  echo "Failed to install Zod 4. Please check your npm configuration and try again."
  exit 1
fi

# Make the script executable
chmod +x install-zod.sh

echo "Installation complete!"