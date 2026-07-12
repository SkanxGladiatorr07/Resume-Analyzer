# ResumeAI Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ResumeAI Backend                         │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Client    │  │   Frontend   │  │   External Services    │ │
│  │  (curl/     │  │   (React)    │  │   (Gemini AI)          │ │
│  │  Postman)   │  │              │  │                        │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                │                       │              │
│         └────────────────┴───────────────────────┘              │
│                          │                                       │
│                          ▼                                       │
│         ┌────────────────────────────────────┐                  │
│         │        Express.js App              │                  │
│         │  (CORS, Body Parser, Error Handler)│                  │
│         └────────────┬───────────────────────┘                  │
│                      │                                           │
│         ┌────────────┴───────────────┐                          │
│         │      Authentication        │                          │
│         │      Middleware (JWT)      │                          │
│         └────────────┬───────────────┘                          │
│                      │                                           │
│         ┌────────────┴────────────────────────────┐             │
│         │            API Routes                   │             │
│         ├──────────────────────────────────────┬──┘             │
│         │                                      │                │
│    ┌────▼────┐  ┌────────┐  ┌─────────┐  ┌───▼──────┐         │
│    │  Auth   │  │ Resume │  │   AI    │  │ Analysis │ ← New   │
│    │ Routes  │  │ Routes │  │ Routes  │  │  Routes  │         │
│    └────┬────┘  └────┬───┘  └────┬────┘  └────┬─────┘         │
│         │            │           │             │               │
│    ┌────▼────┐  ┌────▼───┐  ┌───▼─────┐  ┌────▼──────┐        │
│    │  Auth   │  │ Resume │  │   AI    │  │ Analysis  │        │
│    │Controller│ │Controller│ │Controller│ │Controller │        │
│    └────┬────┘  └────┬───┘  └────┬────┘  └────┬──────┘        │
│         │            │           │             │               │
│    ┌────▼────────────▼───────────▼─────────────▼───────┐       │
│    │              Service Layer                         │       │
│    ├─────────────────────────────────────────────────┬──┘       │
│    │                                                 │          │
│    │  ┌──────────────┐  ┌────────────────────────┐  │          │
│    │  │  Parsing     │  │  AI Analysis Service   │  │          │
│    │  │  Pipeline    │  │  (Business Logic)      │  │          │
│    │  └──────┬───────┘  └───────────┬────────────┘  │          │
│    │         │                      │                │          │
│    │  ┌──────▼───────┐  ┌───────────▼──────────┐    │          │
│    │  │  Parser      │  │  Gemini Service      │    │          │
│    │  │  Utils       │  │  (AI Integration)    │    │          │
│    │  └──────────────┘  └───────────┬──────────┘    │          │
│    │                                │                │          │
│    │  ┌─────────────────────────────▼──────────┐    │          │
│    │  │         Prompt Templates               │    │          │
│    │  │  (Resume Analysis, ATS, Skills, etc.)  │    │          │
│    │  └────────────────────────────────────────┘    │          │
│    └─────────────────────────────────────────────────┘          │
│                           │                                      │
│         ┌─────────────────┴────────────────────┐                │
│         │          Data Layer                  │                │
│         ├───────────┬────────────┬─────────────┘                │
│         │           │            │                              │
│    ┌────▼────┐ ┌────▼─────┐ ┌───▼────────┐                     │
│    │  User   │ │  Resume  │ │  Analysis  │ ← New               │
│    │  Model  │ │  Model   │ │   Model    │                     │
│    └────┬────┘ └────┬─────┘ └────┬───────┘                     │
│         │           │            │                              │
│         └───────────┴────────────┴──────────┐                   │
│                                             │                   │
│                     ┌───────────────────────▼─────────┐         │
│                     │      MongoDB Database           │         │
│                     │  (Users, Resumes, Analyses)     │         │
│                     └─────────────────────────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### Authentication Flow

```
1. Client Request
   ├─ POST /api/auth/register
   └─ POST /api/auth/login
   
2. Auth Controller
   ├─ Validate input
   ├─ Check user exists
   └─ Generate JWT token
   
3. Response
   └─ { token, user }
```

### Resume Upload & Parsing Flow

