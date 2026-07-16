# AI Resume Chat API Documentation

## Overview

The AI Resume Chat backend provides a complete system for managing chat sessions and messages. Users can have conversations with an AI assistant about their resumes, with full session management and message tracking.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT SYSTEM ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

User Request
    ↓
Authentication Middleware
    ↓
Chat Controller
    ↓
Chat Service
    ├─ Session Management
    ├─ Message Storage
    ├─ Access Control
    └─ Validation
    ↓
MongoDB (ChatSession & ChatMessage)
```

---

## Models

### ChatSession Model

Represents a conversation between a user and AI about their resume.

```javascript
{
  user: ObjectId,              // User who owns this session
  resume: ObjectId,            // Resume being discussed
  title: String,               // Session title
  status: String,              // active | archived | deleted
  messageCount: Number,        // Total messages in session
  lastMessageAt: Date,         // Last message timestamp
  metadata: {
    resumeFileName: String,
    totalTokensUsed: Number,
    averageResponseTime: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Instance Methods:**
- `isActive()` - Check if session is active
- `updateLastMessage()` - Update last message timestamp
- `incrementMessageCount()` - Increment message count
- `archive()` - Archive session
- `softDelete()` - Soft delete session
- `updateTitle(newTitle)` - Update session title
- `getSummary()` - Get session summary

**Static Methods:**
- `findByUser(userId, options)` - Find user's sessions
- `findByResume(resumeId, userId)` - Find sessions by resume
- `getUserStats(userId)` - Get user statistics
- `createSession(userId, resumeId, info)` - Create new session

### ChatMessage Model

Represents individual messages in a chat session.

```javascript
{
  session: ObjectId,           // Session this message belongs to
  sender: String,              // user | ai
  message: String,             // Message content (max 10000 chars)
  sourcesUsed: [{              // Sources for AI responses
    chunkId: String,
    sectionName: String,
    score: Number,
    text: String
  }],
  timestamp: Date,             // Message timestamp
  metadata: {
    model: String,             // AI model used
    tokensUsed: Number,        // Tokens consumed
    responseTime: Number,      // Response time in ms
    messageLength: Number,     // Message length
    edited: Boolean,
    editedAt: Date
  },
  status: String,              // sent | delivered | error
  error: {
    message: String,
    timestamp: Date
  }
}
```

**Instance Methods:**
- `isUserMessage()` - Check if from user
- `isAIMessage()` - Check if from AI
- `hasSources()` - Check if has sources
- `getSummary()` - Get message summary
- `markAsError(message)` - Mark as error
- `getFormattedSources()` - Get formatted sources

**Static Methods:**
- `findBySession(sessionId, options)` - Get session messages
- `countBySession(sessionId)` - Count messages
- `getLatestBySession(sessionId)` - Get latest message
- `createUserMessage(sessionId, message)` - Create user message
- `createAIMessage(sessionId, message, sources, metadata)` - Create AI message
- `deleteBySession(sessionId)` - Delete all messages
- `getSessionStats(sessionId)` - Get statistics
- `searchInSession(sessionId, text)` - Search messages

---

## API Endpoints

### 1. Create Chat Session

**Endpoint:** `POST /api/chat/session`

**Authentication:** Required

**Request Body:**
```json
{
  "resumeId": "65abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "65xyz789abc123",
    "title": "Chat about john_doe_resume.pdf",
    "status": "active",
    "messageCount": 0,
    "lastMessageAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "resumeId": "65abc123def456",
    "resumeFileName": "john_doe_resume.pdf"
  }
}
```

**Error Responses:**
- `400` - Resume ID missing
- `403` - Access denied
- `404` - Resume not found
- `500` - Server error

---

### 2. Get All Sessions

**Endpoint:** `GET /api/chat/sessions`

**Authentication:** Required

**Query Parameters:**
- `status` (optional) - Filter by status: active, archived, deleted
- `limit` (optional) - Max results (default: 50)

**Example:** `GET /api/chat/sessions?status=active&limit=20`

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "65xyz789abc123",
      "title": "Chat about resume",
      "status": "active",
      "messageCount": 15,
      "lastMessageAt": "2024-01-15T10:45:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:45:00.000Z",
      "resume": {
        "id": "65abc123def456",
        "fileName": "john_doe_resume.pdf"
      }
    }
  ],
  "stats": {
    "total": 10,
    "active": 8,
    "archived": 2,
    "totalMessages": 150
  },
  "total": 8
}
```

---

### 3. Get Specific Session

**Endpoint:** `GET /api/chat/session/:id`

**Authentication:** Required

**Query Parameters:**
- `messageLimit` (optional) - Max messages (default: 100)

**Example:** `GET /api/chat/session/65xyz789abc123?messageLimit=50`

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "65xyz789abc123",
    "title": "Chat about resume",
    "status": "active",
    "messageCount": 15,
    "lastMessageAt": "2024-01-15T10:45:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:45:00.000Z",
    "resume": {
      "id": "65abc123def456",
      "fileName": "john_doe_resume.pdf",
      "embeddingStatus": "completed"
    }
  },
  "messages": [
    {
      "id": "65msg1",
      "sender": "user",
      "message": "What is my Python experience?",
      "timestamp": "2024-01-15T10:35:00.000Z",
      "sourcesUsed": [],
      "status": "sent"
    },
    {
      "id": "65msg2",
      "sender": "ai",
      "message": "Based on your resume, you have 5 years of Python experience...",
      "timestamp": "2024-01-15T10:35:05.000Z",
      "sourcesUsed": [
        {
          "chunkId": "chunk_1",
          "sectionName": "EXPERIENCE",
          "score": 0.89,
          "text": "Senior Python Developer..."
        }
      ],
      "status": "sent"
    }
  ],
  "stats": {
    "total": 15,
    "userMessages": 8,
    "aiMessages": 7,
    "avgUserMessageLength": 45,
    "avgAIMessageLength": 250
  }
}
```

