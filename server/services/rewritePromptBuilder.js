/**
 * Rewrite Prompt Builder Service
 * Builds optimized prompts for resume rewriting
 * 
 * @module services/rewritePromptBuilder
 */

import rewriteConfig from '../config/rewrite.js';
import { estimateTokens } from '../utils/chatHelpers.js';

/**
 * Build rewrite prompt
 * Creates a structured prompt for resume rewriting
 * 
 * @param {Object} params - Prompt parameters
 * @param {string} params.content - Content to rewrite
 * @param {string} params.section - Resume section
 * @param {string} params.tone - Desired tone
 * @param {Array} params.relatedContext - Related resume chunks for context
 * @returns {Object} Prompt object with text and metadata
 */
export const buildRewritePrompt = ({ content, section, tone, relatedContext = [] }) => {
  // Build the complete prompt
  let prompt = '';

  // Add system instruction
  prompt += rewriteConfig.prompts.systemInstruction + '\n\n';

  // Add tone-specific instructions
  const toneInstruction = rewriteConfig.prompts.toneInstructions[tone];
  if (toneInstruction) {
    prompt += toneInstruction + '\n\n';
  }

  // Add section-specific guidelines
  const sectionGuideline = rewriteConfig.prompts.sectionGuidelines[section];
  if (sectionGuideline) {
    prompt += sectionGuideline + '\n\n';
  }

  // Add context template
  const contextSection = rewriteConfig.prompts.contextTemplate(
    content,
    section,
    tone,
    relatedContext
  );
  prompt += contextSection + '\n\n';

  // Add JSON format instruction
  prompt += rewriteConfig.prompts.jsonFormatInstruction;

  return {
    text: prompt,
    metadata: {
      estimatedTokens: estimateTokens(prompt),
      section,
      tone,
      hasContext: relatedContext.length > 0,
      contextChunks: relatedContext.length,
      originalLength: content.length,
    },
  };
};

/**
 * Build prompt for batch rewrite
 * @param {Array} items - Items to rewrite
 * @returns {Array} Array of prompt objects
 */
export const buildBatchRewritePrompts = (items) => {
  return items.map((item) =>
    buildRewritePrompt({
      content: item.content,
      section: item.section,
      tone: item.tone,
      relatedContext: item.relatedContext || [],
    })
  );
};

/**
 * Validate rewrite prompt
 * @param {Object} promptObject - Prompt object to validate
 * @returns {Object} Validation result
 */
export const validateRewritePrompt = (promptObject) => {
  const errors = [];
  const warnings = [];

  // Check prompt text
  if (!promptObject.text || typeof promptObject.text !== 'string') {
    errors.push('Prompt text is required and must be a string');
  }

  if (promptObject.text && promptObject.text.length === 0) {
    errors.push('Prompt text cannot be empty');
  }

  // Check token count
  const maxTokens = rewriteConfig.gemini.maxOutputTokens * 2; // Rough estimate for input
  if (promptObject.metadata.estimatedTokens > maxTokens) {
    warnings.push(
      `Prompt is large (${promptObject.metadata.estimatedTokens} tokens). May approach limits.`
    );
  }

  // Check original content length
  if (promptObject.metadata.originalLength < 10) {
    warnings.push('Original content is very short. Rewrite may not add much value.');
  }

  if (promptObject.metadata.originalLength > 3000) {
    warnings.push('Original content is very long. Consider rewriting in smaller sections.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Build comparison prompt
 * Creates a prompt to compare original and rewritten content
 * 
 * @param {string} original - Original content
 * @param {string} rewritten - Rewritten content
 * @returns {Object} Prompt object
 */
export const buildComparisonPrompt = (original, rewritten) => {
  const prompt = `Compare the following original and rewritten resume content. Identify the key improvements made.

ORIGINAL:
${original}

REWRITTEN:
${rewritten}

Respond with JSON in this format:
{
  "improvements": [
    {
      "type": "Improvement Category",
      "description": "What was improved and why it's better"
    }
  ],
  "summary": "Brief summary of overall improvements"
}`;

  return {
    text: prompt,
    metadata: {
      estimatedTokens: estimateTokens(prompt),
      originalLength: original.length,
      rewrittenLength: rewritten.length,
    },
  };
};

export default {
  buildRewritePrompt,
  buildBatchRewritePrompts,
  validateRewritePrompt,
  buildComparisonPrompt,
};
