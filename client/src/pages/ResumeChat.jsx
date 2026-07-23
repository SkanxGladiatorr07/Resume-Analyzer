/**
 * Resume Chat Page
 * AI-powered chat interface for asking questions about resumes
 * Converted to Material Design 3 from Stitch design
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService, resumeService } from '../services';
import ReactMarkdown from 'react-markdown';
import { MaterialIcon } from '../components';

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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Auto-resize textarea
   */
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  };

  return (
    <div className="flex h-full bg-surface">
      {/* Left Sidebar: Chat Sessions */}
      <aside className={`${
        showSidebar ? 'w-80' : 'w-0'
      } bg-surface-container-low border-r border-outline-variant transition-all duration-300 overflow-hidden flex flex-col h-full shrink-0`}>
        <div className="p-md border-b border-outline-variant flex justify-between items-center">
          <span className="text-label-caps font-label-caps uppercase tracking-wider text-on-surface-variant">Sessions</span>
          <button 
            onClick={() => {
              setShowNewChatModal(true);
              setError(null);
            }}
            className="flex items-center gap-xs text-primary hover:bg-primary-container/10 p-1 rounded transition-colors"
          >
            <MaterialIcon className="text-md">add_circle</MaterialIcon>
            <span className="text-label-caps font-label-caps">New Chat</span>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-sm space-y-sm" style={{scrollbarWidth: 'thin'}}>
          {isLoading && sessions.length === 0 ? (
            <div className="p-md text-center text-on-surface-variant">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="p-md text-center text-on-surface-variant">
              <p className="text-body-sm">No chat sessions yet</p>
              <p className="text-body-sm mt-xs">Start a new chat to begin</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session)}
                className={`group relative ${
                  currentSession?.id === session.id
                    ? 'bg-primary-container/10 border-l-4 border-primary'
                    : 'hover:bg-surface-container border-l-4 border-transparent'
                } p-md rounded-r-lg transition-all cursor-pointer`}
              >
                <div className="flex justify-between items-start mb-1">
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
                      className="w-full px-sm py-1 text-body-sm font-bold text-on-surface border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
                    />
                  ) : (
                    <>
                      <span className="text-body-sm font-bold text-on-surface truncate pr-8" onDoubleClick={(e) => startEditing(session, e)}>
                        {session.title}
                      </span>
                      <span className="text-[10px] text-outline whitespace-nowrap">
                        {session.lastMessageAt ? formatTime(session.lastMessageAt) : 'New'}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-body-sm text-on-surface-variant truncate">{session.messageCount || 0} messages</p>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-xs bg-surface-container-low p-1 rounded">
                  <button 
                    onClick={(e) => startEditing(session, e)}
                    className="hover:text-primary transition-colors" 
                    title="Rename"
                  >
                    <MaterialIcon className="text-md">edit</MaterialIcon>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="hover:text-error transition-colors" 
                    title="Delete"
                  >
                    <MaterialIcon className="text-md">delete</MaterialIcon>
                  </button>
                </div>
              </div>
            ))
          )}
        </nav>

        <div className="p-md border-t border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-md p-sm bg-white border border-outline-variant rounded-lg">
            <div className="bg-primary/10 text-primary p-1 rounded">
              <MaterialIcon style={{ fontVariationSettings: "'FILL' 1" }}>bolt</MaterialIcon>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Pro Plan</p>
              <p className="text-body-sm font-bold text-on-surface">Unlimited Analysis</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col h-full bg-surface-container-lowest relative">
        {/* Chat Header */}
        <header className="h-14 flex justify-between items-center px-lg border-b border-outline-variant bg-white z-20">
          <div className="flex items-center gap-md">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-on-surface-variant md:hidden">
              <MaterialIcon>menu</MaterialIcon>
            </button>
            <h2 className="text-body-base font-bold text-on-surface">
              {currentSession ? currentSession.title : 'AI Resume Chat'}
            </h2>
          </div>
          {currentSession && (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-on-surface-variant hover:text-primary text-body-sm font-medium transition-colors"
            >
              Dashboard
            </button>
          )}
        </header>

        {/* Messages History */}
        <div className="flex-1 overflow-y-auto p-lg md:px-xxl py-xl space-y-xl" id="chat-history" style={{scrollbarWidth: 'thin'}}>
          {!currentSession ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl px-lg">
                <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-md">
                  <MaterialIcon className="text-primary text-4xl">chat</MaterialIcon>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                  Welcome to AI Resume Chat
                </h2>
                <p className="text-on-surface-variant mb-xl font-body-base">
                  Start a conversation about your resume. Ask questions about your skills,
                  experience, or get insights to improve your resume.
                </p>
                <button
                  onClick={() => {
                    setShowNewChatModal(true);
                    setError(null);
                  }}
                  className="bg-primary hover:bg-primary-container text-on-primary py-sm px-xl rounded-lg font-bold transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          ) : messages.length === 0 && !isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl px-lg">
                <div className="mb-xl">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-md">
                    What would you like to know?
                  </h3>
                  <p className="text-on-surface-variant font-body-base">
                    Ask me anything about your resume. Here are some suggestions to get started:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
                  {[
                    { icon: 'description', text: 'Review my resume' },
                    { icon: 'edit', text: 'Rewrite my project section' },
                    { icon: 'search', text: 'What skills am I missing?' },
                    { icon: 'lightbulb', text: 'Generate interview questions' },
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(suggestion.text)}
                      className="flex items-center p-md border-2 border-outline-variant rounded-xl hover:border-primary hover:bg-primary-fixed transition-all text-left group"
                    >
                      <MaterialIcon className="text-primary text-3xl mr-md group-hover:scale-110 transition-transform">{suggestion.icon}</MaterialIcon>
                      <span className="text-body-sm font-medium text-on-surface group-hover:text-primary">
                        {suggestion.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-md max-w-3xl ${message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-surface-container-highest border border-outline-variant' 
                      : 'bg-primary'
                  }`}>
                    <MaterialIcon className={message.sender === 'user' ? 'text-on-surface-variant text-md' : 'text-white text-md'}>
                      {message.sender === 'user' ? 'person' : 'smart_toy'}
                    </MaterialIcon>
                  </div>
                  <div className={`space-y-md ${message.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div className={`p-lg rounded-xl shadow-sm relative group ${
                      message.sender === 'user'
                        ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                        : 'bg-surface-container-low border border-outline-variant rounded-tl-none'
                    }`}>
                      {message.sender === 'user' ? (
                        <p className="text-body-base whitespace-pre-wrap">{message.message}</p>
                      ) : (
                        <>
                          <div className="prose prose-sm max-w-none text-on-surface">
                            <ReactMarkdown>{message.message}</ReactMarkdown>
                          </div>
                          
                          {/* Copy button for AI messages */}
                          <button
                            onClick={() => handleCopyMessage(message.id, message.message)}
                            className="absolute top-2 right-2 p-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <MaterialIcon className="text-secondary text-md">check</MaterialIcon>
                            ) : (
                              <MaterialIcon className="text-on-surface-variant text-md">content_copy</MaterialIcon>
                            )}
                          </button>
                        </>
                      )}
                      
                      {/* Sources for AI messages */}
                      {message.sender === 'ai' && message.sourcesUsed && message.sourcesUsed.length > 0 && (
                        <div className="mt-md pt-md border-t border-outline-variant">
                          <p className="text-label-caps font-label-caps text-on-surface-variant mb-sm flex items-center">
                            <MaterialIcon className="text-sm mr-xs">description</MaterialIcon>
                            Resume Sections Used:
                          </p>
                          <div className="space-y-sm">
                            {message.sourcesUsed.map((source, idx) => (
                              <div key={idx} className="bg-primary-fixed rounded-lg p-sm border border-primary/20">
                                <div className="flex items-center justify-between mb-xs">
                                  <div className="flex items-center">
                                    <span className="w-2 h-2 bg-primary rounded-full mr-xs"></span>
                                    <span className="text-label-caps font-label-caps text-primary">{source.sectionName}</span>
                                  </div>
                                  <div className="flex items-center gap-xs">
                                    <span className="text-label-caps font-label-caps text-primary">
                                      {(source.score * 100).toFixed(0)}%
                                    </span>
                                    <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${source.score * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                                {source.text && (
                                  <p className="text-body-sm text-on-surface-variant line-clamp-2">
                                    {source.text}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] text-outline ${message.sender === 'user' ? 'mr-sm' : 'ml-sm'}`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="flex gap-md max-w-3xl">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <MaterialIcon className="text-white text-md">smart_toy</MaterialIcon>
                  </div>
                  <div className="bg-surface-container-low p-md rounded-xl rounded-tl-none border border-outline-variant flex gap-sm items-center">
                    <div className="flex gap-xs">
                      <div className="w-2 h-2 bg-outline rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-body-sm text-on-surface-variant font-medium">AI is thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-lg py-sm bg-error-container border-t border-error">
            <p className="text-body-sm text-on-error-container">{error}</p>
          </div>
        )}

        {/* Input Area */}
        {currentSession && (
          <footer className="p-lg md:px-xxl pb-xl pt-0 bg-transparent">
            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-xl"></div>
              <div className="relative bg-white border border-outline-variant rounded-xl shadow-lg focus-within:border-primary transition-all p-2">
                <div className="flex items-end gap-sm">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Ask about your resume..."
                    disabled={isSending}
                    rows="1"
                    className="flex-1 border-none focus:ring-0 text-body-base py-3 resize-none bg-transparent min-h-[48px] max-h-32 disabled:opacity-50"
                    style={{scrollbarWidth: 'thin'}}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isSending}
                    className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-md hover:bg-primary-container transition-all active:scale-95 disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed"
                  >
                    <MaterialIcon>send</MaterialIcon>
                  </button>
                </div>
                <div className="px-md pb-sm flex justify-between items-center">
                  <div className="flex gap-md">
                    <button className="text-[10px] font-bold text-outline hover:text-primary flex items-center gap-xs uppercase tracking-widest transition-colors">
                      <MaterialIcon className="text-sm">auto_awesome</MaterialIcon>
                      Optimize Bullet Points
                    </button>
                  </div>
                  <span className="text-[10px] text-outline">Enter to send • Shift+Enter for new line</span>
                </div>
              </div>
            </div>
          </footer>
        )}
      </section>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-lg">
          <div className="bg-white rounded-xl max-w-md w-full p-xl">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-lg">Start New Chat</h3>
            
            <div className="mb-lg">
              <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
                Select Resume
              </label>
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-md py-sm text-body-base focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
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
              <div className="mb-lg p-md bg-error-container border border-error rounded-lg">
                <p className="text-body-sm text-on-error-container">{error}</p>
              </div>
            )}

            <div className="flex gap-md">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setError(null);
                }}
                className="flex-1 py-sm px-lg border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={isLoading || !selectedResume}
                className="flex-1 py-sm px-lg bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeChat;
