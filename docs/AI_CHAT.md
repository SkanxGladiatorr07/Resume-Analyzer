# AI Resume Chat - Sequence Diagrams

## Complete Chat Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Auth
    participant ChatController
    participant RAGService
    participant ChromaDB
    participant LLM
    participant MongoDB

    User->>Frontend: Navigate to Resume Chat
    Frontend->>API: GET /api/resumes/:id
    API->>Auth: Verify JWT Token
    Auth-->>API: User Authenticated
    API->>MongoDB: Fetch Resume + ParsedData
    MongoDB-->>API: Resume Data
    API-->>Frontend: Resume Details
    Frontend-->>User: Display Chat Interface

    User->>Frontend: Type Question
    Frontend->>API: POST /api/chat/message
    Note over Frontend,API: {resumeId, message, sessionId?}
    
    API->>Auth: Verify JWT Token
    Auth-->>API: User Authenticated
    
    API->>ChatController: Process Message
    
    alt New Session
        ChatController->>MongoDB: Create ChatSession
        MongoDB-->>ChatController: Session ID
    else Existing Session
        ChatController->>MongoDB: Update lastActivity
    end
    
    ChatController->>MongoDB: Save User Message
    
    ChatController->>RAGService: Retrieve Context
    RAGService->>RAGService: Generate Query Embedding
    RAGService->>ChromaDB: Semantic Search
    Note over RAGService,ChromaDB: Top 5 relevant chunks<br/>filtered by resumeId
    ChromaDB-->>RAGService: Relevant Chunks
    RAGService-->>ChatController: Context String
    
    ChatController->>ChatController: Build Prompt
    Note over ChatController: System Prompt +<br/>Context +<br/>User Message
    
    ChatController->>LLM: Generate Response
    Note over LLM: Google Gemini 1.5 Pro
    LLM-->>ChatController: AI Response
    
    ChatController->>MongoDB: Save Assistant Message
    ChatController->>MongoDB: Increment messageCount
    
    ChatController-->>API: Response Data
    API-->>Frontend: JSON Response
    Frontend-->>User: Display AI Answer

    alt Error Occurred
        LLM-->>ChatController: API Error
        ChatController-->>API: Error Response
        API-->>Frontend: Error Message
        Frontend-->>User: Show Error
    end
```

## Session Management

```mermaid
stateDiagram-v2
    [*] --> NoSession: User Opens Chat
    
    NoSession --> CreatingSession: Send First Message
    CreatingSession --> ActiveSession: Session Created
    
    ActiveSession --> ActiveSession: Exchange Messages
    ActiveSession --> IdleSession: 30 min inactivity
    
    IdleSession --> ActiveSession: New Message
    IdleSession --> EndedSession: User Closes Chat
    
    ActiveSession --> EndedSession: User Ends Session
    EndedSession --> [*]
    
    note right of ActiveSession
        - Messages stored in DB
        - Context maintained
        - lastActivity updated
    end note
    
    note right of IdleSession
        - Session persisted
        - Can resume anytime
        - Context preserved
    end note
```

## Message Processing Pipeline

```mermaid
flowchart TD
    Start([Incoming Message])
    
    Start --> Validate[Validate Input<br/>- Non-empty message<br/>- Valid resumeId<br/>- Valid sessionId]
    
    Validate -->|Invalid| Error400[Return 400<br/>Bad Request]
    
    Validate -->|Valid| CheckSession{Session<br/>Exists?}
    
    CheckSession -->|No| CreateSession[Create New Session<br/>Generate sessionId]
    CheckSession -->|Yes| UpdateSession[Update Session<br/>lastActivity]
    
    CreateSession --> SaveUserMsg[Save User Message<br/>to MongoDB]
    UpdateSession --> SaveUserMsg
    
    SaveUserMsg --> CheckType{Message<br/>Type?}
    
    CheckType -->|General Question| RAGFlow[RAG Pipeline]
    CheckType -->|Specific Info| DirectQuery[Direct DB Query]
    CheckType -->|Modification Request| StructuredEdit[Structured Edit]
    
    RAGFlow --> EmbedQuery[Generate Query<br/>Embedding]
    EmbedQuery --> VectorSearch[Semantic Search<br/>in ChromaDB]
    VectorSearch --> RankResults[Rank & Filter<br/>Top 5 Chunks]
    RankResults --> BuildContext[Build Context<br/>String]
    
    DirectQuery --> FetchData[Fetch from<br/>ParsedData]
    FetchData --> BuildContext
    
    StructuredEdit --> ValidateEdit[Validate Edit<br/>Request]
    ValidateEdit --> BuildContext
    
    BuildContext --> BuildPrompt[Build Full Prompt<br/>System + Context + Query]
    BuildPrompt --> CallLLM[Call Google Gemini<br/>API]
    
    CallLLM -->|Error| LLMError[Handle LLM Error<br/>Return Graceful Message]
    
    CallLLM -->|Success| ParseResponse[Parse LLM<br/>Response]
    ParseResponse --> SaveAIMsg[Save Assistant Message<br/>to MongoDB]
    
    SaveAIMsg --> IncrementCount[Increment Message<br/>Count]
    IncrementCount --> LogAnalytics[Log Analytics<br/>Event]
    
    LogAnalytics --> Success[Return 200<br/>AI Response]
    
    Error400 --> End([End])
    LLMError --> ErrorResponse[Return 500<br/>Service Error]
    ErrorResponse --> End
    Success --> End

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style Error400 fill:#ffcdd2
    style LLMError fill:#ffcdd2
    style ErrorResponse fill:#ffcdd2
