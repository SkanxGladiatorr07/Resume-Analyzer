/**
 * Pinecone Configuration
 * Configuration for Pinecone vector database
 * 
 * @module config/pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Pinecone configuration object
 * @typedef {Object} PineconeConfig
 * @property {string} apiKey - Pinecone API key
 * @property {string} environment - Pinecone environment
 * @property {string} indexName - Default index name for resume data
 * @property {string} namespace - Default namespace for organizing vectors
 * @property {number} dimension - Vector dimension (embedding size)
 * @property {string} metric - Distance metric for similarity search
 */

/**
 * Get Pinecone configuration from environment variables
 * 
 * @returns {PineconeConfig} Pinecone configuration object
 * @throws {Error} If required environment variables are missing
 * 
 * @example
 * const config = getPineconeConfig();
 * console.log(config.indexName);
 */
export const getPineconeConfig = () => {
  const config = {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT || 'gcp-starter',
    indexName: process.env.PINECONE_INDEX_NAME || 'resumeai-index',
    namespace: process.env.PINECONE_NAMESPACE || 'resumes',
    dimension: parseInt(process.env.PINECONE_DIMENSION || '1536', 10), // OpenAI ada-002 default
    metric: process.env.PINECONE_METRIC || 'cosine', // cosine, euclidean, or dotproduct
  };

  // Validate required configuration
  if (!config.apiKey) {
    throw new Error(
      'PINECONE_API_KEY is required. Please set it in your .env file.'
    );
  }

  return config;
};

/**
 * Pinecone client instance (singleton)
 * @type {Pinecone|null}
 */
let pineconeClient = null;

/**
 * Initialize Pinecone client
 * Creates a singleton instance of the Pinecone client
 * 
 * @returns {Promise<Pinecone>} Initialized Pinecone client
 * @throws {Error} If initialization fails
 * 
 * @example
 * const pinecone = await initializePinecone();
 * const indexes = await pinecone.listIndexes();
 */
export const initializePinecone = async () => {
  if (pineconeClient) {
    return pineconeClient;
  }

  try {
    const config = getPineconeConfig();

    pineconeClient = new Pinecone({
      apiKey: config.apiKey,
    });

    console.log('[Pinecone] Client initialized successfully');
    return pineconeClient;
  } catch (error) {
    console.error('[Pinecone] Initialization failed:', error.message);
    throw new Error(`Failed to initialize Pinecone: ${error.message}`);
  }
};

/**
 * Get Pinecone client instance
 * Returns existing client or creates new one
 * 
 * @returns {Promise<Pinecone>} Pinecone client instance
 * 
 * @example
 * const pinecone = await getPineconeClient();
 * const index = pinecone.index('my-index');
 */
export const getPineconeClient = async () => {
  if (!pineconeClient) {
    return await initializePinecone();
  }
  return pineconeClient;
};

/**
 * Get Pinecone index
 * Returns a configured index instance
 * 
 * @param {string} [indexName] - Index name (defaults to config value)
 * @returns {Promise<Object>} Pinecone index instance
 * 
 * @example
 * const index = await getPineconeIndex();
 * await index.upsert([{ id: '1', values: [...] }]);
 */
export const getPineconeIndex = async (indexName) => {
  const client = await getPineconeClient();
  const config = getPineconeConfig();
  const name = indexName || config.indexName;

  return client.index(name);
};

/**
 * Check if Pinecone index exists
 * 
 * @param {string} [indexName] - Index name to check
 * @returns {Promise<boolean>} True if index exists
 * 
 * @example
 * const exists = await indexExists('my-index');
 * if (!exists) {
 *   await createIndex('my-index');
 * }
 */
export const indexExists = async (indexName) => {
  try {
    const client = await getPineconeClient();
    const config = getPineconeConfig();
    const name = indexName || config.indexName;

    const indexes = await client.listIndexes();
    return indexes.indexes?.some((index) => index.name === name) || false;
  } catch (error) {
    console.error('[Pinecone] Error checking index existence:', error.message);
    return false;
  }
};

