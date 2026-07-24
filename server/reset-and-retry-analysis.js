import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as analysisPipeline from './services/analysisPipeline.js';

dotenv.config();

async function resetAndRetry() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Analysis = (await import('./models/Analysis.js')).default;
    const Resume = (await import('./models/Resume.js')).default;
    
    // Find stuck processing analyses
    const stuckAnalyses = await Analysis.find({ analysisStatus: 'processing' });
    
    console.log(`📄 Found ${stuckAnalyses.length} stuck analysis\n`);
    
    for (const analysis of stuckAnalyses) {
      console.log(`🔄 Resetting analysis ${analysis._id}`);
      
      // Reset to pending
      analysis.analysisStatus = 'pending';
      analysis.errorMessage = null;
      analysis.errorDetails = null;
      await analysis.save();
      
      // Trigger generation
      console.log(`🚀 Triggering new generation for resume ${analysis.resume}`);
      await analysisPipeline.triggerAnalysisGeneration(analysis.resume.toString(), analysis.user.toString());
    }

    console.log('\n⏳ Waiting 20 seconds for analysis...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    console.log('\n📊 Final Status:');
    for (const analysis of stuckAnalyses) {
      const updated = await Analysis.findById(analysis._id).populate('resume');
      console.log(`  - ${updated.resume?.originalName}: ${updated.analysisStatus}`);
      if (updated.atsScore) console.log(`    ✅ ATS Score: ${updated.atsScore}`);
      if (updated.errorMessage) console.log(`    ❌ Error: ${updated.errorMessage}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAndRetry();
