/**
 * Version Comparison Service
 * Handles comparison logic between resume versions
 */

import { generateContent } from './geminiService.js';

/**
 * Compare two arrays and find differences
 */
const compareArrays = (oldArray = [], newArray = []) => {
  const oldSet = new Set(oldArray.map((item) => (typeof item === 'string' ? item.toLowerCase() : JSON.stringify(item))));
  const newSet = new Set(newArray.map((item) => (typeof item === 'string' ? item.toLowerCase() : JSON.stringify(item))));

  const added = newArray.filter((item) => {
    const key = typeof item === 'string' ? item.toLowerCase() : JSON.stringify(item);
    return !oldSet.has(key);
  });

  const removed = oldArray.filter((item) => {
    const key = typeof item === 'string' ? item.toLowerCase() : JSON.stringify(item);
    return !newSet.has(key);
  });

  return { added, removed, unchanged: oldArray.filter((item) => {
    const key = typeof item === 'string' ? item.toLowerCase() : JSON.stringify(item);
    return newSet.has(key);
  }) };
};

/**
 * Compare skills between versions
 */
const compareSkills = (oldSkills = [], newSkills = []) => {
  return compareArrays(oldSkills, newSkills);
};

/**
 * Compare experience sections
 */
const compareExperience = (oldExp = [], newExp = []) => {
  const changes = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  };

  // Create maps for comparison
  const oldExpMap = new Map(
    oldExp.map((exp, index) => [`${exp.company}-${exp.title}-${index}`, exp])
  );
  const newExpMap = new Map(
    newExp.map((exp, index) => [`${exp.company}-${exp.title}-${index}`, exp])
  );

  // Find added and modified
  newExp.forEach((exp, index) => {
    const key = `${exp.company}-${exp.title}-${index}`;
    const oldMatch = oldExpMap.get(key);

    if (!oldMatch) {
      // Check if this is truly new or just reordered
      const similarMatch = oldExp.find(
        (old) => old.company === exp.company && old.title === exp.title
      );

      if (!similarMatch) {
        changes.added.push({
          company: exp.company,
          title: exp.title,
          startDate: exp.startDate,
          endDate: exp.endDate,
        });
      } else {
        // It's modified
        changes.modified.push({
          company: exp.company,
          title: exp.title,
          changes: detectExperienceChanges(similarMatch, exp),
        });
      }
    } else {
      // Check if modified
      if (JSON.stringify(oldMatch) !== JSON.stringify(exp)) {
        changes.modified.push({
          company: exp.company,
          title: exp.title,
          changes: detectExperienceChanges(oldMatch, exp),
        });
      } else {
        changes.unchanged.push({
          company: exp.company,
          title: exp.title,
        });
      }
    }
  });

  // Find removed
  oldExp.forEach((exp) => {
    const stillExists = newExp.find(
      (newE) => newE.company === exp.company && newE.title === exp.title
    );
    if (!stillExists) {
      changes.removed.push({
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
      });
    }
  });

  return changes;
};

/**
 * Detect specific changes in an experience entry
 */
const detectExperienceChanges = (oldExp, newExp) => {
  const changes = [];

  if (oldExp.description !== newExp.description) {
    changes.push('description');
  }
  if (oldExp.startDate !== newExp.startDate) {
    changes.push('startDate');
  }
  if (oldExp.endDate !== newExp.endDate) {
    changes.push('endDate');
  }
  if (oldExp.location !== newExp.location) {
    changes.push('location');
  }
  if (JSON.stringify(oldExp.responsibilities) !== JSON.stringify(newExp.responsibilities)) {
    changes.push('responsibilities');
  }

  return changes;
};

/**
 * Compare education sections
 */
