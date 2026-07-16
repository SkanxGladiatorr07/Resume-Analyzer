# Semantic Search Documentation

## Overview

The Semantic Search feature enables natural language queries against resume content using vector embeddings and similarity search. Users can search their resumes using conversational questions and get the most relevant content sections.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMANTIC SEARCH FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. USER QUERY
   ├─ POST /api/search
   ├─ { resumeId, query }
   └─ Authenticated request

2. VALIDATE ACCESS
   ├─ Check resume exists
   ├─ Verify user ownership
   └─ Ensure embeddings are ready

3. GENERATE QUERY EMBEDDING
   ├─ Use Gemini text-embedding-004
   ├─ Convert query to 768-dim vector
   └─ Same model as document embeddings

4. SEARCH PINECONE
   ├─ Query vector database
   ├─ Filter by resumeId + userId
   ├─ Return top K similar chunks
   └─ Include similarity scores

5. FORMAT RESULTS
   ├─ Sort by similarity score
   ├─ Extract metadata
   ├─ Format for display
   └─ Return to user

```

## API Endpoints

### 1. Search Resume

Search a specific resume by semantic similarity.

**Endpoint:** `POST /api/search`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "resumeId": "65abc123def456",
  "query": "What programming languages and frameworks?",
  "topK": 5,
  "sections": ["SKILLS", "EXPERIENCE"]
}
```

**Parameters:**
- `resumeId` (required): Resume identifier
- `query` (required): Search query (2-1000 characters)
- `topK` (optional): Number of results (default: 5, max: 20)
- `sections` (optional): Filter by specific sections

**Response:**
```json
{
  "success": true,
  "query": "What programming languages and frameworks?",
  "resumeId": "65abc123def456",
  "fileName": "john_doe_resume.pdf",
  "totalResults": 5,
  "results": [
    {
      "chunkId": "chunk_65abc_1",
      "score": 0.8756,
      "sectionName": "SKILLS",
      "text": "Proficient in Python, JavaScript, React, Node.js...",
      "chunkIndex": 0,
      "subsection": null,
      "metadata": {
        "fileName": "john_doe_resume.pdf",
        "totalChunks": 12,
        "documentType": "resume_chunk"
      }
    }
  ],
  "metadata": {
    "topK": 5,
    "searchDuration": 245,
    "embeddingStatus": "completed",
    "sections": "all"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid query or embeddings not ready
- `403`: Access denied (not user's resume)
- `404`: Resume not found
- `500`: Server error

---

### 2. Search Multiple Resumes

Search across all user's resumes.

**Endpoint:** `POST /api/search/multiple`

**Authentication:** Required

**Request Body:**
```json
{
  "query": "software engineering experience",
  "topK": 3,
  "resumeIds": ["65abc...", "65def..."]
}
```

**Parameters:**
- `query` (required): Search query
- `topK` (optional): Results per resume (default: 5)
- `resumeIds` (optional): Specific resumes to search (defaults to all user resumes)

**Response:**
```json
{
  "success": true,
  "query": "software engineering experience",
  "totalResumes": 2,
  "results": [
    {
      "resumeId": "65abc...",
      "fileName": "resume_v1.pdf",
      "totalResults": 3,
      "results": [...]
    },
    {
      "resumeId": "65def...",
      "fileName": "resume_v2.pdf",
      "totalResults": 2,
      "results": [...]
    }
  ],
  "metadata": {
    "topK": 3,
    "searchDuration": 456,
    "resumesSearched": 3
  }
}
```

---

### 3. Get Search Suggestions

Get suggested queries based on resume content.

**Endpoint:** `GET /api/search/suggestions/:resumeId`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "resumeId": "65abc...",
  "sections": [
    {
      "section": "EXPERIENCE",
      "chunkCount": 5,
      "suggestedQueries": [
        "What work experience do I have?",
        "What companies have I worked for?",
        "What are my job responsibilities?"
      ]
    },
    {
      "section": "SKILLS",
      "chunkCount": 2,
      "suggestedQueries": [
        "What technical skills do I have?",
        "What programming languages do I know?"
      ]
    }
  ],
  "totalSections": 6
}
```

---

### 4. Get Search Statistics

