# ResumeAI API Request Flow

## Backend Request Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Middleware
    participant Controller
    participant Service
    participant Database
    participant AI

    Client->>Express: HTTP Request
    Express->>Middleware: Pass Request
    
    alt Security Checks
        Middleware->>Middleware: Helmet (Security Headers)
        Middleware->>Middleware: CORS Validation
        Middleware->>Middleware: Rate Limiting
    end
    
    alt Authentication Required
        Middleware->>Middleware: Verify JWT Token
        alt Invalid Token
            Middleware-->>Client: 401 Unauthorized
        end
    end
    
    alt Input Validation
        Middleware->>Middleware: Validate Request Body
        alt Invalid Input
            Middleware-->>Client: 400 Bad Request
        end
    end
    
    Middleware->>Controller: Validated Request
    
    alt Business Logic
        Controller->>Service: Process Request
        
        alt Database Operation
            Service->>Database: Query/Update
            Database-->>Service: Result
        end
        
        alt AI Processing
            Service->>AI: API Call
            AI-->>Service: AI Response
        end
        
        Service-->>Controller: Processed Data
    end
    
    Controller->>Controller: Format Response
    Controller-->>Client: HTTP Response (200/201/etc)
    
    alt Error Handling
        Service-->>Controller: Error
        Controller->>Controller: Log Error
        Controller-->>Client: Error Response (4xx/5xx)
    end
```

## Detailed Flow by Feature

### 1. User Registration Flow

```mermaid
flowchart TD
    Start([Client: POST /api/auth/register])
    
    Start --> Validate[Validate Input<br/>name, email, password]
    Validate -->|Invalid| Error400[Return 400<br/>Validation Error]
    
    Validate -->|Valid| CheckEmail[Check Email<br/>Exists in DB]
    CheckEmail -->|Exists| Error409[Return 409<br/>Email Already Exists]
    
    CheckEmail -->|New| HashPassword[Hash Password<br/>bcrypt 10 rounds]
    HashPassword --> CreateUser[Create User<br/>in MongoDB]
    
    CreateUser --> GenToken[Generate<br/>Verification Token]
    GenToken --> SendEmail[Send Verification<br/>Email via Nodemailer]
    
    SendEmail -->|Success| GenJWT[Generate JWT Token<br/>24h expiry]
    SendEmail -->|Fail| LogError[Log Email Error<br/>Continue Registration]
    
    GenJWT --> SetCookie[Set HTTP-Only Cookie]
    SetCookie --> Success[Return 201<br/>User Created]
    
    Error400 --> End([End])
    Error409 --> End
    LogError --> GenJWT
    Success --> End

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style Error400 fill:#ffcdd2
    style Error409 fill:#ffcdd2
```

### 2. Resume Upload & Analysis Flow

```mermaid
flowchart TD
    Start([Client: POST /api/resumes/upload])
    
    Start --> Auth[Verify JWT Token]
    Auth -->|Invalid| Error401[Return 401<br/>Unauthorized]
    
    Auth -->|Valid| Upload[Multer Upload<br/>PDF File]
    Upload -->|Fail| Error400[Return 400<br/>Invalid File]
    
    Upload -->|Success| SaveFile[Save File to<br/>uploads/ Directory]
    SaveFile --> CreateRecord[Create Resume<br/>Record in MongoDB]
    
    CreateRecord --> ParsePDF[Parse PDF<br/>pdf-parse Library]
    ParsePDF -->|Error| ParseError[Log Error<br/>Mark Status: error]
    
    ParsePDF -->|Success| ExtractAI[AI: Extract Structured Data<br/>Google Gemini API]
    ExtractAI --> SaveParsed[Save ParsedData<br/>to MongoDB]
    
    SaveParsed --> ATSAnalysis[AI: ATS Analysis<br/>Score & Suggestions]
    ATSAnalysis --> SaveAnalysis[Save Analysis<br/>to MongoDB]
    
    SaveAnalysis --> GenerateEmbedding[Generate Embeddings<br/>Google AI Embeddings]
    GenerateEmbedding --> StoreVector[Store in ChromaDB<br/>for Semantic Search]
    
    StoreVector --> Success[Return 201<br/>Resume Created + Analysis]
    
    Error401 --> End([End])
    Error400 --> End
    ParseError --> ErrorResponse[Return 500<br/>Processing Error]
    ErrorResponse --> End
    Success --> End

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style Error401 fill:#ffcdd2
    style Error400 fill:#ffcdd2
    style ErrorResponse fill:#ffcdd2
```

### 3. Job Matching Flow

```mermaid
flowchart TD
    Start([Client: POST /api/job-match])
    
    Start --> Auth[Verify JWT Token]
    Auth -->|Invalid| Error401[Return 401]
    
    Auth -->|Valid| Validate[Validate Input<br/>resumeId, jobDescription]
    Validate -->|Invalid| Error400[Return 400]
    
    Validate -->|Valid| FetchResume[Fetch Resume +<br/>ParsedData from MongoDB]
    FetchResume -->|Not Found| Error404[Return 404]
    
    FetchResume -->|Found| PreparePrompt[Prepare AI Prompt<br/>Resume + Job Description]
    PreparePrompt --> CallAI[AI: Analyze Match<br/>Google Gemini API]
    
    CallAI -->|Error| AIError[Return 500<br/>AI Service Error]
    
    CallAI -->|Success| ParseResponse[Parse AI Response<br/>Extract Match Data]
    ParseResponse --> CalculateScore[Calculate Match Score<br/>0-100 scale]
    
    CalculateScore --> SaveMatch[Save JobMatch<br/>to MongoDB]
    SaveMatch --> LogAnalytics[Log Analytics Event]
    
    LogAnalytics --> Success[Return 200<br/>Match Results]
    
    Error401 --> End([End])
    Error400 --> End
    Error404 --> End
    AIError --> End
    Success --> End

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style Error401 fill:#ffcdd2
    style Error400 fill:#ffcdd2
    style Error404 fill:#ffcdd2
    style AIError fill:#ffcdd2
