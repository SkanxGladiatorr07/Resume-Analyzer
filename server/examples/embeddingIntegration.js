/**
 * Embedding Pipeline Integration Examples
 * 
 * This file shows how to integrate the embedding pipeline
 * with your existing resume upload and processing flow.
 * 
 * @module examples/embeddingIntegration
 */

import { generateEmbeddingsForResume } from '../services/embeddingPipeline.js';
import Resume from '../models/Resume.js';
import ResumeChunk from '../models/ResumeChunk.js';

/**
 * Example 1: Automatic Embedding Generation After Resume Upload
 * 
 * This pattern triggers embedding generation automatically
 * after a resume is successfully parsed and chunked.
 */
export const automaticEmbeddingGeneration = async (req, res) => {
  try {
    // ... existing upload and parsing logic
    const resume = await Resume.findById(resumeId);
    
    // Check if resume is parsed and ready for embedding
    if (resume.parsingStatus === 'completed') {
      // Trigger embedding generation asynchronously
      // Don't wait for it to complete before responding
      generateEmbeddingsForResume(resume._id.toString())
        .then((result) => {
          console.log(
            `[Embedding] Generated embeddings for ${resume.fileName}: ${result.successful}/${result.totalChunks} successful`
          );
        })
        .catch((error) => {
          console.error(`[Embedding] Failed for ${resume.fileName}:`, error.message);
        });
    }
    
    // Return immediately
    res.json({
      message: 'Resume uploaded successfully',
      resumeId: resume._id,
      status: 'processing',
      embeddingStatus: resume.embeddingStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example 2: Check Embedding Status
 * 
 * Endpoint to check the embedding generation status for a resume.
 */
export const checkEmbeddingStatus = async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    const resume = await Resume.findById(resumeId).select(
      'fileName embeddingStatus embeddingError embeddingStartedAt embeddingCompletedAt'
    );
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // Get chunk statistics
    const chunks = await ResumeChunk.findByResumeId(resumeId);
    const chunkStats = {
      total: chunks.length,
      pending: chunks.filter((c) => c.status === 'pending').length,
      embedded: chunks.filter((c) => c.status === 'embedded').length,
      indexed: chunks.filter((c) => c.status === 'indexed').length,
      error: chunks.filter((c) => c.status === 'error').length,
    };
    
    res.json({
      fileName: resume.fileName,
      status: resume.embeddingStatus,
      error: resume.embeddingError,
      startedAt: resume.embeddingStartedAt,
      completedAt: resume.embeddingCompletedAt,
      chunks: chunkStats,
      progress:
        chunkStats.total > 0
          ? Math.round((chunkStats.indexed / chunkStats.total) * 100)
          : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example 3: Manually Trigger Embedding Generation
 * 
 * Endpoint to manually trigger embedding generation for a resume.
 * Useful for retry or manual processing.
 */
export const triggerEmbeddingGeneration = async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // Check if resume is ready
    if (resume.parsingStatus !== 'completed') {
      return res.status(400).json({
        error: 'Resume must be parsed before generating embeddings',
      });
    }
    
    // Check if already processing
    if (resume.embeddingStatus === 'processing') {
      return res.status(400).json({
        error: 'Embedding generation already in progress',
      });
    }
    
    // Start embedding generation
    generateEmbeddingsForResume(resumeId)
      .then((result) => {
        console.log(`[Embedding] Manual trigger completed:`, result);
      })
      .catch((error) => {
        console.error(`[Embedding] Manual trigger failed:`, error.message);
      });
    
    res.json({
      message: 'Embedding generation started',
      resumeId,
      status: 'processing',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example 4: Synchronous Embedding Generation (Wait for Completion)
 * 
 * This pattern waits for embedding generation to complete
 * before responding. Use with caution - may timeout for large resumes.
 */
export const synchronousEmbeddingGeneration = async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    // Wait for embedding generation to complete
    const result = await generateEmbeddingsForResume(resumeId);
    
    if (result.failed > 0) {
      return res.status(500).json({
        message: 'Embedding generation completed with errors',
        result,
      });
    }
    
    res.json({
      message: 'Embedding generation completed successfully',
      result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example 5: Batch Process All Pending Resumes
 * 
 * Background job or admin endpoint to process all pending resumes.
 */
export const batchProcessPending = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const { processAllPendingResumes } = await import('../services/embeddingPipeline.js');
    
    // Start batch processing
    processAllPendingResumes({ limit: parseInt(limit, 10) })
      .then((summary) => {
        console.log(`[Embedding] Batch processing completed:`, summary);
      })
      .catch((error) => {
        console.error(`[Embedding] Batch processing failed:`, error.message);
      });
    
    res.json({
      message: 'Batch processing started',
      limit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example 6: Retry Failed Embeddings
 * 
 * Endpoint to retry failed embeddings for a specific resume.
 */
export const retryFailedEmbeddings = async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const { retryFailedEmbeddings: retryFn } = await import(
      '../services/embeddingPipeline.js'
    );
    
    // Start retry
    retryFn(resumeId)
      .then((result) => {
        console.log(`[Embedding] Retry completed:`, result);
      })
      .catch((error) => {
        console.error(`[Embedding] Retry failed:`, error.message);
      });
    
    res.json({
      message: 'Retry started',
      resumeId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example 7: Get Pipeline Statistics
 * 
 * Admin endpoint to view embedding pipeline statistics.
 */
export const getPipelineStatistics = async (req, res) => {
  try {
    const { getPipelineStats } = await import('../services/embeddingPipeline.js');
    
    const stats = await getPipelineStats();
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example 8: Webhook Pattern - Background Job Queue
 * 
 * Integration with a job queue (e.g., Bull, BullMQ)
 * for reliable background processing.
 */
export const setupEmbeddingQueue = (Queue) => {
  // Create queue
  const embeddingQueue = new Queue('embedding-generation', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
  });
  
  // Process jobs
  embeddingQueue.process(async (job) => {
    const { resumeId } = job.data;
    
    console.log(`[Queue] Processing embedding job for resume: ${resumeId}`);
    
    try {
      const result = await generateEmbeddingsForResume(resumeId);
      
      console.log(`[Queue] Job completed:`, result);
      
      return result;
    } catch (error) {
      console.error(`[Queue] Job failed:`, error.message);
      throw error;
    }
  });
  
  // Add job after resume upload
  const addEmbeddingJob = async (resumeId) => {
    await embeddingQueue.add(
      { resumeId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );
    
    console.log(`[Queue] Added embedding job for resume: ${resumeId}`);
  };
  
  return { embeddingQueue, addEmbeddingJob };
};

/**
 * Example 9: Event-Based Integration
 * 
 * Use Node.js EventEmitter pattern for loose coupling.
 */
export const eventBasedIntegration = (eventEmitter) => {
  // Listen for resume parsed event
  eventEmitter.on('resume:parsed', async ({ resumeId }) => {
    console.log(`[Event] Resume parsed, generating embeddings: ${resumeId}`);
    
    try {
      const result = await generateEmbeddingsForResume(resumeId);
      
      // Emit completion event
      eventEmitter.emit('embedding:completed', {
        resumeId,
        result,
      });
    } catch (error) {
      // Emit error event
      eventEmitter.emit('embedding:failed', {
        resumeId,
        error: error.message,
      });
    }
  });
  
  // Listen for embedding completion
  eventEmitter.on('embedding:completed', ({ resumeId, result }) => {
    console.log(`[Event] Embedding completed for ${resumeId}:`, result);
    // Could trigger notifications, analytics, etc.
  });
  
  // Listen for embedding failures
  eventEmitter.on('embedding:failed', ({ resumeId, error }) => {
    console.error(`[Event] Embedding failed for ${resumeId}:`, error);
    // Could trigger alerts, retry logic, etc.
  });
};

/**
 * Example 10: Complete Resume Upload Flow with Embeddings
 * 
 * Full integration showing upload → parse → chunk → embed flow.
 */
export const completeResumeUploadFlow = async (req, res) => {
  try {
    // Step 1: Upload resume (existing logic)
    // ... file upload logic
    
    // Step 2: Parse resume (existing logic)
    // ... parsing logic
    
    // Step 3: Generate chunks (existing logic)
    const { chunkResume } = await import('../services/chunkingService.js');
    const chunks = await chunkResume(resume);
    
    // Step 4: Save chunks to database (existing logic)
    const { saveChunks } = await import('../utils/chunkUtils.js');
    await saveChunks(chunks);
    
    // Step 5: Generate embeddings (NEW)
    generateEmbeddingsForResume(resume._id.toString())
      .then((result) => {
        console.log(
          `[Upload] Complete pipeline finished: ${result.successful}/${result.totalChunks} embeddings`
        );
      })
      .catch((error) => {
        console.error(`[Upload] Embedding generation failed:`, error.message);
      });
    
    // Return response
    res.json({
      message: 'Resume uploaded and processing started',
      resumeId: resume._id,
      fileName: resume.fileName,
      chunks: chunks.length,
      status: {
        parsing: resume.parsingStatus,
        embedding: resume.embeddingStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Example Routes
 * 
 * How to integrate these examples into your Express router.
 */
export const setupEmbeddingRoutes = (router) => {
  // Check embedding status
  router.get('/api/resumes/:resumeId/embedding-status', checkEmbeddingStatus);
  
  // Manually trigger embedding generation
  router.post('/api/resumes/:resumeId/generate-embeddings', triggerEmbeddingGeneration);
  
  // Retry failed embeddings
  router.post('/api/resumes/:resumeId/retry-embeddings', retryFailedEmbeddings);
  
  // Batch process pending (admin only)
  router.post('/api/admin/embeddings/batch-process', batchProcessPending);
  
  // Get pipeline statistics (admin only)
  router.get('/api/admin/embeddings/stats', getPipelineStatistics);
  
  return router;
};

export default {
  automaticEmbeddingGeneration,
  checkEmbeddingStatus,
  triggerEmbeddingGeneration,
  synchronousEmbeddingGeneration,
  batchProcessPending,
  retryFailedEmbeddings,
  getPipelineStatistics,
  setupEmbeddingQueue,
  eventBasedIntegration,
  completeResumeUploadFlow,
  setupEmbeddingRoutes,
};
