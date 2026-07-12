/**
 * Resume Analysis Prompts
 * Structured prompts for Gemini AI analysis
 * All prompts request STRICT JSON output
 */

/**
 * Generate prompt for resume analysis
 * @param {Object} resumeData - Parsed resume data
 * @returns {string} Formatted prompt
 */
export const generateResumeAnalysisPrompt = (resumeData) => {
  const { contactInfo, skills, education, experience, projects, certifications } = resumeData;

  return `You are an expert resume analyst and career advisor. Analyze the following resume data and provide a comprehensive assessment.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

ANALYSIS REQUIREMENTS:
1. Overall Quality Score (0-100)
2. ATS Compatibility Score (0-100)
3. Strengths (list of specific strengths)
4. Weaknesses (list of specific issues)
5. Improvement Suggestions (actionable recommendations)
6. Missing Sections (what's missing)
7. Keywords Analysis (important keywords found/missing)
8. Professional Level (entry/mid/senior)

RESPONSE FORMAT:
You MUST respond with VALID JSON ONLY. No markdown, no explanations, just pure JSON.

{
  "overallScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "professionalLevel": "<entry|mid|senior>",
  "strengths": [
    "<specific strength with brief explanation>"
  ],
  "weaknesses": [
    "<specific weakness with brief explanation>"
  ],
  "improvements": [
    {
      "category": "<category name>",
      "suggestion": "<specific actionable suggestion>",
      "priority": "<high|medium|low>"
    }
  ],
  "missingSections": [
    "<section name>"
  ],
  "keywords": {
    "found": ["<keyword>"],
    "missing": ["<keyword>"],
    "recommended": ["<keyword>"]
  },
  "summary": "<brief 2-3 sentence overall summary>"
}

IMPORTANT: Return ONLY the JSON object. Do NOT include markdown code blocks, explanations, or any other text.`;
};

/**
 * Generate prompt for ATS optimization
 * @param {Object} resumeData - Parsed resume data
 * @returns {string} Formatted prompt
 */
export const generateATSOptimizationPrompt = (resumeData) => {
  return `You are an ATS (Applicant Tracking System) optimization expert. Analyze this resume for ATS compatibility.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Evaluate the resume against these ATS criteria:
1. Formatting (simple, parseable structure)
2. Keywords (industry-relevant keywords)
3. Contact Information (complete and clear)
4. Job Titles (clear and standard)
5. Dates (proper format)
6. Section Headers (standard naming)
7. File Compatibility (structure)

RESPONSE FORMAT:
Return VALID JSON ONLY (no markdown, no code blocks):

{
  "atsScore": <number 0-100>,
  "formatting": {
    "score": <number 0-100>,
    "issues": ["<issue>"],
    "recommendations": ["<recommendation>"]
  },
  "keywords": {
    "score": <number 0-100>,
    "density": <number>,
    "found": ["<keyword>"],
    "missing": ["<keyword>"]
  },
  "structure": {
    "score": <number 0-100>,
    "sectionsFound": ["<section>"],
    "sectionsMissing": ["<section>"],
    "recommendations": ["<recommendation>"]
  },
  "contactInfo": {
    "score": <number 0-100>,
    "complete": <boolean>,
    "issues": ["<issue>"]
  },
  "overallRecommendations": [
    "<specific recommendation>"
  ]
}

Return ONLY the JSON object.`;
};

/**
 * Generate prompt for skill gap analysis
 * @param {Object} resumeData - Parsed resume data
 * @param {string} targetRole - Target job role
 * @returns {string} Formatted prompt
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

/**
 * Generate prompt for resume improvement suggestions
 * @param {Object} resumeData - Parsed resume data
 * @returns {string} Formatted prompt
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

/**
 * Generate prompt for keyword extraction
 * @param {Object} resumeData - Parsed resume data
 * @param {string} jobDescription - Optional job description
 * @returns {string} Formatted prompt
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

/**
 * Generate prompt for structured analysis (specific format)
 * @param {Object} resumeData - Parsed resume data
 * @returns {string} Formatted prompt
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
