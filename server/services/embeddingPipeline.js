/**
 * Embedding Pipeline Service
 * Service for generating and managing embeddings for resume chunks
 * 
 * This service handles the complete pipeline:
 * 1. Fetch pending resume chunks
 * 2. Generate embeddings using Gemini
 * 3. Upload vectors to Pinecone
 * 4. Update chunk and resume status
 * 5. Handle retries and errors
 * 
 * @module services/embeddingPipeline
 */

import Resume from '../models/Resume.js';
import ResumeChunk from '../models/ResumeChunk.js';
import { generateEmbedding, validateEmbedding } from './embeddingService.js';
import { upsertVector, upsertVectorsBatch } from './vectorService.js';

/**
 * Pipeline configuration
 */
const PIPELINE_CONFIG = {
  batchSize: 10, // Process 10 chunks at a time
  maxRetries: 1, // Retry failed embeddings once
  retryDelay: 2000, // Wait 2 seconds before retry
  namespace: process.env.PINECONE_NAMESPACE || 'resume-chunks',
};

/**
 * Log embedding error
 * 
 * @param {string} chunkId - Chunk identifier
 * @param {string} resumeId - Resume identifier
 * @param {string} errorMessage - Error message
 * @param {string} stage - Pipeline stage where error occurred
 */
const logEmbeddingError = (chunkId, resumeId, errorMessage, stage) => {
  const timestamp = new Date().toISOString();
  console.error(
    `[EmbeddingPipeline] ERROR at ${stage}`,
    {
      timestamp,
      chunkId,
      resumeId,
      error: errorMessage,
    }
  );
};

/**
 * Generate embedding for a single chunk
 * 
 * @param {Object} chunk - Resume chunk document
 * @param {number} [retryCount=0] - Current retry attempt
 * @returns {Promise<number[]>} Generated embedding vector
 * @throws {Error} If embedding generation fails after retries
 */
const generateChunkEmbedding = async (chunk, retryCount = 0) => {
  try {
    console.log(`[EmbeddingPipeline] Generating embedding for chunk: ${chunk.chunkId}`);

    // Prepare text with context
    const textWithContext = `Section: ${chunk.sectionName}\n\n${chunk.text}`;

    // Generate embedding
    const embedding = await generateEmbedding(textWithContext, {
      taskType: 'RETRIEVAL_DOCUMENT',
      title: `Resume ${chunk.sectionName} - ${chunk.fileName}`,
    });

    // Validate embedding
    if (!validateEmbedding(embedding)) {
      throw new Error('Generated embedding is invalid');
    }

    console.log(`[EmbeddingPipeline] Successfully generated embedding for chunk: ${chunk.chunkId}`);
    return embedding;
  } catch (error) {
    // Log error
    logEmbeddingError(
      chunk.chunkId,
      chunk.resumeId.toString(),
      error.message,
      'embedding_generation'
    );

    // Retry logic
    if (retryCount < PIPELINE_CONFIG.maxRetries) {
      console.log(
        `[EmbeddingPipeline] Retrying chunk ${chunk.chunkId} (attempt ${retryCount + 1}/${PIPELINE_CONFIG.maxRetries})`
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, PIPELINE_CONFIG.retryDelay));

      // Retry
      return generateChunkEmbedding(chunk, retryCount + 1);
    }

    // All retries exhausted
    throw new Error(
      `Failed to generate embedding after ${PIPELINE_CONFIG.maxRetries + 1} attempts: ${error.message}`
    );
  }
};

/**
 * Upload embedding to Pinecone vector database
 * 
 * @param {Object} chunk - Resume chunk document
 * @param {number[]} embedding - Embedding vector
 * @returns {Promise<string>} Vector ID in Pinecone
 * @throws {Error} If upload fails
 */
