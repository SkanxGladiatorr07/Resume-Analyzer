/**
 * Improvement Suggestions Prompt
 * 
 * PURPOSE:
 * Provides detailed, section-by-section improvement suggestions for the resume.
 * This is more granular than general analysis and focuses on specific edits
 * the user can make to each resume section.
 * 
 * DESIGN DECISIONS:
 * 1. Section-by-section scoring - rate each resume section independently
 * 2. Granular suggestions - specific to each section and role
 * 3. Priority and impact - help users focus on high-impact changes
 * 4. Improved examples - show better ways to phrase experience bullet points
 * 5. Skill recommendations - which skills to add/remove
 * 6. Structure optimization - recommended section order
 * 
 * USAGE:
 * NOT YET IMPLEMENTED - prepared for future feature.
 * Will be used for "Detailed Recommendations" or "Resume Optimizer" feature.
 * Provides more actionable feedback than the general analysis.
 * 
 * IMPLEMENTATION NOTES:
 * - New endpoint: POST /api/analysis/:resumeId/improvements
 * - Can be combined with general analysis or offered separately
 * - Frontend will show improvements by section with expand/collapse
 * - Each suggestion will have priority badge (high/medium/low)
 * - Impact indicators will show expected score improvement
 * 
 * OUTPUT STRUCTURE:
 * Comprehensive breakdown by resume section with scores, suggestions,
 * and specific examples of improved content.
 */

/**
 * Generate prompt for improvement suggestions
 * @param {Object} resumeData - Parsed resume data
 * @returns {string} Formatted prompt for improvement recommendations
 */
export const generateImprovementPrompt = (resumeData) => {
  return `You are a professional resume writer. Provide specific, actionable improvements for this resume.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Provide improvements for:
1. Contact Information
2. Skills Section
3. Work Experience descriptions
4. Education Section
5. Projects Section
6. Overall Structure

RESPONSE FORMAT:
Return VALID JSON ONLY:

{
  "contactInfo": {
    "score": <number 0-100>,
    "suggestions": ["<suggestion>"]
  },
  "skills": {
    "score": <number 0-100>,
    "suggestions": ["<suggestion>"],
    "skillsToAdd": ["<skill>"],
    "skillsToRemove": ["<skill>"]
  },
  "experience": {
    "score": <number 0-100>,
    "generalSuggestions": ["<suggestion>"],
    "perJob": [
      {
        "title": "<job title>",
        "suggestions": ["<suggestion>"],
        "improvedDescriptions": ["<improved bullet point>"]
      }
    ]
  },
  "education": {
    "score": <number 0-100>,
    "suggestions": ["<suggestion>"]
  },
  "projects": {
    "score": <number 0-100>,
    "suggestions": ["<suggestion>"]
  },
  "structure": {
    "score": <number 0-100>,
    "suggestions": ["<suggestion>"],
    "recommendedOrder": ["<section>"]
  },
  "overallImprovements": [
    {
      "type": "<improvement type>",
      "description": "<description>",
      "priority": "<high|medium|low>",
      "impact": "<impact description>"
    }
  ]
}

Return ONLY the JSON object.`;
};
