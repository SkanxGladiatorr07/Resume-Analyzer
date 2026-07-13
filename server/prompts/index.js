/**
 * Prompts Index
 * Central export point for all AI prompts
 * 
 * ORGANIZATION:
 * Prompts are organized by feature/use case into separate files for maintainability.
 * Each prompt file contains detailed comments explaining its purpose, design decisions,
 * and usage context.
 * 
 * PROMPT CATEGORIES:
 * 1. structuredAnalysis - Primary analysis (ACTIVE - used in production)
 * 2. atsOptimization - ATS-focused analysis (PREPARED - not yet used)
 * 3. jobDescriptionMatch - Job matching analysis (PREPARED - future feature)
 * 4. skillGapAnalysis - Career development analysis (PREPARED - future feature)
 * 5. improvementSuggestions - Detailed recommendations (PREPARED - future feature)
 * 
 * ADDING NEW PROMPTS:
 * 1. Create a new file in prompts/ directory
 * 2. Add comprehensive comments explaining purpose and design
 * 3. Export the prompt function
 * 4. Import and re-export here
 * 5. Update this comment to document the new prompt
 */

// PRIMARY PROMPTS (Currently Active)
export { generateStructuredAnalysisPrompt } from './structuredAnalysis.js';

// FUTURE FEATURE PROMPTS (Prepared but Not Yet Used)
export { generateATSOptimizationPrompt } from './atsOptimization.js';
export { 
  generateJobMatchPrompt,
  generateKeywordExtractionPrompt 
} from './jobDescriptionMatch.js';
export { generateSkillGapPrompt } from './skillGapAnalysis.js';
export { generateImprovementPrompt } from './improvementSuggestions.js';

/**
 * PROMPT DESIGN PRINCIPLES:
 * 
 * 1. STRICT JSON OUTPUT
 *    - All prompts must explicitly request JSON-only responses
 *    - No markdown, no code blocks, no explanations
 *    - This ensures reliable parsing and prevents format issues
 * 
 * 2. EXPLICIT STRUCTURE
 *    - Always provide the exact JSON structure expected
 *    - Define data types clearly (number, string, array, boolean)
 *    - Include examples when structure is complex
 * 
 * 3. CLEAR CONSTRAINTS
 *    - Specify numeric ranges (e.g., "0-100" for scores)
 *    - Define array size expectations (e.g., "2-5 items minimum")
 *    - Set string length limits when relevant
 * 
 * 4. ACTIONABLE OUTPUT
 *    - Request specific, implementable suggestions
 *    - Avoid generic feedback like "needs improvement"
 *    - Ask for concrete examples and changes
 * 
 * 5. CONTEXT PRESERVATION
 *    - Include sufficient resume data in the prompt
 *    - Provide role/domain context when relevant
 *    - Reference specific sections being analyzed
 * 
 * 6. ERROR HANDLING
 *    - Allow empty arrays for categories with no issues
 *    - Don't force feedback when none is needed
 *    - Handle edge cases (empty sections, minimal data)
 */

/**
 * PROMPT VERSIONING:
 * When modifying prompts that affect production output:
 * 1. Test changes thoroughly with various resume types
 * 2. Consider incrementing analysisVersion in Analysis model
 * 3. Document significant changes in commit messages
 * 4. Keep old versions if breaking changes are needed
 */
