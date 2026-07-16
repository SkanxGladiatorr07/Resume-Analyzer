# RAG Infrastructure - Finalized Implementation

## Overview

Complete RAG (Retrieval Augmented Generation) infrastructure for the Resume ATS Analyzer. This system automatically processes resumes through chunking, embedding generation, and vector indexing to enable semantic search and AI chat.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATED RAG PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘

1. RESUME UPLOAD
   ↓
2. PARSING (Extract text + structured data)
   ↓
3. AUTO-TRIGGER RAG PIPELINE
   ├─ Step 1: CHUNKING
   │  ├─ Intelligent section-based splitting
   │  ├─ Save chunks to MongoDB
   │  └─ Duplicate prevention
   │
   ├─ Step 2: EMBEDDING GENERATION
   │  ├─ Generate embeddings with Gemini
   │  ├─ Batch processing (10 at a time)
   │  ├─ Retry logic (1 retry)
   │  └─ Update chunk status
   │
   └─ Step 3: VECTOR INDEXING
      ├─ Optimized batch upload to Pinecone
      ├─ Duplicate detection
      ├─ Store metadata
      └─ Update resume status
   ↓
4. READY FOR SEARCH & CHAT
```

---

## File Organization

### Services (Organized by Function)

```
services/
├── embeddingService.js      # Embedding generation (Gemini)
├── chunkService.js          # Chunk management (NEW)
├── vectorService.js         # Vector operations (Pinecone)
├── retrievalService.js      # Semantic retrieval (NEW)
├── ragPipeline.js           # RAG orchestration (NEW)
├── chunkingService.js       # Legacy chunking logic
├── embeddingPipeline.js     # Embedding pipeline
└── searchService.js         # Search functionality
```

### Config

```
config/
└── pinecone.js             # Pinecone configuration
```

### Utils

```
utils/
├── ragLogger.js            # Centralized RAG logging (NEW)
└── vectorOptimizer.js      # Optimized vector uploads (NEW)
```

### Scripts

```
scripts/
├── manageRAG.js           # RAG management CLI (NEW)
├── testChunking.js        # Test chunking
├── testEmbedding.js       # Test embeddings
└── testSearch.js          # Test search
```

---

## Key Features

### 1. Automatic Triggering ✅

RAG pipeline automatically starts after resume parsing completes.

```javascript
// In parsingPipeline.js
import { triggerRAGPipelineAfterParsing } from './ragPipeline.js';

// After successful parsing
triggerRAGPipelineAfterParsing(resumeId);
```

**Configuration:**
```env
RAG_AUTO_TRIGGER=true  # Enable/disable auto-trigger
```

### 2. Duplicate Prevention ✅

Multiple layers of duplicate prevention:

**Resume Level:**
- Check if embedding status is 'processing' or 'completed'
- Skip if already being processed

**Chunk Level:**
- Check if chunks already exist before creating
- Count indexed chunks vs total chunks

**Vector Level:**
- Fetch existing vectors from Pinecone
- Skip already uploaded vectors
- Configurable with `skipDuplicateCheck` option

### 3. Improved Logging ✅

Centralized logging system with structured output:

```javascript
import { logChunking, logEmbedding, logVector } from './utils/ragLogger.js';

// Chunking logs
logChunking.start(resumeId, fileName);
logChunking.success(resumeId, chunkCount, duration);
logChunking.error(resumeId, error);

// Embedding logs
logEmbedding.start(resumeId, chunkCount);
logEmbedding.success(resumeId, successful, failed, duration);
logEmbedding.error(resumeId, chunkId, error);

// Vector logs
logVector.batchUpload(count, namespace, duration);
logVector.error(operation, error, context);
```

**Log Features:**
- Color-coded console output
- Structured error logging
- Operation-specific loggers
- Debug mode support
- Timestamps and metadata

### 4. Refactored Services ✅

**New Services:**

#### `chunkService.js`
Simplified chunk operations:
```javascript
import { generateChunksForResume, hasChunks } from './chunkService.js';

await generateChunksForResume(resumeId);
const exists = await hasChunks(resumeId);
```

#### `retrievalService.js`
Centralized retrieval operations:
```javascript
import { getContextForChat } from './retrievalService.js';

