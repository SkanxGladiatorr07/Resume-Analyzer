import mongoose from 'mongoose';
import Resume from './models/Resume.js';
import Analysis from './models/Analysis.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkResumes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all resumes
    const resumes = await Resume.find().sort({ createdAt: -1 }).limit(5);
    
    console.log(`📄 Total Resumes: ${resumes.length}\n`);
    
    for (const resume of resumes) {
      console.log(`Resume: ${resume.originalName}`);
      console.log(`  - ID: ${resume._id}`);
      console.log(`  - Parsing Status: ${resume.parsingStatus}`);
      console.log(`  - Word Count: ${resume.wordCount || 'N/A'}`);
      console.log(`  - Has Text: ${resume.extractedText ? 'Yes' : 'No'}`);
      console.log(`  - Has Structured Data: ${resume.structuredData ? 'Yes' : 'No'}`);
      console.log(`  - Error: ${resume.parsingError || 'None'}`);
      
      // Check for analysis
      const analysis = await Analysis.findOne({ resume: resume._id });
      console.log(`  - Has Analysis: ${analysis ? 'Yes (' + analysis.analysisStatus + ')' : 'No'}`);
      if (analysis && analysis.errorMessage) {
        console.log(`  - Analysis Error: ${analysis.errorMessage}`);
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkResumes();
