/**
 * RAG Pipeline Service
 * Orchestrates the complete RAG workflow: chunking → embedding → indexing
 * Automatically triggered after resume parsing
 * 
 * @module services/ragPipeline
 */

import Resume from '../models/Resume.js';
import { generateChunksForResume, hasChunks } from './chunkService.js';
import { generateEmbeddingsForResume } from './embeddingPipeline.js';
import { logPipeline, logStructuredError } from '../utils/ragLogger.js';

/**
 * RAG Pipeline configuration
 */
const PIPELINE_CONFIG = {
  autoTrigger: process.env.RAG_AUTO_TRIGGER !== 'false', // Default: true
  retryDelay: 5000, // 5 seconds
  maxRetries: 1,
};

/**
 * Check if resume is ready for RAG processing
 * 
 * @param {Object} resume - Resume document
 * @returns {Object} Readiness check result
 */
const checkReadiness = (resume) => {
  const issues = [];

  if (resume.parsingStatus !== 'completed') {
    issues.push('Resume parsing not completed');
  }

  if (!resume.extractedText || resume.extractedText.length < 100) {
    issues.push('Insufficient text content');
  }

  return {
    ready: issues.length === 0,
    issues,
  };
};

/**
 * Execute the complete RAG pipeline for a resume
 * 
 * @param {string} resumeId - Resume identifier
 * @param {Object} [options={}] - Pipeline options
 * @returns {Promise<Object>} Pipeline execution result
 */
export const executeRAGPipeline = async (resumeId, options = {}) => {
  const startTime = Date.now();
  const pipelineName = 'RAG';

  try {
    logPipeline.start(pipelineName, resumeId);

    // Step 1: Get resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Step 2: Check readiness
    logPipeline.stage(pipelineName, 'readiness-check', resumeId);
    const readiness = checkReadiness(resume);
    if (!readiness.ready) {
      throw new Error(`Resume not ready: ${readiness.issues.join(', ')}`);
    }

    // Step 3: Check for existing embeddings
    if (resume.embeddingStatus === 'completed' && !options.force) {
      logPipeline.warning(
        pipelineName,
        'Embeddings already completed',
        { resumeId, embeddingStatus: resume.embeddingStatus }
      );
      return {
        success: true,
        resumeId,
        skipped: true,
        reason: 'Embeddings already completed',
        embeddingStatus: resume.embeddingStatus,
      };
    }

    // Step 4: Generate chunks (if not exists)
    logPipeline.stage(pipelineName, 'chunking', resumeId);
    let chunkResult;
    
    if (await hasChunks(resumeId)) {
      logPipeline.warning(pipelineName, 'Chunks already exist', { resumeId });
      chunkResult = { success: true, chunksCreated: 0, skipped: true };
    } else {
      chunkResult = await generateChunksForResume(resumeId);
    }

    // Step 5: Generate embeddings
    logPipeline.stage(pipelineName, 'embedding', resumeId);
    const embeddingResult = await generateEmbeddingsForResume(resumeId);

    const duration = Date.now() - startTime;
    logPipeline.success(pipelineName, resumeId, duration);

    return {
      success: true,
      resumeId,
      fileName: resume.fileName,
      chunks: {
        created: chunkResult.chunksCreated || 0,
        total: embeddingResult.totalChunks,
      },
      embeddings: {
        successful: embeddingResult.successful,
        failed: embeddingResult.failed,
      },
      duration,
    };
  } catch (error) {
    logPipeline.error(pipelineName, resumeId, error);
    logStructuredError('executeRAGPipeline', error, { resumeId });

    // Update resume embedding status to failed
    try {
      await Resume.findByIdAndUpdate(resumeId, {
        embeddingStatus: 'failed',
        embeddingError: error.message,
      });
    } catch (updateError) {
      console.error('Failed to update resume status:', updateError);
    }

    throw error;
  }
};

/**
 * Trigger RAG pipeline after resume parsing
 * Non-blocking, runs in background
 * 
 * @param {string} resumeId - Resume identifier
 */
