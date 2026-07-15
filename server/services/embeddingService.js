/**
 * Embedding Service
 * Service for generating vector embeddings from text using OpenAI
 * 
 * This service provides a centralized way to generate embeddings for:
 * - Resume content
 * - Job descriptions
 * - Analysis results
 * - Search queries
 * 
 * @module services/embeddingService
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Embedding configuration
 * @typedef {Object} EmbeddingConfig
 * @property {string} model - Model name for embeddings
 * @property {number} dimension - Vector dimension
 * @property {number} batchSize - Maximum batch size for embedding generation
 * @property {number} maxRetries - Maximum retry attempts for failed requests
 */

/**
 * Get embedding configuration from environment variables
 * 
 * @returns {EmbeddingConfig} Embedding configuration
 * @throws {Error} If required API key is missing
 */
const getEmbeddingConfig = () => {
  const config = {
    model: process.env.EMBEDDING_MODEL || 'text-embedding-004',
    dimension: parseInt(process.env.EMBEDDING_DIMENSION || '768', 10),
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '100', 10),
    maxRetries: parseInt(process.env.EMBEDDING_MAX_RETRIES || '3', 10),
  };

  // Validate API key
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required for embedding generation');
  }

  return config;
};

/**
 * Gemini AI client instance (singleton)
 * @type {GoogleGenerativeAI|null}
 */
let genAI = null;

/**
 * Initialize Gemini AI client
 * 
 * @returns {GoogleGenerativeAI} Initialized Gemini AI client
 */
const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Generate embedding for a single text
 * Uses Google's embedding model to convert text to vector representation
 * 
 * @param {string} text - Text to generate embedding for
 * @param {Object} [options={}] - Generation options
 * @param {string} [options.taskType='RETRIEVAL_DOCUMENT'] - Task type for embedding
 * @param {string} [options.title] - Optional title for the text
 * @returns {Promise<number[]>} Vector embedding
 * @throws {Error} If embedding generation fails
 * 
 * @example
 * const embedding = await generateEmbedding(
 *   "Software engineer with 5 years of experience"
 * );
 * console.log(embedding.length); // 768
 */
export const generateEmbedding = async (text, options = {}) => {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text must be a non-empty string');
    }

    const config = getEmbeddingConfig();
    const ai = getGenAI();

    // Get the embedding model
    const model = ai.getGenerativeModel({
      model: config.model,
    });

    // Prepare content for embedding
    const taskType = options.taskType || 'RETRIEVAL_DOCUMENT';
    const content = {
      content: {
        parts: [{ text: text.trim() }],
      },
      taskType,
    };

    // Add optional title
    if (options.title) {
      content.title = options.title;
    }

    // Generate embedding
    const result = await model.embedContent(content);
    const embedding = result.embedding.values;

    // Validate embedding dimension
    if (embedding.length !== config.dimension) {
      console.warn(
        `[Embedding] Expected dimension ${config.dimension}, got ${embedding.length}`
      );
    }

    return embedding;
  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embeddings for multiple texts in batch
 * Processes texts in batches to optimize API usage
 * 
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @param {Object} [options={}] - Generation options
 * @returns {Promise<Array<{text: string, embedding: number[], index: number}>>} Array of embeddings with metadata
 * @throws {Error} If batch embedding generation fails
 * 
 * @example
 * const embeddings = await generateEmbeddingsBatch([
 *   "Resume text 1",
 *   "Resume text 2",
 *   "Resume text 3"
 * ]);
 * console.log(embeddings[0].embedding);
 */
export const generateEmbeddingsBatch = async (texts, options = {}) => {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    const config = getEmbeddingConfig();
    const results = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += config.batchSize) {
      const batch = texts.slice(i, i + config.batchSize);
      console.log(
        `[Embedding] Processing batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(texts.length / config.batchSize)}`
      );

      // Generate embeddings for batch with retry logic
      const batchResults = await Promise.all(
        batch.map(async (text, batchIndex) => {
          const globalIndex = i + batchIndex;
          let lastError;

          // Retry logic
          for (let attempt = 0; attempt < config.maxRetries; attempt++) {
            try {
              const embedding = await generateEmbedding(text, options);
              return {
                text,
                embedding,
                index: globalIndex,
              };
            } catch (error) {
              lastError = error;
              console.warn(
                `[Embedding] Retry ${attempt + 1}/${config.maxRetries} for text at index ${globalIndex}`
              );
              // Wait before retry (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, attempt) * 1000)
              );
            }
          }

          // All retries failed
          throw new Error(
            `Failed to generate embedding for text at index ${globalIndex} after ${config.maxRetries} attempts: ${lastError.message}`
          );
        })
      );

      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error('[Embedding] Error in batch embedding generation:', error.message);
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
};