const context = await getContextForChat({
  resumeId,
  query,
  userId,
  options: { topK: 5 }
});
```

#### `ragPipeline.js`
Complete RAG orchestration:
```javascript
import { executeRAGPipeline } from './ragPipeline.js';

const result = await executeRAGPipeline(resumeId);
```

### 5. Optimized Vector Uploads ✅

Efficient batch uploads with:

```javascript
import { uploadVectorsOptimized } from './utils/vectorOptimizer.js';

const result = await uploadVectorsOptimized(vectors, namespace, {
  skipDuplicateCheck: false,
  batchSize: 100,
});
```

**Features:**
- Configurable batch size (default: 100)
- Duplicate detection before upload
- Concurrent batch processing (max 3 concurrent)
- Automatic retry with exponential backoff
- Progress logging

**Configuration:**
```env
VECTOR_BATCH_SIZE=100
VECTOR_MAX_CONCURRENT=3
```

### 6. Enhanced Retry Logic ✅

**Embedding Retry:**
- Automatic retry on failure (max 1 retry)
- Exponential backoff (2 seconds)
- Per-chunk retry tracking
- Resume-level retry count

**Vector Upload Retry:**
- Batch-level retries (max 2 retries)
- Per-batch exponential backoff
- Failed batch tracking
- Detailed error logging

**Manual Retry:**
```bash
# CLI tool
node scripts/manageRAG.js retry <resumeId>
```

---

## Usage

### Automatic Usage (Default)

After resume upload, everything happens automatically:

1. User uploads resume
2. Parsing starts automatically
3. RAG pipeline triggers after parsing
4. Chunks created → Embeddings generated → Vectors indexed
5. Resume ready for search

### Manual Usage

```bash
# Check status
node scripts/manageRAG.js status

# Process single resume
node scripts/manageRAG.js process <resumeId>

# Batch process pending
node scripts/manageRAG.js batch 10

# Retry failed
node scripts/manageRAG.js retry <resumeId>

# Validate readiness
node scripts/manageRAG.js validate <resumeId>

# Show statistics
node scripts/manageRAG.js stats

# Cleanup RAG data
node scripts/manageRAG.js cleanup <resumeId>
```

### Programmatic Usage

```javascript
// Execute RAG pipeline
import { executeRAGPipeline } from './services/ragPipeline.js';

const result = await executeRAGPipeline(resumeId);

// Get context for chat
import { getContextForChat } from './services/retrievalService.js';

const context = await getContextForChat({
  resumeId,
  query: userMessage,
  userId,
  options: { topK: 5 }
});

// Use context in AI chat
const chatResponse = await generateChatResponse(context.context, userMessage);
```

---

## Configuration

### Environment Variables

```env
# RAG Pipeline
RAG_AUTO_TRIGGER=true

# Embedding
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSION=768
EMBEDDING_BATCH_SIZE=100

# Vector Operations
VECTOR_BATCH_SIZE=100
VECTOR_MAX_CONCURRENT=3

# Pinecone
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=resume-ats
PINECONE_NAMESPACE=resume-chunks
PINECONE_DIMENSION=768

# Gemini
GEMINI_API_KEY=your_key

# Debug
DEBUG=true  # Enable debug logging
```

---

## Status Tracking

### Resume Model Fields

```javascript
{
  // Parsing
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed',
  
  // Embedding
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed',
  embeddingError: String,
  embeddingStartedAt: Date,
  embeddingCompletedAt: Date,
  embeddingRetryCount: Number
}
```

### Chunk Model Fields

```javascript
{
  status: 'pending' | 'embedded' | 'indexed' | 'error',
  embedding: [Number],  // 768-dim vector
  embeddingModel: String,
  vectorId: String,  // Pinecone ID
  error: {
    message: String,
    timestamp: Date
  }
}
```

---

## Error Handling

### Automatic Error Recovery

1. **Parsing Failure**: Resume status → failed, can retry
2. **Chunking Failure**: Error logged, resume status → failed
3. **Embedding Failure**: 
   - Auto-retry once per chunk
   - Failed chunks tracked
   - Resume status → completed with warning if partial success
4. **Vector Upload Failure**:
   - Batch retry (2 attempts)
   - Failed batches logged
   - Chunk status → error

### Manual Recovery

```bash
# Retry failed embeddings
node scripts/manageRAG.js retry <resumeId>

