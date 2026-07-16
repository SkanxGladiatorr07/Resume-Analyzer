/**
 * Chat Service
 * Service for managing chat sessions and messages
 * 
 * @module services/chatService
 */

import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import Resume from '../models/Resume.js';

/**
 * Create a new chat session
 * 
 * @param {string} userId - User identifier
 * @param {string} resumeId - Resume identifier
 * @param {Object} [options={}] - Session options
 * @returns {Promise<Object>} Created session
 * @throws {Error} If resume not found or doesn't belong to user
 */
export const createChatSession = async (userId, resumeId, options = {}) => {
  try {
    // Validate resume exists and belongs to user
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This resume does not belong to you.');
    }

    // Check if resume is ready for chat
    if (resume.embeddingStatus !== 'completed') {
      throw new Error('Resume embeddings are not ready. Please wait for processing to complete.');
    }

    // Create session
    const session = await ChatSession.createSession(userId, resumeId, {
      fileName: resume.fileName || resume.originalName,
    });

    console.log(`[ChatService] Created session ${session._id} for resume ${resumeId}`);

    return {
      success: true,
      session: session.getSummary(),
    };
  } catch (error) {
    console.error('[ChatService] Error creating session:', error.message);
    throw error;
  }
};

/**
 * Get all chat sessions for a user
 * 
 * @param {string} userId - User identifier
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Object>} Sessions list
 */
export const getUserChatSessions = async (userId, options = {}) => {
  try {
    const status = options.status || 'active';
    const limit = options.limit || 50;

    const sessions = await ChatSession.findByUser(userId, {
      status,
      limit,
      populate: 'resume',
      select: '-metadata',
    });

    // Get statistics
    const stats = await ChatSession.getUserStats(userId);

    console.log(`[ChatService] Retrieved ${sessions.length} sessions for user ${userId}`);

    return {
      success: true,
      sessions: sessions.map((session) => ({
        id: session._id,
        title: session.title,
        status: session.status,
        messageCount: session.messageCount,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        resume: {
          id: session.resume._id,
          fileName: session.resume.fileName || session.resume.originalName,
        },
      })),
      stats,
      total: sessions.length,
    };
  } catch (error) {
    console.error('[ChatService] Error getting user sessions:', error.message);
    throw error;
  }
};

/**
 * Get a specific chat session with messages
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Object>} Session with messages
 * @throws {Error} If session not found or access denied
 */
export const getChatSession = async (sessionId, userId, options = {}) => {
  try {
    // Get session
    const session = await ChatSession.findById(sessionId).populate('resume');

    if (!session) {
      throw new Error('Chat session not found');
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This chat session does not belong to you.');
    }

    // Get messages
    const messages = await ChatMessage.findBySession(sessionId, {
      limit: options.messageLimit || 100,
      sort: 1, // Ascending (oldest first)
    });

    // Get message statistics
    const messageStats = await ChatMessage.getSessionStats(sessionId);

    console.log(`[ChatService] Retrieved session ${sessionId} with ${messages.length} messages`);

    return {
      success: true,
      session: {
        id: session._id,
        title: session.title,
        status: session.status,
        messageCount: session.messageCount,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        resume: {
          id: session.resume._id,
          fileName: session.resume.fileName || session.resume.originalName,
          embeddingStatus: session.resume.embeddingStatus,
        },
      },
      messages: messages.map((msg) => ({
        id: msg._id,
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        sourcesUsed: msg.sourcesUsed || [],
        status: msg.status,
      })),
      stats: messageStats,
    };
  } catch (error) {
    console.error('[ChatService] Error getting session:', error.message);
    throw error;
  }
};

/**
 * Delete a chat session
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @param {boolean} [hardDelete=false] - Permanently delete or soft delete
 * @returns {Promise<Object>} Delete result
 * @throws {Error} If session not found or access denied
 */
