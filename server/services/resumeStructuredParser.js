/**
 * Resume Structured Parser Service
 * Extracts structured data from resume text using pattern matching
 * No AI models - pure regex and text analysis
 */

/**
 * Parse resume text into structured data
 * @param {string} text - Extracted resume text
 * @returns {Object} Structured resume data
 */
export const parseStructuredData = (text) => {
  if (!text || typeof text !== 'string') {
    return getEmptyStructure();
  }

  const cleanedText = text.trim();
  
  return {
    contactInfo: parseContactInfo(cleanedText),
    skills: parseSkills(cleanedText),
    education: parseEducation(cleanedText),
    experience: parseExperience(cleanedText),
    projects: parseProjects(cleanedText),
    certifications: parseCertifications(cleanedText),
    languages: parseLanguages(cleanedText),
  };
};

/**
 * Get empty structure (for failed parsing)
 */
const getEmptyStructure = () => ({
  contactInfo: {
    name: null,
    email: null,
    phone: null,
    linkedin: null,
    github: null,
  },
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  languages: [],
});

/**
 * Parse contact information
 * @param {string} text - Resume text
 * @returns {Object} Contact info
 */
export const parseContactInfo = (text) => {
  const contactInfo = {
    name: null,
    email: null,
    phone: null,
    linkedin: null,
    github: null,
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    contactInfo.email = emailMatches[0];
  }

  // Extract phone number (various formats)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    contactInfo.phone = phoneMatches[0].trim();
  }

  // Extract LinkedIn URL
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/gi;
  const linkedinMatches = text.match(linkedinRegex);
  if (linkedinMatches && linkedinMatches.length > 0) {
    contactInfo.linkedin = linkedinMatches[0];
  }

  // Extract GitHub URL
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/gi;
  const githubMatches = text.match(githubRegex);
  if (githubMatches && githubMatches.length > 0) {
    contactInfo.github = githubMatches[0];
  }

  // Extract name (heuristic: first non-empty line, usually at the top)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length > 0) {
    // Check first few lines for a name-like pattern
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines that look like section headers
      if (/^(resume|cv|curriculum vitae|contact|profile|summary|objective|professional)/i.test(line)) {
        continue;
      }
      
      // Skip lines with email or phone
      if (emailRegex.test(line) || phoneRegex.test(line)) {
        continue;
      }
      
      // Name pattern: 2-4 words, each capitalized, reasonable length
      const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/;
      if (namePattern.test(line) && line.length <= 50) {
        contactInfo.name = line;
        break;
      }
      
      // Alternative: Look for capitalized words (less strict)
      if (line.length <= 50 && /^[A-Z]/.test(line) && !line.includes('@') && line.split(' ').length <= 4) {
        contactInfo.name = line;
        break;
      }
    }
  }

  return contactInfo;
};

/**
 * Parse skills section
 * @param {string} text - Resume text
 * @returns {Array} List of skills
 */
export const parseSkills = (text) => {
  const skills = [];
  
  // Common skill section headers
  const skillSectionRegex = /(?:^|\n)(SKILLS?|TECHNICAL SKILLS?|CORE COMPETENCIES|TECHNOLOGIES|EXPERTISE)[\s:]*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n{2,}|$)/i;
  const skillSectionMatch = text.match(skillSectionRegex);
  
  if (skillSectionMatch) {
    const skillSection = skillSectionMatch[2];
    
    // Extract skills separated by common delimiters
    const rawSkills = skillSection.split(/[,•·|;]\s*|\n/);
    
    for (const skill of rawSkills) {
      const cleaned = skill.trim();
      
      // Filter out empty strings, section headers, or very long text
      if (cleaned && 
          cleaned.length > 1 && 
          cleaned.length < 50 &&
          !/^(skills?|technical|core|technologies|expertise)$/i.test(cleaned)) {
        
        // Remove leading symbols
        const finalSkill = cleaned.replace(/^[-–—:•·*]\s*/, '').trim();
        if (finalSkill) {
          skills.push(finalSkill);
        }
      }
    }
  }
  
  // Fallback: Look for common programming languages and technologies
  if (skills.length === 0) {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node\\.js', 'Express', 'Django', 'Flask', 'Spring',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
      'Git', 'CI/CD', 'REST', 'GraphQL', 'TypeScript', 'HTML', 'CSS', 'SASS',
    ];
    
    const skillPattern = new RegExp(`\\b(${commonSkills.join('|')})\\b`, 'gi');
    const matches = text.match(skillPattern);
    
    if (matches) {
      const uniqueSkills = [...new Set(matches.map(s => s.trim()))];
      skills.push(...uniqueSkills);
    }
  }
  
  // Remove duplicates (case-insensitive)
  const uniqueSkills = [];
  const seenLower = new Set();
  
  for (const skill of skills) {
    const lower = skill.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      uniqueSkills.push(skill);
    }
  }
  
  return uniqueSkills.slice(0, 50); // Limit to 50 skills
};

