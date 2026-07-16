# Semantic Search - Quick Start Guide

## Prerequisites

✅ Resume uploaded and parsed  
✅ Resume chunked  
✅ Embeddings generated (status: completed)  
✅ Vectors stored in Pinecone  

## Quick Test

### 1. Get a Resume ID

```bash
# List resumes with completed embeddings
node scripts/testEmbedding.js list
```

Look for resumes with status "completed". Copy the resume ID.

### 2. Test Basic Search

```bash
# Replace <resumeId> with your actual resume ID
node scripts/testSearch.js search <resumeId> "What is my Python experience?"
```

Example output:
```
════════════════════════════════════════════════════════
  SEARCH RESULTS
════════════════════════════════════════════════════════

Total Results: 3
Search Duration: 234ms

1. Section: SKILLS
   Score: 87.56%
   Chunk: 1/2
   Text: Proficient in Python, Django, Flask. Experience with 
   pandas, NumPy, scikit-learn for data analysis and machine 
   learning applications...

2. Section: EXPERIENCE
   Score: 82.34%
   Chunk: 2/5
   Text: Developed Python-based data pipeline processing 10M+ 
   records daily. Implemented REST APIs using FastAPI...

3. Section: PROJECTS
   Score: 78.91%
   Chunk: 1/3
   Text: Machine Learning Classification System - Built using 
   Python, TensorFlow, and Keras. Achieved 94% accuracy...
```

### 3. Try More Queries

```bash
# Work experience
node scripts/testSearch.js search <resumeId> "Tell me about my work history"

# Technical skills
node scripts/testSearch.js search <resumeId> "What technologies do I know?"

# Education
node scripts/testSearch.js search <resumeId> "What is my educational background?"

# Projects
node scripts/testSearch.js search <resumeId> "What projects have I worked on?"
```

### 4. Get Search Suggestions

```bash
node scripts/testSearch.js suggestions <resumeId>
```

This shows suggested queries for each section of your resume.

### 5. Run Demo Queries

```bash
node scripts/testSearch.js demo <resumeId>
```

Runs 5 different demo queries automatically.

---

## Using the API

### Setup

Make sure your server is running:

```bash
cd server
npm start
```

Server should be at: `http://localhost:5000`

### Get Authentication Token

First, login to get your JWT token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

Copy the `token` from the response.

### Test Search Endpoint

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "resumeId": "YOUR_RESUME_ID",
    "query": "What is my Python experience?",
    "topK": 5
  }'
