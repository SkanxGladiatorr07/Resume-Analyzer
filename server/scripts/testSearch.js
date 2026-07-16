/**
 * Search Service Test Script
 * Test and validate semantic search functionality
 * 
 * Usage:
 *   node scripts/testSearch.js <command> [options]
 * 
 * Commands:
 *   search <resumeId> <query>     - Test search for a specific resume
 *   multi <query>                 - Search across all user resumes
 *   suggestions <resumeId>        - Get search suggestions
 *   stats <resumeId>              - Get search statistics
 *   demo <resumeId>               - Run demo searches
 * 
 * Examples:
 *   node scripts/testSearch.js search 65abc123 "Python experience"
 *   node scripts/testSearch.js multi "software engineering"
 *   node scripts/testSearch.js suggestions 65abc123
 *   node scripts/testSearch.js stats 65abc123
 *   node scripts/testSearch.js demo 65abc123
 * 
 * @module scripts/testSearch
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
  searchResume,
  searchMultipleResumes,
  getSearchSuggestions,
  getSearchStats,
} from '../services/searchService.js';
import Resume from '../models/Resume.js';

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
 * Command: Test search for a specific resume
 * 
 * @param {string} resumeId - Resume identifier
 * @param {string} query - Search query
 */
const commandSearch = async (resumeId, query) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  SEMANTIC SEARCH TEST');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Get resume info
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`User: ${resume.user}`);
    console.log(`Status: ${resume.embeddingStatus}`);
    console.log(`Query: "${query}"\n`);

    // Perform search
    const result = await searchResume({
      resumeId,
      query,
      userId: resume.user.toString(),
      options: { topK: 5 },
    });

    console.log('════════════════════════════════════════════════════════');
    console.log('  SEARCH RESULTS');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`Total Results: ${result.totalResults}`);
    console.log(`Search Duration: ${result.metadata.searchDuration}ms\n`);

    if (result.results.length === 0) {
      console.log('No results found.\n');
      return;
    }

    result.results.forEach((match, idx) => {
      console.log(`${idx + 1}. Section: ${match.sectionName}`);
      console.log(`   Score: ${(match.score * 100).toFixed(2)}%`);
      console.log(`   Chunk: ${match.chunkIndex + 1}/${match.metadata.totalChunks}`);
      console.log(`   Text: ${match.text.substring(0, 200)}${match.text.length > 200 ? '...' : ''}`);
      console.log('');
    });
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Search across multiple resumes
 * 
 * @param {string} query - Search query
 */
const commandMulti = async (query) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  MULTI-RESUME SEARCH TEST');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Get first user with completed embeddings
    const resume = await Resume.findOne({ embeddingStatus: 'completed' });
    if (!resume) {
      console.error('✗ No resumes with completed embeddings found');
      return;
    }

    const userId = resume.user.toString();
    console.log(`User: ${userId}`);
    console.log(`Query: "${query}"\n`);

    // Perform search
    const result = await searchMultipleResumes({
      query,
      userId,
      options: { topK: 3 },
    });

    console.log('════════════════════════════════════════════════════════');
    console.log('  RESULTS BY RESUME');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`Resumes with Results: ${result.totalResumes}`);
    console.log(`Search Duration: ${result.metadata.searchDuration}ms\n`);

    if (result.results.length === 0) {
      console.log('No results found.\n');
      return;
    }

    result.results.forEach((resumeResult, idx) => {
      console.log(`\n${idx + 1}. ${resumeResult.fileName}`);
      console.log(`   Resume ID: ${resumeResult.resumeId}`);
      console.log(`   Matches: ${resumeResult.totalResults}\n`);

      resumeResult.results.forEach((match, matchIdx) => {
        console.log(`   ${matchIdx + 1}. ${match.sectionName} - Score: ${(match.score * 100).toFixed(2)}%`);
        console.log(`      ${match.text.substring(0, 150)}${match.text.length > 150 ? '...' : ''}`);
      });
    });
    console.log('');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Get search suggestions
 * 
 * @param {string} resumeId - Resume identifier
 */
const commandSuggestions = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  SEARCH SUGGESTIONS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`User: ${resume.user}\n`);

    const suggestions = await getSearchSuggestions(resumeId, resume.user.toString());

    console.log('════════════════════════════════════════════════════════');
    console.log('  SUGGESTED QUERIES BY SECTION');
    console.log('════════════════════════════════════════════════════════\n');

    suggestions.sections.forEach((section) => {
      console.log(`\n${section.section} (${section.chunkCount} chunks):`);
      section.suggestedQueries.forEach((query, idx) => {
        console.log(`  ${idx + 1}. "${query}"`);
      });
    });
    console.log('');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Get search statistics
 * 
 * @param {string} resumeId - Resume identifier
 */
