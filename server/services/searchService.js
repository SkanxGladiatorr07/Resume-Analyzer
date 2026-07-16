/**
 * Semantic Search Service
 * Service for semantic retrieval of resume chunks using vector embeddings
 * 
 * This service provides:
 * - Query embedding generation
 * - Vector similarity search in Pinecone
 * - Results filtering and formatting
 * - User-scoped search (security)
 * 
 * @module services/searchService
 */

import { generateQueryEmbedding } from './embeddingService.js';
import { querySimilarVectors } from './vectorService.js';
import ResumeChunk from '../models/ResumeChunk.js';
import Resume from '../models/Resume.js';

/**
 * Search configuration
 */
const SEARCH_CONFIG = {
  defaultTopK: 5,
  maxTopK: 20,
  minSimilarityScore: 0.0, // Accept all results
  namespace: process.env.PINECONE_NAMESPACE || 'resume-chunks',
};

/**
 * Search result structure
 * @typedef {Object} SearchResult
 * @property {string} chunkId - Chunk identifier
 * @property {number} score - Similarity score (0-1)
 * @property {string} sectionName - Section name
 * @property {string} text - Chunk text content
 * @property {number} chunkIndex - Chunk position in section
 * @property {string} subsection - Subsection identifier
 * @property {Object} metadata - Additional metadata
 */

/**
 * Validate search query
 * 
 * @param {string} query - Search query
 * @throws {Error} If query is invalid
 */
const validateQuery = (query) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    throw new Error('Query cannot be empty');
  }

  if (trimmedQuery.length < 2) {
    throw new Error('Query must be at least 2 characters long');
  }

  if (trimmedQuery.length > 1000) {
    throw new Error('Query cannot exceed 1000 characters');
  }

  return trimmedQuery;
};

/**
 * Validate resume access
 * Ensures resume exists and belongs to the user
 * 
 * @param {string} resumeId - Resume identifier
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Resume document
 * @throws {Error} If resume not found or access denied
 */
const validateResumeAccess = async (resumeId, userId) => {
  const resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new Error('Resume not found');
  }

  // Check ownership
  if (resume.user.toString() !== userId.toString()) {
    throw new Error('Access denied. This resume does not belong to you.');
  }

  // Check if embeddings are ready
  if (resume.embeddingStatus !== 'completed') {
    const statusMessages = {
      pending: 'Resume embeddings are pending generation',
      processing: 'Resume embeddings are currently being generated',
      failed: 'Resume embedding generation failed',
    };

    throw new Error(
      statusMessages[resume.embeddingStatus] ||
        'Resume embeddings are not available for search'
    );
  }

  return resume;
};

/**
 * Format search results
 * Transforms vector search results into user-friendly format
 * 
 * @param {Array} matches - Pinecone search matches
 * @param {number} topK - Number of results requested
 * @returns {SearchResult[]} Formatted search results
 */
const formatSearchResults = (matches, topK) => {
  if (!matches || matches.length === 0) {
    return [];
  }

  return matches
    .filter((match) => match.score >= SEARCH_CONFIG.minSimilarityScore)
    .slice(0, topK)
    .map((match) => ({
      chunkId: match.metadata.chunkId,
      score: match.score,
      sectionName: match.metadata.sectionName,
      text: match.metadata.text,
      chunkIndex: match.metadata.chunkIndex,
      subsection: match.metadata.subsection || null,
      metadata: {
        fileName: match.metadata.fileName,
        totalChunks: match.metadata.totalChunks,
        documentType: match.metadata.documentType,
      },
    }))
    .sort((a, b) => b.score - a.score); // Sort by score descending
};

/**
 * Search resume by semantic similarity
 * Main search function that handles the complete search workflow
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.resumeId - Resume identifier
 * @param {string} params.query - Search query
 * @param {string} params.userId - User identifier (for access control)
 * @param {Object} [params.options={}] - Search options
 * @param {number} [params.options.topK=5] - Number of results to return
 * @param {string[]} [params.options.sections] - Filter by specific sections
 * @returns {Promise<Object>} Search results with metadata
 * @throws {Error} If search fails
 * 
 * @example
 * const results = await searchResume({
 *   resumeId: '65abc123...',
 *   query: 'Python machine learning experience',
 *   userId: 'user123',
 *   options: { topK: 5 }
 * });
 */
