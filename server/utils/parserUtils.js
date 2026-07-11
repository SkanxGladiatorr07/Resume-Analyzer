/**
 * Parser Utility Functions
 * Reusable helper functions for resume parsing
 */

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} Whether phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Valid phone should have 10-15 digits
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Validate URL format
 * @param {string} url - URL
 * @returns {boolean} Whether URL is valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    // Try with protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
      return true;
    }
    // Try adding protocol
    new URL('https://' + url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Clean and normalize text
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s+/g, '\n') // Remove leading spaces on new lines
    .replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
};

/**
 * Extract year from text
 * @param {string} text - Text containing year
 * @returns {string|null} Year or null
 */
export const extractYear = (text) => {
  if (!text) return null;
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : null;
};

/**
 * Extract year range from text
 * @param {string} text - Text containing year range
 * @returns {string|null} Year range or null
 */
export const extractYearRange = (text) => {
  if (!text) return null;
  
  // Match patterns like "2020 - 2023" or "2020-2023"
  const rangeMatch = text.match(/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b/);
  if (rangeMatch) return rangeMatch[0];
  
  // Match patterns like "2020 - Present"
  const presentMatch = text.match(/\b(19|20)\d{2}\s*[-–—]\s*Present/i);
  if (presentMatch) return presentMatch[0];
  
  // Single year
  return extractYear(text);
};

/**
 * Deduplicate array (case-insensitive)
 * @param {Array<string>} arr - Array of strings
 * @returns {Array<string>} Deduplicated array
 */
export const deduplicateArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  
  const seen = new Set();
  const result = [];
  
  for (const item of arr) {
    if (!item || typeof item !== 'string') continue;
    
    const lower = item.toLowerCase().trim();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item.trim());
    }
  }
  
  return result;
};

/**
 * Check if string is a section header
 * @param {string} text - Text to check
 * @returns {boolean} Whether text is a section header
 */
export const isSectionHeader = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const upperText = text.toUpperCase().trim();
  const sectionHeaders = [
    'SUMMARY', 'OBJECTIVE', 'PROFILE',
    'EXPERIENCE', 'WORK EXPERIENCE', 'EMPLOYMENT', 'PROFESSIONAL EXPERIENCE',
    'EDUCATION', 'ACADEMIC', 'QUALIFICATIONS',
    'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'EXPERTISE',
    'PROJECTS', 'PERSONAL PROJECTS', 'KEY PROJECTS',
    'CERTIFICATIONS', 'CERTIFICATES', 'LICENSES',
    'LANGUAGES', 'LANGUAGE',
    'AWARDS', 'HONORS', 'ACHIEVEMENTS',
    'REFERENCES', 'PUBLICATIONS',
  ];
  
  return sectionHeaders.includes(upperText);
};

/**
 * Remove bullet points from text
 * @param {string} text - Text with bullets
 * @returns {string} Text without bullets
 */
export const removeBullets = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/^[•\-*◦▪▸►]\s*/gm, '').trim();
};

/**
 * Split text into lines and clean
 * @param {string} text - Text to split
 * @returns {Array<string>} Array of clean lines
 */
export const splitIntoLines = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

/**
 * Validate structured data field
 * @param {*} value - Value to validate
 * @param {string} type - Expected type ('string', 'array', 'object')
 * @param {Object} options - Validation options
 * @returns {boolean} Whether value is valid
 */
export const validateField = (value, type, options = {}) => {
  const { minLength = 0, maxLength = Infinity, required = false } = options;
  
  // Check required
  if (required && (value === null || value === undefined || value === '')) {
    return false;
  }
  
  // If not required and empty, it's valid
  if (!required && (value === null || value === undefined || value === '')) {
    return true;
  }
  
  // Type validation
  switch (type) {
    case 'string':
      if (typeof value !== 'string') return false;
      return value.length >= minLength && value.length <= maxLength;
      
    case 'array':
      if (!Array.isArray(value)) return false;
      return value.length >= minLength && value.length <= maxLength;
      
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
      
    default:
      return false;
  }
};

/**
 * Sanitize text for storage
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 10000); // Max length 10k chars
};

/**
 * Check if text contains mostly valid characters
 * @param {string} text - Text to check
 * @returns {boolean} Whether text is valid
 */
export const hasValidCharacters = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Count valid characters (letters, numbers, common punctuation)
  const validChars = text.match(/[a-zA-Z0-9\s.,!?;:()\-'"@]/g) || [];
  const ratio = validChars.length / text.length;
  
  return ratio > 0.7; // At least 70% valid characters
};

/**
 * Limit array size
 * @param {Array} arr - Array to limit
 * @param {number} max - Maximum size
 * @returns {Array} Limited array
 */
export const limitArray = (arr, max) => {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max);
};

/**
 * Format location string
 * @param {string} location - Location string
 * @returns {string|null} Formatted location or null
 */
export const formatLocation = (location) => {
  if (!location || typeof location !== 'string') return null;
  
  // Clean up location
  const cleaned = location.trim();
  
  // Check if it looks like a valid location (City, State or City, Country)
  const locationPattern = /^[A-Za-z\s]+,\s*[A-Za-z\s]{2,}$/;
  if (locationPattern.test(cleaned)) {
    return cleaned;
  }
  
  return null;
};

/**
 * Extract location from text
 * @param {string} text - Text containing location
 * @returns {string|null} Location or null
 */
export const extractLocation = (text) => {
  if (!text || typeof text !== 'string') return null;
  
  // Match patterns like "City, ST" or "City, State"
  const locationPattern = /\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z\s]+)\b/;
  const match = text.match(locationPattern);
  
  return match ? match[0] : null;
};

/**
 * Calculate confidence score for parsed data
 * @param {Object} structuredData - Parsed structured data
 * @returns {number} Confidence score (0-100)
 */
export const calculateConfidence = (structuredData) => {
  if (!structuredData) return 0;
  
  let score = 0;
  const weights = {
    contactInfo: 20,
    skills: 15,
    education: 20,
    experience: 25,
    projects: 10,
    certifications: 5,
    languages: 5,
  };
  
  // Contact info
  const contact = structuredData.contactInfo || {};
  if (contact.name) score += weights.contactInfo * 0.3;
  if (contact.email && isValidEmail(contact.email)) score += weights.contactInfo * 0.3;
  if (contact.phone && isValidPhone(contact.phone)) score += weights.contactInfo * 0.2;
  if (contact.linkedin) score += weights.contactInfo * 0.1;
  if (contact.github) score += weights.contactInfo * 0.1;
  
  // Skills
  if (structuredData.skills && structuredData.skills.length > 0) {
    score += Math.min(weights.skills, structuredData.skills.length * 2);
  }
  
  // Education
  if (structuredData.education && structuredData.education.length > 0) {
    score += Math.min(weights.education, structuredData.education.length * 10);
  }
  
  // Experience
  if (structuredData.experience && structuredData.experience.length > 0) {
    score += Math.min(weights.experience, structuredData.experience.length * 8);
  }
  
  // Projects
  if (structuredData.projects && structuredData.projects.length > 0) {
    score += Math.min(weights.projects, structuredData.projects.length * 3);
  }
  
  // Certifications
  if (structuredData.certifications && structuredData.certifications.length > 0) {
    score += Math.min(weights.certifications, structuredData.certifications.length * 2);
  }
  
  // Languages
  if (structuredData.languages && structuredData.languages.length > 0) {
    score += Math.min(weights.languages, structuredData.languages.length * 2);
  }
  
  return Math.min(100, Math.round(score));
};
