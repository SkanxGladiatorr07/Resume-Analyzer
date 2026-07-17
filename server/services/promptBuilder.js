/**
 * Prompt Builder Service
 * Builds optimized prompts for AI chat
 * 
 * @module services/promptBuilder
 */

import chatConfig from '../config/chat.js';
import { estimateTokens, truncateContext } from '../utils/chatHelpers.js';

/**
 * Build context section from chunks
 * @param {Array} chunks - Retrieved chunks
 * @param {string} fileName - Resume file name
 * @returns {string} Formatted context
 */
const buildContextSection = (chunks, fileName) => {
  return chatConfig.prompts.contextTemplate(chunks, fileName);
};

/**
 * Build complete chat prompt
 * Optimized for Gemini AI with token management
 * 
 * @param {string} question - User's question
 * @param {Array} chunks - Retrieved resume chunks
 * @param {string} resumeFileName - Resume file name
 * @param {Object} options - Additional options
 * @returns {Object} Prompt object with text and metadata
 */
export const buildChatPrompt = (question, chunks, resumeFileName, options = {}) => {
  const {
    includeSystemInstruction = true,
    maxTokens = chatConfig.gemini.maxPromptTokens,
  } = options;

  // Build components
  const systemInstruction = chatConfig.prompts.systemInstruction;
  const contextSection = buildContextSection(chunks, resumeFileName);
  const questionSection = `\nUSER QUESTION:\n${question}\n`;
  const formatInstruction = chatConfig.prompts.jsonFormatInstruction;

  // Combine all parts
  let fullPrompt = '';

  if (includeSystemInstruction) {
    fullPrompt += systemInstruction + '\n\n';
  }

  fullPrompt += contextSection + '\n';
  fullPrompt += questionSection + '\n';
  fullPrompt += formatInstruction;

  // Check token count and truncate if necessary
  const estimatedTokens = estimateTokens(fullPrompt);

  if (estimatedTokens > maxTokens) {
    console.log(`[PromptBuilder] Truncating prompt: ${estimatedTokens} > ${maxTokens} tokens`);

    // Truncate context section to fit
    const nonContextLength = estimateTokens(
      systemInstruction + questionSection + formatInstruction
    );
    const availableForContext = maxTokens - nonContextLength - 100; // 100 token buffer

    const truncatedContext = truncateContext(contextSection, availableForContext);

    fullPrompt = '';
    if (includeSystemInstruction) {
      fullPrompt += systemInstruction + '\n\n';
    }
    fullPrompt += truncatedContext + '\n';
    fullPrompt += questionSection + '\n';
    fullPrompt += formatInstruction;
  }

  return {
    text: fullPrompt,
    metadata: {
      estimatedTokens: estimateTokens(fullPrompt),
      chunksUsed: chunks.length,
      truncated: estimatedTokens > maxTokens,
      systemInstructionIncluded: includeSystemInstruction,
    },
  };
};

/**
 * Build fallback prompt when no context is available
 * @param {string} question - User's question
 * @returns {Object} Prompt object
 */
export const buildNoContextPrompt = (question) => {
  const prompt = `You are a resume assistant. The user asked: "${question}"

However, no relevant information was found in their resume to answer this question.

Respond with this EXACT JSON:
{
  "answer": "I don't have enough information in your resume to answer this question.",
  "sources": []
}`;

  return {
    text: prompt,
    metadata: {
      estimatedTokens: estimateTokens(prompt),
      chunksUsed: 0,
      truncated: false,
      systemInstructionIncluded: false,
    },
  };
};

/**
 * Build prompt for specific use cases
 * @param {string} type - Prompt type (review, rewrite, suggestions, etc.)
 * @param {string} question - User's question
 * @param {Array} chunks - Retrieved chunks
 * @param {string} resumeFileName - Resume file name
 * @returns {Object} Prompt object
 */
export const buildSpecializedPrompt = (type, question, chunks, resumeFileName) => {
  const basePrompt = buildChatPrompt(question, chunks, resumeFileName);

  // Add type-specific instructions
  const specializedInstructions = getSpecializedInstructions(type);

  if (specializedInstructions) {
    const modifiedText =
      basePrompt.text.replace(
        chatConfig.prompts.systemInstruction,
        chatConfig.prompts.systemInstruction + '\n\n' + specializedInstructions
      );

    return {
      text: modifiedText,
      metadata: {
        ...basePrompt.metadata,
        promptType: type,
      },
    };
  }

  return basePrompt;
};

/**
 * Get specialized instructions for prompt types
 * @param {string} type - Prompt type
 * @returns {string|null} Specialized instructions
 */
const getSpecializedInstructions = (type) => {
  const instructions = {
    review: `SPECIAL FOCUS: Provide a comprehensive review of the resume.
- Highlight strengths
- Identify areas for improvement
- Suggest specific enhancements
- Be constructive and actionable`,

    rewrite: `SPECIAL FOCUS: Provide rewrite suggestions.
- Maintain factual accuracy
- Improve clarity and impact
- Use action verbs
- Quantify achievements where possible`,

    suggestions: `SPECIAL FOCUS: Provide actionable suggestions.
- Be specific and practical
- Prioritize high-impact changes
- Explain the reasoning behind each suggestion`,

    interview: `SPECIAL FOCUS: Generate relevant interview questions.
- Base questions on resume content
- Include technical and behavioral questions
- Cover key experiences and skills
- Provide a mix of difficulty levels`,

    summary: `SPECIAL FOCUS: Provide a concise summary.
- Highlight key qualifications
- Mention relevant experience
- Include notable achievements
- Keep it professional and impactful`,
  };

  return instructions[type] || null;
};

/**
 * Validate prompt before sending to AI
 * @param {Object} promptObject - Prompt object
 * @returns {Object} Validation result
 */
export const validatePrompt = (promptObject) => {
  const errors = [];

  if (!promptObject.text || typeof promptObject.text !== 'string') {
    errors.push('Prompt text is required and must be a string');
  }

  if (promptObject.text && promptObject.text.length === 0) {
    errors.push('Prompt text cannot be empty');
  }

  if (promptObject.metadata.estimatedTokens > chatConfig.gemini.maxPromptTokens * 1.1) {
    errors.push(`Prompt exceeds maximum token limit (${promptObject.metadata.estimatedTokens} tokens)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: promptObject.metadata.truncated ? ['Prompt was truncated to fit token limit'] : [],
  };
};

export default {
  buildChatPrompt,
  buildNoContextPrompt,
  buildSpecializedPrompt,
  validatePrompt,
};