```
1. Client Request
   └─ POST /api/resumes/upload (multipart/form-data)
   
2. Multer Middleware
   ├─ Validate file type (PDF/DOCX)
   ├─ Validate file size (<5MB)
   └─ Save to uploads/
   
3. Resume Controller
   ├─ Create Resume document
   └─ Trigger parsing
   
4. Parsing Pipeline (Async)
   ├─ Extract text (pdf-parse/mammoth)
   ├─ Parse sections (parserUtils)
   ├─ Validate data (dataValidator)
   └─ Save structured data
   
5. Response
   └─ { resume document }
```

### Analysis Generation Flow (New)

```
1. Client Request
   └─ POST /api/analysis/:resumeId
   
2. Middleware Chain
   ├─ authenticate (JWT)
   ├─ validateResumeId (MongoDB ObjectId)
   └─ checkResumeOwnership (User === Owner)
   
3. Analysis Controller
   └─ Call analysisService.generateAnalysis()
   
4. Analysis Service
   ├─ Check if cached analysis exists
   │  ├─ YES → Return cached (instant)
   │  └─ NO  → Continue
   │
   ├─ Verify resume is parsed
   ├─ Generate prompt (promptTemplates)
   ├─ Call Gemini AI (geminiService)
   ├─ Validate AI response
   ├─ Sanitize data
   ├─ Save to MongoDB (Analysis model)
   └─ Return analysis
   
5. Response
   └─ { cached: false, data: {...} }

6. Subsequent Requests
   └─ Return cached (instant, no AI call)
```

---

## Data Flow

### User Registration → Resume Upload → Analysis

```
User Register
    ↓
User Login (Get JWT)
    ↓
Upload Resume
    ↓
Resume Parsing (Automatic)
    ↓
Wait for "completed" status
    ↓
Generate Analysis
    ↓
View Results
    ↓
Subsequent Views (Cached)
```

---

## Component Interactions

### Analysis Endpoint Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  POST /api/analysis/:id                 │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │   analysisController.js   │
          │  - generateAnalysis()     │
          └─────────────┬─────────────┘
                        │
          ┌─────────────▼─────────────────┐
          │   analysisService.js          │
          │  - generateAnalysis()         │
          │  - validateAnalysisStructure()│
          │  - sanitizeAnalysisData()     │
          └─────────┬──────────┬──────────┘
                    │          │
       ┌────────────▼──┐   ┌───▼─────────────────┐
       │  Check Cache  │   │   Generate New      │
       │  (MongoDB)    │   │   (Gemini AI)       │
       └────────┬──────┘   └────┬────────────────┘
                │               │
         ┌──────▼───────┐   ┌───▼──────────────────┐
         │  Return      │   │  Validate & Sanitize │
         │  Cached      │   │  Save to MongoDB     │
         │  Analysis    │   │  Return Analysis     │
         └──────────────┘   └──────────────────────┘
```

---

## Database Schema

### Collections

```
┌─────────────────────────────────────────────────────────┐
│                     users                                │
├─────────────────────────────────────────────────────────┤
│ _id: ObjectId                                           │
│ name: String                                            │
│ email: String (unique, indexed)                         │
│ password: String (hashed)                               │
│ createdAt: Date                                         │
│ updatedAt: Date                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    resumes                               │
├─────────────────────────────────────────────────────────┤
│ _id: ObjectId                                           │
│ user: ObjectId → users                                  │
│ originalName: String                                    │
│ filePath: String                                        │
│ fileSize: Number                                        │
│ mimeType: String                                        │
│ parsingStatus: String (pending/processing/completed)    │
│ extractedText: String                                   │
│ structuredData: Object {                                │
│   contactInfo: {...}                                    │
│   skills: [...]                                         │
│   education: [...]                                      │
│   experience: [...]                                     │
│   projects: [...]                                       │
│   certifications: [...]                                 │
│   languages: [...]                                      │
│ }                                                        │
│ parsingStartedAt: Date                                  │
│ parsingCompletedAt: Date                                │
│ createdAt: Date                                         │
│ updatedAt: Date                                         │
│                                                          │
│ Indexes:                                                │
│ - user (for user queries)                               │
│ - parsingStatus (for status queries)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   analyses ← NEW                         │
├─────────────────────────────────────────────────────────┤
│ _id: ObjectId                                           │
│ resume: ObjectId → resumes (unique, indexed)            │
│ user: ObjectId → users (indexed)                        │
│ atsScore: Number (0-100)                                │
│ summary: String                                         │
│ strengths: [String]                                     │
│ weaknesses: [String]                                    │
│ missingSkills: [String]                                 │
│ grammarFeedback: [String]                               │
│ formattingFeedback: [String]                            │
│ suggestions: [String]                                   │
│ analysisVersion: String                                 │
│ aiModel: String                                         │
│ generatedAt: Date                                       │
│ forcedRegeneration: Boolean                             │
│ createdAt: Date                                         │
│ updatedAt: Date                                         │
│                                                          │
│ Indexes:                                                │
│ - resume (unique, one analysis per resume)              │
│ - resume + user (compound, ownership queries)           │
└─────────────────────────────────────────────────────────┘
```

### Relationships

```
┌────────┐        ┌──────────┐        ┌───────────┐
│  User  │◄───────┤  Resume  │◄───────┤ Analysis  │
│        │ 1    * │          │ 1    1 │           │
└────────┘        └──────────┘        └───────────┘
   (owns)            (has)
