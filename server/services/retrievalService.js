/**
 * Retrieval Service
 * Centralized service for semantic retrieval operations
 * Wraps search functionality with improved logging and error handling
 * 
 * @module services/retrievalService
 */

import { searchResume, searchMultipleResumes } from './searchService.js';
import { logSearch, logStructuredError } from '../utils/ragLogger.js';

/**
 * Retrieve relevant chunks for a query
 * Main retrieval function with logging
 * 
 * @param {Object} params - Retrieval parameters
 * @param {string} params.resumeId - Resume identifier
 * @param {string} params.query - Search query
 * @param {string} params.userId - User identifier
 * @param {Object} [params.options={}] - Retrieval options
 * @returns {Promise<Object>} Retrieval results
 */
export const retrieveRelevantChunks = async ({ resumeId, query, userId, options = {} }) => {
  const startTime = Date.now();

  try {
    logSearch.start(resumeId, query);

    const results = await searchResume({
      resumeId,
      query,
      userId,
      options,
    });

    const duration = Date.now() - startTime;

    if (results.totalResults === 0) {
      logSearch.noResults(resumeId, query);
    } else {
      logSearch.success(resumeId, results.totalResults, duration);
    }

    return results;
  } catch (error) {
    logSearch.error(resumeId, error);
    logStructuredError('retrieveRelevantChunks', error, { resumeId, query });
    throw error;
  }
};

/**
 * Retrieve relevant chunks from multiple resumes
 * 
 * @param {Object} params - Retrieval parameters
 * @param {string} params.query - Search query
 * @param {string} params.userId - User identifier
 * @param {Object} [params.options={}] - Retrieval options
 * @returns {Promise<Object>} Retrieval results
 */
export const retrieveFromMultipleResumes = async ({ query, userId, options = {} }) => {
  const startTime = Date.now();

  try {
    const results = await searchMultipleResumes({
      query,
      userId,
      options,
    });

    const duration = Date.now() - startTime;

    return {
      ...results,
      retrievalDuration: duration,
    };
  } catch (error) {
    logStructuredError('retrieveFromMultipleResumes', error, { query, userId });
    throw error;
  }
};

/**
 * Format retrieved chunks for chat context
 * Prepares chunks to be used as context in RAG chat
 * 
 * @param {Array} chunks - Retrieved chunks
 * @param {Object} [options={}] - Formatting options
 * @returns {string} Formatted context
 */
export const formatChunksForContext = (chunks, options = {}) => {
  const maxLength = options.maxLength || 4000;
  const includeScores = options.includeScores !== false;
  const includeSections = options.includeSections !== false;

  let context = '';
  let currentLength = 0;

  for (const chunk of chunks) {
    // Format chunk header
    let chunkText = '';

    if (includeSections) {
      chunkText += `[${chunk.sectionName}]\n`;
    }

    if (includeScores) {
      chunkText += `[Relevance: ${(chunk.score * 100).toFixed(1)}%]\n`;
    }

    chunkText += `${chunk.text}\n\n`;

    // Check if adding this chunk would exceed max length
    if (currentLength + chunkText.length > maxLength) {
      break;
    }

    context += chunkText;
    currentLength += chunkText.length;
  }

  return context.trim();
};

/**
 * Get context for RAG chat
 * Retrieves and formats chunks for use in chat
 * 
 * @param {Object} params - Context parameters
 * @param {string} params.resumeId - Resume identifier
 * @param {string} params.query - User query
 * @param {string} params.userId - User identifier
 * @param {Object} [params.options={}] - Options
 * @returns {Promise<Object>} Context data
 */
export const getContextForChat = async ({ resumeId, query, userId, options = {} }) => {
  try {
    // Retrieve relevant chunks
    const topK = options.topK || 5;
    const results = await retrieveRelevantChunks({
      resumeId,
      query,
      userId,
      options: { topK },
    });

    // Format for context
    const context = formatChunksForContext(results.results, {
      maxLength: options.maxContextLength,
      includeScores: options.includeScores,
      includeSections: options.includeSections,
    });

    return {
      context,
      chunks: results.results,
      totalResults: results.totalResults,
      resumeId,
      query,
    };
  } catch (error) {
    logStructuredError('getContextForChat', error, { resumeId, query });
    throw error;
  }
};

/**
 * Validate retrieval readiness
 * Check if resume is ready for retrieval
 * 
 * @param {Object} resume - Resume document
 * @returns {Object} Validation result
 */
export const validateRetrievalReadiness = (resume) => {
  const issues = [];

  if (resume.parsingStatus !== 'completed') {
    issues.push('Resume parsing is not completed');
  }

  if (resume.embeddingStatus !== 'completed') {
    issues.push('Resume embeddings are not generated');
  }

  return {
    ready: issues.length === 0,
    issues,
  };
};

export default {
  retrieveRelevantChunks,
  retrieveFromMultipleResumes,
  formatChunksForContext,
  getContextForChat,
  validateRetrievalReadiness,
};