export const searchResume = async ({ resumeId, query, userId, options = {} }) => {
  const startTime = Date.now();

  try {
    console.log(`[Search] Starting search for resume: ${resumeId}`);
    console.log(`[Search] Query: "${query}"`);

    // Step 1: Validate query
    const validatedQuery = validateQuery(query);

    // Step 2: Validate resume access and status
    const resume = await validateResumeAccess(resumeId, userId);

    // Step 3: Parse options
    const topK = Math.min(
      options.topK || SEARCH_CONFIG.defaultTopK,
      SEARCH_CONFIG.maxTopK
    );
    const sectionFilter = options.sections;

    // Step 4: Generate query embedding
    console.log(`[Search] Generating query embedding...`);
    const queryEmbedding = await generateQueryEmbedding(validatedQuery);

    // Step 5: Prepare Pinecone filter
    const filter = {
      resumeId: resumeId,
      userId: userId,
    };

    // Add section filter if specified
    if (sectionFilter && Array.isArray(sectionFilter) && sectionFilter.length > 0) {
      filter.sectionName = { $in: sectionFilter };
    }

    // Step 6: Search in Pinecone
    console.log(`[Search] Searching Pinecone (topK: ${topK})...`);
    const matches = await querySimilarVectors(queryEmbedding, {
      topK: topK * 2, // Fetch more to filter
      filter,
      namespace: SEARCH_CONFIG.namespace,
      includeMetadata: true,
      includeValues: false,
    });

    // Step 7: Format results
    const results = formatSearchResults(matches, topK);

    const duration = Date.now() - startTime;

    console.log(`[Search] Found ${results.length} results in ${duration}ms`);

    // Step 8: Return response
    return {
      success: true,
      query: validatedQuery,
      resumeId,
      fileName: resume.fileName,
      totalResults: results.length,
      results,
      metadata: {
        topK,
        searchDuration: duration,
        embeddingStatus: resume.embeddingStatus,
        sections: sectionFilter || 'all',
      },
    };
  } catch (error) {
    console.error(`[Search] Error:`, error.message);
    throw error;
  }
};

/**
 * Search across multiple resumes (user's resume collection)
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string} params.userId - User identifier
 * @param {Object} [params.options={}] - Search options
 * @param {number} [params.options.topK=5] - Results per resume
 * @param {string[]} [params.options.resumeIds] - Specific resumes to search
 * @returns {Promise<Object>} Search results grouped by resume
 * 
 * @example
 * const results = await searchMultipleResumes({
 *   query: 'software engineering',
 *   userId: 'user123',
 *   options: { topK: 3 }
 * });
 */
export const searchMultipleResumes = async ({ query, userId, options = {} }) => {
  const startTime = Date.now();

  try {
    console.log(`[Search] Multi-resume search for user: ${userId}`);
    console.log(`[Search] Query: "${query}"`);

    // Step 1: Validate query
    const validatedQuery = validateQuery(query);

    // Step 2: Get user's resumes
    const resumeFilter = {
      user: userId,
      embeddingStatus: 'completed',
    };

    // Filter by specific resumes if provided
    if (options.resumeIds && Array.isArray(options.resumeIds)) {
      resumeFilter._id = { $in: options.resumeIds };
    }

    const resumes = await Resume.find(resumeFilter).select('_id fileName');

    if (resumes.length === 0) {
      return {
        success: true,
        query: validatedQuery,
        totalResumes: 0,
        results: [],
        metadata: {
          searchDuration: Date.now() - startTime,
        },
      };
    }

    // Step 3: Generate query embedding once
    console.log(`[Search] Generating query embedding...`);
    const queryEmbedding = await generateQueryEmbedding(validatedQuery);

    const topK = options.topK || SEARCH_CONFIG.defaultTopK;

    // Step 4: Search each resume
    const searchPromises = resumes.map(async (resume) => {
      const filter = {
        resumeId: resume._id.toString(),
        userId: userId,
      };

      const matches = await querySimilarVectors(queryEmbedding, {
        topK,
        filter,
        namespace: SEARCH_CONFIG.namespace,
        includeMetadata: true,
        includeValues: false,
      });

      const results = formatSearchResults(matches, topK);

      return {
        resumeId: resume._id.toString(),
        fileName: resume.fileName,
        results,
        totalResults: results.length,
      };
    });

    const resumeResults = await Promise.all(searchPromises);

    const duration = Date.now() - startTime;

    // Filter out resumes with no results
    const filteredResults = resumeResults.filter((r) => r.totalResults > 0);

    console.log(
      `[Search] Found results in ${filteredResults.length}/${resumes.length} resumes in ${duration}ms`
    );

    return {
      success: true,
      query: validatedQuery,
      totalResumes: filteredResults.length,
      results: filteredResults,
      metadata: {
        topK,
        searchDuration: duration,
        resumesSearched: resumes.length,
      },
    };
  } catch (error) {
    console.error(`[Search] Multi-resume search error:`, error.message);
    throw error;
  }
};