/**
 * Generate embedding for search query
 * Uses query-specific task type for better search results
 * 
 * @param {string} query - Search query text
 * @returns {Promise<number[]>} Query embedding vector
 * @throws {Error} If query embedding generation fails
 * 
 * @example
 * const queryEmbedding = await generateQueryEmbedding(
 *   "Find resumes with Python experience"
 * );
 */
export const generateQueryEmbedding = async (query) => {
  return generateEmbedding(query, {
    taskType: 'RETRIEVAL_QUERY',
  });
};

/**
 * Estimate token count for text
 * Rough estimation based on character count
 * 
 * @param {string} text - Text to estimate tokens for
 * @returns {number} Estimated token count
 * 
 * @example
 * const tokens = estimateTokenCount("Hello world");
 * console.log(tokens); // ~2
 */
export const estimateTokenCount = (text) => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
};

/**
 * Calculate embedding generation cost
 * Estimates cost based on token count (for planning purposes)
 * 
 * @param {number} tokenCount - Number of tokens
 * @param {string} [model='text-embedding-004'] - Model name
 * @returns {number} Estimated cost in USD
 * 
 * @example
 * const tokens = estimateTokenCount(text);
 * const cost = calculateEmbeddingCost(tokens);
 * console.log(`Estimated cost: $${cost.toFixed(6)}`);
 */
export const calculateEmbeddingCost = (tokenCount, model = 'text-embedding-004') => {
  // Google Gemini embedding pricing (as of 2024)
  // text-embedding-004: Free up to certain limits
  // For planning purposes, assume nominal cost
  const costPerMillionTokens = 0.0; // Currently free

  return (tokenCount / 1000000) * costPerMillionTokens;
};

/**
 * Validate embedding vector
 * Checks if embedding has valid format and values
 * 
 * @param {number[]} embedding - Embedding vector to validate
 * @returns {boolean} True if embedding is valid
 * 
 * @example
 * if (validateEmbedding(embedding)) {
 *   await storeEmbedding(embedding);
 * }
 */
export const validateEmbedding = (embedding) => {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length === 0) {
    return false;
  }

  // Check if all values are numbers
  return embedding.every((value) => typeof value === 'number' && !isNaN(value));
};

/**
 * Normalize embedding vector
 * Normalizes vector to unit length (for cosine similarity)
 * 
 * @param {number[]} embedding - Embedding vector to normalize
 * @returns {number[]} Normalized embedding vector
 * 
 * @example
 * const normalized = normalizeEmbedding(embedding);
 */
export const normalizeEmbedding = (embedding) => {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));

  if (magnitude === 0) {
    return embedding;
  }

  return embedding.map((val) => val / magnitude);
};

/**
 * Calculate cosine similarity between two embeddings
 * 
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} Cosine similarity score (0-1)
 * @throws {Error} If embeddings have different dimensions
 * 
 * @example
 * const similarity = calculateCosineSimilarity(
 *   resumeEmbedding,
 *   jobEmbedding
 * );
 * console.log(`Similarity: ${(similarity * 100).toFixed(2)}%`);
 */
export const calculateCosineSimilarity = (embedding1, embedding2) => {
  if (embedding1.length !== embedding2.length) {
    throw new Error(
      `Embeddings must have same dimension. Got ${embedding1.length} and ${embedding2.length}`
    );
  }

  const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
};

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateQueryEmbedding,
  estimateTokenCount,
  calculateEmbeddingCost,
  validateEmbedding,
  normalizeEmbedding,
  calculateCosineSimilarity,
};
