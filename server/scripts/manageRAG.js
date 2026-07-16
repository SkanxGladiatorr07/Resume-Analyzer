/**
 * RAG Management CLI Tool
 * Comprehensive tool for managing the complete RAG infrastructure
 * 
 * Usage:
 *   node scripts/manageRAG.js <command> [options]
 * 
 * Commands:
 *   status                    - Show RAG pipeline status
 *   process <resumeId>        - Process single resume through RAG pipeline
 *   batch [limit]             - Batch process pending resumes
 *   retry <resumeId>          - Retry failed RAG pipeline
 *   validate <resumeId>       - Validate resume RAG readiness
 *   cleanup <resumeId>        - Clean up RAG data for resume
 *   stats                     - Show detailed statistics
 * 
 * @module scripts/manageRAG
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import services
import {
  executeRAGPipeline,
  retryRAGPipeline,
  processPendingResumes,
  getRAGPipelineStats,
  validateRAGReadiness,
} from '../services/ragPipeline.js';
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
 * Format duration
 */
const formatDuration = (ms) => {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Command: Show RAG pipeline status
 */
const commandStatus = async () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  RAG PIPELINE STATUS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const stats = await getRAGPipelineStats();

    console.log('Resume Status:');
    console.log(`  Total Resumes:     ${stats.total}`);
    console.log(`  Parsed:            ${stats.parsed}`);
    console.log(`  Ready for Search:  ${stats.ready} ✓`);
    console.log('');

    console.log('Embedding Status:');
    console.log(`  Pending:           ${stats.pending}`);
    console.log(`  Processing:        ${stats.processing}`);
    console.log(`  Completed:         ${stats.completed} ✓`);
    console.log(`  Failed:            ${stats.failed} ${stats.failed > 0 ? '✗' : ''}`);
    console.log('');

    // Vector database stats
    try {
      const vectorStats = await getNamespaceStats();
      console.log('Vector Database:');
      console.log(`  Total Vectors:     ${vectorStats.vectorCount || 0}`);
    } catch (error) {
      console.log('Vector Database:     Unable to fetch stats');
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Process single resume
 */
const commandProcess = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  PROCESS RESUME THROUGH RAG PIPELINE');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`Parsing: ${resume.parsingStatus}`);
    console.log(`Embedding: ${resume.embeddingStatus || 'pending'}\n`);

    console.log('Starting RAG pipeline...\n');

    const result = await executeRAGPipeline(resumeId);

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  RESULT');
    console.log('════════════════════════════════════════════════════════\n');

    if (result.skipped) {
      console.log(`⚠ Skipped: ${result.reason}`);
      return;
    }

    console.log(`Chunks Created:      ${result.chunks.created}`);
    console.log(`Total Chunks:        ${result.chunks.total}`);
    console.log(`Embeddings Success:  ${result.embeddings.successful} ✓`);
    console.log(`Embeddings Failed:   ${result.embeddings.failed} ${result.embeddings.failed > 0 ? '✗' : ''}`);
    console.log(`Duration:            ${formatDuration(result.duration)}`);
    console.log('');
    console.log(`✓ Resume is now ready for semantic search!`);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Batch process pending resumes
 */
const commandBatch = async (limit = 10) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  BATCH PROCESS PENDING RESUMES');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    console.log(`Processing up to ${limit} pending resumes...\n`);

    const result = await processPendingResumes({ limit });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  BATCH RESULT');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`Processed:  ${result.processed}`);
    console.log(`Successful: ${result.successful} ✓`);
    console.log(`Failed:     ${result.failed} ${result.failed > 0 ? '✗' : ''}`);

    if (result.results.length > 0) {
      console.log('\n════════════════════════════════════════════════════════');
      console.log('  DETAILS');
      console.log('════════════════════════════════════════════════════════\n');

      result.results.forEach((res, idx) => {
        console.log(`${idx + 1}. ${res.fileName}`);
        console.log(`   Status: ${res.status}`);
        if (res.status === 'success') {
          console.log(`   Chunks: ${res.chunks.total}`);
          console.log(`   Embeddings: ${res.embeddings.successful}/${res.chunks.total}`);
        } else {
          console.log(`   Error: ${res.error}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Retry failed pipeline
 */
const commandRetry = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  RETRY FAILED RAG PIPELINE');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`Current Status: ${resume.embeddingStatus}\n`);

    const result = await retryRAGPipeline(resumeId);

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  RETRY RESULT');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`Embeddings Success:  ${result.embeddings.successful} ✓`);
    console.log(`Embeddings Failed:   ${result.embeddings.failed} ${result.embeddings.failed > 0 ? '✗' : ''}`);
    console.log(`Duration:            ${formatDuration(result.duration)}`);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Validate resume RAG readiness
 */
const commandValidate = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  VALIDATE RAG READINESS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const result = await validateRAGReadiness(resumeId);

    console.log(`Resume ID: ${result.resumeId}`);
    console.log(`Ready for Search: ${result.ready ? '✓ Yes' : '✗ No'}\n`);

    console.log('Checks:');
    console.log(`  Parsed:    ${result.checks.parsed ? '✓' : '✗'}`);
    console.log(`  Has Text:  ${result.checks.hasText ? '✓' : '✗'}`);
    console.log(`  Embedded:  ${result.checks.embedded ? '✓' : '✗'}`);
    console.log('');

    console.log('Status:');
    console.log(`  Parsing:   ${result.status.parsing}`);
    console.log(`  Embedding: ${result.status.embedding || 'pending'}`);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Cleanup RAG data
 */
const commandCleanup = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  CLEANUP RAG DATA');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}\n`);

    // Get chunks
    const chunks = await ResumeChunk.find({ resumeId });
    console.log(`Found ${chunks.length} chunks`);

    // Delete vectors
    const vectorIds = chunks.filter((c) => c.vectorId).map((c) => c.vectorId);
    if (vectorIds.length > 0) {
      console.log(`Deleting ${vectorIds.length} vectors from Pinecone...`);
      await deleteVectorsBatch(vectorIds);
      console.log('✓ Vectors deleted');
    }

    // Delete chunks
    console.log('Deleting chunks from database...');
    await ResumeChunk.deleteMany({ resumeId });
    console.log('✓ Chunks deleted');

    // Reset resume status
    console.log('Resetting resume status...');
    resume.embeddingStatus = 'pending';
    resume.embeddingError = null;
    resume.embeddingStartedAt = null;
    resume.embeddingCompletedAt = null;
    resume.embeddingRetryCount = 0;
    await resume.save();
    console.log('✓ Resume status reset');

    console.log('\n✓ Cleanup complete');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Show detailed statistics
 */
const commandStats = async () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  DETAILED RAG STATISTICS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Resume stats
    const pipelineStats = await getRAGPipelineStats();

    console.log('Pipeline Statistics:');
    console.log(`  Total Resumes:          ${pipelineStats.total}`);
    console.log(`  Parsed Resumes:         ${pipelineStats.parsed}`);
    console.log(`  Ready for Search:       ${pipelineStats.ready}`);
    console.log(`  Embedding Pending:      ${pipelineStats.pending}`);
    console.log(`  Embedding Processing:   ${pipelineStats.processing}`);
    console.log(`  Embedding Completed:    ${pipelineStats.completed}`);
    console.log(`  Embedding Failed:       ${pipelineStats.failed}`);
    console.log('');

    // Chunk stats
    const totalChunks = await ResumeChunk.countDocuments();
    const chunksByStatus = await ResumeChunk.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    console.log('Chunk Statistics:');
    console.log(`  Total Chunks:           ${totalChunks}`);
    chunksByStatus.forEach((stat) => {
      console.log(`  ${stat._id.padEnd(20)}: ${stat.count}`);
    });
    console.log('');

    // Vector stats
    try {
      const vectorStats = await getNamespaceStats();
      console.log('Vector Database Statistics:');
      console.log(`  Total Vectors:          ${vectorStats.vectorCount || 0}`);
      console.log(`  Namespace:              ${process.env.PINECONE_NAMESPACE || 'resume-chunks'}`);
    } catch (error) {
      console.log('Vector Database:          Unable to fetch stats');
    }
    console.log('');

    // Recent failures
    const failedResumes = await Resume.find({ embeddingStatus: 'failed' })
      .select('fileName embeddingError')
      .limit(5);

    if (failedResumes.length > 0) {
      console.log('Recent Failures:');
      failedResumes.forEach((resume, idx) => {
        console.log(`  ${idx + 1}. ${resume.fileName}`);
        console.log(`     Error: ${resume.embeddingError}`);
      });
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Show usage
 */
const showUsage = () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  RAG MANAGEMENT CLI');
  console.log('════════════════════════════════════════════════════════\n');
  console.log('Usage:');
  console.log('  node scripts/manageRAG.js <command> [options]\n');
  console.log('Commands:');
  console.log('  status                    Show RAG pipeline status');
  console.log('  process <resumeId>        Process single resume');
  console.log('  batch [limit]             Batch process pending resumes');
  console.log('  retry <resumeId>          Retry failed pipeline');
  console.log('  validate <resumeId>       Validate RAG readiness');
  console.log('  cleanup <resumeId>        Clean up RAG data');
  console.log('  stats                     Show detailed statistics\n');
  console.log('Examples:');
  console.log('  node scripts/manageRAG.js status');
  console.log('  node scripts/manageRAG.js process 65abc123');
  console.log('  node scripts/manageRAG.js batch 10');
  console.log('  node scripts/manageRAG.js retry 65abc123');
  console.log('  node scripts/manageRAG.js validate 65abc123');
  console.log('  node scripts/manageRAG.js cleanup 65abc123');
  console.log('  node scripts/manageRAG.js stats\n');
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
      case 'status':
        await commandStatus();
        break;

      case 'process':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/manageRAG.js process <resumeId>\n');
        } else {
          await commandProcess(args[1]);
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
          console.log('Usage: node scripts/manageRAG.js retry <resumeId>\n');
        } else {
          await commandRetry(args[1]);
        }
        break;

      case 'validate':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/manageRAG.js validate <resumeId>\n');
        } else {
          await commandValidate(args[1]);
        }
        break;

      case 'cleanup':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/manageRAG.js cleanup <resumeId>\n');
        } else {
          await commandCleanup(args[1]);
        }
        break;

      case 'stats':
        await commandStats();
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
