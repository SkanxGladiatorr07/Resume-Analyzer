# ResumeAI RAG Pipeline Documentation

## RAG (Retrieval-Augmented Generation) Architecture

```mermaid
graph TB
    subgraph "Ingestion Pipeline"
        PDF[PDF Resume Upload]
        Parse[PDF Text Extraction<br/>pdf-parse]
        Chunk[Text Chunking<br/>500 tokens overlap]
        Embed[Generate Embeddings<br/>Google AI Embeddings]
        Store[Store in ChromaDB<br/>Vector Database]
    end
    
    subgraph "Retrieval Pipeline"
        Query[User Query]
        QEmbed[Query Embedding<br/>Google AI Embeddings]
        Search[Semantic Search<br/>ChromaDB]
        Rank[Rerank Results<br/>Relevance Score]
        Filter[Filter Top K<br/>K=5 chunks]
    end
    
    subgraph "Generation Pipeline"
        Context[Combine Context<br/>Retrieved Chunks]
        Prompt[Build Prompt<br/>Template + Context]
        LLM[Google Gemini LLM<br/>Generate Response]
        Response[Return Answer<br/>with Citations]
    end
    
    subgraph "Storage Layer"
        MongoDB[(MongoDB<br/>Resume Metadata)]
        ChromaDB[(ChromaDB<br/>Vector Embeddings)]
        FileSystem[File System<br/>PDF Storage]
    end

    PDF --> Parse
    Parse --> MongoDB
    Parse --> Chunk
    Chunk --> Embed
    Embed --> Store
    Store --> ChromaDB
    PDF --> FileSystem
    
    Query --> QEmbed
    QEmbed --> Search
    Search --> ChromaDB
    ChromaDB --> Rank
    Rank --> Filter
    
    Filter --> Context
    MongoDB --> Context
    Context --> Prompt
    Prompt --> LLM
    LLM --> Response

    style PDF fill:#e3f2fd
    style Response fill:#c8e6c9
    style MongoDB fill:#fff3e0
    style ChromaDB fill:#fff3e0
```

## Detailed RAG Flow

### 1. Document Ingestion Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant PDFParser
    participant Chunker
    participant Embedder
    participant ChromaDB
    participant MongoDB

    User->>API: Upload Resume (PDF)
    API->>PDFParser: Extract Text
    PDFParser-->>API: Raw Text + Metadata
    
    API->>MongoDB: Save Resume Record
    MongoDB-->>API: Resume ID
    
    API->>Chunker: Split Text into Chunks
    Note over Chunker: 500 tokens per chunk<br/>100 token overlap
    Chunker-->>API: Text Chunks Array
    
    loop For Each Chunk
        API->>Embedder: Generate Embedding
        Embedder-->>API: 384-dim Vector
        API->>ChromaDB: Store (ID, Vector, Metadata, Text)
    end
    
    ChromaDB-->>API: Storage Confirmation
    API->>MongoDB: Update Status: indexed
    API-->>User: Upload Complete
```

### 2. Query Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Embedder
    participant ChromaDB
    participant Reranker
    participant LLM

    User->>API: Ask Question about Resume
    API->>Embedder: Generate Query Embedding
    Embedder-->>API: Query Vector
    
    API->>ChromaDB: Similarity Search (Top 10)
    Note over ChromaDB: Cosine Similarity Search<br/>Filter by resumeId
    ChromaDB-->>API: Top 10 Chunks with Scores
    
    API->>Reranker: Rerank by Relevance
    Reranker-->>API: Top 5 Chunks (Ordered)
    
    API->>API: Build Context from Chunks
    API->>LLM: Send Prompt + Context
    Note over LLM: Google Gemini 1.5 Pro<br/>with system instructions
    
    LLM-->>API: Generated Response
    API->>API: Add Citations/Sources
    API-->>User: Answer with Context
```

## Text Chunking Strategy

```mermaid
flowchart TD
    Start([Raw Resume Text])
    
    Start --> Clean[Clean Text<br/>Remove Extra Spaces]
    Clean --> Detect[Detect Sections<br/>Summary, Experience, etc.]
    
    Detect --> Section1[Section: Contact Info]
    Detect --> Section2[Section: Summary]
    Detect --> Section3[Section: Experience]
    Detect --> Section4[Section: Education]
    Detect --> Section5[Section: Skills]
    
    Section1 --> Chunk1[Chunk 1<br/>Contact Details]
    
    Section2 --> Chunk2[Chunk 2<br/>Professional Summary]
    
    Section3 --> SplitExp{Experience<br/>Too Long?}
    SplitExp -->|No| Chunk3[Chunk 3<br/>Full Experience]
    SplitExp -->|Yes| Split1[Chunk 3a<br/>Job 1-2]
    SplitExp -->|Yes| Split2[Chunk 3b<br/>Job 3-4]
    
    Section4 --> Chunk4[Chunk 4<br/>Education]
    
    Section5 --> Chunk5[Chunk 5<br/>Skills List]
    
    Chunk1 --> AddMeta[Add Metadata<br/>resumeId, userId, section]
    Chunk2 --> AddMeta
    Chunk3 --> AddMeta
    Split1 --> AddMeta
    Split2 --> AddMeta
    Chunk4 --> AddMeta
    Chunk5 --> AddMeta
    
    AddMeta --> Overlap[Add Overlap<br/>100 tokens with prev/next]
    Overlap --> Store[(Store in ChromaDB)]

    style Start fill:#e3f2fd
    style Store fill:#c8e6c9
```

## Embedding Generation

### Embedding Model Specifications
- **Model**: Google Generative AI Embeddings
- **Dimension**: 384 (text-embedding-004)
- **Max Input**: 2048 tokens per chunk
- **Batch Size**: 100 documents per API call
- **Normalization**: L2 normalized vectors

