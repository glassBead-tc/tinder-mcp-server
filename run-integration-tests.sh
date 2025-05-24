#!/bin/bash

# Tinder API MCP Server Integration Test Runner
# This script runs comprehensive integration tests for the Tinder API MCP server

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}   Tinder API MCP Server Integration Test Runner         ${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js to run the tests.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install npm to run the tests.${NC}"
    exit 1
fi

# Create a timestamp for the report
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_DIR="test-reports"
REPORT_FILE="$REPORT_DIR/integration-test-report_$TIMESTAMP.txt"

# Create reports directory if it doesn't exist
mkdir -p $REPORT_DIR

# Function to run tests and capture output
run_tests() {
    local test_type=$1
    local test_pattern=$2
    
    echo -e "${YELLOW}Running $test_type tests...${NC}"
    
    # Run tests and capture output
    npm test -- --testPathPattern="$test_pattern" --json > "$REPORT_DIR/temp_output.json" 2>&1
    
    # Check if tests passed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $test_type tests passed${NC}"
        echo "✓ $test_type tests passed" >> "$REPORT_FILE"
    else
        echo -e "${RED}✗ $test_type tests failed${NC}"
        echo "✗ $test_type tests failed" >> "$REPORT_FILE"
    fi
    
    # Extract test results from JSON output
    node -e "
        try {
            const fs = require('fs');
            const data = fs.readFileSync('$REPORT_DIR/temp_output.json', 'utf8');
            const jsonStart = data.indexOf('{');
            if (jsonStart >= 0) {
                const jsonData = JSON.parse(data.substring(jsonStart));
                const results = jsonData.testResults;
                let passed = 0;
                let failed = 0;
                let testDetails = [];
                
                results.forEach(result => {
                    result.assertionResults.forEach(assertion => {
                        if (assertion.status === 'passed') {
                            passed++;
                            testDetails.push('  ✓ ' + assertion.title);
                        } else {
                            failed++;
                            testDetails.push('  ✗ ' + assertion.title + ' - ' + assertion.failureMessages.join('\\n'));
                        }
                    });
                });
                
                fs.appendFileSync('$REPORT_FILE', '\\nTests: ' + (passed + failed) + ' total, ' + passed + ' passed, ' + failed + ' failed\\n');
                fs.appendFileSync('$REPORT_FILE', testDetails.join('\\n') + '\\n');
            } else {
                fs.appendFileSync('$REPORT_FILE', '\\nCould not parse test results\\n');
            }
        } catch (e) {
            fs.appendFileSync('$REPORT_FILE', '\\nError parsing test results: ' + e.message + '\\n');
        }
    "
    
    # Remove temporary file
    rm -f "$REPORT_DIR/temp_output.json"
    
    echo
}

# Install dependencies if needed
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}Dependencies installed${NC}"
else
    echo -e "${GREEN}Dependencies already installed${NC}"
fi
echo

# Initialize report file
echo "Tinder API MCP Server Integration Test Report" > "$REPORT_FILE"
echo "Generated on: $(date)" >> "$REPORT_FILE"
echo "=======================================" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

# Run component integration tests
run_tests "Component Integration" "services"

# Run authentication tests
run_tests "Authentication" "authentication"

# Run API endpoint tests
run_tests "API Endpoints" "routes"

# Run validation tests
run_tests "Validation" "validation"

# Run error handling tests
run_tests "Error Handling" "error-handler"

# Run rate limiting tests
run_tests "Rate Limiting" "rate-limiter"

# Run security tests
run_tests "Security" "security"

# Run end-to-end integration tests
run_tests "End-to-End Integration" "integration"

# Generate summary
echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}   Integration Test Summary                              ${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}Test report generated: ${REPORT_FILE}${NC}"
echo

# Check if any tests failed
if grep -q "✗" "$REPORT_FILE"; then
    echo -e "${RED}Some tests failed. Please check the report for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi