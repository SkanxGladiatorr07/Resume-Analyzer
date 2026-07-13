/**
 * ATS Optimization Prompt
 * 
 * PURPOSE:
 * Analyzes resume specifically for ATS (Applicant Tracking System) compatibility.
 * This is more focused than the general analysis and looks at technical aspects
 * that affect how well the resume will be parsed by ATS software.
 * 
 * DESIGN DECISIONS:
 * 1. Focus on ATS-specific criteria (formatting, keywords, structure)
 * 2. Scoring breakdown by category (formatting, keywords, structure, contact info)
 * 3. Keyword density analysis
 * 4. Section completeness checks
 * 5. Returns actionable recommendations for each category
 * 
 * USAGE:
 * Currently available but NOT used in the primary workflow.
 * Can be added as an additional analysis type in future iterations.
 * Prepared for future "Advanced ATS Analysis" feature.
 * 
 * OUTPUT STRUCTURE:
 * Detailed breakdown of ATS compatibility with category-specific scores
 * and recommendations for each area of improvement.
 */

/**
 * Generate prompt for ATS optimization analysis
 * @param {Object} resumeData - Parsed resume data
 * @returns {string} Formatted prompt for ATS-focused analysis
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
