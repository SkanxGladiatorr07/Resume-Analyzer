import app from './app.js';
import config from './config/index.js';
import connectDB from './config/database.js';

// Startup function with database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // Start Express server only after successful DB connection
    const server = app.listen(config.server.port, () => {
      console.log('='.repeat(50));
      console.log('🚀 ResumeAI Backend Server Started Successfully!');
      console.log('='.repeat(50));
      console.log(`📍 Environment: ${config.server.env}`);
      console.log(`🌐 Server: http://localhost:${config.server.port}`);
      console.log(`🔗 API: http://localhost:${config.server.port}/api`);
      console.log(`❤️  Health: http://localhost:${config.server.port}/api/health`);
      console.log('='.repeat(50));
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('='.repeat(50));
    console.error('❌ Failed to start server');
    console.error('='.repeat(50));
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if MongoDB is running');
    console.error('   2. Verify MONGODB_URI in .env file');
    console.error('   3. Ensure network connectivity');
    console.error('='.repeat(50));
    process.exit(1);
  }
};

// Start the application
startServer();
