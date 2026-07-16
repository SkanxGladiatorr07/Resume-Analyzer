/**
 * Chat Session Model
 * Represents a chat conversation between user and AI about their resume
 * 
 * @module models/ChatSession
 */

import mongoose from 'mongoose';

/**
 * Chat Session Schema
 */
const chatSessionSchema = new mongoose.Schema(
  {
    // User who owns this chat session
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Resume being discussed
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },

    // Session title (auto-generated or user-defined)
    title: {
      type: String,
      required: true,
      maxlength: 200,
      default: 'New Chat Session',
    },

    // Session status
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
      index: true,
    },

    // Message count for quick access
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Last message timestamp for sorting
    lastMessageAt: {
      type: Date,
      default: null,
    },

    // Session metadata
    metadata: {
      resumeFileName: String,
      totalTokensUsed: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient querying
chatSessionSchema.index({ user: 1, createdAt: -1 });
chatSessionSchema.index({ user: 1, resume: 1 });
chatSessionSchema.index({ user: 1, status: 1, lastMessageAt: -1 });

// Instance Methods

/**
 * Check if session is active
 * @returns {boolean}
 */
chatSessionSchema.methods.isActive = function () {
  return this.status === 'active';
};

/**
 * Update last message timestamp
 */
chatSessionSchema.methods.updateLastMessage = async function () {
  this.lastMessageAt = new Date();
  await this.save();
};

/**
 * Increment message count
 */
chatSessionSchema.methods.incrementMessageCount = async function () {
  this.messageCount += 1;
  await this.save();
};

/**
 * Archive session
 */
chatSessionSchema.methods.archive = async function () {
  this.status = 'archived';
  await this.save();
};

/**
 * Soft delete session
 */
chatSessionSchema.methods.softDelete = async function () {
  this.status = 'deleted';
  await this.save();
};

/**
 * Update session title
 * @param {string} newTitle - New title
 */
chatSessionSchema.methods.updateTitle = async function (newTitle) {
  this.title = newTitle.substring(0, 200);
  await this.save();
};

/**
 * Get session summary
 * @returns {Object} Session summary
 */
chatSessionSchema.methods.getSummary = function () {
  return {
    id: this._id,
    title: this.title,
    status: this.status,
    messageCount: this.messageCount,
    lastMessageAt: this.lastMessageAt,
    createdAt: this.createdAt,
    resumeId: this.resume,
    resumeFileName: this.metadata?.resumeFileName,
  };
};

// Static Methods

/**
 * Find active sessions by user
 * @param {string} userId - User identifier
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Array>} Array of sessions
 */
chatSessionSchema.statics.findByUser = function (userId, options = {}) {
  const query = {
    user: userId,
    status: options.status || 'active',
  };

  return this.find(query)
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .limit(options.limit || 50)
    .select(options.select || '-metadata')
    .populate(options.populate || '')
    .exec();
};

/**
 * Find sessions by resume
 * @param {string} resumeId - Resume identifier
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} Array of sessions
 */
chatSessionSchema.statics.findByResume = function (resumeId, userId) {
  return this.find({
    resume: resumeId,
    user: userId,
    status: 'active',
  })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Get user's session statistics
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Statistics
 */
chatSessionSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalMessages: { $sum: '$messageCount' },
      },
    },
  ]);

  const result = {
    total: 0,
    active: 0,
    archived: 0,
    totalMessages: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    result.totalMessages += stat.totalMessages;
  });

  return result;
};

/**
 * Delete old sessions
 * @param {number} daysOld - Sessions older than this many days
 * @returns {Promise<Object>} Delete result
 */
chatSessionSchema.statics.deleteOldSessions = async function (daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    status: 'deleted',
    updatedAt: { $lt: cutoffDate },
  });
};

/**
 * Create session with resume info
 * @param {string} userId - User identifier
 * @param {string} resumeId - Resume identifier
 * @param {Object} resumeInfo - Resume information
 * @returns {Promise<Object>} Created session
 */
chatSessionSchema.statics.createSession = async function (userId, resumeId, resumeInfo = {}) {
  const title = resumeInfo.fileName
    ? `Chat about ${resumeInfo.fileName}`
    : 'New Chat Session';

  const session = await this.create({
    user: userId,
    resume: resumeId,
    title,
    status: 'active',
    metadata: {
      resumeFileName: resumeInfo.fileName,
      totalTokensUsed: 0,
      averageResponseTime: 0,
    },
  });

  return session;
};

// Middleware

/**
 * Pre-save middleware
 * Update lastMessageAt if it's null on creation
 */
chatSessionSchema.pre('save', function (next) {
  if (this.isNew && !this.lastMessageAt) {
    this.lastMessageAt = this.createdAt || new Date();
  }
  next();
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
