/**
 * RAG Setup Utility
 * Helper functions for setting up and testing RAG infrastructure
 * 
 * @module utils/ragSetup
 */

import {
  initializePinecone,
  indexExists,
  createIndex,
  getIndexStats,
  getPineconeConfig,
} from '../config/pinecone.js';
import { generateEmbedding, validateEmbedding } from '../services/embeddingService.js';
import { upsertVector, querySimilarVectors } from '../services/vectorService.js';

/**
 * Initialize RAG infrastructure
 * Sets up Pinecone and validates configuration
 * 
 * @returns {Promise<Object>} Initialization result with status
 * @throws {Error} If initialization fails
 */
export const initializeRAG = async () => {
  const result = {
    success: false,
    steps: {},
    errors: [],
  };

  try {
    console.log('[RAG Setup] Starting RAG infrastructure initialization...');

    // Step 1: Validate configuration
    console.log('[RAG Setup] Step 1: Validating configuration...');
    try {
      const config = getPineconeConfig();
      result.steps.configValidation = {
        success: true,
        config: {
          indexName: config.indexName,
          namespace: config.namespace,
          dimension: config.dimension,
          metric: config.metric,
        },
      };
      console.log('[RAG Setup] ✓ Configuration valid');
    } catch (error) {
      result.steps.configValidation = { success: false, error: error.message };
      result.errors.push(`Configuration validation failed: ${error.message}`);
      throw error;
    }

    // Step 2: Initialize Pinecone client
    console.log('[RAG Setup] Step 2: Initializing Pinecone client...');
    try {
      await initializePinecone();
      result.steps.pineconeInit = { success: true };
      console.log('[RAG Setup] ✓ Pinecone client initialized');
    } catch (error) {
      result.steps.pineconeInit = { success: false, error: error.message };
      result.errors.push(`Pinecone initialization failed: ${error.message}`);
      throw error;
    }

    // Step 3: Check/Create index
    console.log('[RAG Setup] Step 3: Checking index...');
    try {
      const config = getPineconeConfig();
      const exists = await indexExists(config.indexName);

      if (!exists) {
        console.log(`[RAG Setup] Index "${config.indexName}" does not exist, creating...`);
        await createIndex(config.indexName);
        result.steps.indexSetup = { success: true, created: true };
        console.log('[RAG Setup] ✓ Index created successfully');
      } else {
        result.steps.indexSetup = { success: true, created: false };
        console.log('[RAG Setup] ✓ Index already exists');
      }
    } catch (error) {
      result.steps.indexSetup = { success: false, error: error.message };
      result.errors.push(`Index setup failed: ${error.message}`);
      throw error;
    }

    // Step 4: Get index statistics
    console.log('[RAG Setup] Step 4: Getting index statistics...');
    try {
      const stats = await getIndexStats();
      result.steps.indexStats = {
        success: true,
        stats,
      };
      console.log('[RAG Setup] ✓ Index statistics retrieved');
    } catch (error) {
      result.steps.indexStats = { success: false, error: error.message };
      // Not critical, continue
      console.warn('[RAG Setup] ⚠ Could not retrieve index stats:', error.message);
    }

    result.success = true;
    console.log('[RAG Setup] ✅ RAG infrastructure initialized successfully');
    return result;
  } catch (error) {
    console.error('[RAG Setup] ❌ RAG initialization failed:', error.message);
    result.success = false;
    throw error;
  }
};

/**
 * Test RAG infrastructure
 * Performs end-to-end test of embedding generation and vector storage
 * 
 * @returns {Promise<Object>} Test results
 */