### Metadata Schema
```javascript
{
  resumeId: String,
  userId: String,
  section: String, // 'contact', 'summary', 'experience', etc.
  chunkIndex: Number,
  totalChunks: Number,
  filename: String,
  uploadedAt: String,
  skills: [String], // Extracted skills for filtering
  yearsExperience: Number // For filtering
}
```

## Semantic Search Process

```mermaid
flowchart TD
    Start([User Query])
    
    Start --> Embed[Generate Query<br/>Embedding]
    Embed --> BuildFilter[Build Metadata Filter<br/>resumeId, userId]
    
    BuildFilter --> Search[ChromaDB<br/>Similarity Search]
    
    Search --> Score[Cosine Similarity<br/>Scoring]
    Score --> Top10[Get Top 10<br/>Results]
    
    Top10 --> CheckRelevance{Relevance<br/>Score > 0.7?}
    
    CheckRelevance -->|Yes| Rerank[Rerank by<br/>Multiple Factors]
    CheckRelevance -->|No| Expand[Expand Search<br/>Lower Threshold]
    
    Expand --> Search
    
    Rerank --> Factors[Consider:<br/>- Similarity Score<br/>- Section Relevance<br/>- Chunk Position]
    
    Factors --> Top5[Select Top 5<br/>Chunks]
    Top5 --> Context[Build Context<br/>String]
    
    Context --> End([Return Context])

    style Start fill:#e3f2fd
    style End fill:#c8e6c9
```

## Prompt Engineering

### System Prompt Template
```
You are ResumeAI, an intelligent assistant specialized in analyzing resumes and providing career guidance.

Context: The following information is from the user's resume:
{retrieved_context}

Guidelines:
1. Base your responses ONLY on the provided context
2. If information is not in the context, say "I don't have that information in your resume"
3. Be specific and cite sections when possible
4. Provide actionable advice
5. Maintain a professional but friendly tone

User Question: {user_query}
```

### Context Building
```javascript
function buildContext(chunks) {
  let context = "";
  
  chunks.forEach((chunk, index) => {
    context += `[Source ${index + 1} - ${chunk.metadata.section}]\n`;
    context += chunk.document + "\n\n";
  });
  
  return context;
}
```

## RAG Performance Optimization

### Indexing Optimization
```mermaid
graph LR
    Input[Resume Upload]
    
    subgraph "Parallel Processing"
        Parse[PDF Parsing]
        Store[File Storage]
        Metadata[Extract Metadata]
    end
    
    Input --> Parse
    Input --> Store
    Input --> Metadata
    
    Parse --> Chunk[Text Chunking]
    
    Chunk --> Batch[Batch Embeddings<br/>100 at a time]
    Batch --> Index[Bulk Insert<br/>to ChromaDB]
    
    Store --> Complete1[Complete]
    Metadata --> Complete2[Complete]
    Index --> Complete3[Complete]
    
    Complete1 --> Done([Indexing Done])
    Complete2 --> Done
    Complete3 --> Done

    style Input fill:#e3f2fd
    style Done fill:#c8e6c9
```

### Query Optimization
- **Caching**: Cache common queries and embeddings (Redis)
- **Batch Processing**: Process multiple queries in parallel
- **Lazy Loading**: Load context only when needed
- **Connection Pooling**: Reuse ChromaDB connections

## RAG Quality Metrics

### Retrieval Metrics
- **Precision@K**: Relevant chunks in top K results
- **Recall@K**: Retrieved relevant chunks / total relevant
- **MRR**: Mean Reciprocal Rank of first relevant result
- **NDCG**: Normalized Discounted Cumulative Gain

### Generation Metrics
- **Faithfulness**: Response accuracy to retrieved context
- **Answer Relevance**: Response relevance to query
- **Context Relevance**: Retrieved context relevance to query
- **Latency**: End-to-end response time (target: <3s)

## Error Handling

```mermaid
flowchart TD
    Start([RAG Query])
    
    Start --> TryEmbed[Try: Generate Embedding]
    TryEmbed -->|Error| EmbedFail[Embedding Service Down]
    EmbedFail --> Fallback1[Fallback: Keyword Search]
    
    TryEmbed -->|Success| TrySearch[Try: Vector Search]
    TrySearch -->|Error| SearchFail[ChromaDB Unavailable]
    SearchFail --> Fallback2[Fallback: Return Cached Results]
    
    TrySearch -->|Success| CheckResults{Results<br/>Found?}
    CheckResults -->|No| NoResults[No Relevant Context]
    NoResults --> Fallback3[Fallback: General LLM Response]
    
    CheckResults -->|Yes| TryLLM[Try: Generate Response]
    TryLLM -->|Error| LLMFail[LLM Service Down]
    LLMFail --> Fallback4[Return: Context Only]
    
    TryLLM -->|Success| Success[Return Generated Answer]
    
    Fallback1 --> End([End])
    Fallback2 --> End
    Fallback3 --> End
    Fallback4 --> End
    Success --> End

    style Start fill:#e3f2fd
    style Success fill:#c8e6c9
    style EmbedFail fill:#ffcdd2
    style SearchFail fill:#ffcdd2
    style LLMFail fill:#ffcdd2
```

## Future Enhancements

### Planned Features
1. **Hybrid Search**: Combine semantic + keyword search
2. **Multi-Resume Search**: Query across multiple resumes
3. **Conversation Memory**: Maintain chat context across sessions
4. **Fine-tuned Embeddings**: Custom embedding model for resumes
5. **Query Expansion**: Automatic query reformulation
6. **Contextual Compression**: Smart context trimming for long resumes
7. **A/B Testing**: Compare different chunking strategies
8. **Real-time Indexing**: Incremental updates instead of full reindex