export const triggerRAGPipelineAfterParsing = (resumeId) => {
  if (!PIPELINE_CONFIG.autoTrigger) {
    console.log('[RAG] Auto-trigger disabled, skipping pipeline');
    return;
  }

  // Run pipeline asynchronously
  setTimeout(async () => {
    try {
      console.log(`[RAG] Auto-triggering pipeline for resume: ${resumeId}`);
      await executeRAGPipeline(resumeId);
    } catch (error) {
      console.error(`[RAG] Auto-trigger failed for ${resumeId}:`, error.message);
    }
  }, 1000); // Small delay to ensure parsing is fully committed
};

/**
 * Retry failed RAG pipeline
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Retry result
 */
export const retryRAGPipeline = async (resumeId) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.embeddingStatus !== 'failed') {
      throw new Error('Can only retry failed embeddings');
    }

    logPipeline.warning('RAG', 'Retrying failed pipeline', { resumeId });

    // Reset embedding status
    resume.embeddingStatus = 'pending';
    resume.embeddingError = null;
    await resume.save();

    // Re-execute pipeline
    return await executeRAGPipeline(resumeId);
  } catch (error) {
    logStructuredError('retryRAGPipeline', error, { resumeId });
    throw error;
  }
};

/**
 * Process multiple pending resumes
 * Batch process resumes that need RAG pipeline
 * 
 * @param {Object} [options={}] - Processing options
 * @returns {Promise<Object>} Batch processing result
 */
export const processPendingResumes = async (options = {}) => {
  const limit = options.limit || 10;

  try {
    // Find resumes that are parsed but not embedded
    const pendingResumes = await Resume.find({
      parsingStatus: 'completed',
      $or: [
        { embeddingStatus: 'pending' },
        { embeddingStatus: { $exists: false } },
      ],
    })
      .limit(limit)
      .sort({ createdAt: 1 });

    console.log(`[RAG] Found ${pendingResumes.length} pending resumes`);

    const results = [];

    for (const resume of pendingResumes) {
      try {
        const result = await executeRAGPipeline(resume._id.toString());
        results.push({
          resumeId: resume._id.toString(),
          fileName: resume.fileName,
          status: 'success',
          ...result,
        });
      } catch (error) {
        results.push({
          resumeId: resume._id.toString(),
          fileName: resume.fileName,
          status: 'failed',
          error: error.message,
        });
      }
    }

    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return {
      processed: results.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    logStructuredError('processPendingResumes', error, { limit });
    throw error;
  }
};

/**
 * Get RAG pipeline statistics
 * 
 * @returns {Promise<Object>} Pipeline statistics
 */
export const getRAGPipelineStats = async () => {
  const resumes = await Resume.find().select('parsingStatus embeddingStatus');

  const stats = {
    total: resumes.length,
    parsed: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    ready: 0, // Both parsed and embedded
  };

  resumes.forEach((resume) => {
    if (resume.parsingStatus === 'completed') {
      stats.parsed++;
    }

    const embStatus = resume.embeddingStatus || 'pending';
    stats[embStatus]++;

    if (resume.parsingStatus === 'completed' && resume.embeddingStatus === 'completed') {
      stats.ready++;
    }
  });

  return stats;
};

/**
 * Validate resume is RAG-ready
 * Check if resume is ready for search/retrieval
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Validation result
 */
export const validateRAGReadiness = async (resumeId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error('Resume not found');
  }

  const checks = {
    parsed: resume.parsingStatus === 'completed',
    hasText: resume.extractedText && resume.extractedText.length > 0,
    embedded: resume.embeddingStatus === 'completed',
  };

  const ready = Object.values(checks).every((check) => check === true);

  return {
    ready,
    checks,
    resumeId,
    status: {
      parsing: resume.parsingStatus,
      embedding: resume.embeddingStatus,
    },
  };
};

export default {
  executeRAGPipeline,
  triggerRAGPipelineAfterParsing,
  retryRAGPipeline,
  processPendingResumes,
  getRAGPipelineStats,
  validateRAGReadiness,
};
