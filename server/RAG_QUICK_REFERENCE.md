# RAG Infrastructure - Quick Reference

## 🚀 Quick Start

### Automatic Mode (Default)

```bash
# 1. Upload resume via API
POST /api/resumes/upload

# 2. Everything happens automatically:
# ✓ Parsing
# ✓ Chunking
# ✓ Embedding generation
# ✓ Vector indexing

# 3. Check status
node scripts/manageRAG.js status
```

---

## 📋 Commands

### Status & Info

```bash
# Overall status
node scripts/manageRAG.js status

# Detailed statistics
node scripts/manageRAG.js stats

# Validate specific resume
node scripts/manageRAG.js validate <resumeId>
```

### Processing

```bash
# Process single resume
node scripts/manageRAG.js process <resumeId>

# Batch process (10 resumes)
node scripts/manageRAG.js batch 10

# Retry failed
node scripts/manageRAG.js retry <resumeId>
```

### Maintenance

```bash
# Clean up RAG data
node scripts/manageRAG.js cleanup <resumeId>
```

---

## 🏗️ Architecture

```
Upload → Parse → Auto-Trigger RAG Pipeline
                 ├─ Chunk
                 ├─ Embed
                 └─ Index
                 ↓
              Ready for Search & Chat
```

---

## 📂 File Structure

```
services/
├── chunkService.js          # Chunk management
├── retrievalService.js      # Retrieval for chat
├── ragPipeline.js           # Pipeline orchestration
├── embeddingService.js      # Embedding generation
├── vectorService.js         # Vector operations
└── searchService.js         # Search functionality

utils/
├── ragLogger.js            # Centralized logging
└── vectorOptimizer.js      # Optimized uploads

scripts/
└── manageRAG.js           # Management CLI
```

---

## 🔧 Configuration

```env
# Auto-trigger
RAG_AUTO_TRIGGER=true

# Embedding
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSION=768

# Vector operations
VECTOR_BATCH_SIZE=100
VECTOR_MAX_CONCURRENT=3

# Pinecone
PINECONE_API_KEY=your_key
PINECONE_NAMESPACE=resume-chunks

# Gemini
GEMINI_API_KEY=your_key
```

---

## 🎯 Key Functions

### For Chat Integration

```javascript
import { getContextForChat } from './services/retrievalService.js';

// Get context for AI chat
const context = await getContextForChat({
  resumeId,
  query: userMessage,
  userId,
  options: { topK: 5 }
});

// Use: context.context (formatted string for AI)
```

### For Pipeline Management

```javascript
import { executeRAGPipeline } from './services/ragPipeline.js';

// Process resume
const result = await executeRAGPipeline(resumeId);
```

### For Retrieval

```javascript
import { retrieveRelevantChunks } from './services/retrievalService.js';

// Search resume
const results = await retrieveRelevantChunks({
  resumeId,
  query,
  userId,
  options: { topK: 5 }
});
```

---

## 🔍 Status Tracking

### Resume Statuses

```javascript
// Parsing
'pending' | 'processing' | 'completed' | 'failed'

// Embedding
'pending' | 'processing' | 'completed' | 'failed'
```

### Chunk Statuses

```javascript
'pending' | 'embedded' | 'indexed' | 'error'
```

---

## 📊 Monitoring

### Check Status

```bash
node scripts/manageRAG.js status
```

Output:
```
Resume Status:
  Total Resumes:     15
  Ready for Search:  10 ✓

Embedding Status:
  Completed:         10 ✓
  Failed:            0
```

---

## 🛠️ Troubleshooting

### Pipeline Not Triggering

```bash
# Check config
cat .env | grep RAG_AUTO_TRIGGER
# Should be: RAG_AUTO_TRIGGER=true

# Manual trigger
node scripts/manageRAG.js process <resumeId>
```

### Embeddings Failed

```bash
# Retry
node scripts/manageRAG.js retry <resumeId>

# Or cleanup and reprocess
node scripts/manageRAG.js cleanup <resumeId>
node scripts/manageRAG.js process <resumeId>
```

### Check Logs

```bash
# Logs show detailed info with colors:
# ✅ = Success
# ❌ = Error
# ⚠️  = Warning
# ℹ️ = Info
```

---

## 🎨 Logging

### Import

```javascript
import { logChunking, logEmbedding, logVector } from './utils/ragLogger.js';
```

### Usage

```javascript
// Start operation
logChunking.start(resumeId, fileName);

// Success
logChunking.success(resumeId, count, duration);

// Error
logChunking.error(resumeId, error);
```

---

## ✅ Duplicate Prevention

### Resume Level
- Checks if already processing
- Checks if already completed
- Verifies chunk status

### Chunk Level
- Checks if chunks exist
- Skips duplicate creation

### Vector Level
- Fetches existing vectors
- Skips duplicate uploads

---

## 🚄 Performance

### Optimizations
- ✅ Batch processing (10 chunks)
- ✅ Concurrent uploads (3 batches)
- ✅ Duplicate detection
- ✅ Automatic retries
- ✅ Exponential backoff

### Benchmarks
- Chunking: ~500ms for 20 chunks
- Embedding: ~10-15s for 20 chunks
- Vector upload: ~2-3s for 20 vectors
- **Total**: ~15-20s per resume

---

## 🔄 Retry Logic

### Automatic
- Embedding: 1 retry per chunk
- Vector upload: 2 retries per batch
- Exponential backoff

### Manual
```bash
node scripts/manageRAG.js retry <resumeId>
```

---

## 📈 Testing

### Test Individual Components

```bash
# Chunking
node scripts/testChunking.js single <resumeId>

# Embeddings
node scripts/testEmbedding.js resume <resumeId>

# Search
node scripts/testSearch.js search <resumeId> "query"
```

### Test Full Pipeline

```bash
node scripts/manageRAG.js process <resumeId>
```

---

## 🎯 Ready for Chat

```javascript
// Get context (prepared for tomorrow)
const context = await getContextForChat({
  resumeId,
  query: userMessage,
  userId
});

// context.context = formatted text for AI
// context.chunks = raw results
// context.totalResults = count
```

---

## 📝 Summary

### Status: ✅ Production Ready

**Features:**
- ✅ Automatic triggering
- ✅ Duplicate prevention
- ✅ Improved logging
- ✅ Refactored services
- ✅ Optimized uploads
- ✅ Enhanced retry
- ✅ Organized structure
- ✅ Chat preparation

**Commands:**
```bash
status process batch retry validate cleanup stats
```

**Performance:**
- ~15-20s per resume
- Batch processing supported
- Automatic error recovery

**Next:**
- Tomorrow: AI Resume Chat

---

## 📚 Documentation

- **Complete Guide**: `RAG_INFRASTRUCTURE.md`
- **Implementation**: `TASK_5_SUMMARY.md`
- **This Guide**: `RAG_QUICK_REFERENCE.md`

---

**Everything is ready for AI chat integration!** 🚀