Get searchability statistics for a resume.

**Endpoint:** `GET /api/search/stats/:resumeId`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "stats": {
    "resumeId": "65abc...",
    "fileName": "john_doe_resume.pdf",
    "embeddingStatus": "completed",
    "totalChunks": 12,
    "sections": {
      "EXPERIENCE": {
        "count": 5,
        "totalSize": 4230
      },
      "SKILLS": {
        "count": 2,
        "totalSize": 850
      }
    },
    "searchable": true
  }
}
```

---

## Usage Examples

### Example 1: Basic Search

```javascript
// Using fetch API
const response = await fetch('http://localhost:5000/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    resumeId: '65abc123def456',
    query: 'What is my Python experience?'
  })
});

const data = await response.json();
console.log(`Found ${data.totalResults} results`);
data.results.forEach(result => {
  console.log(`${result.sectionName}: ${result.text}`);
});
```

### Example 2: Search with Filters

```javascript
const response = await fetch('http://localhost:5000/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    resumeId: '65abc123def456',
    query: 'machine learning projects',
    topK: 10,
    sections: ['PROJECTS', 'EXPERIENCE']
  })
});
```

### Example 3: Multi-Resume Search

```javascript
const response = await fetch('http://localhost:5000/api/search/multiple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'cloud computing AWS',
    topK: 3
  })
});

