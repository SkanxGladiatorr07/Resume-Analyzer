/**
 * Embedding Pipeline Test Script
 * Test and manage embedding generation for resume chunks
 * 
 * Usage:
 *   node scripts/testEmbedding.js <command> [options]
 * 
 * Commands:
 *   resume <resumeId>      - Generate embeddings for a specific resume
 *   batch [limit]          - Process all pending resumes (default limit: 10)
 *   retry <resumeId>       - Retry failed embeddings for a resume
 *   stats                  - Show pipeline statistics
 *   list                   - List resumes by embedding status
 *   cleanup <resumeId>     - Delete all embeddings and vectors for a resume
 * 
 * Examples:
 *   node scripts/testEmbedding.js resume 65abc123def456
 *   node scripts/testEmbedding.js batch 5
 *   node scripts/testEmbedding.js retry 65abc123def456
 *   node scripts/testEmbedding.js stats
 *   node scripts/testEmbedding.js list
 *   node scripts/testEmbedding.js cleanup 65abc123def456
 * 
 * @module scripts/testEmbedding
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import services and models
import {
  generateEmbeddingsForResume,
  processAllPendingResumes,
  retryFailedEmbeddings,
  getPipelineStats,
} from '../services/embeddingPipeline.js';
import Resume from '../models/Resume.js';
import ResumeChunk from '../models/ResumeChunk.js';
import { deleteVectorsBatch, getNamespaceStats } from '../services/vectorService.js';

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-ats';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('\n✓ Disconnected from MongoDB');
};

/**
 * Format duration in human-readable format
 * 
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
const formatDuration = (ms) => {
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Command: Generate embeddings for a specific resume
 * 
 * @param {string} resumeId - Resume identifier
 */
const commandResume = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  GENERATE EMBEDDINGS FOR RESUME');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Validate resume exists
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`Status: ${resume.embeddingStatus}`);
    console.log(`User: ${resume.user}\n`);

    // Check if already processed
    if (resume.embeddingStatus === 'completed') {
      console.log('⚠ Resume already has completed embeddings');
      console.log('Use "retry" command to reprocess failed chunks\n');
    }

    // Generate embeddings
    const result = await generateEmbeddingsForResume(resumeId);

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  RESULT');
    console.log('════════════════════════════════════════════════════════\n');
    console.log(`Total Chunks:    ${result.totalChunks}`);
    console.log(`Processed:       ${result.processed}`);
    console.log(`Successful:      ${result.successful} ✓`);
    console.log(`Failed:          ${result.failed} ${result.failed > 0 ? '✗' : ''}`);
    console.log(`Skipped:         ${result.skipped}`);
    console.log(`Duration:        ${formatDuration(result.duration)}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n════════════════════════════════════════════════════════');
      console.log('  ERRORS');
      console.log('════════════════════════════════════════════════════════\n');
      result.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. Chunk: ${err.chunkId}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Process all pending resumes
 * 
 * @param {number} [limit=10] - Maximum resumes to process
 */
const commandBatch = async (limit = 10) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  BATCH PROCESS PENDING RESUMES');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    console.log(`Processing up to ${limit} pending resumes...\n`);

    const result = await processAllPendingResumes({ limit });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  BATCH RESULT');
    console.log('════════════════════════════════════════════════════════\n');
    console.log(`Processed:  ${result.processed}`);
    console.log(`Successful: ${result.successful} ✓`);
    console.log(`Failed:     ${result.failed} ${result.failed > 0 ? '✗' : ''}`);

    if (result.resumes.length > 0) {
      console.log('\n════════════════════════════════════════════════════════');
      console.log('  RESUME DETAILS');
      console.log('════════════════════════════════════════════════════════\n');

      result.resumes.forEach((resume, idx) => {
        console.log(`${idx + 1}. ${resume.fileName}`);
        console.log(`   ID: ${resume.resumeId}`);
        console.log(`   Status: ${resume.status}`);
        if (resume.successful) {
          console.log(`   Chunks: ${resume.successful}/${resume.totalChunks} successful`);
        }
        if (resume.error) {
          console.log(`   Error: ${resume.error}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Retry failed embeddings
 * 
 * @param {string} resumeId - Resume identifier
 */
const commandRetry = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  RETRY FAILED EMBEDDINGS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Validate resume exists
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`Current Status: ${resume.embeddingStatus}\n`);

    const result = await retryFailedEmbeddings(resumeId);

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  RETRY RESULT');
    console.log('════════════════════════════════════════════════════════\n');
    console.log(`Retried:    ${result.retried}`);
    console.log(`Successful: ${result.successful} ✓`);
    console.log(`Failed:     ${result.failed} ${result.failed > 0 ? '✗' : ''}`);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Show pipeline statistics
 */