const uploadToVectorDB = async (chunk, embedding) => {
  try {
    console.log(`[EmbeddingPipeline] Uploading vector for chunk: ${chunk.chunkId}`);

    // Prepare vector ID (use chunk ID for easy reference)
    const vectorId = chunk.chunkId;

    // Check if vector already exists (skip duplicates)
    if (chunk.vectorId && chunk.status === 'indexed') {
      console.log(`[EmbeddingPipeline] Vector already exists, skipping: ${vectorId}`);
      return vectorId;
    }

    // Prepare metadata
    const metadata = {
      chunkId: chunk.chunkId,
      resumeId: chunk.resumeId.toString(),
      userId: chunk.userId.toString(),
      sectionName: chunk.sectionName,
      subsection: chunk.subsection || '',
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      fileName: chunk.fileName,
      documentType: chunk.documentType,
      chunkSize: chunk.chunkSize,
      text: chunk.text, // Store text for retrieval
      createdAt: chunk.createdAt.toISOString(),
    };

    // Upload to Pinecone
    await upsertVector(vectorId, embedding, metadata, PIPELINE_CONFIG.namespace);

    console.log(`[EmbeddingPipeline] Successfully uploaded vector: ${vectorId}`);
    return vectorId;
  } catch (error) {
    logEmbeddingError(
      chunk.chunkId,
      chunk.resumeId.toString(),
      error.message,
      'vector_upload'
    );
    throw new Error(`Failed to upload vector: ${error.message}`);
  }
};

/**
 * Update chunk status
 * 
 * @param {string} chunkId - Chunk identifier
 * @param {string} status - New status ('embedded', 'indexed', 'error')
 * @param {Object} [data={}] - Additional data to update
 * @returns {Promise<void>}
 */
const updateChunkStatus = async (chunkId, status, data = {}) => {
  try {
    const chunk = await ResumeChunk.findOne({ chunkId });
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }

    chunk.status = status;

    // Update additional fields based on status
    if (status === 'embedded' && data.embedding && data.model) {
      chunk.embedding = data.embedding;
      chunk.embeddingModel = data.model;
    }

    if (status === 'indexed' && data.vectorId) {
      chunk.vectorId = data.vectorId;
    }

    if (status === 'error' && data.errorMessage) {
      chunk.error = {
        message: data.errorMessage,
        timestamp: new Date(),
      };
    }

    await chunk.save();
    console.log(`[EmbeddingPipeline] Updated chunk status: ${chunkId} -> ${status}`);
  } catch (error) {
    console.error(`[EmbeddingPipeline] Error updating chunk status:`, error.message);
    throw error;
  }
};

/**
 * Update resume embedding status
 * 
 * @param {string} resumeId - Resume identifier
 * @param {string} status - New status ('processing', 'completed', 'failed')
 * @param {Object} [data={}] - Additional data
 * @returns {Promise<void>}
 */
const updateResumeStatus = async (resumeId, status, data = {}) => {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error(`Resume not found: ${resumeId}`);
    }

    resume.embeddingStatus = status;

    if (status === 'processing') {
      resume.embeddingStartedAt = new Date();
    }

    if (status === 'completed') {
      resume.embeddingCompletedAt = new Date();
      resume.embeddingError = null; // Clear any previous errors
    }

    if (status === 'failed' && data.errorMessage) {
      resume.embeddingError = data.errorMessage;
      resume.embeddingRetryCount = (resume.embeddingRetryCount || 0) + 1;
    }

    await resume.save();
    console.log(`[EmbeddingPipeline] Updated resume status: ${resumeId} -> ${status}`);
  } catch (error) {
    console.error(`[EmbeddingPipeline] Error updating resume status:`, error.message);
    throw error;
  }
};

/**
 * Process a single chunk through the embedding pipeline
 * 
 * @param {Object} chunk - Resume chunk document
 * @returns {Promise<Object>} Processing result
 */
const processChunk = async (chunk) => {
  const result = {
    chunkId: chunk.chunkId,
    resumeId: chunk.resumeId.toString(),
    status: 'pending',
    error: null,
  };

  try {
    // Step 1: Generate embedding
    const embedding = await generateChunkEmbedding(chunk);

    // Step 2: Update chunk with embedding
    await updateChunkStatus(chunk.chunkId, 'embedded', {
      embedding,
      model: process.env.EMBEDDING_MODEL || 'text-embedding-004',
    });

    // Step 3: Upload to Pinecone
    const vectorId = await uploadToVectorDB(chunk, embedding);

    // Step 4: Mark as indexed
    await updateChunkStatus(chunk.chunkId, 'indexed', { vectorId });

    result.status = 'indexed';
    result.vectorId = vectorId;
  } catch (error) {
    // Mark chunk as error
    await updateChunkStatus(chunk.chunkId, 'error', {
      errorMessage: error.message,
    });

    result.status = 'error';
    result.error = error.message;
  }

  return result;
};

/**
 * Generate embeddings for all chunks of a resume
 * Main pipeline function with improved duplicate prevention
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Pipeline execution result
 * 
 * @example
 * const result = await generateEmbeddingsForResume('65abc123...');
 * console.log(`Processed: ${result.processed}, Successful: ${result.successful}`);
 */
