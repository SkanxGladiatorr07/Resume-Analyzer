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
  return `You are an expert resume analyzer and ATS (Applicant Tracking System) specialist. Your task is to perform a detailed comparison between a candidate's resume and a job description, then provide structured analysis in JSON format.

=== RESUME DATA ===
${JSON.stringify(resumeData, null, 2)}

=== JOB DESCRIPTION ===
Title: ${jobTitle || 'Not specified'}
Description: ${jobDescription}

=== ANALYSIS INSTRUCTIONS ===

Perform a comprehensive evaluation following these exact steps:

**STEP 1: MATCH SCORE CALCULATION (0-100)**
Calculate an overall match score considering:
- Technical skills alignment (30% weight)
- Relevant work experience (25% weight)
- Education and qualifications (15% weight)
- Soft skills and cultural fit (15% weight)
- Keyword presence and density (15% weight)

Be objective and realistic. Most candidates score between 40-80. Only exceptional perfect fits should score above 90.

**STEP 2: SUMMARY (2-3 sentences)**
Provide a clear, professional summary that:
- States the overall match quality
- Mentions key strengths
- Notes any critical gaps
- Gives hiring recommendation perspective

**STEP 3: MATCHING SKILLS**
Identify 3-10 specific skills from the resume that directly match job requirements.
- Include both technical and soft skills
- Be specific (e.g., "Python 3.x" not just "Programming")
- Only include genuinely matching skills

**STEP 4: MISSING TECHNICAL SKILLS**
Identify 2-8 technical skills required by the job but missing from the resume.
- Focus on role-critical skills
- Be specific and actionable
- Prioritize high-impact skills

**STEP 5: MISSING SOFT SKILLS**
Identify 1-5 soft skills mentioned in job description but not evident in resume.
- Leadership, communication, teamwork, etc.
- Only include if explicitly mentioned or strongly implied in job description

**STEP 6: MISSING KEYWORDS**
Identify 3-10 important keywords from job description absent from resume.
- Industry terms, tools, methodologies
- Keywords that ATS systems will scan for
- Exclude generic words

**STEP 7: STRENGTHS**
Highlight 3-7 specific strengths where candidate excels for this role.
- Relevant experience that stands out
- Unique qualifications
- Competitive advantages

**STEP 8: RECOMMENDATIONS**
Provide 4-8 specific, actionable recommendations to improve match.
- Focus on highest-impact changes
- Be concrete (what to add, modify, emphasize)
- Prioritize quick wins

**STEP 9: ATS OPTIMIZATION TIPS**
Provide 3-6 specific tips to optimize resume for ATS systems.
- Keyword placement strategies
- Formatting recommendations
- Section organization tips
- Role-specific optimization

=== OUTPUT FORMAT ===

You MUST respond with ONLY valid JSON. No markdown, no explanations, JUST the JSON object:

{
  "matchScore": <integer 0-100>,
  "summary": "<2-3 sentence professional summary>",
  "matchingSkills": [
    "<specific matching skill 1>",
    "<specific matching skill 2>",
    "<specific matching skill 3>"
  ],
  "missingTechnicalSkills": [
    "<specific missing technical skill 1>",
    "<specific missing technical skill 2>"
  ],
  "missingSoftSkills": [
    "<specific missing soft skill 1>",
    "<specific missing soft skill 2>"
  ],
  "missingKeywords": [
    "<important missing keyword 1>",
    "<important missing keyword 2>",
    "<important missing keyword 3>"
  ],
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>",
    "<actionable recommendation 4>"
  ],
  "atsOptimizationTips": [
    "<specific ATS tip 1>",
    "<specific ATS tip 2>",
    "<specific ATS tip 3>"
  ]
}

=== QUALITY GUIDELINES ===

1. **Be Specific**: Avoid generic phrases like "good fit" or "needs improvement"
2. **Be Objective**: Base scores on actual evidence, not potential
3. **Be Actionable**: Every recommendation should be implementable
4. **Be Consistent**: Same quality resume + job = similar scores
5. **Be Realistic**: Most matches score 40-80, perfect fits are rare
6. **Be Thorough**: Include at least minimum items in each array
7. **Be Relevant**: Only include information pertinent to THIS job

=== CRITICAL RULES ===

- Output ONLY the JSON object, nothing else
- NO markdown code blocks (no \`\`\`json)
- NO explanatory text before or after JSON
- All string values must be clear and specific
- All arrays must contain at least 2 items (except missingSoftSkills: min 1)
- matchScore must be an integer between 0-100
- Empty arrays [] are only acceptable if truly no items exist
- Ensure JSON is valid and parseable

Generate the analysis now.`;
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