const commandStats = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  SEARCH STATISTICS');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    const stats = await getSearchStats(resumeId, resume.user.toString());

    console.log(`Resume: ${stats.fileName}`);
    console.log(`Embedding Status: ${stats.embeddingStatus}`);
    console.log(`Searchable: ${stats.searchable ? 'Yes ✓' : 'No ✗'}`);
    console.log(`Total Chunks: ${stats.totalChunks}\n`);

    console.log('Sections:');
    Object.entries(stats.sections).forEach(([section, data]) => {
      console.log(`  ${section}: ${data.count} chunks (${data.totalSize} chars)`);
    });
    console.log('');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Command: Run demo searches
 * 
 * @param {string} resumeId - Resume identifier
 */
const commandDemo = async (resumeId) => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  DEMO SEARCH QUERIES');
  console.log('════════════════════════════════════════════════════════\n');

  const demoQueries = [
    'What programming languages and technologies?',
    'Tell me about work experience',
    'What projects have been worked on?',
    'Educational background and degrees',
    'Key skills and expertise',
  ];

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.error(`✗ Resume not found: ${resumeId}`);
      return;
    }

    console.log(`Resume: ${resume.fileName}`);
    console.log(`Running ${demoQueries.length} demo queries...\n`);

    for (const [idx, query] of demoQueries.entries()) {
      console.log(`\n${idx + 1}. Query: "${query}"`);
      console.log('─'.repeat(60));

      try {
        const result = await searchResume({
          resumeId,
          query,
          userId: resume.user.toString(),
          options: { topK: 3 },
        });

        if (result.results.length === 0) {
          console.log('   No results found.');
          continue;
        }

        result.results.forEach((match, matchIdx) => {
          console.log(`\n   ${matchIdx + 1}. ${match.sectionName} - Score: ${(match.score * 100).toFixed(2)}%`);
          console.log(`      ${match.text.substring(0, 150)}...`);
        });
      } catch (error) {
        console.error(`   ✗ Error: ${error.message}`);
      }

      // Small delay between queries
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('  DEMO COMPLETE');
    console.log('════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
};

/**
 * Show usage information
 */
const showUsage = () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  SEMANTIC SEARCH TEST SCRIPT');
  console.log('════════════════════════════════════════════════════════\n');
  console.log('Usage:');
  console.log('  node scripts/testSearch.js <command> [options]\n');
  console.log('Commands:');
  console.log('  search <resumeId> <query>     Test search for specific resume');
  console.log('  multi <query>                 Search across all user resumes');
  console.log('  suggestions <resumeId>        Get search suggestions');
  console.log('  stats <resumeId>              Get search statistics');
  console.log('  demo <resumeId>               Run demo searches\n');
  console.log('Examples:');
  console.log('  node scripts/testSearch.js search 65abc123 "Python experience"');
  console.log('  node scripts/testSearch.js multi "software engineering"');
  console.log('  node scripts/testSearch.js suggestions 65abc123');
  console.log('  node scripts/testSearch.js stats 65abc123');
  console.log('  node scripts/testSearch.js demo 65abc123\n');
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
      case 'search':
        if (!args[1] || !args[2]) {
          console.error('\n✗ Error: Resume ID and query required');
          console.log('Usage: node scripts/testSearch.js search <resumeId> <query>\n');
        } else {
          // Join all remaining args as query
          const query = args.slice(2).join(' ');
          await commandSearch(args[1], query);
        }
        break;

      case 'multi':
        if (!args[1]) {
          console.error('\n✗ Error: Query required');
          console.log('Usage: node scripts/testSearch.js multi <query>\n');
        } else {
          const query = args.slice(1).join(' ');
          await commandMulti(query);
        }
        break;

      case 'suggestions':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/testSearch.js suggestions <resumeId>\n');
        } else {
          await commandSuggestions(args[1]);
        }
        break;

      case 'stats':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/testSearch.js stats <resumeId>\n');
        } else {
          await commandStats(args[1]);
        }
        break;

      case 'demo':
        if (!args[1]) {
          console.error('\n✗ Error: Resume ID required');
          console.log('Usage: node scripts/testSearch.js demo <resumeId>\n');
        } else {
          await commandDemo(args[1]);
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
