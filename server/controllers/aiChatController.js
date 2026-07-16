/**
 * AI Chat Controller
 * Handles HTTP requests for AI-powered resume chat
 * 
 * @module controllers/aiChatController
 */

import { processChatMessage, getChatStatistics } from '../services/aiChatService.js';

/**
 * @desc    Send message and get AI response
 * @route   POST /api/chat/:sessionId
 * @access  Private
 * 
 * @params {
 *   sessionId: string - Chat session ID
 * }
 * 
 * @body {
 *   message: string (required) - User's question
 * }
 * 
 * @returns {
 *   success: boolean,
 *   userMessage: {
 *     id: string,
 *     sender: string,
 *     message: string,
 *     timestamp: date
 *   },
 *   aiResponse: {
 *     id: string,
 *     sender: string,
 *     message: string,
 *     timestamp: date,
 *     sourcesUsed: array,
 *     status: string
 *   },
 *   retrievalStats: {
 *     chunksRetrieved: number,
 *     topScore: number,
 *     processingTime: number
 *   }
 * }
 */
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user._id.toString();

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string',
      });
    }

    if (message.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (maximum 10000 characters)',
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    // Process message through RAG pipeline
    const result = await processChatMessage(sessionId, userId, message.trim());

    // Return based on success
    if (result.success) {
      res.status(200).json(result);
    } else {
      // Partial failure (e.g., Gemini error but message saved)
      res.status(200).json({
        ...result,
        warning: 'Message saved but AI response may be incomplete',
      });
    }
  } catch (error) {
    console.error('[AI Chat Controller] Error processing message:', error.message);

    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied') || error.message.includes('does not belong')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this chat session',
      });
    }

    if (error.message.includes('inactive')) {
      return res.status(400).json({
        success: false,
        message: 'This chat session is not active',
      });
    }

    if (error.message.includes('embeddings are not ready')) {
      return res.status(400).json({
        success: false,
        message: 'Resume is still being processed. Please wait a moment and try again.',
        hint: 'The resume embeddings need to be generated before you can chat',
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Failed to process your message. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get chat session statistics
 * @route   GET /api/chat/:sessionId/stats
 * @access  Private
 * 
 * @params {
 *   sessionId: string - Chat session ID
 * }
 * 
 * @returns {
 *   success: boolean,
 *   statistics: {
 *     totalMessages: number,
 *     userMessages: number,
 *     aiMessages: number,
 *     averageUserMessageLength: number,
 *     averageAIMessageLength: number,
 *     lastMessageAt: date,
 *     sessionAge: number
 *   }
 * }
 */
export const getStats = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id.toString();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    const result = await getChatStatistics(sessionId, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('[AI Chat Controller] Error getting statistics:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this chat session',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default {
  sendMessage,
  getStats,
};