export const testRAG = async () => {
  const result = {
    success: false,
    tests: {},
  };

  try {
    console.log('[RAG Test] Starting RAG infrastructure tests...');

    // Test 1: Generate test embedding
    console.log('[RAG Test] Test 1: Generating test embedding...');
    const testText = 'Software engineer with 5 years of experience in Python and JavaScript';
    let testEmbedding;

    try {
      testEmbedding = await generateEmbedding(testText);
      const isValid = validateEmbedding(testEmbedding);

      result.tests.embeddingGeneration = {
        success: isValid,
        dimension: testEmbedding.length,
        sampleValues: testEmbedding.slice(0, 5),
      };

      if (isValid) {
        console.log('[RAG Test] ✓ Embedding generation successful');
      } else {
        throw new Error('Generated embedding is invalid');
      }
    } catch (error) {
      result.tests.embeddingGeneration = {
        success: false,
        error: error.message,
      };
      throw error;
    }

    // Test 2: Store test vector
    console.log('[RAG Test] Test 2: Storing test vector...');
    const testId = `test-vector-${Date.now()}`;

    try {
      await upsertVector(testId, testEmbedding, {
        text: testText,
        type: 'test',
        createdAt: new Date().toISOString(),
      });

      result.tests.vectorStorage = {
        success: true,
        vectorId: testId,
      };
      console.log('[RAG Test] ✓ Vector storage successful');
    } catch (error) {
      result.tests.vectorStorage = {
        success: false,
        error: error.message,
      };
      throw error;
    }

    // Test 3: Query similar vectors
    console.log('[RAG Test] Test 3: Querying similar vectors...');
    try {
      const queryResults = await querySimilarVectors(testEmbedding, {
        topK: 1,
        includeMetadata: true,
      });

      const foundTestVector = queryResults.some((match) => match.id === testId);

      result.tests.vectorQuery = {
        success: foundTestVector,
        resultsCount: queryResults.length,
        foundTestVector,
      };

      if (foundTestVector) {
        console.log('[RAG Test] ✓ Vector query successful');
      } else {
        throw new Error('Test vector not found in query results');
      }
    } catch (error) {
      result.tests.vectorQuery = {
        success: false,
        error: error.message,
      };
      throw error;
    }

    result.success = true;
    console.log('[RAG Test] ✅ All RAG tests passed');
    return result;
  } catch (error) {
    console.error('[RAG Test] ❌ RAG tests failed:', error.message);
    result.success = false;
    return result;
  }
};

/**
 * Verify RAG configuration
 * Checks if all required environment variables are set
 * 
 * @returns {Object} Verification result
 */
export const verifyRAGConfig = () => {
  const result = {
    valid: true,
    missing: [],
    warnings: [],
  };

  const requiredVars = [
    'PINECONE_API_KEY',
    'GEMINI_API_KEY',
  ];

  const optionalVars = [
    'PINECONE_INDEX_NAME',
    'PINECONE_NAMESPACE',
    'PINECONE_DIMENSION',
    'EMBEDDING_MODEL',
  ];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      result.valid = false;
      result.missing.push(varName);
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      result.warnings.push(`${varName} not set, using default value`);
    }
  }

  return result;
};

/**
 * Get RAG infrastructure status
 * Returns current status of RAG components
 * 
 * @returns {Promise<Object>} Status information
 */
export const getRAGStatus = async () => {
  const status = {
    configured: false,
    pineconeConnected: false,
    indexExists: false,
    indexStats: null,
    errors: [],
  };

  try {
    // Check configuration
    const configCheck = verifyRAGConfig();
    status.configured = configCheck.valid;

    if (!status.configured) {
      status.errors.push(...configCheck.missing.map((v) => `Missing: ${v}`));
      return status;
    }

    // Check Pinecone connection
    try {
      await initializePinecone();
      status.pineconeConnected = true;
    } catch (error) {
      status.errors.push(`Pinecone connection failed: ${error.message}`);
      return status;
    }

    // Check index
    try {
      const config = getPineconeConfig();
      status.indexExists = await indexExists(config.indexName);

      if (status.indexExists) {
        status.indexStats = await getIndexStats();
      }
    } catch (error) {
      status.errors.push(`Index check failed: ${error.message}`);
    }

    return status;
  } catch (error) {
    status.errors.push(`Status check failed: ${error.message}`);
    return status;
  }
};

export default {
  initializeRAG,
  testRAG,
  verifyRAGConfig,
  getRAGStatus,
};
