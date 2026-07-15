/**
 * RAG Setup Script
 * Command-line utility for initializing and testing RAG infrastructure
 * 
 * Usage:
 *   node scripts/setupRAG.js init    - Initialize RAG infrastructure
 *   node scripts/setupRAG.js test    - Test RAG infrastructure
 *   node scripts/setupRAG.js status  - Check RAG status
 *   node scripts/setupRAG.js verify  - Verify configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import {
  initializeRAG,
  testRAG,
  verifyRAGConfig,
  getRAGStatus,
} from '../utils/ragSetup.js';

/**
 * Print colored console output
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
 * Initialize RAG infrastructure
 */
async function runInit() {
  try {
    log.header('🚀 Initializing RAG Infrastructure');

    const result = await initializeRAG();

    if (result.success) {
      log.success('RAG infrastructure initialized successfully!');
      console.log('\nInitialization Details:');
      console.log(JSON.stringify(result.steps, null, 2));
    } else {
      log.error('RAG initialization failed');
      console.log('\nErrors:');
      result.errors.forEach((error) => log.error(error));
      process.exit(1);
    }
  } catch (error) {
    log.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Test RAG infrastructure
 */
async function runTest() {
  try {
    log.header('🧪 Testing RAG Infrastructure');

    const result = await testRAG();

    if (result.success) {
      log.success('All RAG tests passed!');
      console.log('\nTest Results:');
      console.log(JSON.stringify(result.tests, null, 2));
    } else {
      log.error('Some RAG tests failed');
      console.log('\nTest Results:');
      console.log(JSON.stringify(result.tests, null, 2));
      process.exit(1);
    }
  } catch (error) {
    log.error(`Tests failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Check RAG status
 */
async function runStatus() {
  try {
    log.header('📊 RAG Infrastructure Status');

    const status = await getRAGStatus();

    console.log('Configuration:', status.configured ? '✓ Valid' : '✗ Invalid');
    console.log('Pinecone Connected:', status.pineconeConnected ? '✓ Yes' : '✗ No');
    console.log('Index Exists:', status.indexExists ? '✓ Yes' : '✗ No');

    if (status.indexStats) {
      console.log('\nIndex Statistics:');
      console.log(JSON.stringify(status.indexStats, null, 2));
    }

    if (status.errors.length > 0) {
      console.log('\nErrors:');
      status.errors.forEach((error) => log.error(error));
    }
  } catch (error) {
    log.error(`Status check failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Verify RAG configuration
 */
function runVerify() {
  log.header('🔍 Verifying RAG Configuration');

  const result = verifyRAGConfig();

  if (result.valid) {
    log.success('Configuration is valid!');

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach((warning) => log.warning(warning));
    }
  } else {
    log.error('Configuration is invalid');
    console.log('\nMissing Required Variables:');
    result.missing.forEach((varName) => log.error(varName));

    console.log('\n💡 Tips:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Add your API keys to .env file');
    console.log('3. Run this script again\n');

    process.exit(1);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
${colors.bright}RAG Setup Script${colors.reset}

Usage:
  node scripts/setupRAG.js <command>

Commands:
  ${colors.cyan}init${colors.reset}     Initialize RAG infrastructure (create Pinecone index)
  ${colors.cyan}test${colors.reset}     Test RAG infrastructure (generate and store test vectors)
  ${colors.cyan}status${colors.reset}   Check current RAG status
  ${colors.cyan}verify${colors.reset}   Verify configuration (check environment variables)
  ${colors.cyan}help${colors.reset}     Show this help message

Examples:
  node scripts/setupRAG.js verify
  node scripts/setupRAG.js init
  node scripts/setupRAG.js test
  node scripts/setupRAG.js status
`);
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];

  if (!command || command === 'help') {
    showUsage();
    return;
  }

  switch (command) {
    case 'init':
      await runInit();
      break;

    case 'test':
      await runTest();
      break;

    case 'status':
      await runStatus();
      break;

    case 'verify':
      runVerify();
      break;

    default:
      log.error(`Unknown command: ${command}`);
      showUsage();
      process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
