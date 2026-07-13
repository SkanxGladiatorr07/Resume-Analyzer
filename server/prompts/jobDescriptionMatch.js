/**
 * Job Description Matching Prompt
 * 
 * PURPOSE:
 * Compares resume against a specific job description to calculate match score
 * and provide targeted recommendations. This helps users tailor their resume
 * for specific job applications.
 * 
 * DESIGN DECISIONS:
 * 1. Match score calculation (0-100) based on skills, experience, and keywords
 * 2. Skill categorization - matching vs. missing (technical and soft)
 * 3. Keyword analysis - present and missing keywords
 * 4. Strengths identification - what makes the candidate stand out
 * 5. Actionable recommendations - specific improvements
 * 6. ATS optimization tips - how to pass ATS for this specific job
 * 
 * USAGE:
 * ACTIVE - Used in job match endpoint
 * Called when user compares resume with job description
 * Endpoint: POST /api/job-match/:resumeId/:jobDescriptionId
 * 
 * OUTPUT STRUCTURE:
 * {
 *   "matchScore": number (0-100),
 *   "summary": string (2-3 sentences),
 *   "matchingSkills": string[],
 *   "missingTechnicalSkills": string[],
 *   "missingSoftSkills": string[],
 *   "missingKeywords": string[],
 *   "strengths": string[],
 *   "recommendations": string[],
 *   "atsOptimizationTips": string[]
 * }
 */

/**
 * Generate prompt for job description matching
 * @param {Object} resumeData - Parsed resume data (structuredData)
 * @param {string} jobDescription - Job description text
 * @param {string} jobTitle - Job title
 * @returns {string} Formatted prompt for job matching analysis
 */
export const generateJobMatchPrompt = (resumeData, jobDescription, jobTitle = '') => {
  return `You are a resume-to-job matching expert and ATS specialist. Compare this resume against the provided job description and provide a comprehensive match analysis.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
Title: ${jobTitle || 'Not specified'}
Description: ${jobDescription}

ANALYSIS REQUIREMENTS:

1. Calculate a match score (0-100) based on:
   - Technical skills alignment
   - Soft skills presence
   - Experience relevance
   - Keyword matching
   - Qualification match
   - Overall fit for the role

2. Provide a concise summary (2-3 sentences) of the overall match quality and candidate fit.

3. Identify matching skills - skills from the resume that align with job requirements.

4. Identify missing technical skills - technical skills required by the job but not present in the resume.

5. Identify missing soft skills - soft skills mentioned in the job description but not evident in the resume.

6. Identify missing keywords - important keywords from the job description that should be added to the resume.

7. Highlight strengths - specific aspects where the candidate excels or stands out for this role.

8. Provide actionable recommendations - specific changes to improve the match score.

9. Give ATS optimization tips - how to tailor the resume to pass ATS for this specific job.

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT structure:

{
  "matchScore": <number between 0-100>,
  "summary": "<2-3 sentence summary of match quality>",
  "matchingSkills": [
    "<skill that matches job requirement 1>",
    "<skill that matches job requirement 2>",
    "<skill that matches job requirement 3>"
  ],
  "missingTechnicalSkills": [
    "<missing technical skill 1>",
    "<missing technical skill 2>"
  ],
  "missingSoftSkills": [
    "<missing soft skill 1>",
    "<missing soft skill 2>"
  ],
  "missingKeywords": [
    "<missing keyword 1>",
    "<missing keyword 2>"
  ],
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "atsOptimizationTips": [
    "<ATS tip 1>",
    "<ATS tip 2>",
    "<ATS tip 3>"
  ]
}

IMPORTANT RULES:
- Return ONLY the JSON object above
- NO markdown formatting (no \`\`\`json or \`\`\`)
- NO additional text or explanations
- All arrays must contain strings
- matchScore must be a number (0-100)
- Each array should have at least 2-5 items
- Be specific and actionable in all feedback
- If no issues in a category, provide empty array []
- Base match score on actual alignment, not potential
- Be honest about gaps and mismatches
- Recommendations should be concrete and implementable

Return ONLY the JSON object now.`;
};

/**
 * Generate prompt for keyword extraction and comparison
 * @param {Object} resumeData - Parsed resume data
 * @param {string} jobDescription - Job description text (optional)
 * @returns {string} Formatted prompt for keyword analysis
 */
export const generateKeywordExtractionPrompt = (resumeData, jobDescription = null) => {
  const basePrompt = `You are a keyword extraction expert. Extract and analyze keywords from this resume.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}`;

  const jobDescPrompt = jobDescription
    ? `\n\nJOB DESCRIPTION TO MATCH AGAINST:\n${jobDescription}\n\nCompare resume keywords with job description keywords.`
    : '';

  return `${basePrompt}${jobDescPrompt}

Extract:
1. Technical keywords
2. Soft skill keywords
3. Industry-specific terms
4. Action verbs
5. Tools and technologies

${jobDescription ? 'Also provide matching score with job description.' : ''}

RESPONSE FORMAT:
Return VALID JSON ONLY:

{
  "technical": ["<keyword>"],
  "softSkills": ["<keyword>"],
  "industry": ["<keyword>"],
  "actionVerbs": ["<keyword>"],
  "tools": ["<keyword>"],
  "allKeywords": ["<keyword>"],
  "keywordDensity": <number>,
  ${jobDescription ? '"matchingScore": <number 0-100>,\n  "matchedKeywords": ["<keyword>"],\n  "missingKeywords": ["<keyword>"],' : ''}
  "recommendations": ["<keyword to add>"]
}

Return ONLY the JSON object.`;
};
