/**
 * Resume Chat Page
 * AI-powered chat interface for asking questions about resumes
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService, resumeService } from '../services';
import ReactMarkdown from 'react-markdown';

const ResumeChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeIdFromUrl = searchParams.get('resumeId');

  // State
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(resumeIdFromUrl || '');
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Auto-scroll to bottom when messages change
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Load user's resumes and sessions on mount
   */
  useEffect(() => {
    loadResumes();
    loadSessions();
  }, []);

  /**
   * Load sessions when current session changes
   */
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession]);

  /**
   * Load user's resumes
   */
  const loadResumes = async () => {
    try {
      const response = await resumeService.getResumes();
      setUserResumes(response.data || []);
    } catch (err) {
      console.error('Error loading resumes:', err);
    }
  };

  /**
   * Load chat sessions
   */
  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await chatService.getSessions({ status: 'active', limit: 50 });
      setSessions(response.sessions || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load chat sessions');
      setIsLoading(false);
    }
  };

  /**
   * Load messages for a session
   */
  const loadMessages = async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await chatService.getSession(sessionId, { messageLimit: 100 });
      setMessages(response.messages || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
      setIsLoading(false);
    }
  };

  /**
   * Create new chat session
   */
  const handleCreateSession = async () => {
    if (!selectedResume) {
      setError('Please select a resume to chat about');
      return;
    }

    try {
      setIsLoading(true);
      const response = await chatService.createSession(selectedResume);
      
      // Add to sessions list
      const newSession = response.session;
      setSessions((prev) => [newSession, ...prev]);
      
      // Set as current session
      setCurrentSession(newSession);
      setMessages([]);
      setShowNewChatModal(false);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error creating session:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create chat session';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  /**
   * Switch to a different session
   */
  const handleSelectSession = (session) => {
    setCurrentSession(session);
    setError(null);
  };

  /**
   * Send message
   */
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!inputMessage.trim() || !currentSession) {
      return;
    }

    if (isSending) {
      return;
    }

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    setError(null);

    // Add user message to UI immediately
    const tempUserMessage = {
      id: 'temp-' + Date.now(),
      sender: 'user',
      message: userMsg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // Send to API
      const response = await chatService.sendMessage(currentSession.id, userMsg);

      // Remove temp message and add real messages
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          response.userMessage,
          response.aiResponse,
        ];
      });

      setIsSending(false);
      
      // Focus input
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg = err.response?.data?.message || 'Failed to send message';
      setError(errorMsg);
      setIsSending(false);

      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    }
  };

  /**
   * Delete session
   */
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this chat session?')) {
      return;
    }

    try {
      await chatService.deleteSession(sessionId);
      
      // Remove from sessions list
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      
      // If current session, clear it
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
    }
  };

  /**
   * Rename session
   */
  const handleRenameSession = async (sessionId) => {
    if (!editingTitle.trim() || editingTitle === sessions.find(s => s.id === sessionId)?.title) {
      setEditingSessionId(null);
      setEditingTitle('');
      return;
    }

    try {
      await chatService.updateSessionTitle(sessionId, editingTitle.trim());
      
      // Update in sessions list
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s))
      );
      
      // Update current session if it's the one being renamed
      if (currentSession?.id === sessionId) {
        setCurrentSession((prev) => ({ ...prev, title: editingTitle.trim() }));
      }
      
      setEditingSessionId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Error renaming session:', err);
      setError('Failed to rename session');
    }
  };

  /**
   * Start editing session title
   */
  const startEditing = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  /**
   * Copy message to clipboard
   */
  const handleCopyMessage = async (messageId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Error copying message:', err);
      setError('Failed to copy message');
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-80' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Resume Chat</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No chat sessions yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group ${
                    currentSession?.id === session.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleRenameSession(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSession(session.id);
                            if (e.key === 'Escape') {
                              setEditingSessionId(null);
                              setEditingTitle('');
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full px-2 py-1 text-sm font-medium text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p 
                          className="font-medium text-gray-900 truncate text-sm"
                          onDoubleClick={(e) => startEditing(session, e)}
                        >
                          {session.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {session.messageCount} messages
                      </p>
                    </div>
                    <div className="flex items-center ml-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(session, e)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Rename"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {session.lastMessageAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(session.lastMessageAt)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="mr-3 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentSession ? currentSession.title : 'AI Resume Chat'}
              </h1>
              {currentSession && (
                <p className="text-sm text-gray-500">
                  Ask questions about your resume
                </p>
              )}
            </div>
          </div>
          
          {currentSession && (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Back to Dashboard
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentSession ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to AI Resume Chat
                </h2>
                <p className="text-gray-600 mb-6">
                  Start a conversation about your resume. Ask questions about your skills,
                  experience, or get insights to improve your resume.
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          ) : messages.length === 0 && !isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl px-4">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    What would you like to know?
                  </h3>
                  <p className="text-gray-600">
                    Ask me anything about your resume. Here are some suggestions to get started:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: '📝', text: 'Review my resume', emoji: true },
                    { icon: '🔄', text: 'Rewrite my project section', emoji: true },
                    { icon: '🎯', text: 'What skills am I missing?', emoji: true },
                    { icon: '💡', text: 'Generate interview questions', emoji: true },
                    { icon: '📊', text: 'Summarize my experience', emoji: true },
                    { icon: '💻', text: 'What programming languages do I know?', emoji: true },
                    { icon: '🏆', text: 'What are my key achievements?', emoji: true },
                    { icon: '🎓', text: 'Tell me about my education', emoji: true },
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(suggestion.text)}
                      className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                    >
                      <span className="text-2xl mr-3">{suggestion.icon}</span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                        {suggestion.text}
                      </span>
                    </button>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500">
                  💡 Tip: Double-click a session title in the sidebar to rename it
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white border border-gray-200 rounded-2xl rounded-tl-sm'
                    } px-4 py-3 shadow-sm relative group`}
                  >
                    {message.sender === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    ) : (
                      <>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{message.message}</ReactMarkdown>
                        </div>
                        
                        {/* Copy button for AI messages */}
                        <button
                          onClick={() => handleCopyMessage(message.id, message.message)}
                          className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy response"
                        >
                          {copiedMessageId === message.id ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                    
                    {/* Sources for AI messages - Enhanced Display */}
                    {message.sender === 'ai' && message.sourcesUsed && message.sourcesUsed.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Resume Sections Used:
                        </p>
                        <div className="space-y-2">
                          {message.sourcesUsed.map((source, idx) => (
                            <div key={idx} className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                  <span className="text-xs font-bold text-blue-900">{source.sectionName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-blue-700">
                                      {(source.score * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  {/* Similarity bar */}
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full transition-all"
                                      style={{ width: `${source.score * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              {source.text && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {source.text}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">AI is thinking...</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Analyzing your resume and generating response
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Input Area */}
        {currentSession && (
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a question about your resume..."
                disabled={isSending}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Start New Chat</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Resume
              </label>
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a resume...</option>
                {userResumes.map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.fileName || resume.originalName}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setError(null);
                }}
                disabled={isLoading}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!selectedResume || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeChat;
