/**
 * Test AI Chat Pipeline
 * CLI tool for testing the AI Resume Chat functionality
 * 
 * Usage:
 *   node scripts/testAIChat.js chat <sessionId> <userId> <question>
 *   node scripts/testAIChat.js stats <sessionId> <userId>
 *   node scripts/testAIChat.js validate <sessionId> <userId>
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { processChatMessage, getChatStatistics } from '../services/aiChatService.js';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';

// Load environment variables
dotenv.config();

/**
 * Display help information
 */
const showHelp = () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               AI CHAT PIPELINE TEST TOOL                         ║
╚══════════════════════════════════════════════════════════════════╝

Usage:
  node scripts/testAIChat.js <command> [options]

Commands:

  chat <sessionId> <userId> <question>
    Send a chat message and get AI response
    Example: node scripts/testAIChat.js chat 65abc123 65xyz789 "What skills do I have?"

  stats <sessionId> <userId>
    Get chat session statistics
    Example: node scripts/testAIChat.js stats 65abc123 65xyz789

  validate <sessionId> <userId>
    Validate if session is ready for chat
    Example: node scripts/testAIChat.js validate 65abc123 65xyz789

  messages <sessionId> <userId>
    List all messages in a session
    Example: node scripts/testAIChat.js messages 65abc123 65xyz789

  help
    Display this help information

Environment Variables Required:
  - MONGODB_URI
  - GEMINI_API_KEY
  - PINECONE_API_KEY

`);
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Test chat message
 */
const testChat = async (sessionId, userId, question) => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    TESTING CHAT MESSAGE                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log(`Session ID: ${sessionId}`);
  console.log(`User ID: ${userId}`);
  console.log(`Question: "${question}"\n`);

  try {
    const startTime = Date.now();

    const result = await processChatMessage(sessionId, userId, question);

    const duration = Date.now() - startTime;

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                         RESULT                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Success: ${result.success}`);
    console.log(`⏱️  Total Time: ${duration}ms\n`);

    console.log('USER MESSAGE:');
    console.log(`  ID: ${result.userMessage.id}`);
    console.log(`  Message: ${result.userMessage.message}`);
    console.log(`  Timestamp: ${result.userMessage.timestamp}\n`);

    console.log('AI RESPONSE:');
    console.log(`  ID: ${result.aiResponse.id}`);
    console.log(`  Message: ${result.aiResponse.message}`);
    console.log(`  Status: ${result.aiResponse.status}`);
    console.log(`  Timestamp: ${result.aiResponse.timestamp}`);
    console.log(`  Sources: ${result.aiResponse.sourcesUsed.length}\n`);

    if (result.aiResponse.sourcesUsed.length > 0) {
      console.log('SOURCES USED:');
      result.aiResponse.sourcesUsed.forEach((source, idx) => {
        console.log(`  ${idx + 1}. ${source.sectionName} (${(source.score * 100).toFixed(1)}%)`);
        console.log(`     Text: ${source.text.substring(0, 100)}...`);
      });
      console.log();
    }

    console.log('RETRIEVAL STATS:');
    console.log(`  Chunks Retrieved: ${result.retrievalStats.chunksRetrieved}`);
    console.log(`  Top Score: ${(result.retrievalStats.topScore * 100).toFixed(1)}%`);
    console.log(`  Processing Time: ${result.retrievalStats.processingTime}ms\n`);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
  }
};

/**
 * Get statistics
 */
const testStats = async (sessionId, userId) => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                   GETTING SESSION STATS                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log(`Session ID: ${sessionId}`);
  console.log(`User ID: ${userId}\n`);

  try {
    const result = await getChatStatistics(sessionId, userId);

    console.log('STATISTICS:');
    console.log(`  Total Messages: ${result.statistics.totalMessages}`);
    console.log(`  User Messages: ${result.statistics.userMessages}`);
    console.log(`  AI Messages: ${result.statistics.aiMessages}`);
    console.log(`  Avg User Message Length: ${result.statistics.averageUserMessageLength} chars`);
    console.log(`  Avg AI Message Length: ${result.statistics.averageAIMessageLength} chars`);
    console.log(`  Last Message: ${result.statistics.lastMessageAt}`);
    console.log(`  Session Age: ${Math.floor(result.statistics.sessionAge / 1000 / 60)} minutes\n`);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};

/**
 * Validate session
 */