```

---

## Middleware Pipeline

### Request Processing Order

```
Request
  │
  ├─ CORS Middleware
  │  └─ Allow origin: http://localhost:3002
  │
  ├─ Body Parser
  │  └─ Parse JSON (10MB limit)
  │
  ├─ Request Logger (development)
  │  └─ Log: GET /api/analysis/...
  │
  ├─ Route Matching
  │  └─ /api/analysis/:resumeId
  │
  ├─ Authentication Middleware
  │  ├─ Extract JWT from header
  │  ├─ Verify token
  │  └─ Attach user to req.user
  │
  ├─ Resume ID Validation
  │  └─ Check valid MongoDB ObjectId
  │
  ├─ Ownership Verification
  │  ├─ Fetch resume from DB
  │  └─ Check resume.user === req.user.id
  │
  ├─ Controller Handler
  │  └─ Execute business logic
  │
  └─ Response or Error Handler
```

---

## Service Layer Architecture

### Gemini AI Integration

```
┌───────────────────────────────────────────────────┐
│             Gemini AI Integration                 │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │       Prompt Templates                  │     │
│  │  - generateStructuredAnalysisPrompt()   │     │
│  │  - generateResumeAnalysisPrompt()       │     │
│  │  - generateATSOptimizationPrompt()      │     │
│  │  - generateSkillGapPrompt()             │     │
│  │  - generateImprovementPrompt()          │     │
│  │  - generateKeywordExtractionPrompt()    │     │
│  └────────────────┬────────────────────────┘     │
│                   │                               │
│  ┌────────────────▼─────────────────────────┐    │
│  │       Gemini Service                     │    │
│  │  - generateContent()                     │    │
│  │  - parseJSONResponse()                   │    │
│  │  - analyzeResume()                       │    │
│  │  - testConnection()                      │    │
│  │  - Retry logic (1 retry)                 │    │
│  └────────────────┬─────────────────────────┘    │
│                   │                               │
│  ┌────────────────▼─────────────────────────┐    │
│  │     AI Analysis Service                  │    │
│  │  - analyzeResumeComprehensive()          │    │
│  │  - analyzeATSCompatibility()             │    │
│  │  - analyzeSkillGaps()                    │    │
│  │  - generateImprovements()                │    │
│  │  - extractKeywords()                     │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │     Analysis Service (New)               │   │
│  │  - generateAnalysis()                    │   │
│  │  - validateAnalysisStructure()           │   │
│  │  - sanitizeAnalysisData()                │   │
│  │  - getAnalysis()                         │   │
│  │  - deleteAnalysis()                      │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token

