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

/**
 * Build structured prompt for AI chat
 * Creates a prompt with retrieved context and user question
 * 
 * @param {string} question - User's question
 * @param {Array} chunks - Retrieved resume chunks
 * @param {string} resumeFileName - Resume file name for context
 * @returns {string} Structured prompt
 */
const buildChatPrompt = (question, chunks, resumeFileName) => {
  // Build context from chunks
  let context = '';
  chunks.forEach((chunk, index) => {
    context += `\n--- Chunk ${index + 1} [${chunk.sectionName}] (Relevance: ${(chunk.score * 100).toFixed(1)}%) ---\n`;
    context += chunk.text;
    context += '\n';
  });

  // Build the structured prompt
  const prompt = `You are an AI assistant helping users understand their resume. You have been given relevant sections from the resume "${resumeFileName}".

RESUME CONTEXT:
${context}

USER QUESTION:
${question}

IMPORTANT INSTRUCTIONS:
1. Answer ONLY based on the provided resume context above
2. If the answer is not in the provided context, respond with: "I don't have enough information in your resume to answer this question."
3. Be specific and reference the exact sections when answering
4. Keep answers concise and professional
5. If you mention any information, it MUST come from the resume context provided

Your response MUST be in this EXACT JSON format (no markdown, no code blocks, no extra text):
{
  "answer": "Your detailed answer here, based ONLY on the resume context",
  "sources": [
    {
      "section": "Section name from resume",
      "similarity": 0.92
    }
  ]
}

The "sources" array should list which resume sections you used to answer, with their relevance scores.
If you cannot answer from the provided context, return:
{
  "answer": "I don't have enough information in your resume to answer this question.",
  "sources": []
}

Remember: Your response must be ONLY the JSON object. No additional text, explanations, or markdown formatting.`;

  return prompt;
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
  const logPrefix = `[AI Chat ${sessionId.slice(-6)}]`;

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${logPrefix} 🚀 Starting Chat Pipeline`);
    console.log(`${logPrefix} Question: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`);
    console.log(`${logPrefix} User ID: ${userId}`);
    console.log(`${'='.repeat(70)}\n`);

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

    // Step 4: Retrieve relevant chunks (Top 5)
    console.log(`${logPrefix} 🔍 Step 4/9: Retrieving relevant resume chunks...`);
    const step4StartTime = Date.now();
    const retrievalResult = await getContextForChat({
      resumeId: resume._id.toString(),
      query: question,
      userId,
      options: {
        topK: 5,
        maxContextLength: 4000,
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
      
      // Create AI message with no context response
      const aiMessage = await ChatMessage.createAIMessage(
        sessionId,
        "I don't have enough information in your resume to answer this question.",
        [],
        {
          model: 'gemini-1.5-flash',
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

    // Step 5: Build structured prompt
    console.log(`${logPrefix} 📝 Step 5/9: Building structured prompt...`);
    const step5StartTime = Date.now();
    const prompt = buildChatPrompt(
      question,
      retrievalResult.chunks,
      resume.fileName || resume.originalName
    );
    const step5Time = Date.now() - step5StartTime;
    console.log(`${logPrefix} ✅ Step 5 Complete (${step5Time}ms)`);
    console.log(`${logPrefix}    • Prompt Length: ${prompt.length} characters`);
    console.log(`${logPrefix}    • Context Chunks: ${retrievalResult.chunks.length}\n`);

    // Step 6: Send to Gemini and get response
    console.log(`${logPrefix} 🤖 Step 6/9: Sending to Gemini AI...`);
    let aiResponse;
    let responseTime = 0;

    try {
      const geminiStartTime = Date.now();
      aiResponse = await generateContent(prompt, true);
      responseTime = Date.now() - geminiStartTime;
      console.log(`${logPrefix} ✅ Step 6 Complete (${responseTime}ms)`);
      console.log(`${logPrefix}    • Model: gemini-1.5-flash`);
      console.log(`${logPrefix}    • Answer Length: ${aiResponse.answer?.length || 0} characters`);
      console.log(`${logPrefix}    • Sources Cited: ${aiResponse.sources?.length || 0}\n`);
    } catch (geminiError) {
      console.error(`${logPrefix} ❌ Step 6 Failed: Gemini error`);
      console.error(`${logPrefix}    • Error: ${geminiError.message}\n`);
      
      // Create error AI message
      const errorMessage = await ChatMessage.createAIMessage(
        sessionId,
        "I'm sorry, I'm having trouble processing your question right now. Please try again in a moment.",
        [],
        {
          model: 'gemini-1.5-flash',
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
    const validation = validateAIResponse(aiResponse, retrievalResult.chunks);

    if (!validation.isValid) {
      console.error(`${logPrefix} ❌ Step 7 Failed: Invalid response format`);
      validation.errors.forEach(err => {
        console.error(`${logPrefix}    • ${err}`);
      });
      console.log();
      throw new Error(`Invalid AI response: ${validation.errors.join(', ')}`);
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
        model: 'gemini-1.5-flash',
        tokensUsed: Math.ceil(prompt.length / 4), // Rough estimate
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
    const logPrefix = `[AI Chat ${sessionId.slice(-6)}]`;
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
