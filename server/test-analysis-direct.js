import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resume from './models/Resume.js';
import Analysis from './models/Analysis.js';
import * as geminiService from './services/geminiService.js';
import { generateStructuredAnalysisPrompt } from './prompts/index.js';

dotenv.config();

async function testAnalysis() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get first resume
    const resume = await Resume.findOne().sort({ createdAt: -1 });
    if (!resume) {
      console.log('❌ No resume found');
      return;
    }

    console.log(`📄 Testing analysis for: ${resume.originalName}`);
    console.log(`   - Word count: ${resume.wordCount}`);
    console.log(`   - Has structured data: ${!!resume.structuredData}`);

    // Generate prompt
    const prompt = generateStructuredAnalysisPrompt(
      resume.extractedText,
      resume.structuredData
    );

    console.log(`\n📊 Prompt size: ${prompt.length} characters\n`);
    console.log(`🤖 Calling Gemini API...`);

    // Call Gemini
    const result = await geminiService.generateContent(prompt, true);

    console.log(`\n✅ Analysis generated successfully!`);
    console.log(`   - ATS Score: ${result.atsScore}`);
    console.log(`   - Strengths: ${result.strengths?.length || 0}`);
    console.log(`   - Improvements: ${result.improvements?.length || 0}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAnalysis();