export const deleteChatSession = async (sessionId, userId, hardDelete = false) => {
  try {
    // Get session
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Chat session not found');
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This chat session does not belong to you.');
    }

    if (hardDelete) {
      // Permanently delete session and all messages
      await ChatMessage.deleteBySession(sessionId);
      await session.deleteOne();
      console.log(`[ChatService] Permanently deleted session ${sessionId} and its messages`);
    } else {
      // Soft delete (mark as deleted)
      await session.softDelete();
      console.log(`[ChatService] Soft deleted session ${sessionId}`);
    }

    return {
      success: true,
      message: hardDelete ? 'Chat session permanently deleted' : 'Chat session deleted',
      deleted: true,
    };
  } catch (error) {
    console.error('[ChatService] Error deleting session:', error.message);
    throw error;
  }
};

/**
 * Update chat session title
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @param {string} newTitle - New title
 * @returns {Promise<Object>} Updated session
 * @throws {Error} If session not found or access denied
 */
export const updateSessionTitle = async (sessionId, userId, newTitle) => {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Chat session not found');
    }

    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This chat session does not belong to you.');
    }

    await session.updateTitle(newTitle);

    console.log(`[ChatService] Updated session ${sessionId} title to "${newTitle}"`);

    return {
      success: true,
      session: session.getSummary(),
    };
  } catch (error) {
    console.error('[ChatService] Error updating session title:', error.message);
    throw error;
  }
};

/**
 * Archive a chat session
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Archived session
 * @throws {Error} If session not found or access denied
 */
export const archiveChatSession = async (sessionId, userId) => {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Chat session not found');
    }

    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This chat session does not belong to you.');
    }

    await session.archive();

    console.log(`[ChatService] Archived session ${sessionId}`);

    return {
      success: true,
      session: session.getSummary(),
    };
  } catch (error) {
    console.error('[ChatService] Error archiving session:', error.message);
    throw error;
  }
};

/**
 * Add message to chat session (placeholder for future AI integration)
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @param {string} message - User message
 * @returns {Promise<Object>} Message result
 * @throws {Error} If session not found or access denied
 */
export const addMessageToSession = async (sessionId, userId, message) => {
  try {
    // Validate session
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Chat session not found');
    }

    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This chat session does not belong to you.');
    }

    if (!session.isActive()) {
      throw new Error('Cannot add messages to inactive session');
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 10000) {
      throw new Error('Message is too long (max 10000 characters)');
    }

    // Create user message
    const userMessage = await ChatMessage.createUserMessage(sessionId, message);

    console.log(`[ChatService] Added user message to session ${sessionId}`);

    // TODO: Generate AI response (will be implemented later)
    // For now, just return the user message
    return {
      success: true,
      userMessage: {
        id: userMessage._id,
        sender: userMessage.sender,
        message: userMessage.message,
        timestamp: userMessage.timestamp,
      },
      aiResponse: null, // Will be populated when AI integration is added
    };
  } catch (error) {
    console.error('[ChatService] Error adding message:', error.message);
    throw error;
  }
};

/**
 * Search messages in a session
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @param {string} searchText - Text to search for
 * @returns {Promise<Object>} Search results
 * @throws {Error} If session not found or access denied
 */
export const searchSessionMessages = async (sessionId, userId, searchText) => {
  try {
    // Validate session ownership
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Chat session not found');
    }

    if (session.user.toString() !== userId.toString()) {
      throw new Error('Access denied. This chat session does not belong to you.');
    }

    // Search messages
    const messages = await ChatMessage.searchInSession(sessionId, searchText);

    console.log(`[ChatService] Found ${messages.length} messages matching "${searchText}"`);

    return {
      success: true,
      query: searchText,
      results: messages.map((msg) => msg.getSummary()),
      total: messages.length,
    };
  } catch (error) {
    console.error('[ChatService] Error searching messages:', error.message);
    throw error;
  }
};

export default {
  createChatSession,
  getUserChatSessions,
  getChatSession,
  deleteChatSession,
  updateSessionTitle,
  archiveChatSession,
  addMessageToSession,
  searchSessionMessages,
};
