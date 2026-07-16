/**
 * Chat Message Model
 * Represents individual messages in a chat session
 * 
 * @module models/ChatMessage
 */

import mongoose from 'mongoose';

/**
 * Chat Message Schema
 */
const chatMessageSchema = new mongoose.Schema(
  {
    // Chat session this message belongs to
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true,
    },

    // Message sender
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },

    // Message content
    message: {
      type: String,
      required: true,
      maxlength: 10000,
    },

    // Sources used for RAG (for AI messages)
    sourcesUsed: [
      {
        chunkId: String,
        sectionName: String,
        score: Number,
        text: String,
      },
    ],

    // Message timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Message metadata
    metadata: {
      // For AI messages
      model: String,
      tokensUsed: Number,
      responseTime: Number,
      
      // For user messages
      messageLength: Number,
      
      // General
      edited: {
        type: Boolean,
        default: false,
      },
      editedAt: Date,
    },

    // Message status
    status: {
      type: String,
      enum: ['sent', 'delivered', 'error'],
      default: 'sent',
    },

    // Error information (if any)
    error: {
      message: String,
      timestamp: Date,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  }
);

// Indexes for efficient querying
chatMessageSchema.index({ session: 1, timestamp: 1 });
chatMessageSchema.index({ session: 1, sender: 1 });

// Instance Methods

/**
 * Check if message is from user
 * @returns {boolean}
 */
chatMessageSchema.methods.isUserMessage = function () {
  return this.sender === 'user';
};

/**
 * Check if message is from AI
 * @returns {boolean}
 */
chatMessageSchema.methods.isAIMessage = function () {
  return this.sender === 'ai';
};

/**
 * Check if message has sources
 * @returns {boolean}
 */
chatMessageSchema.methods.hasSources = function () {
  return this.sourcesUsed && this.sourcesUsed.length > 0;
};

/**
 * Get message summary
 * @returns {Object} Message summary
 */
chatMessageSchema.methods.getSummary = function () {
  return {
    id: this._id,
    sender: this.sender,
    message: this.message,
    timestamp: this.timestamp,
    sourcesCount: this.sourcesUsed?.length || 0,
    status: this.status,
  };
};

/**
 * Mark message as error
 * @param {string} errorMessage - Error message
 */
chatMessageSchema.methods.markAsError = async function (errorMessage) {
  this.status = 'error';
  this.error = {
    message: errorMessage,
    timestamp: new Date(),
  };
  await this.save();
};

/**
 * Get formatted sources
 * @returns {Array} Formatted sources
 */
chatMessageSchema.methods.getFormattedSources = function () {
  if (!this.hasSources()) {
    return [];
  }

  return this.sourcesUsed.map((source, idx) => ({
    index: idx + 1,
    section: source.sectionName,
    relevance: source.score ? `${(source.score * 100).toFixed(1)}%` : 'N/A',
    preview: source.text ? source.text.substring(0, 150) + '...' : '',
  }));
};

// Static Methods

/**
 * Find messages by session
 * @param {string} sessionId - Session identifier
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Array>} Array of messages
 */
chatMessageSchema.statics.findBySession = function (sessionId, options = {}) {
  return this.find({ session: sessionId })
    .sort({ timestamp: options.sort || 1 }) // 1 = ascending (oldest first)
    .limit(options.limit || 100)
    .select(options.select || '')
    .exec();
};

/**
 * Get message count for session
 * @param {string} sessionId - Session identifier
 * @returns {Promise<number>} Message count
 */
chatMessageSchema.statics.countBySession = function (sessionId) {
  return this.countDocuments({ session: sessionId });
};

/**
 * Get latest message for session
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object|null>} Latest message
 */
chatMessageSchema.statics.getLatestBySession = function (sessionId) {
  return this.findOne({ session: sessionId })
    .sort({ timestamp: -1 })
    .exec();
};

/**
 * Create user message
 * @param {string} sessionId - Session identifier
 * @param {string} message - Message content
 * @returns {Promise<Object>} Created message
 */
chatMessageSchema.statics.createUserMessage = async function (sessionId, message) {
  const userMessage = await this.create({
    session: sessionId,
    sender: 'user',
    message: message.trim(),
    timestamp: new Date(),
    metadata: {
      messageLength: message.length,
    },
    status: 'sent',
  });

  return userMessage;
};

/**
 * Create AI message
 * @param {string} sessionId - Session identifier
 * @param {string} message - Message content
 * @param {Array} sources - Sources used
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created message
 */
chatMessageSchema.statics.createAIMessage = async function (
  sessionId,
  message,
  sources = [],
  metadata = {}
) {
  const aiMessage = await this.create({
    session: sessionId,
    sender: 'ai',
    message: message.trim(),
    sourcesUsed: sources,
    timestamp: new Date(),
    metadata: {
      model: metadata.model,
      tokensUsed: metadata.tokensUsed,
      responseTime: metadata.responseTime,
    },
    status: 'sent',
  });

  return aiMessage;
};

/**
 * Delete messages by session
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object>} Delete result
 */
chatMessageSchema.statics.deleteBySession = function (sessionId) {
  return this.deleteMany({ session: sessionId });
};

/**
 * Get session statistics
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object>} Statistics
 */
chatMessageSchema.statics.getSessionStats = async function (sessionId) {
  const stats = await this.aggregate([
    { $match: { session: mongoose.Types.ObjectId(sessionId) } },
    {
      $group: {
        _id: '$sender',
        count: { $sum: 1 },
        avgLength: { $avg: { $strLenCP: '$message' } },
      },
    },
  ]);

  const result = {
    total: 0,
    userMessages: 0,
    aiMessages: 0,
    avgUserMessageLength: 0,
    avgAIMessageLength: 0,
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    if (stat._id === 'user') {
      result.userMessages = stat.count;
      result.avgUserMessageLength = Math.round(stat.avgLength);
    } else if (stat._id === 'ai') {
      result.aiMessages = stat.count;
      result.avgAIMessageLength = Math.round(stat.avgLength);
    }
  });

  return result;
};

/**
 * Search messages by content
 * @param {string} sessionId - Session identifier
 * @param {string} searchText - Text to search for
 * @returns {Promise<Array>} Matching messages
 */
chatMessageSchema.statics.searchInSession = function (sessionId, searchText) {
  return this.find({
    session: sessionId,
    message: { $regex: searchText, $options: 'i' },
  })
    .sort({ timestamp: 1 })
    .limit(20)
    .exec();
};

// Middleware

/**
 * Pre-save middleware
 * Set timestamp if not set
 */
chatMessageSchema.pre('save', function (next) {
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  next();
});

/**
 * Post-save middleware
 * Update session's lastMessageAt and messageCount
 */
chatMessageSchema.post('save', async function (doc) {
  try {
    const ChatSession = mongoose.model('ChatSession');
    await ChatSession.findByIdAndUpdate(
      doc.session,
      {
        $set: { lastMessageAt: doc.timestamp },
        $inc: { messageCount: 1 },
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating session after message save:', error);
  }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
