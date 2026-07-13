/**
 * Structured Analysis Prompt
 * 
 * PURPOSE:
 * This prompt generates a comprehensive resume analysis in a strict JSON format
 * for storage in MongoDB and display in the frontend.
 * 
 * DESIGN DECISIONS:
 * 1. Strict JSON requirement - No markdown, no code blocks, pure JSON only
 * 2. Fixed structure - Ensures consistent data structure for database storage
 * 3. Multiple analysis dimensions - ATS score, strengths, weaknesses, skills, grammar, formatting
 * 4. Actionable feedback - All suggestions must be specific and implementable
 * 5. Array constraints - Requests 2-5 items minimum for quality feedback
 * 
 * USAGE:
 * This is the PRIMARY prompt used for generating resume analysis after parsing.
 * It's automatically called by the analysis pipeline after successful resume parsing.
 * 
 * OUTPUT STRUCTURE:
 * {
 *   "atsScore": number (0-100),
 *   "summary": string (2-3 sentences),
 *   "strengths": string[],
 *   "weaknesses": string[],
 *   "missingSkills": string[],
 *   "grammarFeedback": string[],
 *   "formattingFeedback": string[],
 *   "suggestions": string[]
 * }
 */

/**
 * Generate prompt for structured analysis (primary analysis endpoint)
 * @param {Object} resumeData - Parsed resume data from structuredData field
 * @returns {string} Formatted prompt requesting strict JSON response
 */
export const generateStructuredAnalysisPrompt = (resumeData) => {
  return `You are an expert ATS and resume analyst. Analyze the following resume data and provide a comprehensive evaluation.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

ANALYSIS REQUIREMENTS:
1. Calculate an ATS score (0-100) based on:
   - Keyword optimization
   - Format compatibility
   - Content completeness
   - Structure quality
   - Contact information clarity

2. Provide a concise summary (2-3 sentences) of the overall resume quality.

3. Identify specific strengths (what works well).

4. Identify specific weaknesses (what needs improvement).

5. List missing skills that would strengthen the resume for common tech roles.

6. Check for grammar issues (spelling, punctuation, tense consistency).

7. Evaluate formatting (structure, clarity, readability, ATS compatibility).

8. Provide actionable suggestions for improvement.

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT structure:

{
  "atsScore": <number between 0-100>,
  "summary": "<2-3 sentence overall summary>",
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "weaknesses": [
    "<specific weakness 1>",
    "<specific weakness 2>",
    "<specific weakness 3>"
  ],
  "missingSkills": [
    "<missing skill 1>",
    "<missing skill 2>",
    "<missing skill 3>"
  ],
  "grammarFeedback": [
    "<grammar issue 1>",
    "<grammar issue 2>"
  ],
  "formattingFeedback": [
    "<formatting issue 1>",
    "<formatting issue 2>"
  ],
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>"
  ]
}

IMPORTANT RULES:
- Return ONLY the JSON object above
- NO markdown formatting (no \`\`\`json or \`\`\`)
- NO additional text or explanations
- All arrays must contain strings
- atsScore must be a number (0-100)
- Each array should have 2-5 items minimum
- Be specific and actionable in all feedback
- If no issues found in a category, provide empty array []

Return ONLY the JSON object now.`;
};