const compareEducation = (oldEdu = [], newEdu = []) => {
  const changes = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  };

  // Create maps for comparison
  const oldEduMap = new Map(
    oldEdu.map((edu, index) => [`${edu.institution}-${edu.degree}-${index}`, edu])
  );
  const newEduMap = new Map(
    newEdu.map((edu, index) => [`${edu.institution}-${edu.degree}-${index}`, edu])
  );

  // Find added and modified
  newEdu.forEach((edu, index) => {
    const key = `${edu.institution}-${edu.degree}-${index}`;
    const oldMatch = oldEduMap.get(key);

    if (!oldMatch) {
      const similarMatch = oldEdu.find(
        (old) => old.institution === edu.institution && old.degree === edu.degree
      );

      if (!similarMatch) {
        changes.added.push({
          institution: edu.institution,
          degree: edu.degree,
          graduationDate: edu.graduationDate,
        });
      } else {
        changes.modified.push({
          institution: edu.institution,
          degree: edu.degree,
          changes: detectEducationChanges(similarMatch, edu),
        });
      }
    } else {
      if (JSON.stringify(oldMatch) !== JSON.stringify(edu)) {
        changes.modified.push({
          institution: edu.institution,
          degree: edu.degree,
          changes: detectEducationChanges(oldMatch, edu),
        });
      } else {
        changes.unchanged.push({
          institution: edu.institution,
          degree: edu.degree,
        });
      }
    }
  });

  // Find removed
  oldEdu.forEach((edu) => {
    const stillExists = newEdu.find(
      (newE) => newE.institution === edu.institution && newE.degree === edu.degree
    );
    if (!stillExists) {
      changes.removed.push({
        institution: edu.institution,
        degree: edu.degree,
        graduationDate: edu.graduationDate,
      });
    }
  });

  return changes;
};

/**
 * Detect specific changes in an education entry
 */
const detectEducationChanges = (oldEdu, newEdu) => {
  const changes = [];

  if (oldEdu.graduationDate !== newEdu.graduationDate) {
    changes.push('graduationDate');
  }
  if (oldEdu.gpa !== newEdu.gpa) {
    changes.push('gpa');
  }
  if (oldEdu.fieldOfStudy !== newEdu.fieldOfStudy) {
    changes.push('fieldOfStudy');
  }
  if (oldEdu.location !== newEdu.location) {
    changes.push('location');
  }

  return changes;
};

/**
 * Calculate ATS score difference
 */
const compareATSScore = (oldScore = 0, newScore = 0) => {
  const difference = newScore - oldScore;
  const percentageChange = oldScore > 0 ? ((difference / oldScore) * 100).toFixed(2) : 0;

  return {
    oldScore,
    newScore,
    difference,
    percentageChange: parseFloat(percentageChange),
    improved: difference > 0,
    degraded: difference < 0,
    unchanged: difference === 0,
  };
};

/**
 * Compare projects
 */
const compareProjects = (oldProjects = [], newProjects = []) => {
  const changes = {
    added: [],
    removed: [],
    modified: [],
  };

  const oldProjectNames = new Set(oldProjects.map((p) => p.name?.toLowerCase()));
  const newProjectNames = new Set(newProjects.map((p) => p.name?.toLowerCase()));

  // Find added
  newProjects.forEach((proj) => {
    if (!oldProjectNames.has(proj.name?.toLowerCase())) {
      changes.added.push(proj.name);
    }
  });

  // Find removed
  oldProjects.forEach((proj) => {
    if (!newProjectNames.has(proj.name?.toLowerCase())) {
      changes.removed.push(proj.name);
    }
  });

  // Find modified (projects with same name but different content)
  newProjects.forEach((newProj) => {
    const oldProj = oldProjects.find(
      (old) => old.name?.toLowerCase() === newProj.name?.toLowerCase()
    );
    if (oldProj && JSON.stringify(oldProj) !== JSON.stringify(newProj)) {
      changes.modified.push(newProj.name);
    }
  });

  return changes;
};

/**
 * Generate AI summary of improvements
 */