/**
 * Get search suggestions based on resume content
 * Returns common sections and topics from the resume
 * 
 * @param {string} resumeId - Resume identifier
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Search suggestions
 */
export const getSearchSuggestions = async (resumeId, userId) => {
  try {
    // Validate access
    await validateResumeAccess(resumeId, userId);

    // Get all chunks for this resume
    const chunks = await ResumeChunk.find({
      resumeId,
      status: 'indexed',
    }).select('sectionName subsection');

    // Group by section
    const sectionCounts = {};
    chunks.forEach((chunk) => {
      const section = chunk.sectionName;
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    });

    // Generate suggestions
    const suggestions = Object.keys(sectionCounts).map((section) => ({
      section,
      chunkCount: sectionCounts[section],
      suggestedQueries: generateQueriesForSection(section),
    }));

    return {
      success: true,
      resumeId,
      sections: suggestions,
      totalSections: suggestions.length,
    };
  } catch (error) {
    console.error(`[Search] Error getting suggestions:`, error.message);
    throw error;
  }
};

/**
 * Generate sample queries for a section
 * 
 * @param {string} section - Section name
 * @returns {string[]} Sample queries
 */
const generateQueriesForSection = (section) => {
  const queryMap = {
    EXPERIENCE: [
      'What work experience do I have?',
      'What companies have I worked for?',
      'What are my job responsibilities?',
    ],
    SKILLS: [
      'What technical skills do I have?',
      'What programming languages do I know?',
      'What tools and frameworks am I familiar with?',
    ],
    EDUCATION: [
      'What is my educational background?',
      'What degrees do I have?',
      'Where did I study?',
    ],
    PROJECTS: [
      'What projects have I worked on?',
      'What technologies did I use in my projects?',
      'What problems did my projects solve?',
    ],
    CERTIFICATIONS: [
      'What certifications do I have?',
      'What professional credentials do I hold?',
    ],
    SUMMARY: [
      'What is my professional summary?',
      'What are my key strengths?',
      'What is my career objective?',
    ],
  };

  return queryMap[section] || [`Tell me about ${section.toLowerCase()}`];
};

/**
 * Get search statistics for a resume
 * 
 * @param {string} resumeId - Resume identifier
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Search statistics
 */
export const getSearchStats = async (resumeId, userId) => {
  try {
    // Validate access
    const resume = await validateResumeAccess(resumeId, userId);

    // Get chunk statistics
    const chunks = await ResumeChunk.find({
      resumeId,
      status: 'indexed',
    }).select('sectionName chunkSize');

    const stats = {
      resumeId,
      fileName: resume.fileName,
      embeddingStatus: resume.embeddingStatus,
      totalChunks: chunks.length,
      sections: {},
      searchable: resume.embeddingStatus === 'completed' && chunks.length > 0,
    };

    // Group by section
    chunks.forEach((chunk) => {
      const section = chunk.sectionName;
      if (!stats.sections[section]) {
        stats.sections[section] = {
          count: 0,
          totalSize: 0,
        };
      }
      stats.sections[section].count++;
      stats.sections[section].totalSize += chunk.chunkSize;
    });

    return stats;
  } catch (error) {
    console.error(`[Search] Error getting stats:`, error.message);
    throw error;
  }
};

export default {
  searchResume,
  searchMultipleResumes,
  getSearchSuggestions,
  getSearchStats,
};