const commandStats = async () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  EMBEDDING PIPELINE STATISTICS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const stats = await getPipelineStats();

    console.log('Resume Status:');
    console.log(`  Pending:    ${stats.resumes.pending || 0}`);
    console.log(`  Processing: ${stats.resumes.processing || 0}`);
    console.log(`  Completed:  ${stats.resumes.completed || 0} ✓`);
    console.log(`  Failed:     ${stats.resumes.failed || 0} ${stats.resumes.failed > 0 ? '✗' : ''}`);

    console.log('\nChunk Status:');
    console.log(`  Pending:  ${stats.chunks.pending || 0}`);
    console.log(`  Embedded: ${stats.chunks.embedded || 0}`);
    console.log(`  Indexed:  ${stats.chunks.indexed || 0} ✓`);
    console.log(`  Error:    ${stats.chunks.error || 0} ${stats.chunks.error > 0 ? '✗' : ''}`);

    // Vector database stats
    console.log('\nVector Database:');
    try {
      const vectorStats = await getNamespaceStats();
      console.log(`  Vectors:  ${vectorStats.vectorCount || 0}`);
    } catch (error) {
      console.log(`  Vectors:  Unable to fetch (${error.message})`);
    }

    if (stats.failedResumes.length > 0) {
      console.log('\n════════════════════════════════════════════════════════');
      console.log('  FAILED RESUMES (Last 10)');
      console.log('════════════════════════════════════════════════════════\n');

      stats.failedResumes.forEach((resume, idx) => {
        console.log(`${idx + 1}. ${resume.fileName}`);
        console.log(`   ID: ${resume.id}`);
        console.log(`   Error: ${resume.error}`);
        console.log(`   Retry Count: ${resume.retryCount}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: List resumes by embedding status
 */
const commandList = async () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  RESUMES BY EMBEDDING STATUS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const statuses = ['pending', 'processing', 'completed', 'failed'];

    for (const status of statuses) {
      const resumes = await Resume.find({ embeddingStatus: status })
        .select('_id fileName embeddingStatus createdAt')
        .limit(10)
        .sort({ createdAt: -1 });

      console.log(`${status.toUpperCase()} (${resumes.length}):`);

      if (resumes.length === 0) {
        console.log('  (none)\n');
        continue;
      }

      resumes.forEach((resume) => {
        console.log(`  • ${resume.fileName}`);
        console.log(`    ID: ${resume._id}`);
        console.log(`    Created: ${resume.createdAt.toISOString()}`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Cleanup embeddings and vectors for a resume
 * 
 * @param {string} resumeId - Resume identifier
 */
const commandCleanup = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  CLEANUP EMBEDDINGS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Validate resume exists
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`Current Status: ${resume.embeddingStatus}\n`);

    // Get all chunks
    const chunks = await ResumeChunk.findByResumeId(resumeId);
    console.log(`Found ${chunks.length} chunks\n`);

    // Delete vectors from Pinecone
    const vectorIds = chunks.filter((c) => c.vectorId).map((c) => c.vectorId);
    if (vectorIds.length > 0) {
      console.log(`Deleting ${vectorIds.length} vectors from Pinecone...`);
      await deleteVectorsBatch(vectorIds);
      console.log('✓ Vectors deleted\n');
    }

    // Reset chunk status
    console.log('Resetting chunk status...');
    await Promise.all(
      chunks.map((chunk) => {
        chunk.status = 'pending';
        chunk.embedding = null;
        chunk.embeddingModel = null;
        chunk.vectorId = null;
        chunk.error = undefined;
        return chunk.save();
      })
    );
    console.log('✓ Chunks reset\n');

    // Reset resume status
    console.log('Resetting resume status...');
    resume.embeddingStatus = 'pending';
    resume.embeddingError = null;
    resume.embeddingStartedAt = null;
    resume.embeddingCompletedAt = null;
    resume.embeddingRetryCount = 0;
    await resume.save();
    console.log('✓ Resume reset\n');

    console.log('════════════════════════════════════════════════════════');
    console.log('  CLEANUP COMPLETE');
    console.log('════════════════════════════════════════════════════════\n');
    console.log('Resume is ready for re-embedding');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Show usage information
 */
const showUsage = () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  EMBEDDING PIPELINE TEST SCRIPT');
  console.log('════════════════════════════════════════════════════════\n');
  console.log('Usage:');
  console.log('  node scripts/testEmbedding.js <command> [options]\n');
  console.log('Commands:');
  console.log('  resume <resumeId>      Generate embeddings for a specific resume');
  console.log('  batch [limit]          Process all pending resumes (default: 10)');
  console.log('  retry <resumeId>       Retry failed embeddings for a resume');
  console.log('  stats                  Show pipeline statistics');
  console.log('  list                   List resumes by embedding status');
  console.log('  cleanup <resumeId>     Delete all embeddings/vectors for a resume\n');
  console.log('Examples:');
  console.log('  node scripts/testEmbedding.js resume 65abc123def456');
  console.log('  node scripts/testEmbedding.js batch 5');
  console.log('  node scripts/testEmbedding.js retry 65abc123def456');
  console.log('  node scripts/testEmbedding.js stats');
  console.log('  node scripts/testEmbedding.js list');
  console.log('  node scripts/testEmbedding.js cleanup 65abc123def456\n');
};

/**
 * Main function
 */
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showUsage();
    return;
  }

  await connectDB();

  try {
    switch (command) {
      case 'resume':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/testEmbedding.js resume <resumeId>\n');
        } else {
          await commandResume(args[1]);
        }
        break;

      case 'batch':
        {
          const limit = args[1] ? parseInt(args[1], 10) : 10;
          await commandBatch(limit);
        }
        break;

      case 'retry':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/testEmbedding.js retry <resumeId>\n');
        } else {
          await commandRetry(args[1]);
        }
        break;

      case 'stats':
        await commandStats();
        break;

      case 'list':
        await commandList();
        break;

      case 'cleanup':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/testEmbedding.js cleanup <resumeId>\n');
        } else {
          await commandCleanup(args[1]);
        }
        break;

      default:
        console.error(`\n✗ Unknown command: ${command}\n`);
        showUsage();
    }
  } catch (error) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await disconnectDB();
  }
};

// Run main function
main();
