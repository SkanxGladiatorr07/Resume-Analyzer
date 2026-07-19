/**
 * AI Chat Service
 * Implements the complete RAG pipeline for AI resume chat
 * Handles question answering with retrieval-augmented generation
 * 
 * @module services/aiChatService
 */

import { generateQueryEmbedding } from './embeddingService.js';
import { getContextForChat } from './retrievalService.js';
import { generateContent } from './geminiService.js';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import Resume from '../models/Resume.js';

// Import new modules
import chatConfig from '../config/chat.js';
import {
  isDuplicateRequest,
  markRequestInProgress,
  clearRequest,
  validateMessage,
  sleep,
  calculateBackoff,
  sanitizeForLog,
  getShortId,
} from '../utils/chatHelpers.js';
import { buildChatPrompt, buildNoContextPrompt, validatePrompt } from './promptBuilder.js';

/**
 * Call Gemini with retry mechanism
 * Implements exponential backoff for transient failures
 * 
 * @param {string} prompt - Prompt to send
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} AI response
 */
const callGeminiWithRetry = async (prompt, attempt = 0) => {
  const maxRetries = chatConfig.gemini.maxRetries;
  const logPrefix = '[AI Chat]';

  try {
    const response = await generateContent(prompt, true);
    return response;
  } catch (error) {
    // Check if we should retry
    const isRetryable = 
      error.message.includes('timeout') ||
      error.message.includes('429') ||
      error.message.includes('503') ||
      error.message.includes('UNAVAILABLE');

    if (isRetryable && attempt < maxRetries) {
      const delay = calculateBackoff(attempt);
      console.log(`${logPrefix} Gemini call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      console.log(`${logPrefix} Error: ${error.message}`);
      
      await sleep(delay);
      return callGeminiWithRetry(prompt, attempt + 1);
    }

    // Max retries reached or non-retryable error
    console.error(`${logPrefix} Gemini call failed after ${attempt + 1} attempts`);
    throw error;
  }
};

/**
 * Validate AI response
 * Ensures the response has the correct format and is grounded in context
 * 
 * @param {Object} response - AI response to validate
 * @param {Array} retrievedChunks - Chunks that were retrieved
 * @returns {Object} Validation result
 */
const validateAIResponse = (response, retrievedChunks) => {
  const errors = [];

  // Check required fields
  if (!response.answer || typeof response.answer !== 'string') {
    errors.push('Response must include "answer" field as string');
  }

  if (!Array.isArray(response.sources)) {
    errors.push('Response must include "sources" field as array');
  }

  // Validate sources
  if (response.sources && Array.isArray(response.sources)) {
    response.sources.forEach((source, index) => {
      if (!source.section || typeof source.section !== 'string') {
        errors.push(`Source ${index + 1} missing "section" field`);
      }
      if (typeof source.similarity !== 'number' || source.similarity < 0 || source.similarity > 1) {
        errors.push(`Source ${index + 1} has invalid "similarity" value`);
      }
    });
  }

  // Check if answer is grounded (not a generic "I don't know" when context exists)
  const hasContext = retrievedChunks && retrievedChunks.length > 0;
  const isGenericRefusal = response.answer && 
    response.answer.toLowerCase().includes("don't have enough information");

  return {
    isValid: errors.length === 0,
    errors,
    isGrounded: hasContext ? !isGenericRefusal : true,
    hasContext,
  };
};

/**
 * Process chat message with RAG pipeline
 * Complete workflow: embedding -> retrieval -> prompt building -> AI generation -> validation
 * 
 * @param {string} sessionId - Chat session identifier
 * @param {string} userId - User identifier
 * @param {string} question - User's question
 * @returns {Promise<Object>} Chat response with answer and sources
 * @throws {Error} If any step in the pipeline fails
 */
export const processChatMessage = async (sessionId, userId, question) => {
  const startTime = Date.now();
  const shortId = getShortId(sessionId);
  const logPrefix = `[AI Chat ${shortId}]`;

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🚀 Starting Chat Pipeline`);
    console.log(`${logPrefix} Question: "${sanitizeForLog(question, 100)}"`);
    console.log(`${logPrefix} User ID: ${userId}`);
    console.log(`${'='.repeat(70)}\n`);

    // Step 0: Validate message
    console.log(`${logPrefix} 📝 Step 0/9: Validating message...`);
    const validation = validateMessage(question);
    
    if (!validation.isValid) {
      throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
    }

    // Step 0.5: Check for duplicate requests
    console.log(`${logPrefix} 🔍 Step 0.5/9: Checking for duplicates...`);
    if (isDuplicateRequest(sessionId, question)) {
      console.log(`${logPrefix} ⚠️  Duplicate request detected - rejecting\n`);
      throw new Error('Duplicate request. Please wait for the previous request to complete.');
    }

    // Mark request as in-progress
    markRequestInProgress(sessionId, question);

    // Step 1: Validate session and get resume
    console.log(`${logPrefix} 📋 Step 1/9: Validating session...`);
    const stepStartTime = Date.now();
    const session = await ChatSession.findById(sessionId).populate('resume');

    if (!session) {
      throw new Error('Chat session not found');
    }

    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This chat session does not belong to you.');
    }

    if (!session.isActive()) {
      throw new Error('Cannot send messages to inactive session');
    }

    const resume = session.resume;
    
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.embeddingStatus !== 'completed') {
      throw new Error('Resume embeddings are not ready. Please wait for processing to complete.');
    }

    const step1Time = Date.now() - stepStartTime;
    console.log(`${logPrefix} ✅ Step 1 Complete (${step1Time}ms)`);
    console.log(`${logPrefix}    • Resume: ${resume.fileName || resume.originalName}`);
    console.log(`${logPrefix}    • Status: ${session.status}`);
    console.log(`${logPrefix}    • Embedding Status: ${resume.embeddingStatus}\n`);

    // Step 2: Create user message
    console.log(`${logPrefix} 💬 Step 2/9: Creating user message...`);
    const step2StartTime = Date.now();
    const userMessage = await ChatMessage.createUserMessage(sessionId, question);
    const step2Time = Date.now() - step2StartTime;
    console.log(`${logPrefix} ✅ Step 2 Complete (${step2Time}ms)`);
    console.log(`${logPrefix}    • Message ID: ${userMessage._id}`);
    console.log(`${logPrefix}    • Length: ${question.length} characters\n`);

    // Step 3: Generate embedding for question
    console.log(`${logPrefix} 🔢 Step 3/9: Generating question embedding...`);
    const step3StartTime = Date.now();
    const questionEmbedding = await generateQueryEmbedding(question);
    const step3Time = Date.now() - step3StartTime;
    console.log(`${logPrefix} ✅ Step 3 Complete (${step3Time}ms)`);
    console.log(`${logPrefix}    • Dimensions: ${questionEmbedding.length}`);
    console.log(`${logPrefix}    • Model: text-embedding-004\n`);

    // Step 4: Retrieve relevant chunks (Top K from config)
    console.log(`${logPrefix} 🔍 Step 4/9: Retrieving relevant resume chunks...`);
    const step4StartTime = Date.now();
    const retrievalResult = await getContextForChat({
      resumeId: resume._id.toString(),
      query: question,
      userId,
      options: {
        topK: chatConfig.retrieval.topK,
        maxContextLength: chatConfig.retrieval.maxContextLength,
        minSimilarityScore: chatConfig.retrieval.minSimilarityScore,
        includeScores: true,
        includeSections: true,
      },
    });

    const step4Time = Date.now() - step4StartTime;
    console.log(`${logPrefix} ✅ Step 4 Complete (${step4Time}ms)`);
    console.log(`${logPrefix}    • Chunks Retrieved: ${retrievalResult.chunks.length}`);
    retrievalResult.chunks.forEach((chunk, idx) => {
      console.log(`${logPrefix}    • Chunk ${idx + 1}: ${chunk.sectionName} (${(chunk.score * 100).toFixed(1)}% match)`);
    });
    console.log();

    // Check if we have relevant context
    if (retrievalResult.chunks.length === 0) {
      console.log(`${logPrefix} ⚠️  No relevant chunks found - returning generic response\n`);
      
      // Clear request from cache
      clearRequest(sessionId, question);
      
      // Create AI message with no context response
      const aiMessage = await ChatMessage.createAIMessage(
        sessionId,
        "I don't have enough information in your resume to answer this question.",
        [],
        {
          model: chatConfig.gemini.model,
          tokensUsed: 0,
          responseTime: Date.now() - startTime,
        }
      );

      const totalTime = Date.now() - startTime;
      console.log(`${logPrefix} ✅ Pipeline Complete (${totalTime}ms) - No context response\n`);
      console.log(`${'='.repeat(70)}\n`);

      return {
        success: true,
        userMessage: {
          id: userMessage._id,
          sender: userMessage.sender,
          message: userMessage.message,
          timestamp: userMessage.timestamp,
        },
        aiResponse: {
          id: aiMessage._id,
          sender: aiMessage.sender,
          message: aiMessage.message,
          timestamp: aiMessage.timestamp,
          sourcesUsed: [],
        },
        retrievalStats: {
          chunksRetrieved: 0,
          processingTime: totalTime,
        },
      };
    }

    // Step 5: Build structured prompt with new prompt builder
    console.log(`${logPrefix} 📝 Step 5/9: Building structured prompt...`);
    const step5StartTime = Date.now();
    const promptObject = buildChatPrompt(
      question,
      retrievalResult.chunks,
      resume.fileName || resume.originalName
    );

    // Validate prompt
    const promptValidation = validatePrompt(promptObject);
    if (!promptValidation.isValid) {
      throw new Error(`Invalid prompt: ${promptValidation.errors.join(', ')}`);
    }

    const step5Time = Date.now() - step5StartTime;
    console.log(`${logPrefix} ✅ Step 5 Complete (${step5Time}ms)`);
    console.log(`${logPrefix}    • Prompt Length: ${promptObject.text.length} characters`);
    console.log(`${logPrefix}    • Estimated Tokens: ${promptObject.metadata.estimatedTokens}`);
    console.log(`${logPrefix}    • Truncated: ${promptObject.metadata.truncated ? 'Yes' : 'No'}`);
    console.log(`${logPrefix}    • Context Chunks: ${promptObject.metadata.chunksUsed}\n`);

    // Step 6: Send to Gemini with retry mechanism
    console.log(`${logPrefix} 🤖 Step 6/9: Sending to Gemini AI (with retry)...`);
    let aiResponse;
    let responseTime = 0;

    try {
      const geminiStartTime = Date.now();
      aiResponse = await callGeminiWithRetry(promptObject.text);
      responseTime = Date.now() - geminiStartTime;
      
      // Clear request from cache after successful response
      clearRequest(sessionId, question);
      
      console.log(`${logPrefix} ✅ Step 6 Complete (${responseTime}ms)`);
      console.log(`${logPrefix}    • Model: ${chatConfig.gemini.model}`);
      console.log(`${logPrefix}    • Answer Length: ${aiResponse.answer?.length || 0} characters`);
      console.log(`${logPrefix}    • Sources Cited: ${aiResponse.sources?.length || 0}\n`);
    } catch (geminiError) {
      console.error(`${logPrefix} ❌ Step 6 Failed: Gemini error`);
      console.error(`${logPrefix}    • Error: ${geminiError.message}\n`);
      
      // Clear request from cache
      clearRequest(sessionId, question);
      
      // Create error AI message
      const errorMessage = await ChatMessage.createAIMessage(
        sessionId,
        "I'm sorry, I'm having trouble processing your question right now. Please try again in a moment.",
        [],
        {
          model: chatConfig.gemini.model,
          tokensUsed: 0,
          responseTime: Date.now() - startTime,
        }
      );

      await errorMessage.markAsError(geminiError.message);

      const totalTime = Date.now() - startTime;
      console.log(`${logPrefix} ❌ Pipeline Failed (${totalTime}ms) - Gemini error\n`);
      console.log(`${'='.repeat(70)}\n`);

      return {
        success: false,
        error: 'AI service temporarily unavailable',
        userMessage: {
          id: userMessage._id,
          sender: userMessage.sender,
          message: userMessage.message,
          timestamp: userMessage.timestamp,
        },
        aiResponse: {
          id: errorMessage._id,
          sender: errorMessage.sender,
          message: errorMessage.message,
          timestamp: errorMessage.timestamp,
          sourcesUsed: [],
          status: 'error',
        },
      };
    }

    // Step 7: Validate response
    console.log(`${logPrefix} ✔️  Step 7/9: Validating AI response...`);
    const step7StartTime = Date.now();
    const responseValidation = validateAIResponse(aiResponse, retrievalResult.chunks);

    if (!responseValidation.isValid) {
      console.error(`${logPrefix} ❌ Step 7 Failed: Invalid response format`);
      responseValidation.errors.forEach(err => {
        console.error(`${logPrefix}    • ${err}`);
      });
      console.log();
      throw new Error(`Invalid AI response: ${responseValidation.errors.join(', ')}`);
    }

    const step7Time = Date.now() - step7StartTime;
    console.log(`${logPrefix} ✅ Step 7 Complete (${step7Time}ms)`);
    console.log(`${logPrefix}    • Valid Format: Yes`);
    console.log(`${logPrefix}    • Grounded: ${validation.isGrounded ? 'Yes' : 'No'}`);
    console.log(`${logPrefix}    • Has Context: ${validation.hasContext ? 'Yes' : 'No'}\n`);

    // Step 8: Prepare sources with actual data from retrieved chunks
    console.log(`${logPrefix} 🔗 Step 8/9: Preparing sources...`);
    const step8StartTime = Date.now();
    const sourcesUsed = aiResponse.sources.map((source) => {
      // Find the matching chunk
      const matchingChunk = retrievalResult.chunks.find(
        (chunk) => chunk.sectionName === source.section
      );

      return {
        chunkId: matchingChunk ? matchingChunk.chunkId : null,
        sectionName: source.section,
        score: source.similarity,
        text: matchingChunk ? matchingChunk.text.substring(0, 200) : '',
      };
    });

    const step8Time = Date.now() - step8StartTime;
    console.log(`${logPrefix} ✅ Step 8 Complete (${step8Time}ms)`);
    console.log(`${logPrefix}    • Sources Matched: ${sourcesUsed.length}`);
    sourcesUsed.forEach((source, idx) => {
      console.log(`${logPrefix}    • Source ${idx + 1}: ${source.sectionName} (${(source.score * 100).toFixed(1)}%)`);
    });
    console.log();

    // Step 9: Save AI response
    console.log(`${logPrefix} 💾 Step 9/9: Saving AI response...`);
    const step9StartTime = Date.now();
    const aiMessage = await ChatMessage.createAIMessage(
      sessionId,
      aiResponse.answer,
      sourcesUsed,
      {
        model: chatConfig.gemini.model,
        tokensUsed: promptObject.metadata.estimatedTokens,
        responseTime,
      }
    );

    const step9Time = Date.now() - step9StartTime;
    console.log(`${logPrefix} ✅ Step 9 Complete (${step9Time}ms)`);
    console.log(`${logPrefix}    • AI Message ID: ${aiMessage._id}`);
    console.log(`${logPrefix}    • Session Updated: Yes\n`);

    const totalTime = Date.now() - startTime;
    console.log(`${'='.repeat(70)}`);
    console.log(`${logPrefix} 🎉 Pipeline Complete Successfully!`);
    console.log(`${logPrefix} Total Time: ${totalTime}ms`);
    console.log(`${logPrefix} Breakdown:`);
    console.log(`${logPrefix}    • Validation: ${step1Time}ms (${((step1Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • User Message: ${step2Time}ms (${((step2Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • Embedding: ${step3Time}ms (${((step3Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • Retrieval: ${step4Time}ms (${((step4Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • Prompt Build: ${step5Time}ms (${((step5Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • AI Generation: ${responseTime}ms (${((responseTime/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • Validation: ${step7Time}ms (${((step7Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • Source Match: ${step8Time}ms (${((step8Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${logPrefix}    • Save Response: ${step9Time}ms (${((step9Time/totalTime)*100).toFixed(1)}%)`);
    console.log(`${'='.repeat(70)}\n`);

    // Return complete result
    return {
      success: true,
      userMessage: {
        id: userMessage._id,
        sender: userMessage.sender,
        message: userMessage.message,
        timestamp: userMessage.timestamp,
      },
      aiResponse: {
        id: aiMessage._id,
        sender: aiMessage.sender,
        message: aiMessage.message,
        timestamp: aiMessage.timestamp,
        sourcesUsed: aiMessage.sourcesUsed,
        status: aiMessage.status,
      },
      retrievalStats: {
        chunksRetrieved: retrievalResult.chunks.length,
        topScore: retrievalResult.chunks[0]?.score || 0,
        processingTime: totalTime,
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const shortId = getShortId(sessionId);
    const logPrefix = `[AI Chat ${shortId}]`;
    
    // Clear request from cache on error
    clearRequest(sessionId, question);
    
    console.error(`\n${'='.repeat(70)}`);
    console.error(`${logPrefix} ❌ PIPELINE ERROR`);
    console.error(`${logPrefix} Error: ${error.message}`);
    console.error(`${logPrefix} Time: ${totalTime}ms`);
    console.error(`${'='.repeat(70)}\n`);
    throw error;
  }
};

/**
 * Get chat session statistics
 * Returns analytics about the chat session
 * 
 * @param {string} sessionId - Chat session identifier
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Session statistics
 */
export const getChatStatistics = async (sessionId, userId) => {
  try {
    // Validate session ownership
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Chat session not found');
    }

    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied');
    }

    // Get message statistics
    const messageStats = await ChatMessage.getSessionStats(sessionId);

    return {
      success: true,
      statistics: {
        totalMessages: session.messageCount,
        userMessages: messageStats.userMessages,
        aiMessages: messageStats.aiMessages,
        averageUserMessageLength: messageStats.avgUserMessageLength,
        averageAIMessageLength: messageStats.avgAIMessageLength,
        lastMessageAt: session.lastMessageAt,
        sessionAge: Date.now() - new Date(session.createdAt).getTime(),
      },
    };
  } catch (error) {
    console.error('[AI Chat] Error getting statistics:', error.message);
    throw error;
  }
};

export default {
  processChatMessage,
  getChatStatistics,
};