# Clean up and reprocess
node scripts/manageRAG.js cleanup <resumeId>
node scripts/manageRAG.js process <resumeId>
```

---

## Performance Optimizations

### 1. Batch Processing
- Chunks processed in batches of 10
- Vectors uploaded in batches of 100
- Max 3 concurrent batch uploads

### 2. Duplicate Prevention
- Skip already processed resumes
- Check existing chunks before creation
- Detect duplicate vectors before upload

### 3. Efficient Queries
- Indexed fields in MongoDB
- Optimized Pinecone queries
- Minimal data transfer

### 4. Async Operations
- Non-blocking pipeline triggers
- Background processing
- Parallel batch operations

---

## Monitoring

### CLI Commands

```bash
# Overall status
node scripts/manageRAG.js status

# Detailed statistics
node scripts/manageRAG.js stats

# Validate specific resume
node scripts/manageRAG.js validate <resumeId>
```

### Expected Output

```
RAG PIPELINE STATUS

Resume Status:
  Total Resumes:     15
  Parsed:            12
  Ready for Search:  10 ✓

Embedding Status:
  Pending:           2
  Processing:        0
  Completed:         10 ✓
  Failed:            0

Vector Database:
  Total Vectors:     142
```

---

## Integration with Chat (Tomorrow)

The RAG infrastructure is now ready for AI chat integration:

```javascript
// Future chat endpoint (DO NOT IMPLEMENT YET)
POST /api/chat

{
  "resumeId": "...",
  "message": "What is my Python experience?"
}

// Flow:
// 1. Retrieve context using retrievalService
// 2. Format context for AI
// 3. Generate response with Gemini
// 4. Return response
```

**Prepared Functions:**

1. `getContextForChat()` - Retrieves and formats relevant chunks
2. `formatChunksForContext()` - Prepares chunks for AI input
3. `validateRetrievalReadiness()` - Checks if resume is ready

---

## Testing

### Test Individual Components

```bash
# Test chunking
node scripts/testChunking.js single <resumeId>

# Test embeddings
node scripts/testEmbedding.js resume <resumeId>

# Test search
node scripts/testSearch.js search <resumeId> "query"
```

### Test Full Pipeline

```bash
# Process through complete pipeline
node scripts/manageRAG.js process <resumeId>

# Batch test
node scripts/manageRAG.js batch 5
```

---

## Troubleshooting

### Issue: Pipeline not auto-triggering

**Check:**
```env
RAG_AUTO_TRIGGER=true
```

### Issue: Duplicate chunks created

**Solution:**
```bash
node scripts/manageRAG.js cleanup <resumeId>
node scripts/manageRAG.js process <resumeId>
```

### Issue: Embeddings failed

**Check logs:**
- Gemini API key valid?
- Rate limits exceeded?
- Chunk text valid?

**Retry:**
```bash
node scripts/manageRAG.js retry <resumeId>
```

### Issue: Vectors not uploading

**Check:**
- Pinecone API key
- Index name correct
- Namespace configured
- Network connectivity

---

## Summary

### ✅ Completed

1. **Automatic Triggering** - RAG pipeline runs after parsing
2. **Duplicate Prevention** - Multiple layers of protection
3. **Improved Logging** - Structured, color-coded logs
4. **Refactored Services** - Clean, modular architecture
5. **Optimized Uploads** - Batch processing with deduplication
6. **Enhanced Retry** - Automatic and manual retry options
7. **Organized Structure** - Clear file organization
8. **Management CLI** - Comprehensive management tool

### 🎯 Ready For

- ✅ Automatic RAG processing after upload
- ✅ Semantic search across resumes
- ✅ Context retrieval for AI chat
- 🔄 AI chat implementation (tomorrow)

### 📊 Statistics

- **Services**: 3 new, 3 refactored
- **Utils**: 2 new utilities
- **Scripts**: 1 comprehensive CLI tool
- **Logging**: Centralized with 5 operation types
- **Documentation**: Complete implementation guide

---

**The RAG infrastructure is production-ready and optimized for AI chat integration!** 🚀
