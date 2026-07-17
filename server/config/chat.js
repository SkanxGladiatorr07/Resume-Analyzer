/**
 * Chat Configuration
 * Centralized configuration for AI Resume Chat
 * 
 * @module config/chat
 */

/**
 * Chat configuration object
 */
const chatConfig = {
  // Retrieval settings
  retrieval: {
    topK: 5, // Number of chunks to retrieve
    minSimilarityScore: 0.7, // Minimum similarity threshold
    maxContextLength: 4000, // Maximum context characters
    chunkOverlap: 100, // Overlap between chunks for better context
  },

  // Gemini AI settings
  gemini: {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxRetries: 3,
    retryDelay: 1000, // Base delay in ms (exponential backoff)
    timeout: 30000, // 30 seconds
    maxOutputTokens: 2048,
    maxPromptTokens: 6000, // Leave room for response
  },

  // Request handling
  requestHandling: {
    maxConcurrentRequests: 5,
    requestTimeout: 35000, // 35 seconds (includes network time)
    duplicateWindow: 5000, // 5 seconds to detect duplicate requests
  },

  // Message limits
  messageLimits: {
    maxMessageLength: 10000, // Characters
    minMessageLength: 1,
    maxMessagesPerSession: 1000,
  },

  // Session settings
  session: {
    maxTitleLength: 200,
    defaultTitle: 'New Chat Session',
    autoTitleGeneration: false, // Future feature
  },

  // Prompt templates
  prompts: {
    // System instructions for AI
    systemInstruction: `You are an expert resume analyst and career advisor. Your role is to help users understand and improve their resumes.

CORE RESPONSIBILITIES:
1. Answer questions accurately based ONLY on the resume content provided
2. Provide constructive, actionable feedback
3. Be specific and reference exact sections when answering
4. Maintain a professional yet friendly tone
5. If information is not in the resume, clearly state: "I don't have enough information in your resume to answer this question."

RESPONSE RULES:
- Base ALL answers on the provided resume context
- Cite specific sections when making statements
- Keep answers concise but comprehensive
- Use professional language
- Format responses clearly with markdown when appropriate`,

    // JSON format instruction
    jsonFormatInstruction: `Your response MUST be in this EXACT JSON format (no markdown, no code blocks, no extra text):
{
  "answer": "Your detailed answer here, based ONLY on the resume context",
  "sources": [
    {
      "section": "Section name from resume (e.g., SKILLS, EXPERIENCE)",
      "similarity": 0.92
    }
  ]
}

If you cannot answer from the provided context, return:
{
  "answer": "I don't have enough information in your resume to answer this question.",
  "sources": []
}`,

    // Context template
    contextTemplate: (chunks, fileName) => {
      let context = `RESUME: "${fileName}"\n\n`;
      context += `RELEVANT SECTIONS:\n`;
      chunks.forEach((chunk, idx) => {
        context += `\n--- Section ${idx + 1}: ${chunk.sectionName} (Relevance: ${(chunk.score * 100).toFixed(1)}%) ---\n`;
        context += chunk.text;
        context += '\n';
      });
      return context;
    },
  },

  // Logging settings
  logging: {
    enabled: process.env.NODE_ENV !== 'test',
    logLevel: process.env.LOG_LEVEL || 'info', // error, warn, info, debug
    includeTimings: true,
    includeSessionId: true,
  },
};

/**
 * Get configuration value
 * @param {string} path - Dot notation path (e.g., 'retrieval.topK')
 * @returns {*} Configuration value
 */
export const getConfig = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], chatConfig);
};

/**
 * Get all chat configuration
 * @returns {Object} Complete configuration
 */
export const getAllConfig = () => {
  return { ...chatConfig };
};

export default chatConfig;
