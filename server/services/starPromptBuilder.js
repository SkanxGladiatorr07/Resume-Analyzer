/**
 * STAR Prompt Builder Service
 * Builds optimized prompts for STAR bullet generation
 * 
 * @module services/starPromptBuilder
 */

import starConfig from '../config/star.js';
import { estimateTokens } from '../utils/chatHelpers.js';

/**
 * Build STAR generation prompt
 * Creates a structured prompt for converting experience to STAR format
 * 
 * @param {string} experience - Experience text to convert
 * @returns {Object} Prompt object with text and metadata
 */
export const buildStarPrompt = (experience) => {
  // Build the complete prompt
  let prompt = '';

  // Add system instruction
  prompt += starConfig.prompts.systemInstruction + '\n\n';

  // Add STAR format instruction
  prompt += starConfig.prompts.starFormatInstruction + '\n\n';

  // Add content
  const contentSection = starConfig.prompts.contentTemplate(experience);
  prompt += contentSection + '\n\n';

  // Add JSON format instruction
  prompt += starConfig.prompts.jsonFormatInstruction;

  return {
    text: prompt,
    metadata: {
      estimatedTokens: estimateTokens(prompt),
      originalLength: experience.length,
    },
  };
};

/**
 * Build prompt for batch STAR generation
 * @param {Array} experiences - Array of experiences to convert
 * @returns {Array} Array of prompt objects
 */
export const buildBatchStarPrompts = (experiences) => {
  return experiences.map((experience) => buildStarPrompt(experience));
};

/**
 * Validate STAR prompt
 * @param {Object} promptObject - Prompt object to validate
 * @returns {Object} Validation result
 */
export const validateStarPrompt = (promptObject) => {
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
  const maxTokens = starConfig.gemini.maxOutputTokens * 2;
  if (promptObject.metadata.estimatedTokens > maxTokens) {
    warnings.push(
      `Prompt is large (${promptObject.metadata.estimatedTokens} tokens). May approach limits.`
    );
  }

  // Check original content length
  if (promptObject.metadata.originalLength < 15) {
    warnings.push('Original experience is very short. Result may lack detail.');
  }

  if (promptObject.metadata.originalLength > 1500) {
    warnings.push('Original experience is very long. Consider breaking into multiple bullets.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Build comparison prompt
 * Creates a prompt to compare original and STAR version
 * 
 * @param {string} original - Original experience
 * @param {string} starVersion - STAR-formatted version
 * @returns {Object} Prompt object
 */
export const buildComparisonPrompt = (original, starVersion) => {
  const prompt = `Compare the following original experience and STAR-formatted version. Identify improvements and ensure no fabrication occurred.

ORIGINAL:
${original}

STAR VERSION:
${starVersion}

Respond with JSON:
{
  "improvements": ["List of improvements made"],
  "factualAccuracy": "Assessment of accuracy (all facts preserved?)",
  "metricsAdded": false,
  "summary": "Brief summary of changes"
}`;

  return {
    text: prompt,
    metadata: {
      estimatedTokens: estimateTokens(prompt),
      originalLength: original.length,
      starLength: starVersion.length,
    },
  };
};

export default {
  buildStarPrompt,
  buildBatchStarPrompts,
  validateStarPrompt,
  buildComparisonPrompt,
};
