/**
 * Chunk Utilities
 * Helper functions for chunk management and operations
 * 
 * @module utils/chunkUtils
 */

import ResumeChunk from '../models/ResumeChunk.js';

/**
 * Save chunks to database
 * Stores resume chunks in MongoDB
 * 
 * @param {Array<Object>} chunks - Array of chunk objects from chunkingService
 * @returns {Promise<Array>} Array of saved chunk documents
 * @throws {Error} If save operation fails
 * 
 * @example
 * const savedChunks = await saveChunks(chunks);
 * console.log(`Saved ${savedChunks.length} chunks`);
 */
export const saveChunks = async (chunks) => {
  try {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error('Chunks must be a non-empty array');
    }

    // Transform chunks to database format
    const chunkDocs = chunks.map((chunk) => ({
      chunkId: chunk.id,
      resumeId: chunk.metadata.resumeId,
      userId: chunk.metadata.userId,
      text: chunk.text,
      sectionName: chunk.metadata.sectionName,
      subsection: chunk.metadata.subsection,
      chunkIndex: chunk.metadata.chunkIndex,
      totalChunks: chunk.metadata.totalChunks,
      startOffset: chunk.metadata.startOffset,
      endOffset: chunk.metadata.endOffset,
      chunkSize: chunk.metadata.chunkSize || chunk.text.length,
      fileName: chunk.metadata.fileName,
      documentType: chunk.metadata.documentType || 'resume_chunk',
      status: 'pending',
    }));

    // Bulk insert chunks
    const savedChunks = await ResumeChunk.insertMany(chunkDocs, {
      ordered: false, // Continue on duplicates
    });

    console.log(`[ChunkUtils] Saved ${savedChunks.length} chunks to database`);
    return savedChunks;
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.warn('[ChunkUtils] Some chunks already exist, skipping duplicates');
      // Return existing chunks
      const chunkIds = chunks.map((c) => c.id);
      return await ResumeChunk.find({ chunkId: { $in: chunkIds } });
    }

    console.error('[ChunkUtils] Error saving chunks:', error.message);
    throw new Error(`Failed to save chunks: ${error.message}`);
  }
};

/**
 * Load chunks from database
 * Retrieves chunks for a resume
 * 
 * @param {string} resumeId - Resume identifier
 * @param {Object} [options={}] - Query options
 * @param {string} [options.sectionName] - Filter by section
 * @param {string} [options.status] - Filter by status
 * @returns {Promise<Array>} Array of chunk documents
 * 
 * @example
 * const chunks = await loadChunks(resumeId, { sectionName: 'EXPERIENCE' });
 */
export const loadChunks = async (resumeId, options = {}) => {
  try {
    const query = { resumeId };

    if (options.sectionName) {
      query.sectionName = options.sectionName;
    }

    if (options.status) {
      query.status = options.status;
    }

    const chunks = await ResumeChunk.find(query).sort({
      sectionName: 1,
      chunkIndex: 1,
    });

    return chunks;
  } catch (error) {
    console.error('[ChunkUtils] Error loading chunks:', error.message);
    throw new Error(`Failed to load chunks: ${error.message}`);
  }
};

/**
 * Delete chunks for a resume
 * Removes all chunks associated with a resume
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Delete result with count
 * 
 * @example
 * const result = await deleteChunks(resumeId);
 * console.log(`Deleted ${result.deletedCount} chunks`);
 */
export const deleteChunks = async (resumeId) => {
  try {
    const result = await ResumeChunk.deleteByResumeId(resumeId);

    console.log(`[ChunkUtils] Deleted ${result.deletedCount} chunks for resume ${resumeId}`);
    return result;
  } catch (error) {
    console.error('[ChunkUtils] Error deleting chunks:', error.message);
    throw new Error(`Failed to delete chunks: ${error.message}`);
  }
};

/**
 * Update chunk status
 * Updates the status of a chunk
 * 
 * @param {string} chunkId - Chunk identifier
 * @param {string} status - New status ('pending', 'embedded', 'indexed', 'error')
 * @param {Object} [additionalData={}] - Additional data to update
 * @returns {Promise<Object>} Updated chunk document
 * 
 * @example
 * await updateChunkStatus(chunkId, 'embedded', {
 *   embedding: [...],
 *   embeddingModel: 'text-embedding-004'
 * });
 */
export const updateChunkStatus = async (chunkId, status, additionalData = {}) => {
  try {
    const updateData = { status, ...additionalData };

    const chunk = await ResumeChunk.findOneAndUpdate(
      { chunkId },
      { $set: updateData },
      { new: true }
    );

    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }

    return chunk;
  } catch (error) {
    console.error('[ChunkUtils] Error updating chunk status:', error.message);
    throw new Error(`Failed to update chunk status: ${error.message}`);
  }
};

/**
 * Get chunk statistics for a resume
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Chunk statistics
 * 
 * @example
 * const stats = await getChunkStats(resumeId);
 * console.log(`Total chunks: ${stats.totalChunks}`);
 * console.log(`By section:`, stats.bySectionName);
 */