/**
 * Parse education section
 * @param {string} text - Resume text
 * @returns {Array} List of education entries
 */
export const parseEducation = (text) => {
  const education = [];
  
  // Find education section
  const educationSectionRegex = /(?:^|\n)(EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS)[\s:]*\n([\s\S]*?)(?=\n[A-Z]{2,}\s*\n|\n{3,}|$)/i;
  const educationSectionMatch = text.match(educationSectionRegex);
  
  if (educationSectionMatch) {
    const educationSection = educationSectionMatch[2];
    
    // Split into individual entries (look for degree keywords or institution names)
    const lines = educationSection.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let i = 0;
    while (i < lines.length) {
      const eduEntry = {
        degree: null,
        institution: null,
        year: null,
        location: null,
      };
      
      const degreePattern = /(Bachelor|Master|PhD|Ph\.D\.|Doctor|Associate|B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.Tech|M\.Tech)/i;
      
      // Current line
      const currentLine = lines[i];
      
      // Check if this line contains a degree
      if (degreePattern.test(currentLine)) {
        eduEntry.degree = currentLine;
        i++;
        
        // Next line is likely the institution
        if (i < lines.length && !/\d{4}/.test(lines[i])) {
          eduEntry.institution = lines[i];
          i++;
        }
        
        // Next line might be year
        if (i < lines.length) {
          const yearPattern = /\b(19|20)\d{2}\b/g;
          const years = lines[i].match(yearPattern);
          if (years) {
            eduEntry.year = years.length > 1 ? `${years[0]} - ${years[years.length - 1]}` : years[0];
            i++;
          }
        }
      } else {
        // No degree keyword, skip this line
        i++;
        continue;
      }
      
      // Look for location in any of the processed lines
      const combinedText = [eduEntry.degree, eduEntry.institution, eduEntry.year].filter(Boolean).join(' ');
      const locationPattern = /([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})/;
      const locationMatch = combinedText.match(locationPattern);
      if (locationMatch) {
        eduEntry.location = locationMatch[0];
      }
      
      // Only add if we have at least degree or institution
      if (eduEntry.degree || eduEntry.institution) {
        education.push(eduEntry);
      }
    }
  }
  
  return education.slice(0, 10); // Limit to 10 education entries
};

/**
 * Parse work experience section
 * @param {string} text - Resume text
 * @returns {Array} List of experience entries
 */
