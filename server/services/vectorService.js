/**
 * Vector Service
 * Service for managing vector operations with Pinecone
 * 
 * This service provides high-level operations for:
 * - Storing document vectors
 * - Querying similar documents
 * - Managing vector metadata
 * - Batch operations
 * 
 * @module services/vectorService
 */

import {
  getPineconeIndex,
  getPineconeConfig,
  indexExists,
  createIndex,
  getIndexStats,
} from '../config/pinecone.js';

/**
 * Vector record structure
 * @typedef {Object} VectorRecord
 * @property {string} id - Unique vector identifier
 * @property {number[]} values - Vector embedding
 * @property {Object} metadata - Associated metadata
 */

/**
 * Query result structure
 * @typedef {Object} QueryResult
 * @property {string} id - Vector identifier
 * @property {number} score - Similarity score
 * @property {Object} metadata - Associated metadata
 */

/**
 * Ensure index exists, create if it doesn't
 * 
 * @param {string} [indexName] - Index name
 * @returns {Promise<void>}
 * 
 * @example
 * await ensureIndexExists();
 */
const ensureIndexExists = async (indexName) => {
  const exists = await indexExists(indexName);
  if (!exists) {
    console.log('[VectorService] Index does not exist, creating...');
    await createIndex(indexName);
  }
};

/**
 * Upsert vector into Pinecone
 * Inserts or updates a vector with metadata
 * 
 * @param {string} id - Unique identifier for the vector
 * @param {number[]} embedding - Vector embedding
 * @param {Object} metadata - Metadata to associate with the vector
 * @param {string} [namespace] - Namespace to store vector in
 * @returns {Promise<void>}
 * @throws {Error} If upsert operation fails
 * 
 * @example
 * await upsertVector(
 *   'resume-123',
 *   embedding,
 *   {
 *     userId: 'user-456',
 *     documentType: 'resume',
 *     fileName: 'john_doe_resume.pdf'
 *   }
 * );
 */
export const upsertVector = async (id, embedding, metadata = {}, namespace) => {
  try {
    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    // Prepare vector record
    const vector = {
      id,
      values: embedding,
      metadata: {
        ...metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    // Upsert to Pinecone
    await index.namespace(ns).upsert([vector]);

    console.log(`[VectorService] Upserted vector: ${id} in namespace: ${ns}`);
  } catch (error) {
    console.error('[VectorService] Error upserting vector:', error.message);
    throw new Error(`Failed to upsert vector: ${error.message}`);
  }
};

/**
 * Upsert multiple vectors in batch
 * Efficiently stores multiple vectors at once
 * 
 * @param {Array<{id: string, embedding: number[], metadata: Object}>} vectors - Array of vectors to upsert
 * @param {string} [namespace] - Namespace to store vectors in
 * @param {number} [batchSize=100] - Batch size for upsert operations
 * @returns {Promise<number>} Number of vectors upserted
 * @throws {Error} If batch upsert operation fails
 * 
 * @example
 * await upsertVectorsBatch([
 *   { id: 'doc-1', embedding: [...], metadata: {...} },
 *   { id: 'doc-2', embedding: [...], metadata: {...} },
 * ]);
 */
export const upsertVectorsBatch = async (vectors, namespace, batchSize = 100) => {
  try {
    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new Error('Vectors must be a non-empty array');
    }

    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    let totalUpserted = 0;

    // Process in batches
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      // Prepare vector records
      const vectorRecords = batch.map(({ id, embedding, metadata = {} }) => ({
        id,
        values: embedding,
        metadata: {
          ...metadata,
          updatedAt: new Date().toISOString(),
        },
      }));

      // Upsert batch
      await index.namespace(ns).upsert(vectorRecords);

      totalUpserted += vectorRecords.length;
      console.log(
        `[VectorService] Upserted batch ${Math.floor(i / batchSize) + 1}: ${vectorRecords.length} vectors`
      );
    }

    console.log(`[VectorService] Total upserted: ${totalUpserted} vectors in namespace: ${ns}`);
    return totalUpserted;
  } catch (error) {
    console.error('[VectorService] Error in batch upsert:', error.message);
    throw new Error(`Failed to batch upsert vectors: ${error.message}`);
  }
};

