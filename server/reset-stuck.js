import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function resetStuck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Analysis = (await import('./models/Analysis.js')).default;
    
    // Find stuck processing analyses
    const stuckAnalyses = await Analysis.find({ analysisStatus: 'processing' });
    
    console.log(`📄 Found ${stuckAnalyses.length} stuck analyses\n`);
    
    for (const analysis of stuckAnalyses) {
      console.log(`🔄 Resetting analysis ${analysis._id} to failed`);
      
      // Reset to failed so retry script can pick it up
      analysis.analysisStatus = 'failed';
      analysis.errorMessage = 'Analysis interrupted by server restart';
      await analysis.save();
    }

    await mongoose.connection.close();
    console.log('\n✅ Done - now run retry-analysis.js');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetStuck();
