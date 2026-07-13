/**
 * Skill Gap Analysis Prompt
 * 
 * PURPOSE:
 * Analyzes the candidate's current skills against target role requirements
 * and provides a learning path to bridge the gap. This helps users plan
 * their professional development.
 * 
 * DESIGN DECISIONS:
 * 1. Target role comparison - analyze against specific job roles
 * 2. Skill categorization - critical, recommended, nice-to-have
 * 3. Gap identification - what's missing at each priority level
 * 4. Learning path generation - prioritized list of skills to acquire
 * 5. Readiness score - how prepared the candidate is for the target role
 * 6. Time estimates - realistic timeframes for skill acquisition
 * 
 * USAGE:
 * NOT YET IMPLEMENTED - prepared for future feature.
 * Will be used when user wants career development guidance.
 * Can be offered as "Career Insights" or "Skill Development Plan" feature.
 * 
 * IMPLEMENTATION NOTES:
 * - New endpoint: POST /api/analysis/:resumeId/skill-gap
 * - Query parameter: ?targetRole=Software%20Engineer
 * - Frontend will have "Analyze Skill Gap" button with role selector
 * - Predefined list of common tech roles (Software Engineer, Data Scientist, etc.)
 * - Results will show visual skill gap chart and learning roadmap
 * 
 * OUTPUT STRUCTURE:
 * Comprehensive skill analysis with current state, target requirements,
 * identified gaps, and actionable learning path with time estimates.
 */

/**
 * Generate prompt for skill gap analysis
 * @param {Object} resumeData - Parsed resume data
 * @param {string} targetRole - Target job role (default: 'Software Engineer')
 * @returns {string} Formatted prompt for skill gap analysis
 */
export const generateSkillGapPrompt = (resumeData, targetRole = 'Software Engineer') => {
  return `You are a career development expert. Analyze the skills gap for the target role.

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

TARGET ROLE: ${targetRole}

Analyze:
1. Current skills vs. required skills for ${targetRole}
2. Skill gaps (what's missing)
3. Skills to highlight more
4. Learning path recommendations

RESPONSE FORMAT:
Return VALID JSON ONLY:

{
  "targetRole": "${targetRole}",
  "currentSkills": {
    "technical": ["<skill>"],
    "soft": ["<skill>"],
    "tools": ["<skill>"]
  },
  "requiredSkills": {
    "critical": ["<skill>"],
    "recommended": ["<skill>"],
    "nice-to-have": ["<skill>"]
  },
  "skillGaps": {
    "critical": ["<missing critical skill>"],
    "recommended": ["<missing recommended skill>"]
  },
  "skillsToHighlight": [
    {
      "skill": "<skill>",
      "reason": "<why to highlight>"
    }
  ],
  "learningPath": [
    {
      "skill": "<skill to learn>",
      "priority": "<high|medium|low>",
      "estimatedTime": "<time estimate>",
      "resources": ["<learning resource>"]
    }
  ],
  "readinessScore": <number 0-100>
}

Return ONLY the JSON object.`;
};
