/**
 * Vector Optimizer Utility
 * Optimizes vector upload operations with batching and deduplication
 * 
 * @module utils/vectorOptimizer
 */

import { upsertVectorsBatch, fetchVectorsBatch } from '../services/vectorService.js';
import { logVector } from './ragLogger.js';

/**
 * Batch configuration
 */
const BATCH_CONFIG = {
  batchSize: parseInt(process.env.VECTOR_BATCH_SIZE || '100', 10),
  maxConcurrent: parseInt(process.env.VECTOR_MAX_CONCURRENT || '3', 10),
  retryDelay: 2000,
  maxRetries: 2,
};

/**
 * Check for duplicate vectors
 * Efficiently check if vectors already exist in Pinecone
 * 
 * @param {string[]} vectorIds - Vector IDs to check
 * @param {string} [namespace] - Namespace to check in
 * @returns {Promise<Set>} Set of existing vector IDs
 */
export const checkDuplicateVectors = async (vectorIds, namespace) => {
  try {
    if (vectorIds.length === 0) {
      return new Set();
    }

    // Fetch vectors in batches
    const existingVectors = await fetchVectorsBatch(vectorIds, namespace);
    const existingIds = new Set(Object.keys(existingVectors));

    if (existingIds.size > 0) {
      logVector.start('deduplication', existingIds.size);
      console.log(`[VectorOptimizer] Found ${existingIds.size} duplicate vectors`);
    }

    return existingIds;
  } catch (error) {
    console.error('[VectorOptimizer] Error checking duplicates:', error.message);
    // Return empty set on error - will attempt upload anyway
    return new Set();
  }
};

/**
 * Upload vectors in optimized batches
 * 
 * @param {Array} vectors - Vectors to upload
 * @param {string} [namespace] - Namespace to upload to
 * @param {Object} [options={}] - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadVectorsOptimized = async (vectors, namespace, options = {}) => {
  const startTime = Date.now();

  try {
    if (vectors.length === 0) {
      return {
        success: true,
        uploaded: 0,
        skipped: 0,
        failed: 0,
      };
    }

    logVector.start('batch-upload', vectors.length);

    // Step 1: Check for duplicates (if not disabled)
    let vectorsToUpload = vectors;
    let skippedCount = 0;

    if (!options.skipDuplicateCheck) {
      const vectorIds = vectors.map((v) => v.id);
      const existingIds = await checkDuplicateVectors(vectorIds, namespace);

      if (existingIds.size > 0) {
        vectorsToUpload = vectors.filter((v) => !existingIds.has(v.id));
        skippedCount = existingIds.size;
        console.log(`[VectorOptimizer] Skipping ${skippedCount} duplicate vectors`);
      }
    }

    if (vectorsToUpload.length === 0) {
      console.log('[VectorOptimizer] All vectors already exist, nothing to upload');
      return {
        success: true,
        uploaded: 0,
        skipped: skippedCount,
        failed: 0,
      };
    }

    // Step 2: Upload in optimized batches
    const results = await uploadInBatches(vectorsToUpload, namespace, options);

    const duration = Date.now() - startTime;
    logVector.batchUpload(results.uploaded, namespace, duration);

    return {
      success: true,
      uploaded: results.uploaded,
      skipped: skippedCount,
      failed: results.failed,
      duration,
    };
  } catch (error) {
    logVector.error('batch-upload', error, { count: vectors.length });
    throw error;
  }
};

/**
 * Upload vectors in batches with retry logic
 * 
 * @param {Array} vectors - Vectors to upload
 * @param {string} namespace - Namespace
 * @param {Object} options - Options
 * @returns {Promise<Object>} Upload result
 */
const uploadInBatches = async (vectors, namespace, options) => {
  const batchSize = options.batchSize || BATCH_CONFIG.batchSize;
  const batches = [];

  // Split into batches
  for (let i = 0; i < vectors.length; i += batchSize) {
    batches.push(vectors.slice(i, i + batchSize));
  }

  console.log(`[VectorOptimizer] Uploading ${vectors.length} vectors in ${batches.length} batches`);

  let uploadedCount = 0;
  let failedCount = 0;
  const failedBatches = [];

  // Process batches with limited concurrency
  for (let i = 0; i < batches.length; i += BATCH_CONFIG.maxConcurrent) {
    const batchGroup = batches.slice(i, i + BATCH_CONFIG.maxConcurrent);
    
    const batchResults = await Promise.allSettled(
      batchGroup.map((batch, idx) => 
        uploadBatchWithRetry(batch, namespace, i + idx + 1, batches.length)
      )
    );

    // Count results
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        uploadedCount += result.value;
      } else {
        failedCount += batchGroup[idx].length;
        failedBatches.push(i + idx + 1);
      }
    });
  }

  if (failedBatches.length > 0) {
    console.error(`[VectorOptimizer] Failed batches: ${failedBatches.join(', ')}`);
  }

  return {
    uploaded: uploadedCount,
    failed: failedCount,
  };
};

/**
 * Upload a single batch with retry logic
 * 
 * @param {Array} batch - Batch of vectors
 * @param {string} namespace - Namespace
 * @param {number} batchNum - Batch number
 * @param {number} totalBatches - Total batches
 * @returns {Promise<number>} Number uploaded
 */
const uploadBatchWithRetry = async (batch, namespace, batchNum, totalBatches) => {
  let lastError;

  for (let attempt = 0; attempt <= BATCH_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(
          `[VectorOptimizer] Retrying batch ${batchNum} (attempt ${attempt + 1}/${BATCH_CONFIG.maxRetries + 1})`
        );
        await new Promise((resolve) => setTimeout(resolve, BATCH_CONFIG.retryDelay * attempt));
      }

      const count = await upsertVectorsBatch(batch, namespace);
      
      console.log(
        `[VectorOptimizer] Batch ${batchNum}/${totalBatches} uploaded: ${count} vectors`
      );

      return count;
    } catch (error) {
      lastError = error;
      console.error(
        `[VectorOptimizer] Batch ${batchNum} failed (attempt ${attempt + 1}):`,
        error.message
      );
    }
  }

  throw lastError;
};

/**
 * Prepare vectors for upload
 * Format chunks into vector format
 * 
 * @param {Array} chunks - Resume chunks with embeddings
 * @returns {Array} Formatted vectors
 */
export const prepareVectorsForUpload = (chunks) => {
  return chunks
    .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
    .map((chunk) => ({
      id: chunk.chunkId,
      embedding: chunk.embedding,
      metadata: {
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
        text: chunk.text,
        createdAt: chunk.createdAt.toISOString(),
      },
    }));
};

/**
 * Validate vectors before upload
 * 
 * @param {Array} vectors - Vectors to validate
 * @returns {Object} Validation result
 */
export const validateVectors = (vectors) => {
  const issues = [];

  vectors.forEach((vector, idx) => {
    if (!vector.id) {
      issues.push(`Vector ${idx}: Missing ID`);
    }

    if (!vector.embedding || !Array.isArray(vector.embedding)) {
      issues.push(`Vector ${idx}: Invalid embedding`);
    }

    if (vector.embedding && vector.embedding.length === 0) {
      issues.push(`Vector ${idx}: Empty embedding`);
    }

    if (!vector.metadata) {
      issues.push(`Vector ${idx}: Missing metadata`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
};

export default {
  checkDuplicateVectors,
  uploadVectorsOptimized,
  prepareVectorsForUpload,
  validateVectors,
};