/**
 * Create Pinecone index
 * Creates a new index with specified configuration
 * 
 * @param {string} [indexName] - Index name (defaults to config value)
 * @param {Object} [options] - Additional index options
 * @param {number} [options.dimension] - Vector dimension
 * @param {string} [options.metric] - Distance metric
 * @param {string} [options.spec] - Pod spec configuration
 * @returns {Promise<void>}
 * @throws {Error} If index creation fails
 * 
 * @example
 * await createIndex('resume-index', {
 *   dimension: 1536,
 *   metric: 'cosine'
 * });
 */
export const createIndex = async (indexName, options = {}) => {
  try {
    const client = await getPineconeClient();
    const config = getPineconeConfig();
    const name = indexName || config.indexName;

    // Check if index already exists
    const exists = await indexExists(name);
    if (exists) {
      console.log(`[Pinecone] Index "${name}" already exists`);
      return;
    }

    // Create index with configuration
    await client.createIndex({
      name,
      dimension: options.dimension || config.dimension,
      metric: options.metric || config.metric,
      spec: options.spec || {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });

    console.log(`[Pinecone] Index "${name}" created successfully`);

    // Wait for index to be ready
    await waitForIndexReady(name);
  } catch (error) {
    console.error('[Pinecone] Error creating index:', error.message);
    throw new Error(`Failed to create index: ${error.message}`);
  }
};

/**
 * Wait for index to be ready
 * Polls index status until it's ready for operations
 * 
 * @param {string} indexName - Index name to wait for
 * @param {number} [maxWaitMs=60000] - Maximum wait time in milliseconds
 * @returns {Promise<void>}
 * @throws {Error} If index doesn't become ready within timeout
 * 
 * @example
 * await waitForIndexReady('my-index');
 */
export const waitForIndexReady = async (indexName, maxWaitMs = 60000) => {
  const startTime = Date.now();
  const pollInterval = 2000; // Check every 2 seconds

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const client = await getPineconeClient();
      const description = await client.describeIndex(indexName);

      if (description.status?.ready) {
        console.log(`[Pinecone] Index "${indexName}" is ready`);
        return;
      }

      console.log(`[Pinecone] Waiting for index "${indexName}" to be ready...`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('[Pinecone] Error checking index status:', error.message);
      throw error;
    }
  }

  throw new Error(`Index "${indexName}" did not become ready within ${maxWaitMs}ms`);
};

/**
 * Delete Pinecone index
 * 
 * @param {string} [indexName] - Index name (defaults to config value)
 * @returns {Promise<void>}
 * @throws {Error} If index deletion fails
 * 
 * @example
 * await deleteIndex('old-index');
 */
export const deleteIndex = async (indexName) => {
  try {
    const client = await getPineconeClient();
    const config = getPineconeConfig();
    const name = indexName || config.indexName;

    await client.deleteIndex(name);
    console.log(`[Pinecone] Index "${name}" deleted successfully`);
  } catch (error) {
    console.error('[Pinecone] Error deleting index:', error.message);
    throw new Error(`Failed to delete index: ${error.message}`);
  }
};

/**
 * Get index statistics
 * Returns statistics about vectors in the index
 * 
 * @param {string} [indexName] - Index name
 * @param {string} [namespace] - Namespace to query
 * @returns {Promise<Object>} Index statistics
 * 
 * @example
 * const stats = await getIndexStats();
 * console.log(`Total vectors: ${stats.totalVectorCount}`);
 */
export const getIndexStats = async (indexName, namespace) => {
  try {
    const index = await getPineconeIndex(indexName);
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error('[Pinecone] Error getting index stats:', error.message);
    throw new Error(`Failed to get index stats: ${error.message}`);
  }
};

export default {
  getPineconeConfig,
  initializePinecone,
  getPineconeClient,
  getPineconeIndex,
  indexExists,
  createIndex,
  waitForIndexReady,
  deleteIndex,
  getIndexStats,
};
