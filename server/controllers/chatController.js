/**
 * Chat Controller
 * Handles HTTP requests for chat functionality
 * 
 * @module controllers/chatController
 */

import {
  createChatSession,
  getUserChatSessions,
  getChatSession,
  deleteChatSession,
  updateSessionTitle,
  archiveChatSession,
  addMessageToSession,
  searchSessionMessages,
} from '../services/chatService.js';

/**
 * @desc    Create a new chat session
 * @route   POST /api/chat/session
 * @access  Private
 * 
 * @body {
 *   resumeId: string (required)
 * }
 */
export const createSession = async (req, res) => {
  try {
    const { resumeId } = req.body;

    // Validate input
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      });
    }

    const userId = req.user._id.toString();

    // Create session
    const result = await createChatSession(userId, resumeId);

    res.status(201).json(result);
  } catch (error) {
    console.error('[ChatController] Error creating session:', error.message);

    // Handle specific errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('embeddings')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        hint: 'Wait for resume processing to complete before starting a chat',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all chat sessions for authenticated user
 * @route   GET /api/chat/sessions
 * @access  Private
 * 
 * @query {
 *   status: string (optional) - Filter by status (active, archived, deleted)
 *   limit: number (optional) - Max results (default: 50)
 * }
 */
export const getSessions = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { status, limit } = req.query;

    const result = await getUserChatSessions(userId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('[ChatController] Error getting sessions:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get a specific chat session with messages
 * @route   GET /api/chat/session/:id
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @query {
 *   messageLimit: number (optional) - Max messages to return (default: 100)
 * }
 */
export const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const { messageLimit } = req.query;

    const result = await getChatSession(id, userId, {
      messageLimit: messageLimit ? parseInt(messageLimit, 10) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('[ChatController] Error getting session:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete a chat session
 * @route   DELETE /api/chat/session/:id
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @query {
 *   hard: boolean (optional) - Permanently delete (default: false)
 * }
 */
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const hardDelete = req.query.hard === 'true';

    const result = await deleteChatSession(id, userId, hardDelete);

    res.json(result);
  } catch (error) {
    console.error('[ChatController] Error deleting session:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update chat session title
 * @route   PATCH /api/chat/session/:id/title
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @body {
 *   title: string (required)
 * }
 */
export const updateTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user._id.toString();

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    const result = await updateSessionTitle(id, userId, title);

    res.json(result);
  } catch (error) {
    console.error('[ChatController] Error updating title:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update session title',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Archive a chat session
 * @route   PATCH /api/chat/session/:id/archive
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 */
export const archiveSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const result = await archiveChatSession(id, userId);

    res.json(result);
  } catch (error) {
    console.error('[ChatController] Error archiving session:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to archive session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Add message to chat session
 * @route   POST /api/chat/session/:id/message
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @body {
 *   message: string (required)
 * }
 */
export const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user._id.toString();

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const result = await addMessageToSession(id, userId, message);

    res.json(result);
  } catch (error) {
    console.error('[ChatController] Error adding message:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('inactive') || error.message.includes('empty')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Search messages in a session
 * @route   GET /api/chat/session/:id/search
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @query {
 *   q: string (required) - Search query
 * }
 */
export const searchMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { q } = req.query;
    const userId = req.user._id.toString();

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await searchSessionMessages(id, userId, q);

    res.json(result);
  } catch (error) {
    console.error('[ChatController] Error searching messages:', error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default {
  createSession,
  getSessions,
  getSession,
  deleteSession,
  updateTitle,
  archiveSession,
  addMessage,
  searchMessages,
};