**Error Responses:**
- `403` - Access denied
- `404` - Session not found
- `500` - Server error

---

### 4. Delete Session

**Endpoint:** `DELETE /api/chat/session/:id`

**Authentication:** Required

**Query Parameters:**
- `hard` (optional) - Permanently delete (default: false)

**Examples:**
- Soft delete: `DELETE /api/chat/session/65xyz789abc123`
- Hard delete: `DELETE /api/chat/session/65xyz789abc123?hard=true`

**Response:**
```json
{
  "success": true,
  "message": "Chat session deleted",
  "deleted": true
}
```

**Error Responses:**
- `403` - Access denied
- `404` - Session not found
- `500` - Server error

---

### 5. Update Session Title

**Endpoint:** `PATCH /api/chat/session/:id/title`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Discussion about Python skills"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "65xyz789abc123",
    "title": "Discussion about Python skills",
    "status": "active",
    ...
  }
}
```

---

### 6. Archive Session

**Endpoint:** `PATCH /api/chat/session/:id/archive`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "65xyz789abc123",
    "status": "archived",
    ...
  }
}
```

---

### 7. Add Message

**Endpoint:** `POST /api/chat/session/:id/message`

**Authentication:** Required

**Request Body:**
```json
{
  "message": "What is my Python experience?"
}
```

**Response:**
```json
{
  "success": true,
  "userMessage": {
    "id": "65msg123",
    "sender": "user",
    "message": "What is my Python experience?",
    "timestamp": "2024-01-15T10:35:00.000Z"
  },
  "aiResponse": null
}
```

**Note:** AI response generation will be implemented in the next phase.

---

### 8. Search Messages

**Endpoint:** `GET /api/chat/session/:id/search`

**Authentication:** Required

**Query Parameters:**
- `q` (required) - Search query

**Example:** `GET /api/chat/session/65xyz789abc123/search?q=Python`

**Response:**
```json
{
  "success": true,
  "query": "Python",
  "results": [
    {
      "id": "65msg1",
      "sender": "user",
      "message": "What is my Python experience?",
      "timestamp": "2024-01-15T10:35:00.000Z",
      "sourcesCount": 0,
      "status": "sent"
    }
  ],
  "total": 3
}
```

---

## Access Control

### Security Features

1. **Authentication Required** - All endpoints require valid JWT token
2. **User Ownership** - Users can only access their own sessions
3. **Resume Validation** - Validates resume belongs to user
4. **Session Validation** - Validates session belongs to user
5. **Embedding Check** - Ensures resume embeddings are ready

### Access Checks

```javascript
// Resume ownership
if (resume.user.toString() !== userId.toString()) {
  throw new Error('Access denied');
}

// Session ownership
if (session.user.toString() !== userId.toString()) {
  throw new Error('Access denied');
}

// Embedding readiness
if (resume.embeddingStatus !== 'completed') {
  throw new Error('Resume embeddings not ready');
}
```

---

## Usage Examples

### Create and Use Session

```javascript
// 1. Create session
const createResponse = await fetch('/api/chat/session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ resumeId: '65abc123' })
});

const { session } = await createResponse.json();

// 2. Add message
const messageResponse = await fetch(`/api/chat/session/${session.id}/message`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: 'What is my experience?' })
});

// 3. Get messages
const sessionResponse = await fetch(`/api/chat/session/${session.id}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { messages } = await sessionResponse.json();
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common Errors

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Resume ID required | Missing resume ID |
| 400 | Embeddings not ready | Resume not processed |
| 400 | Message required | Empty message |
| 403 | Access denied | Not user's resource |
| 404 | Not found | Resource doesn't exist |
| 500 | Server error | Internal error |

---

## Best Practices

### Session Management

1. **Create Once** - Create session per resume/topic
2. **Reuse Sessions** - Continue existing sessions
3. **Archive Old** - Archive completed conversations
4. **Delete Carefully** - Use soft delete by default

### Message Handling

1. **Validate Input** - Check message length and content
2. **Track Sources** - Store AI source references
3. **Handle Errors** - Mark failed messages
4. **Search History** - Enable message search

### Performance

1. **Limit Messages** - Use messageLimit parameter
2. **Pagination** - Implement client-side pagination
3. **Index Queries** - Database indexes optimize queries
4. **Cache Sessions** - Cache active sessions client-side

---

## Database Indexes

### ChatSession Indexes

```javascript
{ user: 1, createdAt: -1 }
{ user: 1, resume: 1 }
{ user: 1, status: 1, lastMessageAt: -1 }
```

### ChatMessage Indexes

```javascript
{ session: 1, timestamp: 1 }
{ session: 1, sender: 1 }
```

---

## Next Steps

### Phase 2: AI Integration (Not Yet Implemented)

1. **AI Response Generation**
   - Integrate with Gemini API
   - Use RAG for context
   - Generate responses

2. **Context Management**
   - Retrieve relevant chunks
   - Format for AI prompt
   - Track sources

3. **Response Features**
   - Source attribution
   - Follow-up questions
   - Conversation context

---

## Summary

✅ **Implemented:**
- ChatSession and ChatMessage models
- Complete CRUD operations
- Session management
- Message storage
- Access control
- Search functionality
- API documentation

🔄 **Ready for:**
- AI response generation
- RAG integration
- Context retrieval
- Source attribution

**The chat backend is complete and ready for AI integration!** 🚀