const validateSession = async (sessionId, userId) => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                   VALIDATING SESSION                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log(`Session ID: ${sessionId}`);
  console.log(`User ID: ${userId}\n`);

  try {
    const session = await ChatSession.findById(sessionId).populate('resume');

    if (!session) {
      console.error('❌ Session not found\n');
      return;
    }

    console.log('SESSION:');
    console.log(`  ✅ Found: ${session._id}`);
    console.log(`  Title: ${session.title}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Message Count: ${session.messageCount}`);
    console.log(`  Owner: ${session.user}`);
    console.log(`  User Match: ${session.user.toString() === userId ? '✅ Yes' : '❌ No'}\n`);

    if (!session.resume) {
      console.error('❌ Resume not found\n');
      return;
    }

    console.log('RESUME:');
    console.log(`  ✅ Found: ${session.resume._id}`);
    console.log(`  File Name: ${session.resume.fileName || session.resume.originalName}`);
    console.log(`  Parsing Status: ${session.resume.parsingStatus}`);
    console.log(`  Embedding Status: ${session.resume.embeddingStatus}\n`);

    // Check readiness
    const issues = [];
    
    if (session.user.toString() !== userId) {
      issues.push('User does not own this session');
    }
    
    if (session.status !== 'active') {
      issues.push(`Session is not active (status: ${session.status})`);
    }
    
    if (session.resume.parsingStatus !== 'completed') {
      issues.push('Resume parsing not completed');
    }
    
    if (session.resume.embeddingStatus !== 'completed') {
      issues.push('Resume embeddings not completed');
    }

    if (issues.length === 0) {
      console.log('✅ SESSION IS READY FOR CHAT\n');
    } else {
      console.log('❌ SESSION IS NOT READY:\n');
      issues.forEach((issue) => {
        console.log(`   - ${issue}`);
      });
      console.log();
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};

/**
 * List messages
 */
const listMessages = async (sessionId, userId) => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                   LISTING MESSAGES                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log(`Session ID: ${sessionId}`);
  console.log(`User ID: ${userId}\n`);

  try {
    // Validate ownership
    const session = await ChatSession.findById(sessionId);
    
    if (!session) {
      console.error('❌ Session not found\n');
      return;
    }

    if (session.user.toString() !== userId) {
      console.error('❌ User does not own this session\n');
      return;
    }

    // Get messages
    const messages = await ChatMessage.findBySession(sessionId, { sort: 1 });

    console.log(`Found ${messages.length} messages:\n`);

    messages.forEach((msg, idx) => {
      const icon = msg.sender === 'user' ? '👤' : '🤖';
      console.log(`${icon} Message ${idx + 1} [${msg.sender.toUpperCase()}]`);
      console.log(`   ID: ${msg._id}`);
      console.log(`   Time: ${msg.timestamp}`);
      console.log(`   Message: ${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}`);
      
      if (msg.sourcesUsed && msg.sourcesUsed.length > 0) {
        console.log(`   Sources: ${msg.sourcesUsed.length}`);
        msg.sourcesUsed.forEach((source, sidx) => {
          console.log(`     ${sidx + 1}. ${source.sectionName} (${(source.score * 100).toFixed(1)}%)`);
        });
      }
      
      console.log();
    });
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};

/**
 * Main function
 */
const main = async () => {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  // Connect to database
  await connectDB();

  try {
    switch (command) {
      case 'chat':
        if (args.length < 4) {
          console.error('❌ Error: chat command requires sessionId, userId, and question');
          console.error('Usage: node scripts/testAIChat.js chat <sessionId> <userId> <question>');
          process.exit(1);
        }
        await testChat(args[1], args[2], args.slice(3).join(' '));
        break;

      case 'stats':
        if (args.length < 3) {
          console.error('❌ Error: stats command requires sessionId and userId');
          console.error('Usage: node scripts/testAIChat.js stats <sessionId> <userId>');
          process.exit(1);
        }
        await testStats(args[1], args[2]);
        break;

      case 'validate':
        if (args.length < 3) {
          console.error('❌ Error: validate command requires sessionId and userId');
          console.error('Usage: node scripts/testAIChat.js validate <sessionId> <userId>');
          process.exit(1);
        }
        await validateSession(args[1], args[2]);
        break;

      case 'messages':
        if (args.length < 3) {
          console.error('❌ Error: messages command requires sessionId and userId');
          console.error('Usage: node scripts/testAIChat.js messages <sessionId> <userId>');
          process.exit(1);
        }
        await listMessages(args[1], args[2]);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('Run "node scripts/testAIChat.js help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the script
main();
