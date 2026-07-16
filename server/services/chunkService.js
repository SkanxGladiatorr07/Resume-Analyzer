/**
 * Chunk Service
 * Centralized service for resume chunking operations
 * Refactored from chunkingService.js with improved logging and error handling
 * 
 * @module services/chunkService
 */

import Resume from '../models/Resume.js';
import ResumeChunk from '../models/ResumeChunk.js';
import { chunkResume } from './chunkingService.js';
import { logChunking, logStructuredError } from '../utils/ragLogger.js';

/**
 * Generate chunks for a resume
 * Main function to create and save resume chunks
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Chunking result
 */
export const generateChunksForResume = async (resumeId) => {
  const startTime = Date.now();

  try {
    logChunking.start(resumeId, 'Starting chunk generation');

    // Get resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // Validate resume is parsed
    if (resume.parsingStatus !== 'completed') {
      throw new Error('Resume must be parsed before chunking');
    }

    if (!resume.extractedText) {
      throw new Error('Resume has no extracted text');
    }

    // Check if chunks already exist
    const existingChunks = await ResumeChunk.countDocuments({ resumeId });
    if (existingChunks > 0) {
      logChunking.warning(resumeId, `${existingChunks} chunks already exist`);
      return {
        success: true,
        resumeId,
        chunksCreated: 0,
        chunksExisting: existingChunks,
        skipped: true,
        message: 'Chunks already exist',
      };
    }

    // Generate chunks
    logChunking.debug(resumeId, 'Generating chunks from text', {
      textLength: resume.extractedText.length,
    });

    const chunks = chunkResume(resume);

    // Save chunks to database
    const chunkDocuments = chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      resumeId: resume._id,
      userId: resume.user,
      text: chunk.text,
      sectionName: chunk.sectionName,
      subsection: chunk.subsection,
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      startOffset: chunk.startOffset,
      endOffset: chunk.endOffset,
      chunkSize: chunk.chunkSize,
      fileName: chunk.fileName,
      documentType: chunk.documentType,
      status: 'pending',
    }));

    await ResumeChunk.insertMany(chunkDocuments);

    const duration = Date.now() - startTime;
    logChunking.success(resumeId, chunks.length, duration);

    return {
      success: true,
      resumeId,
      chunksCreated: chunks.length,
      chunksExisting: 0,
      duration,
    };
  } catch (error) {
    logChunking.error(resumeId, error);
    logStructuredError('generateChunksForResume', error, { resumeId });
    throw error;
  }
};

/**
 * Check if resume has chunks
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<boolean>}
 */
export const hasChunks = async (resumeId) => {
  const count = await ResumeChunk.countDocuments({ resumeId });
  return count > 0;
};

/**
 * Get chunk statistics for resume
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<Object>} Chunk statistics
 */
export const getChunkStats = async (resumeId) => {
  const chunks = await ResumeChunk.find({ resumeId });

  const stats = {
    total: chunks.length,
    byStatus: {},
    bySection: {},
  };

  chunks.forEach((chunk) => {
    // Count by status
    stats.byStatus[chunk.status] = (stats.byStatus[chunk.status] || 0) + 1;

    // Count by section
    stats.bySection[chunk.sectionName] =
      (stats.bySection[chunk.sectionName] || 0) + 1;
  });

  return stats;
};

/**
 * Delete chunks for resume
 * 
 * @param {string} resumeId - Resume identifier
 * @returns {Promise<number>} Number of chunks deleted
 */
export const deleteChunksForResume = async (resumeId) => {
  const result = await ResumeChunk.deleteMany({ resumeId });
  logChunking.debug(resumeId, 'Deleted chunks', { count: result.deletedCount });
  return result.deletedCount;
};

/**
 * Get chunks for resume
 * 
 * @param {string} resumeId - Resume identifier
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Array>} Chunks
 */
export const getChunksForResume = async (resumeId, options = {}) => {
  const query = { resumeId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.sectionName) {
    query.sectionName = options.sectionName;
  }

  const chunks = await ResumeChunk.find(query).sort({
    sectionName: 1,
    chunkIndex: 1,
  });

  return chunks;
};

export default {
  generateChunksForResume,
  hasChunks,
  getChunkStats,
  deleteChunksForResume,
  getChunksForResume,
};
