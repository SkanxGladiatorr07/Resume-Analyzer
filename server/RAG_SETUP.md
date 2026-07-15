# RAG Infrastructure Setup

## Overview
This document explains how to set up and configure the RAG (Retrieval-Augmented Generation) infrastructure for ResumeAI.

## Architecture

```
RAG Infrastructure
├── Pinecone (Vector Database)
│   ├── Index: resumeai-index
│   ├── Namespace: resumes
│   └── Dimension: 768
├── Embedding Service (Google Gemini)
│   ├── Model: text-embedding-004
│   └── Dimension: 768
└── Vector Service
    ├── Upsert operations
    ├── Query operations
    └── Metadata management
```

## Prerequisites

1. **Pinecone Account**
   - Sign up at https://www.pinecone.io/
   - Get your API key from the dashboard
   - Choose a plan (free tier available)

2. **Google Gemini API Key**
   - Already configured in the project
   - Used for generating embeddings

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and add your Pinecone API key:

```bash
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=gcp-starter
PINECONE_INDEX_NAME=resumeai-index
PINECONE_NAMESPACE=resumes
PINECONE_DIMENSION=768
PINECONE_METRIC=cosine

# Embedding Configuration
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSION=768
EMBEDDING_BATCH_SIZE=100
EMBEDDING_MAX_RETRIES=3
```

### 2. Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PINECONE_API_KEY` | Required | Your Pinecone API key |
| `PINECONE_INDEX_NAME` | resumeai-index | Name of the Pinecone index |
| `PINECONE_NAMESPACE` | resumes | Namespace for organizing vectors |
| `PINECONE_DIMENSION` | 768 | Vector dimension (must match embedding model) |
| `PINECONE_METRIC` | cosine | Distance metric (cosine, euclidean, dotproduct) |
| `EMBEDDING_MODEL` | text-embedding-004 | Google Gemini embedding model |
| `EMBEDDING_BATCH_SIZE` | 100 | Batch size for embedding generation |

## Setup Commands

### Verify Configuration
```bash
node scripts/setupRAG.js verify
```
Checks if all required environment variables are set.

### Initialize Infrastructure
```bash
node scripts/setupRAG.js init
```
Creates Pinecone index if it doesn't exist.

### Test Infrastructure
```bash
node scripts/setupRAG.js test
```
Runs end-to-end tests:
- Generate test embedding
- Store vector in Pinecone
- Query similar vectors

### Check Status
```bash
node scripts/setupRAG.js status
```
Shows current RAG infrastructure status.

## Code Organization

### Configuration
- `config/pinecone.js` - Pinecone client and index management

### Services
- `services/embeddingService.js` - Embedding generation using Gemini
- `services/vectorService.js` - Vector operations with Pinecone

### Utilities
- `utils/ragPreparation.js` - Text preprocessing and chunking
- `utils/ragSetup.js` - Setup and testing utilities

### Scripts
- `scripts/setupRAG.js` - CLI tool for RAG management

## Usage Examples

### Generate Embedding
```javascript
import { generateEmbedding } from './services/embeddingService.js';

const text = "Software engineer with 5 years of Python experience";
const embedding = await generateEmbedding(text);
console.log(embedding.length); // 768
```

### Store Vector
```javascript
import { upsertVector } from './services/vectorService.js';

await upsertVector(
  'resume-123',
  embedding,
  {
    userId: 'user-456',
    documentType: 'resume',
    fileName: 'john_doe.pdf'
  }
);
```

### Query Similar Vectors
```javascript
import { querySimilarVectors } from './services/vectorService.js';

const results = await querySimilarVectors(queryEmbedding, {
  topK: 5,
  filter: { documentType: 'resume' }
});

results.forEach(match => {
  console.log(`ID: ${match.id}, Score: ${match.score}`);
});
```

## Namespaces

Organize vectors by type using namespaces:

- `resumes` - Resume document vectors
- `jobs` - Job description vectors
- `analyses` - Analysis result vectors
- `queries` - User query history

## Best Practices

1. **Batch Operations**
   - Use `upsertVectorsBatch()` for multiple vectors
   - Reduces API calls and improves performance

2. **Metadata**
   - Include userId, documentType, timestamp
   - Enables efficient filtering during queries

3. **Error Handling**
   - All services include retry logic
   - Check return values and handle errors

4. **Cost Optimization**
   - Embeddings are free (Gemini)
   - Pinecone has free tier limits
   - Monitor usage in dashboard

## Troubleshooting

### "PINECONE_API_KEY is required"
- Check .env file exists
- Verify API key is correct
- Ensure no extra spaces

### "Index not found"
- Run `node scripts/setupRAG.js init`
- Check Pinecone dashboard
- Verify index name matches config

### "Dimension mismatch"
- Ensure PINECONE_DIMENSION = 768
- Match embedding model dimension
- Recreate index if needed

### Connection timeout
- Check internet connection
- Verify Pinecone service status
- Check API key permissions

## Next Steps

After setup is complete:

1. ✅ Configuration verified
2. ✅ Index created
3. ✅ Tests passed
4. ⏳ Integrate with resume upload
5. ⏳ Add semantic search endpoints
6. ⏳ Build chat interface

## Support

- Pinecone Docs: https://docs.pinecone.io/
- Gemini Embeddings: https://ai.google.dev/tutorials/embeddings
- Issues: Check server logs for detailed errors