export const generateEmbeddingsForResume = async (resumeId) => {
  const startTime = Date.now();

  console.log(`\n[EmbeddingPipeline] Starting pipeline for resume: ${resumeId}`);

  try {
    // Step 1: Get resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Step 2: Prevent duplicate processing
    if (resume.embeddingStatus === 'processing') {
      console.log('[EmbeddingPipeline] Resume is already being processed, skipping');
      return {
        resumeId,
        skipped: true,
        reason: 'Already processing',
        embeddingStatus: 'processing',
      };
    }

    if (resume.embeddingStatus === 'completed') {
      // Check if all chunks are actually indexed
      const chunks = await ResumeChunk.findByResumeId(resumeId);
      const indexedCount = chunks.filter((c) => c.status === 'indexed').length;
      
      if (indexedCount === chunks.length && chunks.length > 0) {
        console.log('[EmbeddingPipeline] All chunks already indexed, skipping');
        return {
          resumeId,
          skipped: true,
          reason: 'All chunks indexed',
          totalChunks: chunks.length,
          successful: indexedCount,
        };
      }
      
      console.log('[EmbeddingPipeline] Resume marked complete but has unindexed chunks, continuing');
    }

    // Step 3: Update resume status to processing
    await updateResumeStatus(resumeId, 'processing');

    // Step 4: Fetch all chunks for this resume
    const chunks = await ResumeChunk.findByResumeId(resumeId);

    if (chunks.length === 0) {
      throw new Error('No chunks found for this resume');
    }

    console.log(`[EmbeddingPipeline] Found ${chunks.length} chunks to process`);

    // Step 3: Filter out already processed chunks
    const pendingChunks = chunks.filter((chunk) => chunk.status === 'pending');

    if (pendingChunks.length === 0) {
      console.log('[EmbeddingPipeline] All chunks already processed');
      await updateResumeStatus(resumeId, 'completed');
      return {
        resumeId,
        totalChunks: chunks.length,
        processed: 0,
        successful: chunks.filter((c) => c.status === 'indexed').length,
        failed: chunks.filter((c) => c.status === 'error').length,
        skipped: chunks.length,
        duration: Date.now() - startTime,
      };
    }

    console.log(`[EmbeddingPipeline] Processing ${pendingChunks.length} pending chunks`);

    // Step 4: Process chunks in batches
    const results = [];
    for (let i = 0; i < pendingChunks.length; i += PIPELINE_CONFIG.batchSize) {
      const batch = pendingChunks.slice(i, i + PIPELINE_CONFIG.batchSize);
      const batchNumber = Math.floor(i / PIPELINE_CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(pendingChunks.length / PIPELINE_CONFIG.batchSize);

      console.log(
        `\n[EmbeddingPipeline] Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`
      );

      // Process batch in parallel
      const batchResults = await Promise.all(batch.map((chunk) => processChunk(chunk)));

      results.push(...batchResults);

      // Log batch progress
      const batchSuccessful = batchResults.filter((r) => r.status === 'indexed').length;
      const batchFailed = batchResults.filter((r) => r.status === 'error').length;
      console.log(
        `[EmbeddingPipeline] Batch ${batchNumber} complete: ${batchSuccessful} successful, ${batchFailed} failed`
      );
    }

    // Step 5: Calculate statistics
    const successful = results.filter((r) => r.status === 'indexed').length;
    const failed = results.filter((r) => r.status === 'error').length;

    // Step 6: Update resume status
    if (failed === 0) {
      await updateResumeStatus(resumeId, 'completed');
    } else if (successful === 0) {
      await updateResumeStatus(resumeId, 'failed', {
        errorMessage: `All ${failed} chunks failed to process`,
      });
    } else {
      // Partial success
      await updateResumeStatus(resumeId, 'completed', {
        errorMessage: `${failed} chunks failed to process`,
      });
    }

    const duration = Date.now() - startTime;

    console.log(`\n[EmbeddingPipeline] Pipeline complete for resume: ${resumeId}`);
    console.log(`[EmbeddingPipeline] Total time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`[EmbeddingPipeline] Processed: ${results.length}`);
    console.log(`[EmbeddingPipeline] Successful: ${successful}`);
    console.log(`[EmbeddingPipeline] Failed: ${failed}`);

    return {
      resumeId,
      totalChunks: chunks.length,
      processed: results.length,
      successful,
      failed,
      skipped: chunks.length - results.length,
      duration,
      errors: results.filter((r) => r.error).map((r) => ({
        chunkId: r.chunkId,
        error: r.error,
      })),
    };
  } catch (error) {
    console.error(`[EmbeddingPipeline] Pipeline failed for resume ${resumeId}:`, error.message);

    // Update resume status to failed
    await updateResumeStatus(resumeId, 'failed', {
      errorMessage: error.message,
    });

    throw error;
  }
};

/**
 * Process all pending resumes
 * Generates embeddings for all resumes with pending status
 * 
 * @param {Object} [options={}] - Processing options
 * @param {number} [options.limit=10] - Maximum resumes to process
 * @returns {Promise<Object>} Processing summary
 * 
 * @example
 * const summary = await processAllPendingResumes({ limit: 5 });
 */
export const processAllPendingResumes = async (options = {}) => {
  const { limit = 10 } = options;

  console.log('\n[EmbeddingPipeline] Processing all pending resumes');

  try {
    // Find resumes with pending embedding status
    const pendingResumes = await Resume.find({
      embeddingStatus: 'pending',
      parsingStatus: 'completed', // Only process parsed resumes
    })
      .limit(limit)
      .sort({ createdAt: 1 }); // Process oldest first

    if (pendingResumes.length === 0) {
      console.log('[EmbeddingPipeline] No pending resumes found');
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        resumes: [],
      };
    }

    console.log(`[EmbeddingPipeline] Found ${pendingResumes.length} pending resumes`);

    const results = [];

    // Process each resume
    for (const resume of pendingResumes) {
      try {
        const result = await generateEmbeddingsForResume(resume._id.toString());
        results.push({
          resumeId: resume._id.toString(),
          fileName: resume.fileName,
          status: 'completed',
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

    const successful = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    console.log(`\n[EmbeddingPipeline] Batch processing complete`);
    console.log(`[EmbeddingPipeline] Processed: ${results.length}`);
    console.log(`[EmbeddingPipeline] Successful: ${successful}`);
    console.log(`[EmbeddingPipeline] Failed: ${failed}`);

    return {
      processed: results.length,
      successful,
      failed,
      resumes: results,
    };
  } catch (error) {
    console.error('[EmbeddingPipeline] Error processing pending resumes:', error.message);
    throw error;
  }
};

/**
 * Reprocess failed embeddings
 * Retries embedding generation for chunks with error status
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Retry result
 */
export const retryFailedEmbeddings = async (resumeId) => {
  console.log(`\n[EmbeddingPipeline] Retrying failed embeddings for resume: ${resumeId}`);

  try {
    // Find failed chunks
    const failedChunks = await ResumeChunk.find({
      resumeId,
      status: 'error',
    });

    if (failedChunks.length === 0) {
      console.log('[EmbeddingPipeline] No failed chunks found');
      return {
        resumeId,
        retried: 0,
        successful: 0,
        failed: 0,
      };
    }

    console.log(`[EmbeddingPipeline] Found ${failedChunks.length} failed chunks`);

    // Reset chunks to pending
    await Promise.all(
      failedChunks.map((chunk) => updateChunkStatus(chunk.chunkId, 'pending'))
    );

    // Reprocess
    const result = await generateEmbeddingsForResume(resumeId);

    return {
      resumeId,
      retried: failedChunks.length,
      successful: result.successful,
      failed: result.failed,
    };
  } catch (error) {
    console.error(`[EmbeddingPipeline] Error retrying failed embeddings:`, error.message);
    throw error;
  }
};

/**
 * Get pipeline statistics
 * 
 * @returns {Promise<Object>} Pipeline statistics
 */
export const getPipelineStats = async () => {
  try {
    // Resume statistics
    const resumeStats = await Resume.aggregate([
      {
        $group: {
          _id: '$embeddingStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Chunk statistics
    const chunkStats = await ResumeChunk.countByStatus();

    // Get resumes with errors
    const failedResumes = await Resume.find({
      embeddingStatus: 'failed',
    })
      .select('_id fileName embeddingError embeddingRetryCount')
      .limit(10);

    return {
      resumes: resumeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      chunks: chunkStats,
      failedResumes: failedResumes.map((r) => ({
        id: r._id.toString(),
        fileName: r.fileName,
        error: r.embeddingError,
        retryCount: r.embeddingRetryCount,
      })),
    };
  } catch (error) {
    console.error('[EmbeddingPipeline] Error getting stats:', error.message);
    throw error;
  }
};

export default {
  generateEmbeddingsForResume,
  processAllPendingResumes,
  retryFailedEmbeddings,
  getPipelineStats,
};
