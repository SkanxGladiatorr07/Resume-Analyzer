@echo off
setlocal enabledelayedexpansion

REM AI Endpoints Testing Script for Windows
REM This script tests all AI endpoints sequentially

echo ======================================
echo   ResumeAI - AI Endpoints Test Suite
echo ======================================
echo.

REM Configuration
set BASE_URL=http://localhost:5000
set TOKEN=
set RESUME_ID=

REM Step 1: Get TOKEN
echo.
echo [INFO] Step 1: Authentication
set /p TOKEN="Please enter your JWT token: "

if "%TOKEN%"=="" (
    echo [ERROR] Token is required!
    echo.
    echo [INFO] Get your token by logging in:
    echo curl -X POST %BASE_URL%/api/auth/login ^
    echo   -H "Content-Type: application/json" ^
    echo   -d "{\"email\":\"your-email@example.com\",\"password\":\"your-password\"}"
    exit /b 1
)

echo [SUCCESS] Token received

REM Step 2: Get RESUME_ID
echo.
echo [INFO] Step 2: Resume Selection
set /p RESUME_ID="Please enter the resume ID to analyze: "

if "%RESUME_ID%"=="" (
    echo [ERROR] Resume ID is required!
    echo.
    echo [INFO] Upload a resume first:
    echo curl -X POST %BASE_URL%/api/resumes/upload ^
    echo   -H "Authorization: Bearer YOUR_TOKEN" ^
    echo   -F "resume=@/path/to/resume.pdf"
    exit /b 1
)

echo [SUCCESS] Resume ID received

echo.
echo [INFO] Starting tests...
timeout /t 1 /nobreak >nul

REM Test 1: AI Connection Test
echo.
echo Testing: AI Connection Test
echo ----------------------------------------
curl -s "%BASE_URL%/api/ai/test" ^
    -H "Authorization: Bearer %TOKEN%"
echo.

REM Test 2: AI Status
echo.
echo Testing: AI Status
echo ----------------------------------------
curl -s "%BASE_URL%/api/ai/status" ^
    -H "Authorization: Bearer %TOKEN%"
echo.

REM Test 3: Resume Parsing Status
echo.
echo Testing: Resume Parsing Status
echo ----------------------------------------
curl -s "%BASE_URL%/api/resumes/%RESUME_ID%/status" ^
    -H "Authorization: Bearer %TOKEN%"
echo.

REM Test 4: Comprehensive Analysis
echo.
echo Testing: Comprehensive Resume Analysis
echo ----------------------------------------
curl -s -X POST "%BASE_URL%/api/ai/analyze/%RESUME_ID%" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json"
echo.

REM Test 5: ATS Score
echo.
echo Testing: ATS Compatibility Analysis
echo ----------------------------------------
curl -s -X POST "%BASE_URL%/api/ai/ats-score/%RESUME_ID%" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json"
echo.

REM Test 6: Skill Gap (Default Role)
echo.
echo Testing: Skill Gap Analysis (Default)
echo ----------------------------------------
curl -s -X POST "%BASE_URL%/api/ai/skill-gap/%RESUME_ID%" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json"
echo.

REM Test 7: Skill Gap (Custom Role)
echo.
echo Testing: Skill Gap Analysis (Senior Developer)
echo ----------------------------------------
curl -s -X POST "%BASE_URL%/api/ai/skill-gap/%RESUME_ID%" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json" ^
    -d "{\"targetRole\": \"Senior Full Stack Developer\"}"
echo.

REM Test 8: Improvements
echo.
echo Testing: Improvement Suggestions
echo ----------------------------------------
curl -s -X POST "%BASE_URL%/api/ai/improvements/%RESUME_ID%" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json"
echo.

REM Test 9: Keywords (Without Job Description)
echo.
echo Testing: Keyword Extraction
echo ----------------------------------------
curl -s -X POST "%BASE_URL%/api/ai/keywords/%RESUME_ID%" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json"
echo.

REM Test 10: Keywords (With Job Description)
echo.
echo Testing: Keyword Extraction (With Job Description)
echo ----------------------------------------
curl -s -X POST "%BASE_URL%/api/ai/keywords/%RESUME_ID%" ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json" ^
    -d "{\"jobDescription\": \"We are seeking a Senior Full Stack Developer with expertise in React, Node.js, TypeScript, and AWS. Experience with Docker and CI/CD required.\"}"
echo.

REM Summary
echo.
echo ======================================
echo   Test Suite Complete
echo ======================================
echo.
echo [INFO] Review the results above to verify all endpoints are working correctly.
echo.
echo [INFO] For detailed API documentation, see:
echo   - AI_INTEGRATION_GUIDE.md
echo   - AI_TESTING_GUIDE.md
echo   - AI_ENDPOINTS_REFERENCE.md
echo.

pause
