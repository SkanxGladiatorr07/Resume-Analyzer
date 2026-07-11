# Resume Parsing Module - Structure & Documentation

## Overview
The parsing module is responsible for extracting, validating, and structuring resume data from uploaded PDF and DOCX files.

---

## Directory Structure

```
server/
├── controllers/
│   └── resumeController.js          # HTTP request handlers
├── middleware/
│   ├── auth.js                      # JWT authentication
│   └── resumeAuth.js                # Resume ownership validation
├── models/
│   └── Resume.js                    # Resume schema with parsing fields
├── services/
│   ├── parsingPipeline.js           # Main parsing orchestration
│   ├── resumeParserService.js       # Text extraction (PDF/DOCX)
│   └── resumeStructuredParser.js    # Structured data parsing
├── utils/
│   ├── parserUtils.js               # Reusable parser utilities
│   └── dataValidator.js             # Data validation & sanitization
└── routes/
    └── resumeRoutes.js              # API endpoints
```

---

## Module Components

### 1. Controllers (`resumeController.js`)
**Purpose:** Handle HTTP requests and responses

**Functions:**
- `uploadResume()` - Upload resume file and trigger parsing
- `getResumes()` - Get all user's resumes
- `deleteResume()` - Delete resume
- `getResumeRawText()` - Get extracted text
- `getResumeParsedData()` - Get structured data
- `getParsingStatus()` - Get parsing progress

**Responsibilities:**
- Request validation
- Response formatting
- Error handling
- Status code management

---

### 2. Middleware (`resumeAuth.js`)
**Purpose:** Ensure secure access to resumes

**Functions:**
- `checkResumeOwnership()` - Verify user owns the resume
- `validateResumeId()` - Validate ID format

**Security Features:**
- User ownership verification
- MongoDB ObjectId validation
- 403/404 error handling
- Prevents unauthorized access

---

### 3. Services

#### A. Parsing Pipeline (`parsingPipeline.js`)
**Purpose:** Orchestrate the complete parsing process

**Functions:**
- `startParsing()` - Main parsing workflow
- `retryParsing()` - Retry failed parsing
- `getParsingStatus()` - Get status info
- `needsParsing()` - Check if parsing needed
- `getParsingStats()` - User parsing statistics

**Workflow:**
1. Update status to 'processing'
2. Validate file
3. Extract text
4. Validate extraction
5. Parse structured data
6. Validate structured data
7. Calculate confidence score
8. Update status to 'completed'
9. Log results

**Error Handling:**
- Try-catch at each step
- Detailed error logging
- Status update on failure
- Prevents duplicate processing

#### B. Text Extraction (`resumeParserService.js`)
**Purpose:** Extract raw text from resume files

**Functions:**
- `parseResume()` - Main extraction function
- `parsePDF()` - PDF text extraction
- `parseDOCX()` - DOCX text extraction
- `cleanText()` - Text normalization
- `validateParseableFile()` - File validation
- `getWordCount()` - Count words
- `getTextPreview()` - Generate preview
- `isParsingSuccessful()` - Validate extraction

**Technologies:**
- `pdf-parse` for PDF files
- `mammoth` for DOCX files

#### C. Structured Parsing (`resumeStructuredParser.js`)
**Purpose:** Extract structured information from text

**Functions:**
- `parseStructuredData()` - Main parsing function
- `parseContactInfo()` - Extract contact details
- `parseSkills()` - Extract technical skills
- `parseEducation()` - Extract education history
- `parseExperience()` - Extract work experience
- `parseProjects()` - Extract projects
- `parseCertifications()` - Extract certifications
- `parseLanguages()` - Extract languages

**Parsing Methods:**
- Regular expressions
- Section detection
- Pattern matching
- Delimiter-based splitting
- Heuristic analysis

---

### 4. Utilities

#### A. Parser Utils (`parserUtils.js`)
**Purpose:** Reusable helper functions

**Categories:**

**Validation:**
- `isValidEmail()` - Email validation
- `isValidPhone()` - Phone validation
- `isValidUrl()` - URL validation
- `hasValidCharacters()` - Character validation

**Text Processing:**
- `cleanText()` - Text cleaning
- `sanitizeText()` - Sanitization
- `removeBullets()` - Remove bullets
- `splitIntoLines()` - Line splitting

**Extraction:**
- `extractYear()` - Year extraction
- `extractYearRange()` - Date range extraction
- `extractLocation()` - Location extraction

**Data Manipulation:**
- `deduplicateArray()` - Remove duplicates
- `limitArray()` - Limit array size
- `formatLocation()` - Format location

**Analysis:**
- `isSectionHeader()` - Detect headers
- `calculateConfidence()` - Confidence score
- `validateField()` - Field validation

#### B. Data Validator (`dataValidator.js`)
**Purpose:** Validate and sanitize structured data

**Functions:**
- `validateStructuredData()` - Validate all data
- `validateContactInfo()` - Validate contact
- `validateSkills()` - Validate skills
- `validateEducation()` - Validate education
- `validateExperience()` - Validate experience
- `validateProjects()` - Validate projects
- `validateCertifications()` - Validate certs
- `validateLanguages()` - Validate languages

**Validation Rules:**
- Field type checking
- Length constraints
- Required field validation
- Data sanitization
- Array size limits
- Duplicate removal

---

## Data Model

### Resume Schema