```

## Context Building Strategy

```mermaid
graph TB
    subgraph "Context Sources"
        Resume[Resume Metadata<br/>filename, uploadedAt]
        Parsed[ParsedData<br/>Structured Information]
        History[Chat History<br/>Last 5 messages]
        Retrieved[RAG Retrieved<br/>Relevant Chunks]
    end
    
    subgraph "Context Assembly"
        Prioritize[Prioritize Information<br/>1. Direct Answer<br/>2. Related Context<br/>3. Background Info]
        
        Truncate[Truncate if Needed<br/>Max 4000 tokens]
        
        Format[Format Context<br/>Structured Sections]
    end
    
    subgraph "Prompt Components"
        System[System Instructions<br/>Role & Guidelines]
        Context[Assembled Context]
        Query[User Question]
        
        Final[Final Prompt<br/>Token Budget Check]
    end

    Resume --> Prioritize
    Parsed --> Prioritize
    History --> Prioritize
    Retrieved --> Prioritize
    
    Prioritize --> Truncate
    Truncate --> Format
    
    Format --> Context
    System --> Final
    Context --> Final
    Query --> Final

    style Final fill:#c8e6c9
```

## Conversation Flow Types

### 1. Information Retrieval

```mermaid
sequenceDiagram
    participant User
    participant Chat
    participant RAG
    participant LLM

    User->>Chat: "What are my key skills?"
    Chat->>RAG: Retrieve skills section
    RAG-->>Chat: Skills context
    Chat->>LLM: Generate formatted response
    LLM-->>Chat: "Your key skills include..."
    Chat-->>User: Display skills list
```

### 2. Analysis & Advice

```mermaid
sequenceDiagram
    participant User
    participant Chat
    participant RAG
    participant LLM

    User->>Chat: "How can I improve my resume?"
    Chat->>RAG: Retrieve full resume
    RAG-->>Chat: Complete context
    Chat->>LLM: Analyze + suggest improvements
    LLM-->>Chat: Detailed recommendations
    Chat-->>User: Display advice
```

### 3. Comparison & Matching

```mermaid
sequenceDiagram
    participant User
    participant Chat
    participant RAG
    participant LLM

    User->>Chat: "Do I qualify for Senior Dev role?"
    Chat->>RAG: Retrieve experience + skills
    RAG-->>Chat: Relevant context
    Chat->>LLM: Compare with role requirements
    LLM-->>Chat: Match analysis
    Chat-->>User: Display qualification assessment
```

### 4. Multi-Turn Conversation

```mermaid
sequenceDiagram
    participant User
    participant Chat
    participant RAG
    participant LLM

    User->>Chat: "Tell me about my experience"
    Chat->>RAG: Retrieve experience section
    RAG-->>Chat: Experience context
    Chat->>LLM: Generate summary
    LLM-->>Chat: Experience overview
    Chat-->>User: Display summary
    
    Note over User,Chat: Follow-up question
    
    User->>Chat: "Which company was the longest?"
    Chat->>Chat: Load previous context
    Chat->>RAG: Retrieve detailed experience
    RAG-->>Chat: All companies with dates
    Chat->>LLM: Calculate & compare durations
    LLM-->>Chat: "Company X - 3 years"
    Chat-->>User: Display answer
