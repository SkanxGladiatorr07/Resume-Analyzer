import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not set in environment');
      process.exit(1);
    }
    
    console.log('🔑 API Key configured');
    console.log(`📍 Key length: ${apiKey.length} characters`);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ GoogleGenerativeAI initialized');
    
    // Get model
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log(`✅ Model retrieved: ${modelName}`);
    
    // Test simple prompt
    console.log('\n🧪 Testing simple prompt...');
    const result = await model.generateContent('Say hello');
    console.log('✅ Request sent successfully');
    
    const response = await result.response;
    console.log('✅ Response received');
    
    const text = response.text();
    console.log(`📝 Response: ${text}`);
    
    console.log('\n✅ Gemini API is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📋 Full error:', error);
    process.exit(1);
  }
}

testGemini();