const data = await response.json();
data.results.forEach(resume => {
  console.log(`\n${resume.fileName}:`);
  resume.results.forEach(match => {
    console.log(`  - ${match.sectionName}: ${match.score}`);
  });
});
```

### Example 4: Get Suggestions

```javascript
const response = await fetch(
  `http://localhost:5000/api/search/suggestions/${resumeId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
data.sections.forEach(section => {
  console.log(`\n${section.section}:`);
  section.suggestedQueries.forEach(query => {
    console.log(`  - "${query}"`);
  });
});
```

---

## Security

### Access Control

1. **Authentication Required**: All endpoints require valid JWT token
2. **User Ownership**: Users can only search their own resumes
3. **Vector Filtering**: Pinecone queries filter by `userId` and `resumeId`
4. **No Cross-User Access**: Impossible to access other users' data

### Implementation

```javascript
// Service layer validates access
const validateResumeAccess = async (resumeId, userId) => {
  const resume = await Resume.findById(resumeId);
  
  // Check ownership
  if (resume.user.toString() !== userId.toString()) {
    throw new Error('Access denied');
  }
  
  return resume;
};

// Pinecone filter ensures data isolation
const filter = {
  resumeId: resumeId,
  userId: userId  // User can only see their own vectors
};
```

---

## Query Processing

### Query Validation

Queries must meet these criteria:
- Minimum 2 characters
- Maximum 1000 characters
- Non-empty after trimming
- String type

### Query Embedding

1. Query is converted to embedding using same model as documents
2. Uses `RETRIEVAL_QUERY` task type for optimal search results
3. Returns 768-dimensional vector

### Similarity Scoring

- **Score Range**: 0.0 to 1.0
- **1.0**: Identical match
- **0.8-0.9**: Very similar
- **0.6-0.8**: Similar
- **0.4-0.6**: Somewhat related
- **< 0.4**: Less relevant

---

## Empty Results Handling

The system gracefully handles cases with no results:

```json
{
  "success": true,
  "query": "blockchain development",
  "resumeId": "65abc...",
  "fileName": "resume.pdf",
  "totalResults": 0,
  "results": [],
  "metadata": {
    "topK": 5,
    "searchDuration": 123,
    "embeddingStatus": "completed"
  }
}
```

**Common Reasons for Empty Results:**
1. Query terms not present in resume
2. Semantic mismatch
3. Resume has limited content
4. Query too specific

**Solutions:**
- Try broader queries
- Check resume content
- Use suggested queries
- Verify embedding status

---

## Performance

### Benchmarks

- **Query embedding generation**: ~150-300ms
- **Pinecone search**: ~50-150ms
- **Result formatting**: ~10-20ms
- **Total search time**: ~200-500ms

### Optimization Tips

1. **Batch Queries**: For multiple searches, reuse query embedding
2. **Limit TopK**: Start with topK=5, increase only if needed
3. **Section Filters**: Filter by sections to reduce search space
4. **Cache Results**: Cache common queries client-side

---

## Error Handling

### Common Errors

#### 1. Resume Not Found
```json
{
  "success": false,
  "message": "Resume not found"
}
```

#### 2. Access Denied
```json
{
  "success": false,
  "message": "Access denied. This resume does not belong to you."
}
```

#### 3. Embeddings Not Ready
```json
{
  "success": false,
  "message": "Resume embeddings are currently being generated",
  "hint": "Wait for embedding generation to complete before searching"
}
```

#### 4. Invalid Query
```json
{
  "success": false,
  "message": "Query must be at least 2 characters long"
}
```

---

## Testing

### CLI Test Tool

```bash
# Search specific resume
node scripts/testSearch.js search <resumeId> "Python experience"

# Search multiple resumes
node scripts/testSearch.js multi "software engineering"

# Get suggestions
node scripts/testSearch.js suggestions <resumeId>

# Get statistics
node scripts/testSearch.js stats <resumeId>

# Run demo queries
node scripts/testSearch.js demo <resumeId>
```

### Programmatic Testing

```javascript
import { searchResume } from './services/searchService.js';

const result = await searchResume({
  resumeId: '65abc123',
  query: 'machine learning',
  userId: 'user123',
  options: { topK: 5 }
});

console.log(`Found ${result.totalResults} results`);
```

---

## Best Practices

### Query Construction

✅ **Good Queries:**
- "What is my Python experience?"
- "Tell me about machine learning projects"
- "What cloud technologies do I know?"
- "Describe my leadership experience"

❌ **Poor Queries:**
- "a" (too short)
- "python" (too generic, better: "Python programming experience")
- Super long queries with 500+ words

### Result Interpretation

- **Score > 0.8**: Highly relevant, likely contains exact match
- **Score 0.6-0.8**: Relevant, contains related information
- **Score < 0.6**: Somewhat related, may not be what you're looking for

### Integration Patterns

```javascript
// Pattern 1: Search then display
const searchResults = await searchResume({...});
displayResults(searchResults.results);

// Pattern 2: Paginated search
const page1 = await searchResume({ topK: 5 });
const page2 = await searchResume({ topK: 5, offset: 5 });

// Pattern 3: Filtered search
const techSkills = await searchResume({
  query: 'technical skills',
  sections: ['SKILLS', 'EXPERIENCE']
});
```

---

## Troubleshooting

### Issue: "Embeddings not ready"
**Solution**: Wait for embedding generation to complete
```bash
node scripts/testEmbedding.js stats
# Check if resume status is 'completed'
```

### Issue: "No results found"
**Solutions**:
1. Try broader queries
2. Check search suggestions
3. Verify resume has content in relevant sections

### Issue: "Search takes too long"
**Solutions**:
1. Reduce topK parameter
2. Use section filters
3. Check Pinecone connection

### Issue: "Access denied"
**Solution**: Ensure you're using correct user authentication token

---

## Integration with Frontend

### React Example

```jsx
import { useState } from 'react';

const ResumeSearch = ({ resumeId, token }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeId, query })
      });
      
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your resume..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      <div>
        {results.map((result, idx) => (
          <div key={idx}>
            <h4>{result.sectionName}</h4>
            <p>Score: {(result.score * 100).toFixed(1)}%</p>
            <p>{result.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Next Steps

After implementing semantic search:

1. ✅ **Search Implemented** - Users can search resumes
2. 🔄 **RAG Chatbot** - Use search results as context for AI chat
3. 🔄 **Enhanced Job Matching** - Use vector similarity for better matches
4. 🔄 **Resume Recommendations** - Suggest improvements based on searches
5. 🔄 **Analytics** - Track popular queries and search patterns

---

## API Reference

Complete API documentation: See inline JSDoc in:
- `services/searchService.js`
- `controllers/searchController.js`
- `routes/searchRoutes.js`

---

## Support

For issues or questions:
1. Check error messages and status codes
2. Run test script: `node scripts/testSearch.js`
3. Verify embeddings: `node scripts/testEmbedding.js stats`
4. Review this documentation
