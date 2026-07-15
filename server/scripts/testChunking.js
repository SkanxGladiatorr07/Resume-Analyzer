/**
 * Chunking Test Script
 * Test intelligent resume chunking functionality
 * 
 * Usage:
 *   node scripts/testChunking.js <resumeId>
 *   node scripts/testChunking.js --all
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Resume from '../models/Resume.js';
import ResumeChunk from '../models/ResumeChunk.js';
import { chunkResume, getChunkingStats } from '../services/chunkingService.js';
import { saveChunks, getChunkStats, groupChunksBySection } from '../utils/chunkUtils.js';

/**
 * Console colors
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

/**
 * Connect to database
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Test chunking for a single resume
 */
async function testResumeChunking(resumeId) {
  try {
    log.header(`📄 Testing Chunking for Resume: ${resumeId}`);

    // Find resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      log.error('Resume not found');
      return;
    }

    log.info(`Resume: ${resume.fileName}`);
    log.info(`User: ${resume.userId}`);

    // Generate chunks
    log.info('Generating chunks...');
    const chunks = await chunkResume(resume, {
      maxChunkSize: 1000,
      minChunkSize: 100,
      overlapSize: 100,
      preserveSectionIntegrity: true,
    });

    log.success(`Generated ${chunks.length} chunks`);

    // Display chunk details
    console.log('\n📊 Chunk Details:');
    const grouped = chunks.reduce((acc, chunk) => {
      const section = chunk.metadata.sectionName;
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(chunk);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([section, sectionChunks]) => {
      console.log(`\n  ${colors.bright}${section}${colors.reset}: ${sectionChunks.length} chunk(s)`);
      sectionChunks.forEach((chunk, idx) => {
        console.log(
          `    Chunk ${idx + 1}: ${chunk.text.length} chars (${chunk.metadata.startOffset}-${chunk.metadata.endOffset})`
        );
        console.log(`    Preview: ${chunk.text.substring(0, 100)}...`);
      });
    });

    // Get statistics
    const stats = await getChunkingStats(resume);
    console.log('\n📈 Chunking Statistics:');
    console.log(JSON.stringify(stats, null, 2));

    // Save chunks to database
    log.info('\nSaving chunks to database...');
    const savedChunks = await saveChunks(chunks);
    log.success(`Saved ${savedChunks.length} chunks to database`);

    // Verify saved chunks
    const dbStats = await getChunkStats(resumeId);
    console.log('\n💾 Database Statistics:');
    console.log(JSON.stringify(dbStats, null, 2));

    return {
      success: true,
      chunks: chunks.length,
      saved: savedChunks.length,
    };
  } catch (error) {
    log.error(`Error testing chunking: ${error.message}`);
    console.error(error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test chunking for all resumes
 */
async function testAllResumes() {
  try {
    log.header('📚 Testing Chunking for All Resumes');

    const resumes = await Resume.find().limit(5); // Limit for testing
    log.info(`Found ${resumes.length} resumes to process`);

    const results = [];

    for (const resume of resumes) {
      log.info(`\nProcessing: ${resume.fileName} (${resume._id})`);

      try {
        const chunks = await chunkResume(resume);
        const savedChunks = await saveChunks(chunks);

        results.push({
          resumeId: resume._id,
          fileName: resume.fileName,
          chunksGenerated: chunks.length,
          chunksSaved: savedChunks.length,
          success: true,
        });

        log.success(`✓ ${chunks.length} chunks generated and saved`);
      } catch (error) {
        log.error(`✗ Error: ${error.message}`);
        results.push({
          resumeId: resume._id,
          fileName: resume.fileName,
          success: false,
          error: error.message,
        });
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(JSON.stringify(results, null, 2));

    const successful = results.filter((r) => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + (r.chunksGenerated || 0), 0);

    log.success(`\nProcessed ${successful}/${results.length} resumes`);
    log.success(`Generated ${totalChunks} total chunks`);

    return results;
  } catch (error) {
    log.error(`Error in batch testing: ${error.message}`);
    console.error(error);
    return [];
  }
}

/**
 * Show chunk statistics
 */
async function showChunkStats() {
  try {
    log.header('📊 Chunk Statistics');

    const statusCounts = await ResumeChunk.countByStatus();
    console.log('Chunks by Status:');
    console.log(JSON.stringify(statusCounts, null, 2));

    const totalChunks = await ResumeChunk.countDocuments();
    log.info(`\nTotal chunks in database: ${totalChunks}`);

    // Group by section
    const sectionCounts = await ResumeChunk.aggregate([
      {
        $group: {
          _id: '$sectionName',
          count: { $sum: 1 },
          avgSize: { $avg: '$chunkSize' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log('\nChunks by Section:');
    sectionCounts.forEach((section) => {
      console.log(
        `  ${section._id}: ${section.count} chunks (avg ${Math.round(section.avgSize)} chars)`
      );
    });
  } catch (error) {
    log.error(`Error getting statistics: ${error.message}`);
  }
}

/**
 * Clean up test chunks
 */
async function cleanupChunks(resumeId) {
  try {
    log.header('🧹 Cleaning Up Chunks');

    let query = {};
    if (resumeId) {
      query = { resumeId };
      log.info(`Deleting chunks for resume: ${resumeId}`);
    } else {
      log.warning('Deleting ALL chunks (no resume ID specified)');
    }

    const result = await ResumeChunk.deleteMany(query);
    log.success(`Deleted ${result.deletedCount} chunks`);

    return result;
  } catch (error) {
    log.error(`Error cleaning up: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];

  if (!command || command === 'help') {
    console.log(`
${colors.bright}Resume Chunking Test Script${colors.reset}

Usage:
  node scripts/testChunking.js <resumeId>      Test chunking for specific resume
  node scripts/testChunking.js --all           Test chunking for all resumes
  node scripts/testChunking.js --stats         Show chunking statistics
  node scripts/testChunking.js --clean [id]    Clean up test chunks
  node scripts/testChunking.js help            Show this help message

Examples:
  node scripts/testChunking.js 507f1f77bcf86cd799439011
  node scripts/testChunking.js --all
  node scripts/testChunking.js --stats
  node scripts/testChunking.js --clean 507f1f77bcf86cd799439011
`);
    return;
  }

  await connectDB();

  try {
    switch (command) {
      case '--all':
        await testAllResumes();
        break;

      case '--stats':
        await showChunkStats();
        break;

      case '--clean':
        await cleanupChunks(process.argv[3]);
        break;

      default:
        // Assume it's a resume ID
        await testResumeChunking(command);
        break;
    }
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log.info('\nDatabase connection closed');
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