```

## Real-time Streaming Response

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant LLM

    User->>Frontend: Send Message
    Frontend->>API: POST /api/chat/stream
    
    API->>API: Process & Build Prompt
    API->>LLM: Start Streaming Request
    
    loop Stream Chunks
        LLM-->>API: Response Chunk
        API-->>Frontend: SSE: data chunk
        Frontend-->>User: Update UI (typing effect)
    end
    
    LLM-->>API: Stream Complete
    API->>API: Save Complete Message
    API-->>Frontend: SSE: done
    Frontend-->>User: Final Response Displayed
```

## Error Handling in Chat

```mermaid
flowchart TD
    Start([Chat Request])
    
    Start --> TryAuth[Try: Authenticate]
    TryAuth -->|Fail| AuthError[401: Unauthorized]
    
    TryAuth -->|Success| TryValidate[Try: Validate Input]
    TryValidate -->|Fail| ValidationError[400: Invalid Input]
    
    TryValidate -->|Success| TryResume[Try: Fetch Resume]
    TryResume -->|Not Found| NotFoundError[404: Resume Not Found]
    
    TryResume -->|Success| TryRAG[Try: RAG Retrieval]
    TryRAG -->|Fail| RAGError[ChromaDB Error]
    
    RAGError --> Fallback1[Fallback: Use ParsedData]
    Fallback1 --> TryLLM
    
    TryRAG -->|Success| TryLLM[Try: LLM Generation]
    TryLLM -->|Fail| LLMError[LLM Service Error]
    
    LLMError --> Fallback2[Fallback: Template Response]
    
    TryLLM -->|Success| TrySave[Try: Save Message]
    TrySave -->|Fail| SaveError[Log Error]
    SaveError --> ReturnResponse[Return Response Anyway]
    
    TrySave -->|Success| Success[200: Success]
    
    AuthError --> End([End])
    ValidationError --> End
    NotFoundError --> End
    Fallback2 --> End
    ReturnResponse --> End
    Success --> End

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style AuthError fill:#ffcdd2
    style ValidationError fill:#ffcdd2
    style NotFoundError fill:#ffcdd2
    style LLMError fill:#ffcdd2
```

## Chat Performance Optimization

```mermaid
graph LR
    subgraph "Optimization Strategies"
        Cache[Response Caching<br/>Common Questions]
        Prefetch[Prefetch Resume<br/>on Chat Open]
        Parallel[Parallel Processing<br/>RAG + DB Queries]
        Stream[Streaming Responses<br/>Improve UX]
        Batch[Batch Embeddings<br/>Multiple Queries]
    end
    
    subgraph "Performance Metrics"
        Latency[Target Latency<br/>< 3 seconds]
        Throughput[Throughput<br/>100 req/min]
        Accuracy[RAG Accuracy<br/>> 90%]
    end
    
    Cache --> Latency
    Prefetch --> Latency
    Parallel --> Latency
    Stream --> Latency
    Batch --> Throughput

    style Latency fill:#c8e6c9
    style Throughput fill:#c8e6c9
    style Accuracy fill:#c8e6c9
```

## Chat Analytics Tracking

```mermaid
flowchart TD
    Event([Chat Event])
    
    Event --> Track1[Track: Message Sent<br/>timestamp, userId]
    Event --> Track2[Track: Response Time<br/>latency, tokens used]
    Event --> Track3[Track: Context Retrieved<br/>chunks, relevance scores]
    Event --> Track4[Track: User Satisfaction<br/>thumbs up/down]
    
    Track1 --> Store[(Analytics DB)]
    Track2 --> Store
    Track3 --> Store
    Track4 --> Store
    
    Store --> Analyze[Analyze Metrics<br/>- Avg response time<br/>- Popular questions<br/>- RAG quality<br/>- User engagement]
    
    Analyze --> Dashboard[Analytics Dashboard]

    style Event fill:#e3f2fd
    style Dashboard fill:#c8e6c9
```

## Future Enhancements

### Planned Features
1. **Voice Input/Output**: Speech-to-text and text-to-speech
2. **Multi-Resume Chat**: Query across all user's resumes
3. **Proactive Suggestions**: AI suggests improvements unprompted
4. **Context Window Management**: Smart truncation for long conversations
5. **Conversation Branching**: Fork conversations for different scenarios
6. **Export Chat Transcripts**: Save conversations as PDF/TXT
7. **Collaborative Chat**: Share chat sessions with career advisors
8. **Smart Notifications**: Alert users to important insights
