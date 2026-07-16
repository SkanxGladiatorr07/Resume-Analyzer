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

  try {
    console.log(`\n[AI Chat] Processing message for session ${sessionId}`);
    console.log(`[AI Chat] Question: "${question}"`);

    // Step 1: Validate session and get resume
    console.log('[AI Chat] Step 1: Validating session...');
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

    console.log(`[AI Chat] ✅ Session valid, resume: ${resume.fileName || resume.originalName}`);

    // Step 2: Create user message
    console.log('[AI Chat] Step 2: Creating user message...');
    const userMessage = await ChatMessage.createUserMessage(sessionId, question);
    console.log(`[AI Chat] ✅ User message created: ${userMessage._id}`);

    // Step 3: Generate embedding for question
    console.log('[AI Chat] Step 3: Generating question embedding...');
    const questionEmbedding = await generateQueryEmbedding(question);
    console.log(`[AI Chat] ✅ Question embedding generated (${questionEmbedding.length} dimensions)`);

    // Step 4: Retrieve relevant chunks (Top 5)
    console.log('[AI Chat] Step 4: Retrieving relevant resume chunks...');
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

    console.log(`[AI Chat] ✅ Retrieved ${retrievalResult.chunks.length} chunks`);
    retrievalResult.chunks.forEach((chunk, idx) => {
      console.log(`   - Chunk ${idx + 1}: ${chunk.sectionName} (score: ${(chunk.score * 100).toFixed(1)}%)`);
    });

    // Check if we have relevant context
    if (retrievalResult.chunks.length === 0) {
      console.log('[AI Chat] ⚠️  No relevant chunks found');
      
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
          processingTime: Date.now() - startTime,
        },
      };
    }

    // Step 5: Build structured prompt
    console.log('[AI Chat] Step 5: Building structured prompt...');
    const prompt = buildChatPrompt(
      question,
      retrievalResult.chunks,
      resume.fileName || resume.originalName
    );
    console.log(`[AI Chat] ✅ Prompt built (${prompt.length} chars)`);

    // Step 6: Send to Gemini and get response
    console.log('[AI Chat] Step 6: Sending to Gemini AI...');
    let aiResponse;
    let responseTime = 0;

    try {
      const geminiStartTime = Date.now();
      aiResponse = await generateContent(prompt, true);
      responseTime = Date.now() - geminiStartTime;
      console.log(`[AI Chat] ✅ Gemini responded in ${responseTime}ms`);
    } catch (geminiError) {
      console.error('[AI Chat] ❌ Gemini error:', geminiError.message);
      
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
    console.log('[AI Chat] Step 7: Validating AI response...');
    const validation = validateAIResponse(aiResponse, retrievalResult.chunks);

    if (!validation.isValid) {
      console.error('[AI Chat] ❌ Invalid response format:', validation.errors);
      throw new Error(`Invalid AI response: ${validation.errors.join(', ')}`);
    }

    console.log(`[AI Chat] ✅ Response validated (grounded: ${validation.isGrounded})`);

    // Step 8: Prepare sources with actual data from retrieved chunks
    console.log('[AI Chat] Step 8: Preparing sources...');
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

    console.log(`[AI Chat] ✅ Prepared ${sourcesUsed.length} sources`);

    // Step 9: Save AI response
    console.log('[AI Chat] Step 9: Saving AI response...');
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

    console.log(`[AI Chat] ✅ AI message created: ${aiMessage._id}`);
    console.log(`[AI Chat] ✅ Pipeline completed in ${Date.now() - startTime}ms\n`);

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
        processingTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error('[AI Chat] ❌ Pipeline error:', error.message);
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