### Resume Management
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes` - List user's resumes
- `GET /api/resumes/:id` - Get resume details
- `GET /api/resumes/:id/status` - Get parsing status
- `GET /api/resumes/:id/parsed` - Get structured data
- `DELETE /api/resumes/:id` - Delete resume

### AI Analysis (Specialized)
- `GET /api/ai/test` - Test AI connection
- `GET /api/ai/status` - Get AI service status
- `POST /api/ai/analyze/:id` - Comprehensive analysis
- `POST /api/ai/ats-score/:id` - ATS compatibility
- `POST /api/ai/skill-gap/:id` - Skill gap analysis
- `POST /api/ai/improvements/:id` - Improvement suggestions
- `POST /api/ai/keywords/:id` - Keyword extraction

### Analysis (Unified, New)
- `POST /api/analysis/:id` - Generate/get analysis
- `POST /api/analysis/:id?force=true` - Force regenerate
- `GET /api/analysis/:id` - Get existing analysis
- `DELETE /api/analysis/:id` - Delete analysis
- `GET /api/analysis/:id/exists` - Check existence

---

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│              Security Layers                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Layer 1: Network Security                     │
│  ├─ CORS (localhost:3002 only)                 │
│  └─ HTTPS (production)                         │
│                                                 │
│  Layer 2: Authentication                       │
│  ├─ JWT tokens (7 day expiry)                  │
│  ├─ bcrypt password hashing                    │
│  └─ Token validation on every request          │
│                                                 │
│  Layer 3: Authorization                        │
│  ├─ User ownership verification                │
│  ├─ Resource access control                    │
│  └─ No cross-user access                       │
│                                                 │
│  Layer 4: Input Validation                     │
│  ├─ MongoDB ObjectId validation                │
│  ├─ File type validation                       │
│  ├─ File size limits (5MB)                     │
│  └─ Request body validation                    │
│                                                 │
│  Layer 5: Data Protection                      │
│  ├─ API keys in environment variables          │
│  ├─ Passwords hashed (never stored plain)      │
│  ├─ Error messages sanitized                   │
│  └─ Stack traces hidden in production          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Caching Strategy

```
Analysis Request
    ↓
Check MongoDB Cache
    ├─ Found → Return (instant)
    └─ Not Found → Generate
        ↓
    Call Gemini AI (3-8s)
        ↓
    Save to MongoDB
        ↓
    Return Analysis
        ↓
Future Requests → Cache Hit (instant)
```

### Database Indexing

```
User Collection:
  - email (unique)

Resume Collection:
  - user (for user queries)
  - parsingStatus (for status filtering)

Analysis Collection:
  - resume (unique, one per resume)
  - resume + user (compound, ownership)
```

---

## Error Handling Flow

```
Error Occurs
    ↓
Caught by Try-Catch
    ↓
Log Error Details
    ├─ console.error()
    └─ Include context (resumeId, userId, timestamp)
    ↓
Determine Error Type
    ├─ Not Found → 404
    ├─ Unauthorized → 401/403
    ├─ Bad Request → 400
    ├─ AI Error → 503/500
    └─ Unknown → 500
    ↓
Format Error Response
    ├─ { success: false, message: "..." }
    └─ Include stack trace (development only)
    ↓
Send to Client
```

---

## Scalability Considerations

### Current Architecture
- Single server
- MongoDB on local machine
- Gemini API (free tier)

### Production Recommendations
```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌─────▼───┐
│ Node 1 │      │ Node 2  │  (Horizontal Scaling)
└───┬────┘      └─────┬───┘
    │                 │
    └────────┬────────┘
             │
    ┌────────▼─────────┐
    │  MongoDB Cluster │  (Replica Set)
    └──────────────────┘
    
    ┌──────────────────┐
    │  Redis Cache     │  (Session/Analysis)
    └──────────────────┘
    
    ┌──────────────────┐
    │  S3/Cloud        │  (File Storage)
    │  Storage         │
    └──────────────────┘
```

---

## Technology Stack

```
┌─────────────────────────────────────┐
│           Backend Stack             │
├─────────────────────────────────────┤
│ Runtime: Node.js                    │
│ Framework: Express.js               │
│ Database: MongoDB + Mongoose        │
│ Authentication: JWT + bcrypt        │
│ File Upload: Multer                 │
│ PDF Parsing: pdf-parse              │
│ DOCX Parsing: mammoth               │
│ AI: Google Gemini (1.5 Flash)       │
│ Environment: dotenv                 │
│ CORS: cors                          │
└─────────────────────────────────────┘
```

---

**Last Updated:** July 12, 2026  
**Version:** 1.0