```javascript
{
  user: ObjectId,              // Reference to User
  fileName: String,            // Stored filename
  originalName: String,        // Original filename
  fileSize: Number,            // File size in bytes
  fileType: String,            // 'pdf' or 'docx'
  filePath: String,            // File storage path
  
  // Parsing Status
  parsingStatus: String,       // 'pending', 'processing', 'completed', 'failed'
  parsingError: String,        // Error message if failed
  parsingStartedAt: Date,      // When parsing started
  parsingCompletedAt: Date,    // When parsing completed
  
  // Extracted Data
  extractedText: String,       // Raw extracted text
  wordCount: Number,           // Word count
  
  // Structured Data
  structuredData: {
    contactInfo: {
      name: String,
      email: String,
      phone: String,
      linkedin: String,
      github: String,
    },
    skills: [String],
    education: [{
      degree: String,
      institution: String,
      year: String,
      location: String,
    }],
    experience: [{
      title: String,
      company: String,
      duration: String,
      location: String,
      description: [String],
    }],
    projects: [{
      name: String,
      technologies: [String],
      description: [String],
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: String,
    }],
    languages: [{
      language: String,
      proficiency: String,
    }],
  },
  
  timestamps: true              // createdAt, updatedAt
}
```

---

## API Endpoints

### Upload Resume
```
POST /api/resumes/upload
Auth: Required
Body: FormData with 'resume' file
Response: { success, message, data: { id, parsingStatus, ... } }
```

### Get All Resumes
```
GET /api/resumes
Auth: Required
Response: { success, count, data: [resumes] }
```

### Delete Resume
```
DELETE /api/resumes/:id
Auth: Required
Middleware: validateResumeId, checkResumeOwnership
Response: { success, message }
```

### Get Raw Text
```
GET /api/resumes/:id/raw-text
Auth: Required
Middleware: validateResumeId, checkResumeOwnership
Response: { success, data: { extractedText, wordCount, ... } }
Status: 202 (processing), 422 (failed), 200 (success)
```

### Get Structured Data
```
GET /api/resumes/:id/parsed
Auth: Required
Middleware: validateResumeId, checkResumeOwnership
Response: { success, data: { structuredData, ... } }
Status: 202 (processing), 422 (failed), 200 (success)
```

### Get Parsing Status
```
GET /api/resumes/:id/status
Auth: Required
Middleware: validateResumeId, checkResumeOwnership
Response: { success, data: { parsingStatus, duration, ... } }
```

---

## Parsing Flow

### 1. Upload Phase
```
User uploads file
↓
File saved to disk
↓
Resume record created (status: 'pending')
↓
Response sent to user
↓
Parsing triggered (async, non-blocking)
```

### 2. Parsing Phase
```
Status → 'processing'
↓
Validate file (size, readability)
↓
Extract text (pdf-parse or mammoth)
↓
Validate extraction (min 50 chars, 5 words)
↓
Calculate word count
↓
Parse structured data (sections)
↓
Validate & sanitize data
↓
Calculate confidence score
↓
Save to database
↓
Status → 'completed'
↓
Log results
```

### 3. Error Handling
```
Any step fails
↓
Catch error
↓
Status → 'failed'
↓
Save error message
↓
Log error details
```

---

## Performance Optimizations

### 1. Async Processing
- Non-blocking upload response
- Background parsing
- Immediate user feedback

### 2. Duplicate Prevention
- Check status before parsing
- Skip 'processing' resumes
- Skip 'completed' resumes

### 3. Data Limits
- Skills: max 50
- Education: max 10
- Experience: max 15
- Projects: max 10
- Certifications: max 20
- Languages: max 10
- Description bullets: max 20 per item

### 4. Efficient Queries
- Select only needed fields
- Index on user field
- Exclude large fields (extractedText) in lists

---

## Security Features

### 1. Authentication
- JWT required for all endpoints
- Token validation on each request

### 2. Authorization
- Middleware checks ownership
- User can only access own resumes
- 403 on unauthorized access

### 3. Validation
- File type validation (PDF/DOCX only)
- File size limits (5MB max)
- Resume ID format validation
- Data sanitization

### 4. Error Handling
- No sensitive data in errors
- Proper status codes
- Logging without exposing details

---

## Error Messages

### User-Facing Errors
- "File is corrupted or unreadable"
- "Extracted text is too short or empty"
- "Resume parsing failed: [reason]"
- "Text extraction is in progress"
- "Not authorized to access this resume"

### Log Errors
- Detailed stack traces
- File information
- User context
- Timestamp

---

## Testing Checklist

### Upload
- ✅ Upload PDF successfully
- ✅ Upload DOCX successfully
- ✅ Reject invalid file types
- ✅ Reject oversized files
- ✅ Parsing starts immediately

### Parsing
- ✅ PDF text extraction works
- ✅ DOCX text extraction works
- ✅ Structured data parsed correctly
- ✅ Validation removes invalid data
- ✅ Error handling works

### Authorization
- ✅ Users can only see own resumes
- ✅ 403 on unauthorized access
- ✅ 404 on non-existent resume
- ✅ Invalid ID format rejected

### Status Flow
- ✅ pending → processing → completed
- ✅ Failed resumes show error
- ✅ Status endpoint works
- ✅ No duplicate parsing

---

## Future Enhancements (Ready for AI)

### 1. AI Analysis
- Resume quality scoring
- ATS compatibility check
- Keyword matching
- Improvement suggestions

### 2. Advanced Parsing
- Better section detection
- Context-aware extraction
- Multi-language support
- Custom field detection

### 3. Performance
- Queue system for parsing
- Parallel processing
- Caching frequently accessed data
- Database indexing

---

## Maintenance Notes

### Adding New Sections
1. Add parser in `resumeStructuredParser.js`
2. Add validator in `dataValidator.js`
3. Update Resume model schema
4. Update frontend displays
5. Test thoroughly

### Debugging
- Check server logs for errors
- Use parsing status endpoint
- Review error messages in database
- Test with sample resumes

### Monitoring
- Track parsing success rate
- Monitor parsing duration
- Log error patterns
- User feedback

---

**Last Updated:** July 11, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
