import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as analysisPipeline from './services/analysisPipeline.js';

dotenv.config();

async function retryAnalysis() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Analysis = (await import('./models/Analysis.js')).default;
    const failedAnalyses = await Analysis.find({ analysisStatus: 'failed' }).populate('resume');
    
    console.log(`📄 Found ${failedAnalyses.length} failed analysis\n`);
    
    for (const analysis of failedAnalyses) {
      console.log(`🔄 Retrying analysis for: ${analysis.resume?.originalName}`);
      try {
        await analysisPipeline.retryFailedAnalysis(analysis.resume._id.toString(), analysis.user.toString());
        console.log(`✅ Retry initiated\n`);
      } catch (error) {
        console.error(`❌ Failed: ${error.message}\n`);
      }
    }

    console.log('⏳ Waiting 15 seconds for analysis...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('\n📊 Final Status:');
    for (const analysis of failedAnalyses) {
      const updated = await Analysis.findById(analysis._id);
      console.log(`  - ${analysis.resume?.originalName}: ${updated.analysisStatus}`);
      if (updated.atsScore) console.log(`    ATS Score: ${updated.atsScore}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

retryAnalysis();