/**
 * Query similar vectors
 * Finds vectors most similar to the query embedding
 * 
 * @param {number[]} queryEmbedding - Query vector embedding
 * @param {Object} [options={}] - Query options
 * @param {number} [options.topK=10] - Number of results to return
 * @param {Object} [options.filter] - Metadata filter
 * @param {string} [options.namespace] - Namespace to query
 * @param {boolean} [options.includeMetadata=true] - Include metadata in results
 * @param {boolean} [options.includeValues=false] - Include vector values in results
 * @returns {Promise<QueryResult[]>} Array of similar vectors with scores
 * @throws {Error} If query operation fails
 * 
 * @example
 * const results = await querySimilarVectors(
 *   queryEmbedding,
 *   {
 *     topK: 5,
 *     filter: { documentType: 'resume', userId: 'user-123' }
 *   }
 * );
 */
export const querySimilarVectors = async (queryEmbedding, options = {}) => {
  try {
    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();

    const {
      topK = 10,
      filter,
      namespace,
      includeMetadata = true,
      includeValues = false,
    } = options;

    const ns = namespace || config.namespace;

    // Query Pinecone
    const queryResponse = await index.namespace(ns).query({
      vector: queryEmbedding,
      topK,
      filter,
      includeMetadata,
      includeValues,
    });

    const matches = queryResponse.matches || [];
    console.log(`[VectorService] Found ${matches.length} similar vectors in namespace: ${ns}`);

    return matches;
  } catch (error) {
    console.error('[VectorService] Error querying vectors:', error.message);
    throw new Error(`Failed to query similar vectors: ${error.message}`);
  }
};

/**
 * Fetch vector by ID
 * Retrieves a specific vector and its metadata
 * 
 * @param {string} id - Vector identifier
 * @param {string} [namespace] - Namespace to fetch from
 * @returns {Promise<Object|null>} Vector data or null if not found
 * @throws {Error} If fetch operation fails
 * 
 * @example
 * const vector = await fetchVector('resume-123');
 * if (vector) {
 *   console.log(vector.metadata);
 * }
 */
export const fetchVector = async (id, namespace) => {
  try {
    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    const fetchResponse = await index.namespace(ns).fetch([id]);

    const vector = fetchResponse.records?.[id];
    if (!vector) {
      console.log(`[VectorService] Vector not found: ${id}`);
      return null;
    }

    console.log(`[VectorService] Fetched vector: ${id} from namespace: ${ns}`);
    return vector;
  } catch (error) {
    console.error('[VectorService] Error fetching vector:', error.message);
    throw new Error(`Failed to fetch vector: ${error.message}`);
  }
};

/**
 * Fetch multiple vectors by IDs
 * 
 * @param {string[]} ids - Array of vector identifiers
 * @param {string} [namespace] - Namespace to fetch from
 * @returns {Promise<Object>} Map of vector IDs to vector data
 * @throws {Error} If fetch operation fails
 * 
 * @example
 * const vectors = await fetchVectorsBatch(['doc-1', 'doc-2']);
 * console.log(vectors['doc-1'].metadata);
 */
export const fetchVectorsBatch = async (ids, namespace) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs must be a non-empty array');
    }

    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    const fetchResponse = await index.namespace(ns).fetch(ids);

    const vectors = fetchResponse.records || {};
    console.log(`[VectorService] Fetched ${Object.keys(vectors).length} vectors from namespace: ${ns}`);

    return vectors;
  } catch (error) {
    console.error('[VectorService] Error fetching vectors batch:', error.message);
    throw new Error(`Failed to fetch vectors batch: ${error.message}`);
  }
};

/**
 * Delete vector by ID
 * 
 * @param {string} id - Vector identifier to delete
 * @param {string} [namespace] - Namespace to delete from
 * @returns {Promise<void>}
 * @throws {Error} If delete operation fails
 * 
 * @example
 * await deleteVector('resume-123');
 */
export const deleteVector = async (id, namespace) => {
  try {
    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    await index.namespace(ns).deleteOne(id);

    console.log(`[VectorService] Deleted vector: ${id} from namespace: ${ns}`);
  } catch (error) {
    console.error('[VectorService] Error deleting vector:', error.message);
    throw new Error(`Failed to delete vector: ${error.message}`);
  }
};

/**
 * Delete multiple vectors by IDs
 * 
 * @param {string[]} ids - Array of vector identifiers to delete
 * @param {string} [namespace] - Namespace to delete from
 * @returns {Promise<void>}
 * @throws {Error} If delete operation fails
 * 
 * @example
 * await deleteVectorsBatch(['doc-1', 'doc-2', 'doc-3']);
 */
