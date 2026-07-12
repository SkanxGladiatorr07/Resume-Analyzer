#!/bin/bash

# AI Endpoints Testing Script
# This script tests all AI endpoints sequentially

echo "======================================"
echo "  ResumeAI - AI Endpoints Test Suite"
echo "======================================"
echo ""

# Configuration
BASE_URL="http://localhost:5000"
TOKEN=""
RESUME_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to make API call and check response
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    echo ""
    echo "Testing: $name"
    echo "----------------------------------------"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN")
    else
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "Success (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "Failed (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
}

# Step 1: Get TOKEN
echo ""
print_info "Step 1: Authentication"
echo "Please enter your JWT token:"
read -r TOKEN

if [ -z "$TOKEN" ]; then
    print_error "Token is required!"
    echo ""
    print_info "Get your token by logging in:"
    echo "curl -X POST $BASE_URL/api/auth/login \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"email\":\"your-email@example.com\",\"password\":\"your-password\"}'"
    exit 1
fi

print_success "Token received"

# Step 2: Get RESUME_ID
echo ""
print_info "Step 2: Resume Selection"
echo "Please enter the resume ID to analyze:"
read -r RESUME_ID

if [ -z "$RESUME_ID" ]; then
    print_error "Resume ID is required!"
    echo ""
    print_info "Upload a resume first:"
    echo "curl -X POST $BASE_URL/api/resumes/upload \\"
    echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
    echo "  -F \"resume=@/path/to/resume.pdf\""
    exit 1
fi

print_success "Resume ID received"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Install it for better JSON formatting."
    echo "Install: sudo apt-get install jq (Linux) or brew install jq (Mac)"
fi

echo ""
print_info "Starting tests..."
sleep 1

# Test 1: AI Connection Test
test_endpoint "AI Connection Test" "GET" "/api/ai/test"

# Test 2: AI Status
test_endpoint "AI Status" "GET" "/api/ai/status"

# Test 3: Resume Parsing Status
test_endpoint "Resume Parsing Status" "GET" "/api/resumes/$RESUME_ID/status"

# Test 4: Comprehensive Analysis
test_endpoint "Comprehensive Resume Analysis" "POST" "/api/ai/analyze/$RESUME_ID"

# Test 5: ATS Score
test_endpoint "ATS Compatibility Analysis" "POST" "/api/ai/ats-score/$RESUME_ID"

# Test 6: Skill Gap (Default Role)
test_endpoint "Skill Gap Analysis (Default)" "POST" "/api/ai/skill-gap/$RESUME_ID"

# Test 7: Skill Gap (Custom Role)
print_info "Testing with custom target role..."
test_endpoint "Skill Gap Analysis (Senior Developer)" "POST" "/api/ai/skill-gap/$RESUME_ID" \
    '{"targetRole": "Senior Full Stack Developer"}'

# Test 8: Improvements
test_endpoint "Improvement Suggestions" "POST" "/api/ai/improvements/$RESUME_ID"

# Test 9: Keywords (Without Job Description)
test_endpoint "Keyword Extraction" "POST" "/api/ai/keywords/$RESUME_ID"

# Test 10: Keywords (With Job Description)
print_info "Testing with job description..."
test_endpoint "Keyword Extraction (With Job Desc)" "POST" "/api/ai/keywords/$RESUME_ID" \
    '{"jobDescription": "We are seeking a Senior Full Stack Developer with expertise in React, Node.js, TypeScript, and AWS. Experience with Docker and CI/CD required."}'

# Summary
echo ""
echo "======================================"
echo "  Test Suite Complete"
echo "======================================"
echo ""
print_info "Review the results above to verify all endpoints are working correctly."
echo ""
print_info "For detailed API documentation, see:"
echo "  - AI_INTEGRATION_GUIDE.md"
echo "  - AI_TESTING_GUIDE.md"
echo "  - AI_ENDPOINTS_REFERENCE.md"
echo ""