export const parseExperience = (text) => {
  const experience = [];
  
  // Find experience section
  const experienceSectionRegex = /(?:^|\n)(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY)[\s:]*\n([\s\S]*?)(?=\n(?:EDUCATION|PROJECTS|SKILLS|CERTIFICATIONS|LANGUAGES)[^\n]*\n|\n{3,}|$)/i;
  const experienceSectionMatch = text.match(experienceSectionRegex);
  
  if (experienceSectionMatch) {
    const experienceSection = experienceSectionMatch[2];
    
    // Split by job entries (lines that look like titles with separators or dates)
    const lines = experienceSection.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let i = 0;
    while (i < lines.length) {
      const expEntry = {
        title: null,
        company: null,
        duration: null,
        location: null,
        description: [],
      };
      
      const currentLine = lines[i];
      
      // Check if this line looks like a job title (contains | or - separator)
      const titleCompanyPattern = /^(.+?)\s*[-|–—]\s*(.+?)(?:\s*[-|–—]\s*(.+?))?$/;
      const titleCompanyMatch = currentLine.match(titleCompanyPattern);
      
      // Skip if line starts with bullet
      if (currentLine.startsWith('•') || currentLine.startsWith('-') || currentLine.startsWith('*')) {
        i++;
        continue;
      }
      
      if (titleCompanyMatch) {
        expEntry.title = titleCompanyMatch[1].trim();
        expEntry.company = titleCompanyMatch[2].trim();
        
        // Check if third part is location
        if (titleCompanyMatch[3]) {
          const locationPattern = /[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}/;
          if (locationPattern.test(titleCompanyMatch[3])) {
            expEntry.location = titleCompanyMatch[3].trim();
          }
        }
        
        i++;
        
        // Next line might be duration or location
        if (i < lines.length) {
          const nextLine = lines[i];
          
          // Check for duration pattern
          const durationPattern = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*Present/i;
          if (durationPattern.test(nextLine)) {
            const durationMatch = nextLine.match(durationPattern);
            if (durationMatch) {
              expEntry.duration = durationMatch[0];
            }
            i++;
          }
          
          // Check for location if not already set
          if (!expEntry.location && i < lines.length) {
            const locationPattern = /[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}/;
            const locMatch = lines[i].match(locationPattern);
            if (locMatch) {
              expEntry.location = locMatch[0];
              i++;
            }
          }
        }
        
        // Collect description (bullet points)
        while (i < lines.length) {
          const line = lines[i];
          
          // Stop if we hit another job entry
          if (titleCompanyPattern.test(line) || /^[A-Z][\w\s]{10,60}\s*[-|–—]/.test(line)) {
            break;
          }
          
          // Add bullet points
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            const cleaned = line.replace(/^[•\-*]\s*/, '').trim();
            if (cleaned.length > 10) {
              expEntry.description.push(cleaned);
            }
            i++;
          } else {
            i++;
          }
        }
        
        // Only add if we have at least title or company
        if (expEntry.title || expEntry.company) {
          experience.push(expEntry);
        }
      } else {
        i++;
      }
    }
  }
  
  return experience.slice(0, 15); // Limit to 15 experience entries
};

/**
 * Parse projects section
 * @param {string} text - Resume text
 * @returns {Array} List of project entries
 */
export const parseProjects = (text) => {
  const projects = [];
  
  // Find projects section
  const projectsSectionRegex = /(?:^|\n)(PROJECTS?|PERSONAL PROJECTS|KEY PROJECTS)[\s:]*\n([\s\S]*?)(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|LANGUAGES)[^\n]*\n|\n{3,}|$)/i;
  const projectsSectionMatch = text.match(projectsSectionRegex);
  
  if (projectsSectionMatch) {
    const projectsSection = projectsSectionMatch[2];
    
    // Split into individual project entries
    const entries = projectsSection.split(/\n(?=[A-Z][\w\s]{5,60}(?:\n|[|\-–—]))/);
    
    for (const entry of entries) {
      const lines = entry.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) continue;
      
      const projectEntry = {
        name: null,
        technologies: [],
        description: [],
      };
      
      // Extract project name (first line)
      projectEntry.name = lines[0].trim();
      
      // Extract technologies (look for patterns like "Technologies: ..." or "Tech Stack:")
      const techPattern = /(?:Technologies?|Tech Stack|Built with)[\s:]*(.+)/i;
      const techMatch = entry.match(techPattern);
      if (techMatch) {
        const techList = techMatch[1].split(/[,;|•·]/);
        projectEntry.technologies = techList.map(t => t.trim()).filter(t => t && t.length > 1).slice(0, 10);
      }
      
      // Extract description
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !techPattern.test(line)) {
          const cleaned = line.replace(/^[•\-*]\s*/, '').trim();
          if (cleaned.length > 10) {
            projectEntry.description.push(cleaned);
          }
        }
      }
      
      if (projectEntry.name) {
        projects.push(projectEntry);
      }
    }
  }
  
  return projects.slice(0, 10); // Limit to 10 projects
};