```

### 4. Export Flow

```mermaid
flowchart TD
    Start([Client: POST /api/export])
    
    Start --> Auth[Verify JWT Token]
    Auth -->|Invalid| Error401[Return 401]
    
    Auth -->|Valid| Validate[Validate Input<br/>resumeId, format]
    Validate -->|Invalid| Error400[Return 400]
    
    Validate -->|Valid| FetchData[Fetch Resume +<br/>ParsedData + Analysis]
    FetchData -->|Not Found| Error404[Return 404]
    
    FetchData -->|Found| CheckFormat{Export Format?}
    
    CheckFormat -->|PDF| GeneratePDF[Generate PDF<br/>using Template]
    CheckFormat -->|JSON| GenerateJSON[Generate JSON<br/>Structured Data]
    CheckFormat -->|DOCX| GenerateDOCX[Generate DOCX<br/>using Template]
    
    GeneratePDF --> SaveExport[Save Export File<br/>to exports/]
    GenerateJSON --> SaveExport
    GenerateDOCX --> SaveExport
    
    SaveExport --> CreateRecord[Create Export<br/>Record in MongoDB]
    CreateRecord --> LogAnalytics[Log Analytics Event]
    
    LogAnalytics --> Success[Return 200<br/>Download Link]
    
    Error401 --> End([End])
    Error400 --> End
    Error404 --> End
    Success --> End

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style Error401 fill:#ffcdd2
    style Error400 fill:#ffcdd2
    style Error404 fill:#ffcdd2
```

## Middleware Pipeline

```mermaid
graph LR
    Request[Incoming Request] --> Helmet[Helmet<br/>Security Headers]
    Helmet --> CORS[CORS<br/>Origin Check]
    CORS --> RateLimit[Rate Limiter<br/>100/15min]
    RateLimit --> BodyParser[Body Parser<br/>JSON/URL-encoded]
    BodyParser --> FileUpload{File Upload?}
    
    FileUpload -->|Yes| Multer[Multer<br/>File Processing]
    FileUpload -->|No| Auth{Auth Required?}
    Multer --> Auth
    
    Auth -->|Yes| JWTVerify[JWT Verification]
    Auth -->|No| Validation
    JWTVerify -->|Invalid| Reject401[401 Response]
    JWTVerify -->|Valid| AttachUser[Attach User to req]
    
    AttachUser --> Validation[Input Validation<br/>express-validator]
    Validation -->|Invalid| Reject400[400 Response]
    Validation -->|Valid| Controller[Route Controller]
    
    Controller --> Response[HTTP Response]

    style Request fill:#e3f2fd
    style Response fill:#c8e6c9
    style Reject401 fill:#ffcdd2
    style Reject400 fill:#ffcdd2
```

## Error Handling Flow

```mermaid
flowchart TD
    Error([Error Occurs])
    
    Error --> CheckType{Error Type?}
    
    CheckType -->|Validation Error| Format400[Format 400 Response<br/>with Field Errors]
    CheckType -->|Auth Error| Format401[Format 401 Response<br/>Unauthorized]
    CheckType -->|Not Found| Format404[Format 404 Response<br/>Resource Not Found]
    CheckType -->|Database Error| Format500[Format 500 Response<br/>Database Error]
    CheckType -->|AI Service Error| Format503[Format 503 Response<br/>Service Unavailable]
    CheckType -->|Unknown Error| Format500Generic[Format 500 Response<br/>Internal Server Error]
    
    Format400 --> Log[Log Error to Console]
    Format401 --> Log
    Format404 --> Log
    Format500 --> Log
    Format503 --> Log
    Format500Generic --> Log
    
    Log --> SendResponse[Send Error Response<br/>to Client]
    
    SendResponse --> CheckSeverity{Severity?}
    CheckSeverity -->|Critical| Alert[Send Alert<br/>to Admin]
    CheckSeverity -->|Normal| End([End])
    Alert --> End

    style Error fill:#ffcdd2
    style SendResponse fill:#ffe0b2
    style End fill:#c8e6c9
```

## Response Format Standards

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Performance Optimization

### Caching Strategy
- **Response Caching**: Cache GET requests for resume lists (5 min TTL)
- **Database Query Caching**: Mongoose query result caching
- **Static Assets**: CDN caching for frontend assets
- **API Rate Limiting**: Prevent abuse and ensure fair usage

### Async Processing
- **File Upload**: Async file processing with status updates
- **AI Analysis**: Queue-based processing for long-running tasks
- **Email Sending**: Non-blocking email operations
- **Analytics**: Batch analytics event processing