export const getChunkStats = async (resumeId) => {
  try {
    const chunks = await ResumeChunk.findByResumeId(resumeId);

    const stats = {
      totalChunks: chunks.length,
      bySectionName: {},
      byStatus: {},
      totalSize: 0,
      avgChunkSize: 0,
    };

    chunks.forEach((chunk) => {
      // Count by section
      if (!stats.bySectionName[chunk.sectionName]) {
        stats.bySectionName[chunk.sectionName] = 0;
      }
      stats.bySectionName[chunk.sectionName]++;

      // Count by status
      if (!stats.byStatus[chunk.status]) {
        stats.byStatus[chunk.status] = 0;
      }
      stats.byStatus[chunk.status]++;

      // Calculate size
      stats.totalSize += chunk.chunkSize;
    });

    if (chunks.length > 0) {
      stats.avgChunkSize = Math.round(stats.totalSize / chunks.length);
    }

    return stats;
  } catch (error) {
    console.error('[ChunkUtils] Error getting chunk stats:', error.message);
    throw new Error(`Failed to get chunk stats: ${error.message}`);
  }
};

/**
 * Find chunks ready for embedding
 * Returns chunks that are pending and need embedding
 * 
 * @param {number} [limit=100] - Maximum number of chunks to return
 * @returns {Promise<Array>} Array of pending chunk documents
 * 
 * @example
 * const pendingChunks = await findChunksForEmbedding(50);
 * for (const chunk of pendingChunks) {
 *   await generateAndStoreEmbedding(chunk);
 * }
 */
export const findChunksForEmbedding = async (limit = 100) => {
  try {
    const chunks = await ResumeChunk.findPending(limit);
    return chunks;
  } catch (error) {
    console.error('[ChunkUtils] Error finding chunks for embedding:', error.message);
    throw new Error(`Failed to find chunks for embedding: ${error.message}`);
  }
};

/**
 * Group chunks by section
 * Organizes chunks by their section name
 * 
 * @param {Array<Object>} chunks - Array of chunk documents
 * @returns {Object} Chunks grouped by section name
 * 
 * @example
 * const grouped = groupChunksBySection(chunks);
 * console.log(`Experience chunks: ${grouped.EXPERIENCE.length}`);
 */
export const groupChunksBySection = (chunks) => {
  const grouped = {};

  chunks.forEach((chunk) => {
    const section = chunk.sectionName || 'OTHER';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(chunk);
  });

  // Sort chunks within each section
  Object.keys(grouped).forEach((section) => {
    grouped[section].sort((a, b) => a.chunkIndex - b.chunkIndex);
  });

  return grouped;
};

/**
 * Reconstruct full text from chunks
 * Combines chunks back into complete text
 * 
 * @param {Array<Object>} chunks - Array of chunk documents
 * @returns {string} Reconstructed full text
 * 
 * @example
 * const fullText = reconstructTextFromChunks(chunks);
 */
export const reconstructTextFromChunks = (chunks) => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return '';
  }

  // Sort by section and chunk index
  const sorted = [...chunks].sort((a, b) => {
    if (a.sectionName !== b.sectionName) {
      return a.sectionName.localeCompare(b.sectionName);
    }
    return a.chunkIndex - b.chunkIndex;
  });

  return sorted.map((chunk) => chunk.text).join('\n\n');
};

/**
 * Validate chunk data before saving
 * 
 * @param {Object} chunk - Chunk object to validate
 * @returns {Object} Validation result
 * 
 * @example
 * const validation = validateChunkData(chunk);
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 */
export const validateChunkData = (chunk) => {
  const errors = [];

  if (!chunk.id) {
    errors.push('Chunk ID is required');
  }

  if (!chunk.text || chunk.text.trim().length === 0) {
    errors.push('Chunk text is required');
  }

  if (!chunk.metadata) {
    errors.push('Chunk metadata is required');
  } else {
    const requiredMetadata = [
      'resumeId',
      'userId',
      'sectionName',
      'chunkIndex',
      'totalChunks',
      'fileName',
    ];

    requiredMetadata.forEach((field) => {
      if (!chunk.metadata[field] && chunk.metadata[field] !== 0) {
        errors.push(`Metadata field '${field}' is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Calculate total storage size for chunks
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Storage size information
 * 
 * @example
 * const storage = await calculateChunkStorage(resumeId);
 * console.log(`Total: ${storage.totalBytes} bytes`);
 */
export const calculateChunkStorage = async (resumeId) => {
  try {
    const chunks = await ResumeChunk.findByResumeId(resumeId);

    const totalBytes = chunks.reduce((sum, chunk) => {
      return sum + (chunk.text?.length || 0);
    }, 0);

    return {
      totalChunks: chunks.length,
      totalBytes,
      totalKB: (totalBytes / 1024).toFixed(2),
      totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
      avgBytesPerChunk: chunks.length > 0 ? Math.round(totalBytes / chunks.length) : 0,
    };
  } catch (error) {
    console.error('[ChunkUtils] Error calculating storage:', error.message);
    throw new Error(`Failed to calculate chunk storage: ${error.message}`);
  }
};

export default {
  saveChunks,
  loadChunks,
  deleteChunks,
  updateChunkStatus,
  getChunkStats,
  findChunksForEmbedding,
  groupChunksBySection,
  reconstructTextFromChunks,
  validateChunkData,
  calculateChunkStorage,
};
