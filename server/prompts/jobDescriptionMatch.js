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
 * 2. Side-by-side comparison of requirements vs. qualifications
 * 3. Gap analysis - what's missing from the resume
 * 4. Tailoring suggestions - specific changes to improve match
 * 5. Keyword mapping - which job keywords are present/missing
 * 
 * USAGE:
 * NOT YET IMPLEMENTED - prepared for future feature.
 * Will be used when user provides a job description along with their resume.
 * This is the next major feature after basic analysis.
 * 
 * IMPLEMENTATION NOTES:
 * - Job description will be stored in Resume model (new field: jobDescription)
 * - New endpoint: POST /api/analysis/:resumeId/job-match
 * - Frontend will have "Match with Job" button
 * - Results will show match percentage and tailoring suggestions
 * 
 * OUTPUT STRUCTURE:
 * {
 *   "matchScore": number (0-100),
 *   "matchedRequirements": string[],
 *   "missingRequirements": string[],
 *   "matchedSkills": string[],
 *   "missingSkills": string[],
 *   "keywordMapping": { jobKeyword: resumeKeyword },
 *   "experienceMatch": { score, analysis },
 *   "tailoringSuggestions": string[],
 *   "priorityChanges": Array<{ change, impact, priority }>
 * }
 */

/**
 * Generate prompt for job description matching
 * @param {Object} resumeData - Parsed resume data
 * @param {string} jobDescription - Job description text
 * @returns {string} Formatted prompt for job matching analysis
 */
export const generateJobMatchPrompt = (resumeData, jobDescription) => {
  return `You are a resume-to-job matching expert. Compare this resume against the provided job description.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

ANALYSIS REQUIREMENTS:
1. Calculate match score (0-100) based on:
   - Skills alignment
   - Experience relevance
   - Keyword presence
   - Qualification match
   - Domain expertise

2. Identify matched requirements (what the resume already covers).

3. Identify missing requirements (what the job needs but resume lacks).

4. Compare skills - which are present, which are missing.

5. Map keywords - show which job keywords are in the resume.

6. Evaluate experience match - does background fit the role level and type.

7. Provide tailoring suggestions - specific changes to improve match.

8. Prioritize changes by impact - which edits will improve score most.

RESPONSE FORMAT:
Return VALID JSON ONLY:

{
  "matchScore": <number 0-100>,
  "matchedRequirements": [
    "<requirement from job that resume satisfies>"
  ],
  "missingRequirements": [
    "<requirement from job that resume lacks>"
  ],
  "matchedSkills": [
    "<skill present in both job and resume>"
  ],
  "missingSkills": [
    "<skill in job description but not in resume>"
  ],
  "keywordMapping": {
    "<job keyword>": "<corresponding resume keyword or null>"
  },
  "experienceMatch": {
    "score": <number 0-100>,
    "jobLevel": "<entry|mid|senior>",
    "resumeLevel": "<entry|mid|senior>",
    "analysis": "<brief explanation of experience match>"
  },
  "tailoringSuggestions": [
    "<specific suggestion to improve match>"
  ],
  "priorityChanges": [
    {
      "change": "<what to change>",
      "impact": "<expected score improvement>",
      "priority": "<high|medium|low>",
      "section": "<which resume section to modify>"
    }
  ],
  "overallAssessment": "<2-3 sentence summary of match quality>"
}

IMPORTANT: Return ONLY the JSON object. No markdown, no explanations.`;
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
