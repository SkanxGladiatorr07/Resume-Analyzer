# AI Endpoints Testing Script for PowerShell
# This script tests all AI endpoints sequentially

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ResumeAI - AI Endpoints Test Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:5000"
$token = ""
$resumeId = ""

# Function to print colored output
function Print-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Print-Error {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Print-Info {
    param($message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Print-Warning {
    param($message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [string]$data = ""
    )
    
    Write-Host ""
    Write-Host "Testing: $name" -ForegroundColor Yellow
    Write-Host "----------------------------------------"
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $uri = "$baseUrl$endpoint"
        
        if ($method -eq "GET") {
            $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
        }
        elseif ($data -ne "") {
            $response = Invoke-RestMethod -Uri $uri -Method $method -Headers $headers -Body $data
        }
        else {
            $response = Invoke-RestMethod -Uri $uri -Method $method -Headers $headers
        }
        
        Print-Success "Success"
        $response | ConvertTo-Json -Depth 10
    }
    catch {
        Print-Error "Failed"
        $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
        }
    }
}

# Step 1: Get TOKEN
Write-Host ""
Print-Info "Step 1: Authentication"
$token = Read-Host "Please enter your JWT token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Print-Error "Token is required!"
    Write-Host ""
    Print-Info "Get your token by logging in:"
    Write-Host "Invoke-RestMethod -Uri '$baseUrl/api/auth/login' -Method Post -Body '{""email"":""your-email@example.com"",""password"":""your-password""}' -ContentType 'application/json'"
    exit 1
}

Print-Success "Token received"

# Step 2: Get RESUME_ID
Write-Host ""
Print-Info "Step 2: Resume Selection"
$resumeId = Read-Host "Please enter the resume ID to analyze"

if ([string]::IsNullOrWhiteSpace($resumeId)) {
    Print-Error "Resume ID is required!"
    Write-Host ""
    Print-Info "Upload a resume first using curl or Postman"
    exit 1
}

Print-Success "Resume ID received"

Write-Host ""
Print-Info "Starting tests..."
Start-Sleep -Seconds 1

# Test 1: AI Connection Test
Test-Endpoint -name "AI Connection Test" -method "GET" -endpoint "/api/ai/test"

# Test 2: AI Status
Test-Endpoint -name "AI Status" -method "GET" -endpoint "/api/ai/status"

# Test 3: Resume Parsing Status
Test-Endpoint -name "Resume Parsing Status" -method "GET" -endpoint "/api/resumes/$resumeId/status"

# Test 4: Comprehensive Analysis
Test-Endpoint -name "Comprehensive Resume Analysis" -method "POST" -endpoint "/api/ai/analyze/$resumeId"

# Test 5: ATS Score
Test-Endpoint -name "ATS Compatibility Analysis" -method "POST" -endpoint "/api/ai/ats-score/$resumeId"

# Test 6: Skill Gap (Default Role)
Test-Endpoint -name "Skill Gap Analysis (Default)" -method "POST" -endpoint "/api/ai/skill-gap/$resumeId"

# Test 7: Skill Gap (Custom Role)
Print-Info "Testing with custom target role..."
$skillGapData = @{
    targetRole = "Senior Full Stack Developer"
} | ConvertTo-Json

Test-Endpoint -name "Skill Gap Analysis (Senior Developer)" -method "POST" -endpoint "/api/ai/skill-gap/$resumeId" -data $skillGapData

# Test 8: Improvements
Test-Endpoint -name "Improvement Suggestions" -method "POST" -endpoint "/api/ai/improvements/$resumeId"

# Test 9: Keywords (Without Job Description)
Test-Endpoint -name "Keyword Extraction" -method "POST" -endpoint "/api/ai/keywords/$resumeId"

# Test 10: Keywords (With Job Description)
Print-Info "Testing with job description..."
$keywordData = @{
    jobDescription = "We are seeking a Senior Full Stack Developer with expertise in React, Node.js, TypeScript, and AWS. Experience with Docker and CI/CD required."
} | ConvertTo-Json

Test-Endpoint -name "Keyword Extraction (With Job Desc)" -method "POST" -endpoint "/api/ai/keywords/$resumeId" -data $keywordData

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Test Suite Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Print-Info "Review the results above to verify all endpoints are working correctly."
Write-Host ""
Print-Info "For detailed API documentation, see:"
Write-Host "  - AI_INTEGRATION_GUIDE.md"
Write-Host "  - AI_TESTING_GUIDE.md"
Write-Host "  - AI_ENDPOINTS_REFERENCE.md"
Write-Host ""

Read-Host "Press Enter to exit"
