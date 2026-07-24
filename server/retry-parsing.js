import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as parsingPipeline from './services/parsingPipeline.js';

// Load environment variables
dotenv.config();

async function retryParsing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the Resume model
    const Resume = (await import('./models/Resume.js')).default;

    // Find all failed resumes
    const failedResumes = await Resume.find({ parsingStatus: 'failed' });
    
    console.log(`📄 Found ${failedResumes.length} failed resume(s)\n`);
    
    if (failedResumes.length === 0) {
      console.log('No failed resumes to retry.');
      await mongoose.connection.close();
      return;
    }

    // Retry each one
    for (const resume of failedResumes) {
      console.log(`🔄 Retrying: ${resume.originalName}`);
      try {
        await parsingPipeline.retryParsing(resume._id.toString());
        console.log(`✅ Retry initiated for ${resume.originalName}\n`);
      } catch (error) {
        console.error(`❌ Failed to retry ${resume.originalName}: ${error.message}\n`);
      }
    }

    // Wait a bit for async parsing to complete
    console.log('⏳ Waiting for parsing to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    // Check results
    console.log('\n📊 Final Status:');
    for (const resume of failedResumes) {
      const updated = await Resume.findById(resume._id);
      console.log(`  - ${updated.originalName}: ${updated.parsingStatus}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

retryParsing();
