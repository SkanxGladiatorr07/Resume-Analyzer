/**
 * Gemini AI Service
 * Handles all interactions with Google Gemini API
 * Ensures clean architecture and separation of concerns
 * Includes optimization for API usage and token management
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import { estimateTokenCount, checkPromptSize } from '../utils/aiValidator.js';

// Initialize Gemini AI
let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 * @throws {Error} If API key is not configured
 */
const initializeGemini = () => {
  if (!config.ai.geminiApiKey) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    model = genAI.getGenerativeModel({ 
      model: config.ai.model,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
    console.log('✅ Gemini AI initialized successfully');
  }

  return model;
};

/**
 * Check if Gemini is configured
 * @returns {boolean} Whether Gemini is available
 */
export const isGeminiAvailable = () => {
  return !!config.ai.geminiApiKey;
};

/**
 * Parse JSON from Gemini response
 * @param {string} text - Response text
 * @returns {Object} Parsed JSON object
 * @throws {Error} If JSON parsing fails
 */
const parseJSONResponse = (text) => {
  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  
  // Remove ```json and ``` markers
  cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  
  // Remove any other markdown code block markers
  cleanedText = cleanedText.replace(/^```\s*/i, '').replace(/```\s*$/, '');
  
  // Try to parse JSON
  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    // Try to find JSON in the text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error(`Failed to parse JSON: ${e.message}`);
      }
    }
    throw new Error('No valid JSON found in response');
  }
};

/**
 * Generate content using Gemini AI with retry logic
 * @param {string} prompt - The prompt to send to Gemini
 * @param {boolean} expectJSON - Whether to expect JSON response (default: true)
 * @returns {Promise<Object|string>} Parsed response or raw text
 */
export const generateContent = async (prompt, expectJSON = true) => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini AI is not available. API key not configured.');
  }

  // Check prompt size to optimize API usage
  const sizeCheck = checkPromptSize(prompt);
  if (!sizeCheck.withinLimit) {
    console.warn(`⚠️  Prompt is too large: ${sizeCheck.estimatedTokens} tokens (max: ${sizeCheck.maxTokens})`);
    throw new Error(`Prompt exceeds token limit. Estimated: ${sizeCheck.estimatedTokens}, Max: ${sizeCheck.maxTokens}`);
  }
  
  console.log(`📊 Prompt size: ~${sizeCheck.estimatedTokens} tokens (${sizeCheck.percentUsed.toFixed(1)}% of limit)`);

  const aiModel = initializeGemini();
  const maxRetries = config.ai.maxRetries;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Gemini AI request (attempt ${attempt + 1}/${maxRetries + 1})...`);
      
      // Generate content
      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`✅ Gemini AI responded successfully`);

      // If expecting JSON, parse it
      if (expectJSON) {
        try {
          const parsed = parseJSONResponse(text);
          console.log(`✅ JSON parsed successfully`);
          return parsed;
        } catch (parseError) {
          lastError = parseError;
          console.warn(`⚠️  JSON parsing failed on attempt ${attempt + 1}: ${parseError.message}`);
          
          // If this is not the last attempt, retry
          if (attempt < maxRetries) {
            console.log(`🔄 Retrying with more explicit JSON instructions...`);
            // Add more explicit JSON instruction for retry
            const retryPrompt = `${prompt}\n\nREMINDER: Your response must be ONLY valid JSON. No markdown, no explanations, no code blocks. Just pure JSON starting with { and ending with }.`;
            
            // Retry with modified prompt
            const retryResult = await aiModel.generateContent(retryPrompt);
            const retryResponse = await retryResult.response;
            const retryText = retryResponse.text();
            
            try {
              const parsed = parseJSONResponse(retryText);
              console.log(`✅ JSON parsed successfully on retry`);
              return parsed;
            } catch (retryParseError) {
              lastError = retryParseError;
              console.error(`❌ JSON parsing failed again: ${retryParseError.message}`);
            }
          }
        }
      } else {
        // Return raw text if not expecting JSON
        return text;
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Gemini AI error on attempt ${attempt + 1}:`, error.message);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const waitTime = 1000 * (attempt + 1); // Exponential backoff
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All attempts failed
  const errorMessage = lastError 
    ? `Gemini AI failed after ${maxRetries + 1} attempts: ${lastError.message}`
    : 'Gemini AI failed with unknown error';
  
  console.error(`❌ ${errorMessage}`);
  throw new Error(errorMessage);
};

/**
 * Generate resume analysis
 * @param {string} prompt - Analysis prompt
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeResume = async (prompt) => {
  try {
    const result = await generateContent(prompt, true);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Resume analysis error:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * Test Gemini connection
 * @returns {Promise<Object>} Test result
 */
export const testConnection = async () => {
  if (!isGeminiAvailable()) {
    return {
      success: false,
      message: 'Gemini API key not configured',
    };
  }

  try {
    const testPrompt = 'Respond with only this JSON: {"status": "ok", "message": "Connection successful"}';
    const result = await generateContent(testPrompt, true);
    
    return {
      success: true,
      message: 'Gemini AI connection successful',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: `Gemini AI connection failed: ${error.message}`,
    };
  }
};

/**
 * Get model information
 * @returns {Object} Model configuration
 */
export const getModelInfo = () => {
  return {
    available: isGeminiAvailable(),
    model: config.ai.model,
    maxRetries: config.ai.maxRetries,
  };
};
