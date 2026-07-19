import app from './app.js';
import config from './config/index.js';
import connectDB from './config/database.js';
import { validateEnvironment, printEnvironmentSummary } from './utils/envValidator.js';

// Startup function with database connection
const startServer = async () => {
  try {
    console.log('='.repeat(60));
    console.log('🚀 Starting ResumeAI Backend Server');
    console.log('='.repeat(60));

    // Step 1: Validate environment variables
    console.log('\n📋 Step 1: Environment Validation');
    const isValid = validateEnvironment();
    
    if (!isValid) {
      console.error('\n❌ Environment validation failed. Server cannot start.\n');
      process.exit(1);
    }

    // Print environment summary
    printEnvironmentSummary();

    // Step 2: Connect to MongoDB
    console.log('\n📊 Step 2: Database Connection');
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // Step 3: Start Express server
    console.log('\n🌐 Step 3: Starting HTTP Server');
    const server = app.listen(config.server.port, () => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ ResumeAI Backend Server Started Successfully!');
      console.log('='.repeat(60));
      console.log(`📍 Environment: ${config.server.env}`);
      console.log(`🌐 Server: http://localhost:${config.server.port}`);
      console.log(`🔗 API: http://localhost:${config.server.port}/api`);
      console.log(`❤️  Health: http://localhost:${config.server.port}/api/health`);
      console.log('='.repeat(60));
      console.log('\n🎯 Server is ready to accept requests!\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n\n${signal} received. Starting graceful shutdown...`);
      console.log('='.repeat(60));
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        console.log('✅ All connections terminated gracefully');
        console.log('='.repeat(60));
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('\n⚠️  Could not close connections in time. Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('\n❌ UNCAUGHT EXCEPTION! Shutting down...');
      console.error('='.repeat(60));
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('='.repeat(60));
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('\n❌ UNHANDLED REJECTION! Shutting down...');
      console.error('='.repeat(60));
      console.error('Reason:', reason);
      console.error('Promise:', promise);
      console.error('='.repeat(60));
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ FAILED TO START SERVER');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n💡 Troubleshooting Steps:');
    console.error('   1. Check if MongoDB is running');
    console.error('   2. Verify MONGODB_URI in .env file');
    console.error('   3. Ensure all required environment variables are set');
    console.error('   4. Check network connectivity');
    console.error('   5. Review the error stack trace above');
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
};

// Start the application
startServer();
