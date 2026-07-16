# AI Resume Chat Workflow Diagram

## Complete Request-Response Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ POST /api/chat/:sessionId
                                   │ { "message": "What skills do I have?" }
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYER                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  authenticate middleware                                      │  │
│  │  - Verify JWT token                                          │  │
│  │  - Extract user ID                                           │  │
│  │  - Attach user to req.user                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ req.user = { _id: userId, ... }
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AI CHAT CONTROLLER                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  aiChatController.sendMessage()                              │  │
│  │  - Validate input (message not empty, < 10k chars)           │  │
│  │  - Extract sessionId from params                             │  │
│  │  - Call aiChatService.processChatMessage()                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ sessionId, userId, question
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RAG PIPELINE (aiChatService)                      │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 1: VALIDATE SESSION                                       │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ • Find ChatSession by ID                                       │ │
│  │ • Verify session.user === userId                               │ │
│  │ • Check session.status === 'active'                            │ │
│  │ • Populate resume                                              │ │
│  │ • Verify resume.embeddingStatus === 'completed'                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ ✅ Session Valid                      │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 2: CREATE USER MESSAGE                                    │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ ChatMessage.createUserMessage(sessionId, question)             │ │
│  │ • Saves to MongoDB                                             │ │
│  │ • Auto-updates session.lastMessageAt                           │ │
│  │ • Auto-increments session.messageCount                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ userMessage saved                     │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 3: GENERATE QUESTION EMBEDDING                            │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ embeddingService.generateQueryEmbedding(question)              │ │
│  │ • Model: text-embedding-004                                    │ │
│  │ • Task: RETRIEVAL_QUERY                                        │ │
│  │ • Returns: 768-dimensional vector                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ [0.123, 0.456, ..., 0.789] (768 dims) │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 4: RETRIEVE RELEVANT CHUNKS                               │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ retrievalService.getContextForChat()                           │ │
│  │ ├─ Search Pinecone with embedding                              │ │
│  │ ├─ Filter: resumeId, userId                                    │ │
│  │ ├─ Top K: 5                                                    │ │
│  │ ├─ Sort by similarity (descending)                             │ │
│  │ └─ Format with scores and sections                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ Top 5 chunks with scores              │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Retrieved Chunks:                                              │ │
│  │ 1. SKILLS (score: 0.92) - "Python, JavaScript, Java..."       │ │
│  │ 2. EXPERIENCE (score: 0.88) - "Senior Developer at..."        │ │
│  │ 3. PROJECTS (score: 0.85) - "Built ML pipeline using..."      │ │
│  │ 4. SUMMARY (score: 0.78) - "Software engineer with..."        │ │
│  │ 5. EDUCATION (score: 0.72) - "BS in Computer Science..."      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ If no chunks found → Skip to Step 9   │
│                               │ (Return "I don't have enough info")   │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 5: BUILD STRUCTURED PROMPT                                │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ buildChatPrompt(question, chunks, resumeFileName)              │ │
│  │                                                                 │ │
│  │ PROMPT STRUCTURE:                                              │ │
│  │ ┌────────────────────────────────────────────────────────────┐ │ │
│  │ │ You are an AI assistant...                                 │ │ │
│  │ │                                                            │ │ │
│  │ │ RESUME CONTEXT:                                            │ │ │
│  │ │ --- Chunk 1 [SKILLS] (92.0%) ---                           │ │ │
│  │ │ [chunk text]                                               │ │ │
│  │ │ --- Chunk 2 [EXPERIENCE] (88.0%) ---                       │ │ │
│  │ │ [chunk text]                                               │ │ │
│  │ │ ...                                                        │ │ │
│  │ │                                                            │ │ │
│  │ │ USER QUESTION:                                             │ │ │
│  │ │ What programming languages do I know?                      │ │ │
│  │ │                                                            │ │ │
│  │ │ INSTRUCTIONS:                                              │ │ │
│  │ │ 1. Answer ONLY from context                                │ │ │
│  │ │ 2. If not in context, say "I don't have enough info"       │ │ │
│  │ │ 3. Reference sections                                      │ │ │
│  │ │ 4. Be concise                                              │ │ │
│  │ │                                                            │ │ │
│  │ │ Response MUST be EXACT JSON:                               │ │ │
│  │ │ {                                                          │ │ │
│  │ │   "answer": "...",                                         │ │ │
│  │ │   "sources": [                                             │ │ │
│  │ │     {"section": "...", "similarity": 0.92}                 │ │ │
│  │ │   ]                                                        │ │ │
│  │ │ }                                                          │ │ │
│  │ └────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ Structured prompt (~3000 chars)       │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 6: GENERATE AI RESPONSE                                   │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ geminiService.generateContent(prompt, expectJSON=true)         │ │
│  │                                                                 │ │
│  │ Configuration:                                                 │ │
│  │ • Model: gemini-1.5-flash                                      │ │
│  │ • Temperature: 0.7                                             │ │
│  │ • Max Retries: 3                                               │ │
│  │ • Exponential backoff                                          │ │
│  │                                                                 │ │
│  │ Error Handling:                                                │ │
│  │ • API error → Retry up to 3 times                              │ │
│  │ • Invalid JSON → Retry with stricter instructions              │ │
│  │ • All retries fail → Return graceful error                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ Gemini responds (~3 seconds)          │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ AI Response (JSON):                                            │ │
│  │ {                                                              │ │
│  │   "answer": "Based on your resume, you have experience        │ │
│  │              with Python, JavaScript, Java, and SQL. Your      │ │
│  │              Python skills are highlighted in the Skills       │ │
│  │              section where you mention 5 years of experience.", │ │
│  │   "sources": [                                                 │ │
│  │     {"section": "SKILLS", "similarity": 0.92},                 │ │
│  │     {"section": "EXPERIENCE", "similarity": 0.88}              │ │
│  │   ]                                                            │ │
│  │ }                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ JSON parsed successfully              │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 7: VALIDATE RESPONSE                                      │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ validateAIResponse(response, chunks)                           │ │
│  │                                                                 │ │
│  │ Checks:                                                        │ │
│  │ ✅ Has "answer" field (string)                                 │ │
│  │ ✅ Has "sources" field (array)                                 │ │
│  │ ✅ Each source has "section" (string)                          │ │
│  │ ✅ Each source has "similarity" (0-1)                          │ │
│  │ ✅ Answer is grounded (not generic refusal with context)       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ ✅ Valid & Grounded                   │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 8: PREPARE SOURCES                                        │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ Match AI sources to retrieved chunks                           │ │
│  │                                                                 │ │
│  │ For each source in response.sources:                           │ │
│  │ • Find matching chunk by sectionName                           │ │
│  │ • Include chunkId from chunk                                   │ │
│  │ • Include text preview (200 chars)                             │ │
│  │ • Include original score                                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ Sources with full metadata            │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ sourcesUsed = [                                                │ │
│  │   {                                                            │ │
│  │     chunkId: "chunk_001",                                      │ │
│  │     sectionName: "SKILLS",                                     │ │
│  │     score: 0.92,                                               │ │
│  │     text: "Python (5 years), JavaScript (ES6+), React..."     │ │
│  │   },                                                           │ │
│  │   {                                                            │ │
│  │     chunkId: "chunk_003",                                      │ │
│  │     sectionName: "EXPERIENCE",                                 │ │
│  │     score: 0.88,                                               │ │
│  │     text: "Built data processing pipelines using Python..."   │ │
│  │   }                                                            │ │
│  │ ]                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ Sources ready                         │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STEP 9: SAVE AI MESSAGE                                        │ │
│  │ ─────────────────────────────────────────────────────────────  │ │
│  │ ChatMessage.createAIMessage(sessionId, answer, sources, meta)  │ │
│  │                                                                 │ │
│  │ Saves to MongoDB:                                              │ │
│  │ • session: sessionId                                           │ │
│  │ • sender: "ai"                                                 │ │
│  │ • message: response.answer                                     │ │
│  │ • sourcesUsed: prepared sources array                          │ │
│  │ • timestamp: now                                               │ │
│  │ • metadata: { model, tokensUsed, responseTime }                │ │
│  │ • status: "sent"                                               │ │
│  │                                                                 │ │
│  │ Auto-updates:                                                  │ │
│  │ • session.lastMessageAt = now                                  │ │
│  │ • session.messageCount += 1                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               │ ✅ AI message saved                   │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ RETURN RESULT                                                  │ │
│  │ {                                                              │ │
│  │   success: true,                                               │ │
│  │   userMessage: {...},                                          │ │
│  │   aiResponse: {...},                                           │ │
│  │   retrievalStats: {                                            │ │
│  │     chunksRetrieved: 5,                                        │ │
│  │     topScore: 0.92,                                            │ │
│  │     processingTime: 4523                                       │ │
│  │   }                                                            │ │
│  │ }                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTP 200 OK
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RESPONSE TO USER                             │
│  {                                                                   │
│    "success": true,                                                  │
│    "userMessage": {                                                  │
│      "id": "65xyz789abc123",                                         │
│      "sender": "user",                                               │
│      "message": "What programming languages do I know?",             │
│      "timestamp": "2026-07-16T10:30:00.000Z"                         │
│    },                                                                │
│    "aiResponse": {                                                   │
│      "id": "65xyz789abc456",                                         │
│      "sender": "ai",                                                 │
│      "message": "Based on your resume, you have experience with...", │
│      "timestamp": "2026-07-16T10:30:05.000Z",                        │
│      "sourcesUsed": [                                                │
│        {                                                             │
│          "chunkId": "chunk_001",                                     │
│          "sectionName": "SKILLS",                                    │
│          "score": 0.92,                                              │
│          "text": "Python (5 years), JavaScript..."                   │
│        },                                                            │
│        {                                                             │
│          "chunkId": "chunk_003",                                     │
│          "sectionName": "EXPERIENCE",                                │
│          "score": 0.88,                                              │
│          "text": "Built data pipelines..."                           │
│        }                                                             │
│      ],                                                              │
│      "status": "sent"                                                │
│    },                                                                │
│    "retrievalStats": {                                               │
│      "chunksRetrieved": 5,                                           │
│      "topScore": 0.92,                                               │
│      "processingTime": 4523                                          │
│    }                                                                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                              │
└─────────────────────────────────────────────────────────────────────┘

Scenario A: No Relevant Chunks Found
───────────────────────────────────────
STEP 4: Retrieved 0 chunks
         │
         └─→ Skip to STEP 9
             │
             └─→ Save AI message with:
                 • answer: "I don't have enough information..."
                 • sourcesUsed: []
                 • status: "sent"
         ▼
Response 200 OK (success: true)


Scenario B: Gemini API Error
─────────────────────────────
STEP 6: Gemini returns error
         │
         ├─→ Retry 1 (wait 1s)
         │   └─→ Still error
         ├─→ Retry 2 (wait 2s)
         │   └─→ Still error
         ├─→ Retry 3 (wait 3s)
         │   └─→ All retries exhausted
         │
         └─→ Save AI message with:
             • answer: "I'm sorry, I'm having trouble..."
             • sourcesUsed: []
             • status: "error"
             • error: { message: "...", timestamp: ... }
         ▼
Response 200 OK (success: false, error: "AI service unavailable")


Scenario C: Invalid JSON Response
──────────────────────────────────
STEP 6: Gemini returns malformed JSON
         │
         ├─→ JSON parse fails
         │
         ├─→ Retry with stricter prompt
         │   └─→ Parse succeeds
         │
         └─→ Continue to STEP 7
         ▼
Response 200 OK (success: true)


Scenario D: Session Not Found
──────────────────────────────
STEP 1: ChatSession.findById() returns null
         │
         └─→ throw Error("Chat session not found")
         ▼
Response 404 Not Found
{
  "success": false,
  "message": "Chat session not found"
}


Scenario E: Access Denied
──────────────────────────
STEP 1: session.user !== userId
         │
         └─→ throw Error("Access denied...")
         ▼
Response 403 Forbidden
{
  "success": false,
  "message": "You do not have permission to access this chat session"
}


Scenario F: Embeddings Not Ready
─────────────────────────────────
STEP 1: resume.embeddingStatus !== 'completed'
         │
         └─→ throw Error("Resume embeddings are not ready...")
         ▼
Response 400 Bad Request
{
  "success": false,
  "message": "Resume is still being processed. Please wait...",
  "hint": "The resume embeddings need to be generated before you can chat"
}
```

---

## Timing Diagram

```
Timeline (milliseconds):
─────────────────────────────────────────────────────────────────────

0ms     ┃ Request received
        ┃
50ms    ┃ ✅ Step 1: Session validated
        ┃
80ms    ┃ ✅ Step 2: User message saved
        ┃
580ms   ┃ ✅ Step 3: Embedding generated
        ┃     (500ms for Gemini API)
        ┃
1380ms  ┃ ✅ Step 4: Chunks retrieved
        ┃     (800ms for Pinecone query)
        ┃
1390ms  ┃ ✅ Step 5: Prompt built
        ┃     (10ms for string formatting)
        ┃
4390ms  ┃ ✅ Step 6: AI response generated
        ┃     (3000ms for Gemini generation) ← BOTTLENECK
        ┃
4400ms  ┃ ✅ Step 7: Response validated
        ┃     (10ms for validation checks)
        ┃
4420ms  ┃ ✅ Step 8: Sources prepared
        ┃     (20ms for chunk matching)
        ┃
4520ms  ┃ ✅ Step 9: AI message saved
        ┃     (100ms for MongoDB write)
        ┃
4523ms  ┃ Response sent
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: ~4.5 seconds

Breakdown:
• Validation & DB: 180ms (4%)
• Embedding: 500ms (11%)
• Retrieval: 800ms (18%)
• AI Generation: 3000ms (66%) ← Main bottleneck
• Processing: 43ms (1%)
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA TRANSFORMATIONS                         │
└─────────────────────────────────────────────────────────────────────┘

INPUT
─────
{
  "message": "What programming languages do I know?"
}
         │
         ▼
EMBEDDING
─────────
[0.123, 0.456, 0.789, ..., 0.321]  (768 dimensions)
         │
         ▼
PINECONE QUERY
──────────────
{
  vector: [0.123, 0.456, ...],
  filter: { resumeId: "...", userId: "..." },
  topK: 5
}
         │
         ▼
RETRIEVED CHUNKS
────────────────
[
  { chunkId: "chunk_001", sectionName: "SKILLS", score: 0.92, text: "..." },
  { chunkId: "chunk_003", sectionName: "EXPERIENCE", score: 0.88, text: "..." },
  { chunkId: "chunk_007", sectionName: "PROJECTS", score: 0.85, text: "..." },
  { chunkId: "chunk_002", sectionName: "SUMMARY", score: 0.78, text: "..." },
  { chunkId: "chunk_010", sectionName: "EDUCATION", score: 0.72, text: "..." }
]
         │
         ▼
STRUCTURED PROMPT
─────────────────
"You are an AI assistant...
RESUME CONTEXT:
--- Chunk 1 [SKILLS] (92.0%) ---
Python, JavaScript, Java...
--- Chunk 2 [EXPERIENCE] (88.0%) ---
Senior Developer at...
...
USER QUESTION:
What programming languages do I know?
..."
         │
         ▼
GEMINI AI
─────────
{
  "answer": "Based on your resume, you have experience with Python...",
  "sources": [
    {"section": "SKILLS", "similarity": 0.92},
    {"section": "EXPERIENCE", "similarity": 0.88}
  ]
}
         │
         ▼
ENRICHED SOURCES
────────────────
[
  {
    chunkId: "chunk_001",
    sectionName: "SKILLS",
    score: 0.92,
    text: "Python (5 years), JavaScript (ES6+), React, Node.js..."
  },
  {
    chunkId: "chunk_003",
    sectionName: "EXPERIENCE",
    score: 0.88,
    text: "Built automated data processing pipelines using Python..."
  }
]
         │
         ▼
FINAL RESPONSE
──────────────
{
  "success": true,
  "userMessage": {...},
  "aiResponse": {
    "message": "Based on your resume, you have experience with Python...",
    "sourcesUsed": [...],
    "status": "sent"
  },
  "retrievalStats": {...}
}
```

---

**Workflow Diagram v1.0 - July 16, 2026**
