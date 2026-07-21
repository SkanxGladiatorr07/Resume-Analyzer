# ResumeAI System Architecture

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend<br/>Material Design 3]
        Auth[Auth Context]
        Router[React Router]
    end

    subgraph "API Gateway"
        Express[Express.js Server<br/>Port 5000]
        CORS[CORS Middleware]
        JWT[JWT Authentication]
        RateLimit[Rate Limiter]
    end

    subgraph "Business Logic Layer"
        AuthCtrl[Auth Controller]
        ResumeCtrl[Resume Controller]
        AnalysisCtrl[Analysis Controller]
        ChatCtrl[Chat Controller]
        JobCtrl[Job Match Controller]
        ExportCtrl[Export Controller]
        AnalyticsCtrl[Analytics Controller]
    end

    subgraph "Service Layer"
        AIService[AI Service<br/>Google Gemini]
        RAGService[RAG Pipeline<br/>Semantic Search]
        SearchService[Vector Search]
        PDFService[PDF Processing<br/>PDF-Parse]
        EmailService[Email Service<br/>Nodemailer]
        ExportService[Export Service<br/>PDF/JSON]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB Atlas<br/>User & Resume Data)]
        ChromaDB[(ChromaDB<br/>Vector Embeddings)]
        FileSystem[File System<br/>Upload Storage]
    end

    subgraph "External Services"
        Gemini[Google Gemini API]
        Gmail[Gmail SMTP]
    end

    UI --> Router
    Router --> Auth
    Auth --> Express
    
    Express --> CORS
    CORS --> RateLimit
    RateLimit --> JWT
    
    JWT --> AuthCtrl
    JWT --> ResumeCtrl
    JWT --> AnalysisCtrl
    JWT --> ChatCtrl
    JWT --> JobCtrl
    JWT --> ExportCtrl
    JWT --> AnalyticsCtrl
    
    AuthCtrl --> MongoDB
    AuthCtrl --> EmailService
    
    ResumeCtrl --> PDFService
    ResumeCtrl --> AIService
    ResumeCtrl --> MongoDB
    ResumeCtrl --> FileSystem
    
    AnalysisCtrl --> AIService
    AnalysisCtrl --> MongoDB
    
    ChatCtrl --> RAGService
    ChatCtrl --> AIService
    ChatCtrl --> MongoDB
    
    JobCtrl --> AIService
    JobCtrl --> MongoDB
    
    ExportCtrl --> ExportService
    ExportCtrl --> MongoDB
    
    AnalyticsCtrl --> MongoDB
    
    AIService --> Gemini
    RAGService --> ChromaDB
    RAGService --> SearchService
    SearchService --> ChromaDB
    EmailService --> Gmail
    
    PDFService --> FileSystem

    style UI fill:#e3f2fd
    style Express fill:#fff3e0
    style MongoDB fill:#c8e6c9
    style ChromaDB fill:#c8e6c9
    style Gemini fill:#f8bbd0
    style AIService fill:#ffe0b2
    style RAGService fill:#ffe0b2
```

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **UI Library**: Material Design 3 + Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Material Symbols

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer
- **PDF Processing**: pdf-parse
- **Email**: Nodemailer
- **Validation**: express-validator

### Database & Storage
- **Primary Database**: MongoDB Atlas (User & Resume Data)
- **Vector Database**: ChromaDB (Semantic Search)
- **File Storage**: Local File System
- **Session Storage**: JWT Tokens

### AI & Machine Learning
- **LLM**: Google Gemini 1.5 Pro
- **Embeddings**: Google Generative AI Embeddings
- **Vector Search**: ChromaDB
- **RAG Pipeline**: Custom Implementation

### Security
- **Authentication**: JWT with HTTP-only Cookies
- **Password Hashing**: bcryptjs (10 rounds)
- **Rate Limiting**: express-rate-limit
- **CORS**: Configured for frontend origin
- **Input Validation**: express-validator
- **XSS Protection**: Helmet.js

## Deployment Architecture

```mermaid
graph LR
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "Application Servers"
            App1[Node.js Instance 1]
            App2[Node.js Instance 2]
        end
        
        subgraph "Static Assets"
            CDN[CDN/Nginx<br/>React Build]
        end
        
        subgraph "Databases"
            MongoCluster[(MongoDB Atlas<br/>Replica Set)]
            ChromaCluster[(ChromaDB<br/>Cluster)]
        end
        
        subgraph "Storage"
            S3[File Storage<br/>S3/Local]
        end
    end

    User[Users] --> LB
    User --> CDN
    LB --> App1
    LB --> App2
    App1 --> MongoCluster
    App2 --> MongoCluster
    App1 --> ChromaCluster
    App2 --> ChromaCluster
    App1 --> S3
    App2 --> S3

    style User fill:#e3f2fd
    style LB fill:#fff3e0
    style CDN fill:#f3e5f5
    style MongoCluster fill:#c8e6c9
    style ChromaCluster fill:#c8e6c9
```

## Security Architecture

```mermaid
graph TB
    Request[Incoming Request]
    
    subgraph "Security Layers"
        Helmet[Helmet.js<br/>Security Headers]
        CORS[CORS Policy<br/>Origin Validation]
        RateLimit[Rate Limiter<br/>100 req/15min]
        JWTAuth[JWT Validation<br/>Token Verification]
        InputVal[Input Validation<br/>Sanitization]
    end
    
    subgraph "Protected Resources"
        Controllers[Controllers]
        Database[(Database)]
    end

    Request --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> JWTAuth
    JWTAuth --> InputVal
    InputVal --> Controllers
    Controllers --> Database

    style Request fill:#ffcdd2
    style Helmet fill:#fff9c4
    style CORS fill:#fff9c4
    style RateLimit fill:#fff9c4
    style JWTAuth fill:#fff9c4
    style InputVal fill:#fff9c4
    style Controllers fill:#c8e6c9
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Architecture**: All session data in JWT tokens
- **Load Balancing**: Multiple Node.js instances behind load balancer
- **Database Clustering**: MongoDB replica sets for read scaling
- **Caching Strategy**: Redis for session and API response caching (future)

### Vertical Scaling
- **Database Indexing**: Optimized indexes on frequently queried fields
- **Connection Pooling**: Mongoose connection pool management
- **Lazy Loading**: Frontend lazy loading for route components
- **Code Splitting**: Webpack/Vite code splitting for optimal bundle size

### Performance Optimization
- **CDN**: Static assets served via CDN
- **Compression**: Gzip/Brotli compression for API responses
- **Image Optimization**: Optimized asset delivery
- **Query Optimization**: Database query optimization with indexes
- **Memoization**: React.memo and useMemo for component optimization
