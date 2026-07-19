import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import { getLogger } from './middleware/logger.js';
import { sanitizeInput } from './middleware/sanitizer.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { attachFormatter } from './utils/responseFormatter.js';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import jobDescriptionRoutes from './routes/jobDescriptionRoutes.js';
import jobMatchRoutes from './routes/jobMatchRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import aiRewriteRoutes from './routes/aiRewriteRoutes.js';
import aiStarRoutes from './routes/aiStarRoutes.js';
import aiInterviewRoutes from './routes/aiInterviewRoutes.js';
import aiProjectsRoutes from './routes/aiProjectsRoutes.js';
import aiRoadmapRoutes from './routes/aiRoadmapRoutes.js';
import aiHistoryRoutes from './routes/aiHistoryRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const app = express();

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow loading external resources
  })
);

// CORS Configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ========================================
// REQUEST PARSING MIDDLEWARE
// ========================================

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// LOGGING MIDDLEWARE
// ========================================

// Request logging (environment-aware)
app.use(getLogger());

// ========================================
// SANITIZATION MIDDLEWARE
// ========================================

// MongoDB injection and XSS protection
app.use(sanitizeInput);

// ========================================
// UTILITY MIDDLEWARE
// ========================================

// Attach response formatter to all requests
app.use(attachFormatter);

// ========================================
// RATE LIMITING
// ========================================

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// ========================================
// HEALTH CHECK ENDPOINT
// ========================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResumeAI Backend Running',
    environment: config.server.env,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ========================================
// API ROUTES
// ========================================

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/job-descriptions', jobDescriptionRoutes);
app.use('/api/job-match', jobMatchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRewriteRoutes);
app.use('/api/ai', aiStarRoutes);
app.use('/api/ai', aiInterviewRoutes);
app.use('/api/ai', aiProjectsRoutes);
app.use('/api/ai', aiRoadmapRoutes);
app.use('/api/ai', aiHistoryRoutes);
app.use('/api/report', exportRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 Handler - Must be after all routes
app.use(notFound);

// Global Error Handler - Must be last
app.use(errorHandler);

export default app;