```

### Expected Response

```json
{
  "success": true,
  "query": "What is my Python experience?",
  "resumeId": "65abc123...",
  "fileName": "john_doe_resume.pdf",
  "totalResults": 3,
  "results": [
    {
      "chunkId": "chunk_65abc_1",
      "score": 0.8756,
      "sectionName": "SKILLS",
      "text": "Proficient in Python, Django, Flask...",
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

---

## Common Use Cases

### Use Case 1: Interview Preparation

Search your resume to prepare for interview questions:

```bash
# What to say about experience
node scripts/testSearch.js search <id> "Describe my most impactful project"

# Technical depth
node scripts/testSearch.js search <id> "What are my strongest technical skills"

# Leadership
node scripts/testSearch.js search <id> "Tell me about my leadership experience"
```

### Use Case 2: Resume Optimization

Find gaps or areas to improve:

```bash
# Check cloud experience
node scripts/testSearch.js search <id> "Cloud computing AWS Azure GCP"

# Check soft skills
node scripts/testSearch.js search <id> "Communication teamwork collaboration"

# Check certifications
node scripts/testSearch.js search <id> "Certifications and training"
```

### Use Case 3: Job Application Matching

Search if you have relevant experience for a job:

```bash
# Job requires React
node scripts/testSearch.js search <id> "React JavaScript frontend development"

# Job requires data science
node scripts/testSearch.js search <id> "Machine learning data analysis"

# Job requires DevOps
node scripts/testSearch.js search <id> "Docker Kubernetes CI/CD"
```

---

## Integration Examples

### Frontend Integration (React)

```jsx
import { useState } from 'react';
import axios from 'axios';

function ResumeSearch({ resumeId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/search',
        { resumeId, query },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      alert(error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your resume..."
          className="search-input"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results && (
        <div className="search-results">
          <h3>{results.totalResults} Results</h3>
          
          {results.results.map((result, idx) => (
            <div key={idx} className="result-card">
              <div className="result-header">
                <span className="section-badge">{result.sectionName}</span>
                <span className="score-badge">
                  {(result.score * 100).toFixed(1)}% match
                </span>
              </div>
              <p className="result-text">{result.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Backend API Integration

```javascript
// In your Express controller
import { searchResume } from './services/searchService.js';

export const handleUserQuery = async (req, res) => {
  try {
    const { resumeId, query } = req.body;
    const userId = req.user._id.toString();

    const results = await searchResume({
      resumeId,
      query,
      userId,
      options: { topK: 5 }
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Troubleshooting

### Problem: "Resume embeddings are pending generation"

**Solution:**
```bash
# Check status
node scripts/testEmbedding.js stats

# Generate embeddings if needed
node scripts/testEmbedding.js resume <resumeId>
```

### Problem: "No results found"

**Possible causes:**
1. Query doesn't match resume content
2. Query too specific
3. Semantic mismatch

**Solutions:**
```bash
# Try suggestions
node scripts/testSearch.js suggestions <resumeId>

# Try broader query
# Instead of: "React 18 hooks custom hooks"
# Try: "React development experience"
```

### Problem: "Access denied"

**Solution:**
Make sure you're using the correct authentication token and searching your own resume.

### Problem: "Resume not found"

**Solution:**
```bash
# List available resumes
node scripts/testEmbedding.js list

# Use a valid resume ID from the list
```

---

## Query Tips

### ✅ Good Queries

- "What programming languages do I know?"
- "Describe my work experience"
- "What projects have I worked on?"
- "Tell me about my education"
- "What are my key achievements?"
- "Machine learning experience"
- "Leadership and management skills"

### ❌ Poor Queries

- "a" (too short)
- "tell" (too vague)
- Extremely long queries with full paragraphs
- Queries with special characters only

### 🎯 Query Strategies

1. **Natural Questions**: Ask like you would to a person
2. **Keywords**: Use relevant technical terms
3. **Specific Topics**: Focus on particular areas
4. **Broad Categories**: Start broad, then narrow down

---

## Performance Tips

1. **Start with topK=5**: Good balance of results and speed
2. **Use Section Filters**: Faster when you know the section
3. **Cache Common Queries**: Store results client-side
4. **Batch Searches**: For multiple queries, consider batching

---

## Next Steps

Once search is working:

1. ✅ **Test with CLI**: Verify search works
2. ✅ **Test with API**: Use curl or Postman
3. 🔄 **Integrate Frontend**: Add search UI
4. 🔄 **Add Search History**: Track user queries
5. 🔄 **Build RAG Chatbot**: Use search for context

---

## Quick Reference

```bash
# Test search
node scripts/testSearch.js search <resumeId> "query here"

# Multi-resume search
node scripts/testSearch.js multi "query here"

# Get suggestions
node scripts/testSearch.js suggestions <resumeId>

# Get stats
node scripts/testSearch.js stats <resumeId>

# Run demo
node scripts/testSearch.js demo <resumeId>
```

## API Endpoints

```
POST   /api/search                        # Search single resume
POST   /api/search/multiple               # Search multiple resumes
GET    /api/search/suggestions/:resumeId  # Get suggestions
GET    /api/search/stats/:resumeId        # Get statistics
```

---

**You're now ready to search your resumes semantically!** 🔍

For detailed documentation, see `SEMANTIC_SEARCH.md`
