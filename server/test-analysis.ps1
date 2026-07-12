# Analysis Endpoint Testing Script for PowerShell
# Tests the new POST /api/analysis/:resumeId endpoint

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Analysis Endpoint Test Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$token = ""
$resumeId = ""

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

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint
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
    exit 1
}

Print-Success "Token received"

# Step 2: Get RESUME_ID
Write-Host ""
Print-Info "Step 2: Resume Selection"
$resumeId = Read-Host "Please enter the resume ID to analyze"

if ([string]::IsNullOrWhiteSpace($resumeId)) {
    Print-Error "Resume ID is required!"
    exit 1
}

Print-Success "Resume ID received"

Write-Host ""
Print-Info "Starting analysis tests..."
Start-Sleep -Seconds 1

# Test 1: Check if resume is parsed
Test-Endpoint -name "Check Resume Parsing Status" -method "GET" -endpoint "/api/resumes/$resumeId/status"

# Test 2: Check if analysis exists
Test-Endpoint -name "Check if Analysis Exists" -method "GET" -endpoint "/api/analysis/$resumeId/exists"

# Test 3: Generate analysis (or get cached)
Write-Host ""
Print-Info "Generating analysis (this may take 5-10 seconds)..."
Test-Endpoint -name "Generate Analysis (First Request)" -method "POST" -endpoint "/api/analysis/$resumeId"

# Test 4: Get cached analysis
Write-Host ""
Print-Info "Getting cached analysis (should be instant)..."
Test-Endpoint -name "Get Cached Analysis (Second Request)" -method "POST" -endpoint "/api/analysis/$resumeId"

# Test 5: Get analysis via GET
Test-Endpoint -name "Get Analysis via GET" -method "GET" -endpoint "/api/analysis/$resumeId"

# Test 6: Force regenerate
Write-Host ""
Print-Warning "Force regenerating analysis (this may take 5-10 seconds)..."
$confirm = Read-Host "Do you want to force regenerate? (y/n)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    Test-Endpoint -name "Force Regenerate Analysis" -method "POST" -endpoint "/api/analysis/$resumeId?force=true"
}

# Test 7: Delete analysis
Write-Host ""
$confirmDelete = Read-Host "Do you want to delete the analysis? (y/n)"
if ($confirmDelete -eq "y" -or $confirmDelete -eq "Y") {
    Test-Endpoint -name "Delete Analysis" -method "DELETE" -endpoint "/api/analysis/$resumeId"
    
    # Verify deletion
    Test-Endpoint -name "Verify Analysis Deleted" -method "GET" -endpoint "/api/analysis/$resumeId/exists"
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Test Suite Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Print-Info "Key Points:"
Write-Host "  - First POST generates new analysis (3-8 seconds)"
Write-Host "  - Subsequent POSTs return cached analysis (instant)"
Write-Host "  - Use ?force=true to regenerate"
Write-Host "  - GET endpoint retrieves existing analysis"
Write-Host "  - DELETE removes analysis from database"
Write-Host ""
Print-Info "For detailed documentation, see:"
Write-Host "  - ANALYSIS_ENDPOINT_GUIDE.md"
Write-Host ""

Read-Host "Press Enter to exit"
