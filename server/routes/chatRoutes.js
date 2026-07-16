/**
 * Chat Routes
 * Routes for AI Resume Chat functionality
 * 
 * @module routes/chatRoutes
 */

import express from 'express';
import {
  createSession,
  getSessions,
  getSession,
  deleteSession,
  updateTitle,
  archiveSession,
  addMessage,
  searchMessages,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/chat/session
 * @desc    Create a new chat session
 * @access  Private
 * 
 * @body {
 *   resumeId: string (required) - Resume to chat about
 * }
 * 
 * @example
 * POST /api/chat/session
 * {
 *   "resumeId": "65abc123def456"
 * }
 * 
 * @returns {
 *   success: boolean,
 *   session: {
 *     id: string,
 *     title: string,
 *     status: string,
 *     messageCount: number,
 *     lastMessageAt: date,
 *     createdAt: date,
 *     resumeId: string,
 *     resumeFileName: string
 *   }
 * }
 */
router.post('/session', createSession);

/**
 * @route   GET /api/chat/sessions
 * @desc    Get all chat sessions for authenticated user
 * @access  Private
 * 
 * @query {
 *   status: string (optional) - Filter by status (active, archived, deleted)
 *   limit: number (optional) - Max results (default: 50)
 * }
 * 
 * @example
 * GET /api/chat/sessions?status=active&limit=20
 * 
 * @returns {
 *   success: boolean,
 *   sessions: Array<{
 *     id: string,
 *     title: string,
 *     status: string,
 *     messageCount: number,
 *     lastMessageAt: date,
 *     createdAt: date,
 *     updatedAt: date,
 *     resume: {
 *       id: string,
 *       fileName: string
 *     }
 *   }>,
 *   stats: {
 *     total: number,
 *     active: number,
 *     archived: number,
 *     totalMessages: number
 *   },
 *   total: number
 * }
 */
router.get('/sessions', getSessions);

/**
 * @route   GET /api/chat/session/:id
 * @desc    Get a specific chat session with messages
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @query {
 *   messageLimit: number (optional) - Max messages to return (default: 100)
 * }
 * 
 * @example
 * GET /api/chat/session/65abc123def456?messageLimit=50
 * 
 * @returns {
 *   success: boolean,
 *   session: {
 *     id: string,
 *     title: string,
 *     status: string,
 *     messageCount: number,
 *     lastMessageAt: date,
 *     createdAt: date,
 *     updatedAt: date,
 *     resume: {
 *       id: string,
 *       fileName: string,
 *       embeddingStatus: string
 *     }
 *   },
 *   messages: Array<{
 *     id: string,
 *     sender: string,
 *     message: string,
 *     timestamp: date,
 *     sourcesUsed: array,
 *     status: string
 *   }>,
 *   stats: {
 *     total: number,
 *     userMessages: number,
 *     aiMessages: number
 *   }
 * }
 */
router.get('/session/:id', getSession);

/**
 * @route   DELETE /api/chat/session/:id
 * @desc    Delete a chat session
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @query {
 *   hard: boolean (optional) - Permanently delete (default: false)
 * }
 * 
 * @example
 * DELETE /api/chat/session/65abc123def456
 * DELETE /api/chat/session/65abc123def456?hard=true
 * 
 * @returns {
 *   success: boolean,
 *   message: string,
 *   deleted: boolean
 * }
 */
router.delete('/session/:id', deleteSession);

/**
 * @route   PATCH /api/chat/session/:id/title
 * @desc    Update chat session title
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @body {
 *   title: string (required) - New title
 * }
 * 
 * @example
 * PATCH /api/chat/session/65abc123def456/title
 * {
 *   "title": "Discussion about Python skills"
 * }
 * 
 * @returns {
 *   success: boolean,
 *   session: {
 *     id: string,
 *     title: string,
 *     ...
 *   }
 * }
 */
router.patch('/session/:id/title', updateTitle);

/**
 * @route   PATCH /api/chat/session/:id/archive
 * @desc    Archive a chat session
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @example
 * PATCH /api/chat/session/65abc123def456/archive
 * 
 * @returns {
 *   success: boolean,
 *   session: {
 *     id: string,
 *     status: string,
 *     ...
 *   }
 * }
 */
router.patch('/session/:id/archive', archiveSession);

/**
 * @route   POST /api/chat/session/:id/message
 * @desc    Add message to chat session
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @body {
 *   message: string (required) - User message
 * }
 * 
 * @example
 * POST /api/chat/session/65abc123def456/message
 * {
 *   "message": "What is my Python experience?"
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
 *   aiResponse: null | {
 *     id: string,
 *     sender: string,
 *     message: string,
 *     timestamp: date,
 *     sourcesUsed: array
 *   }
 * }
 */
router.post('/session/:id/message', addMessage);

/**
 * @route   GET /api/chat/session/:id/search
 * @desc    Search messages in a session
 * @access  Private
 * 
 * @params {
 *   id: string - Session ID
 * }
 * 
 * @query {
 *   q: string (required) - Search query
 * }
 * 
 * @example
 * GET /api/chat/session/65abc123def456/search?q=Python
 * 
 * @returns {
 *   success: boolean,
 *   query: string,
 *   results: Array<{
 *     id: string,
 *     sender: string,
 *     message: string,
 *     timestamp: date
 *   }>,
 *   total: number
 * }
 */
router.get('/session/:id/search', searchMessages);

export default router;