const generateImprovementSummary = async (comparisonData) => {
  try {
    const { atsScore, skills, experience, education, projects } = comparisonData;

    // Build prompt
    let prompt = `You are an expert resume analyst. Analyze the changes between two resume versions and provide a concise summary of improvements.

CHANGES DETECTED:

ATS SCORE:
- Old Score: ${atsScore.oldScore}/100
- New Score: ${atsScore.newScore}/100
- Change: ${atsScore.difference > 0 ? '+' : ''}${atsScore.difference} points (${atsScore.percentageChange}%)

SKILLS:
- Added: ${skills.added.length > 0 ? skills.added.join(', ') : 'None'}
- Removed: ${skills.removed.length > 0 ? skills.removed.join(', ') : 'None'}

EXPERIENCE:
- Added: ${experience.added.length} new position(s)
- Removed: ${experience.removed.length} position(s)
- Modified: ${experience.modified.length} position(s)

EDUCATION:
- Added: ${education.added.length} new degree(s)
- Removed: ${education.removed.length} degree(s)
- Modified: ${education.modified.length} degree(s)

PROJECTS:
- Added: ${projects.added.length} new project(s)
- Removed: ${projects.removed.length} project(s)
- Modified: ${projects.modified.length} project(s)

TASK:
Provide a brief, professional summary (3-5 sentences) highlighting:
1. Overall improvement or degradation
2. Most significant changes
3. Impact on ATS score
4. Recommendations for further improvement (if any)

Your response must be in this EXACT JSON format (no markdown, no code blocks):
{
  "summary": "Professional summary of changes",
  "keyImprovements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "concerns": ["Concern 1", "Concern 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const aiResponse = await generateContent(prompt, true);

    return {
      summary: aiResponse.summary || 'Changes detected between versions.',
      keyImprovements: aiResponse.keyImprovements || [],
      concerns: aiResponse.concerns || [],
      recommendations: aiResponse.recommendations || [],
    };
  } catch (error) {
    console.error('[Version Comparison] AI summary generation failed:', error.message);

    // Fallback to basic summary
    return generateBasicSummary(comparisonData);
  }
};

/**
 * Generate basic summary without AI
 */
const generateBasicSummary = (comparisonData) => {
  const { atsScore, skills, experience, education } = comparisonData;
  const improvements = [];
  const concerns = [];

  // ATS Score
  if (atsScore.improved) {
    improvements.push(`ATS score improved by ${atsScore.difference} points`);
  } else if (atsScore.degraded) {
    concerns.push(`ATS score decreased by ${Math.abs(atsScore.difference)} points`);
  }

  // Skills
  if (skills.added.length > 0) {
    improvements.push(`Added ${skills.added.length} new skill(s)`);
  }
  if (skills.removed.length > 0) {
    concerns.push(`Removed ${skills.removed.length} skill(s)`);
  }

  // Experience
  if (experience.added.length > 0) {
    improvements.push(`Added ${experience.added.length} new position(s)`);
  }
  if (experience.modified.length > 0) {
    improvements.push(`Updated ${experience.modified.length} position(s)`);
  }

  // Education
  if (education.added.length > 0) {
    improvements.push(`Added ${education.added.length} new degree(s)`);
  }

  const summary =
    improvements.length > 0
      ? `Resume updated with ${improvements.length} improvement(s).`
      : 'Resume updated with minor changes.';

  return {
    summary,
    keyImprovements: improvements,
    concerns,
    recommendations: concerns.length > 0 ? ['Review removed content', 'Consider restoring valuable information'] : [],
  };
};

/**
 * Main comparison function
 */
export const compareVersions = async (olderVersion, newerVersion) => {
  const logPrefix = '[Version Comparison]';

  try {
    console.log(`${logPrefix} Comparing versions ${olderVersion.versionNumber} and ${newerVersion.versionNumber}`);

    // Extract data
    const oldData = olderVersion.parsedData?.structuredData || {};
    const newData = newerVersion.parsedData?.structuredData || {};
    const oldAnalysis = olderVersion.aiAnalysis || {};
    const newAnalysis = newerVersion.aiAnalysis || {};

    // Perform comparisons
    const atsScore = compareATSScore(oldAnalysis.score, newAnalysis.score);
    const skills = compareSkills(oldData.skills, newData.skills);
    const experience = compareExperience(oldData.experience, newData.experience);
    const education = compareEducation(oldData.education, newData.education);
    const projects = compareProjects(oldData.projects, newData.projects);

    // Prepare comparison data
    const comparisonData = {
      atsScore,
      skills,
      experience,
      education,
      projects,
    };

    // Generate AI summary
    console.log(`${logPrefix} Generating AI summary...`);
    const aiSummary = await generateImprovementSummary(comparisonData);

    return {
      success: true,
      data: {
        versions: {
          older: {
            versionNumber: olderVersion.versionNumber,
            createdAt: olderVersion.createdAt,
            atsScore: oldAnalysis.score,
          },
          newer: {
            versionNumber: newerVersion.versionNumber,
            createdAt: newerVersion.createdAt,
            atsScore: newAnalysis.score,
          },
        },
        comparison: {
          atsScore,
          skills,
          experience,
          education,
          projects,
        },
        aiSummary,
        metadata: {
          totalChanges:
            skills.added.length +
            skills.removed.length +
            experience.added.length +
            experience.removed.length +
            experience.modified.length +
            education.added.length +
            education.removed.length +
            education.modified.length +
            projects.added.length +
            projects.removed.length +
            projects.modified.length,
        },
      },
    };
  } catch (error) {
    console.error(`${logPrefix} Comparison failed:`, error.message);
    throw error;
  }
};

export default {
  compareVersions,
};