export const deleteVectorsBatch = async (ids, namespace) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs must be a non-empty array');
    }

    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    await index.namespace(ns).deleteMany(ids);

    console.log(`[VectorService] Deleted ${ids.length} vectors from namespace: ${ns}`);
  } catch (error) {
    console.error('[VectorService] Error deleting vectors batch:', error.message);
    throw new Error(`Failed to delete vectors batch: ${error.message}`);
  }
};

/**
 * Delete all vectors in namespace
 * WARNING: This deletes all vectors in the specified namespace
 * 
 * @param {string} [namespace] - Namespace to delete from
 * @returns {Promise<void>}
 * @throws {Error} If delete operation fails
 * 
 * @example
 * await deleteAllVectors('test-namespace');
 */
export const deleteAllVectors = async (namespace) => {
  try {
    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    await index.namespace(ns).deleteAll();

    console.log(`[VectorService] Deleted all vectors from namespace: ${ns}`);
  } catch (error) {
    console.error('[VectorService] Error deleting all vectors:', error.message);
    throw new Error(`Failed to delete all vectors: ${error.message}`);
  }
};

/**
 * Update vector metadata
 * Updates only the metadata without changing the vector
 * 
 * @param {string} id - Vector identifier
 * @param {Object} metadata - New metadata to set
 * @param {string} [namespace] - Namespace
 * @returns {Promise<void>}
 * @throws {Error} If update operation fails
 * 
 * @example
 * await updateVectorMetadata('resume-123', {
 *   status: 'reviewed',
 *   reviewedAt: new Date().toISOString()
 * });
 */
export const updateVectorMetadata = async (id, metadata, namespace) => {
  try {
    await ensureIndexExists();

    const index = await getPineconeIndex();
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    await index.namespace(ns).update({
      id,
      metadata: {
        ...metadata,
        updatedAt: new Date().toISOString(),
      },
    });

    console.log(`[VectorService] Updated metadata for vector: ${id} in namespace: ${ns}`);
  } catch (error) {
    console.error('[VectorService] Error updating vector metadata:', error.message);
    throw new Error(`Failed to update vector metadata: ${error.message}`);
  }
};

/**
 * Get namespace statistics
 * Returns statistics about vectors in the namespace
 * 
 * @param {string} [namespace] - Namespace to get stats for
 * @returns {Promise<Object>} Namespace statistics
 * 
 * @example
 * const stats = await getNamespaceStats();
 * console.log(`Total vectors: ${stats.vectorCount}`);
 */
export const getNamespaceStats = async (namespace) => {
  try {
    const stats = await getIndexStats(null, namespace);
    const config = getPineconeConfig();
    const ns = namespace || config.namespace;

    const namespaceStats = stats.namespaces?.[ns] || {
      vectorCount: 0,
    };

    console.log(`[VectorService] Stats for namespace "${ns}":`, namespaceStats);
    return namespaceStats;
  } catch (error) {
    console.error('[VectorService] Error getting namespace stats:', error.message);
    throw new Error(`Failed to get namespace stats: ${error.message}`);
  }
};

/**
 * Search vectors by metadata filter
 * Queries vectors matching specific metadata criteria
 * 
 * @param {Object} filter - Metadata filter criteria
 * @param {Object} [options={}] - Additional query options
 * @param {number} [options.topK=100] - Maximum results to return
 * @param {string} [options.namespace] - Namespace to search
 * @returns {Promise<Array>} Matching vectors
 * 
 * @example
 * const resumes = await searchByMetadata({
 *   documentType: 'resume',
 *   userId: 'user-123'
 * }, { topK: 20 });
 */
export const searchByMetadata = async (filter, options = {}) => {
  try {
    // To search by metadata only, we need to provide a dummy vector
    // This is a limitation of Pinecone - all queries require a vector
    // In practice, you'd want to use a zero vector or use list operations

    const config = getPineconeConfig();
    const dummyVector = new Array(config.dimension).fill(0);

    const results = await querySimilarVectors(dummyVector, {
      ...options,
      filter,
      includeValues: false,
    });

    return results;
  } catch (error) {
    console.error('[VectorService] Error searching by metadata:', error.message);
    throw new Error(`Failed to search by metadata: ${error.message}`);
  }
};

export default {
  upsertVector,
  upsertVectorsBatch,
  querySimilarVectors,
  fetchVector,
  fetchVectorsBatch,
  deleteVector,
  deleteVectorsBatch,
  deleteAllVectors,
  updateVectorMetadata,
  getNamespaceStats,
  searchByMetadata,
};