/**
 * Parse certifications section
 * @param {string} text - Resume text
 * @returns {Array} List of certifications
 */
export const parseCertifications = (text) => {
  const certifications = [];
  
  // Find certifications section
  const certificationsSectionRegex = /(?:^|\n)(CERTIFICATIONS?|CERTIFICATES?|LICENSES?)[\s:]*\n([\s\S]*?)(?=\n[A-Z]{2,}\s*\n|\n{3,}|$)/i;
  const certificationsSectionMatch = text.match(certificationsSectionRegex);
  
  if (certificationsSectionMatch) {
    const certificationsSection = certificationsSectionMatch[2];
    
    // Split by newlines or bullet points
    const entries = certificationsSection.split(/\n|[•·*]/);
    
    for (const entry of entries) {
      const cleaned = entry.trim();
      
      // Extract certification with optional issuer and date
      if (cleaned && cleaned.length > 5 && cleaned.length < 200) {
        const certEntry = {
          name: cleaned,
          issuer: null,
          date: null,
        };
        
        // Try to separate name, issuer, and date
        const parts = cleaned.split(/[-–—|]/);
        if (parts.length >= 2) {
          certEntry.name = parts[0].trim();
          certEntry.issuer = parts[1].trim();
        }
        
        // Extract year
        const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          certEntry.date = yearMatch[0];
        }
        
        certifications.push(certEntry);
      }
    }
  }
  
  return certifications.slice(0, 20); // Limit to 20 certifications
};

/**
 * Parse languages section
 * @param {string} text - Resume text
 * @returns {Array} List of languages with proficiency
 */
export const parseLanguages = (text) => {
  const languages = [];
  
  // Find languages section
  const languagesSectionRegex = /(?:^|\n)(LANGUAGES?)[\s:]*\n([\s\S]*?)(?=\n[A-Z]{2,}\s*\n|\n{3,}|$)/i;
  const languagesSectionMatch = text.match(languagesSectionRegex);
  
  if (languagesSectionMatch) {
    const languagesSection = languagesSectionMatch[2];
    
    // Split by newlines or separators
    const entries = languagesSection.split(/\n|[,;•·*]/);
    
    for (const entry of entries) {
      const cleaned = entry.trim();
      
      if (cleaned && cleaned.length > 2 && cleaned.length < 100) {
        const langEntry = {
          language: null,
          proficiency: null,
        };
        
        // Try to separate language and proficiency
        const proficiencyPattern = /(.+?)\s*[-–—:]\s*(Native|Fluent|Professional|Conversational|Basic|Elementary|Advanced|Intermediate|Beginner)/i;
        const match = cleaned.match(proficiencyPattern);
        
        if (match) {
          langEntry.language = match[1].trim();
          langEntry.proficiency = match[2].trim();
        } else {
          langEntry.language = cleaned;
        }
        
        if (langEntry.language) {
          languages.push(langEntry);
        }
      }
    }
  }
  
  return languages.slice(0, 10); // Limit to 10 languages
};

/**
 * Validate structured data
 * @param {Object} structuredData - Parsed structured data
 * @returns {boolean} Whether data contains meaningful information
 */
export const validateStructuredData = (structuredData) => {
  if (!structuredData) return false;
  
  // Check if at least some data was extracted
  const hasContactInfo = structuredData.contactInfo && 
    (structuredData.contactInfo.name || structuredData.contactInfo.email);
  
  const hasSkills = structuredData.skills && structuredData.skills.length > 0;
  const hasEducation = structuredData.education && structuredData.education.length > 0;
  const hasExperience = structuredData.experience && structuredData.experience.length > 0;
  
  // Valid if we have at least contact info OR skills OR education OR experience
  return hasContactInfo || hasSkills || hasEducation || hasExperience;
};
