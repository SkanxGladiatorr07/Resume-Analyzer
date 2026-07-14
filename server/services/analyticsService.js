/**
 * Analytics Service
 * Handles data aggregation for charts and visualizations
 */

import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import JobMatch from '../models/JobMatch.js';
import mongoose from 'mongoose';

/**
 * Get ATS Score Trend over time
 * Shows how ATS scores have progressed
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Object>} Trend data with dates and scores
 */
export const getATSScoreTrend = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await Analysis.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        analysisStatus: 'completed',
        atsScore: { $ne: null },
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
        },
        averageScore: { $avg: '$atsScore' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        date: '$_id',
        averageScore: { $round: ['$averageScore', 0] },
        count: 1,
        _id: 0
      }
    }
  ]);

  return {
    labels: result.map(item => item.date),
    datasets: [
      {
        label: 'Average ATS Score',
        data: result.map(item => item.averageScore),
      }
    ],
    raw: result
  };
};

/**
 * Get Resume Upload Timeline
 * Shows resume uploads over time
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Object>} Upload timeline data
 */
export const getResumeUploadTimeline = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await Resume.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$parsingStatus', 'completed'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$parsingStatus', 'failed'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        date: '$_id',
        total: '$count',
        completed: 1,
        failed: 1,
        _id: 0
      }
    }
  ]);

  return {
    labels: result.map(item => item.date),
    datasets: [
      {
        label: 'Total Uploads',
        data: result.map(item => item.total),
      },
      {
        label: 'Completed',
        data: result.map(item => item.completed),
      },
      {
        label: 'Failed',
        data: result.map(item => item.failed),
      }
    ],
    raw: result
  };
};

/**
 * Get Skills Distribution
 * Analyzes skills frequency across all resumes
 * @param {string} userId - User ID
 * @param {number} limit - Top N skills to return (default: 10)
 * @returns {Promise<Object>} Skills distribution data
 */
export const getSkillsDistribution = async (userId, limit = 10) => {
  // Get all completed resumes with structured data
  const resumes = await Resume.find({
    user: userId,
    parsingStatus: 'completed',
    'structuredData.skills': { $exists: true, $ne: null }
  }).select('structuredData.skills').lean();

  // Count skill frequency
  const skillCount = {};
  
  resumes.forEach(resume => {
    const skills = resume.structuredData?.skills || [];
    skills.forEach(skill => {
      const normalizedSkill = skill.trim().toLowerCase();
      if (normalizedSkill) {
        skillCount[normalizedSkill] = (skillCount[normalizedSkill] || 0) + 1;
      }
    });
  });

  // Sort and get top N skills
  const sortedSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill, count]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1), // Capitalize
      count
    }));

  return {
    labels: sortedSkills.map(item => item.skill),
    datasets: [
      {
        label: 'Skill Frequency',
        data: sortedSkills.map(item => item.count),
      }
    ],
    raw: sortedSkills
  };
};

/**
 * Get Job Match Score Distribution
 * Shows distribution of job match scores
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Match score distribution data
 */
export const getJobMatchScoreDistribution = async (userId) => {
  const result = await JobMatch.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        matchStatus: 'completed',
        matchScore: { $ne: null }
      }
    },
    {
      $bucket: {
        groupBy: '$matchScore',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          avgScore: { $avg: '$matchScore' }
        }
      }
    },
    {
      $project: {
        range: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 0] }, then: '0-20' },
              { case: { $eq: ['$_id', 20] }, then: '20-40' },
              { case: { $eq: ['$_id', 40] }, then: '40-60' },
              { case: { $eq: ['$_id', 60] }, then: '60-80' },
              { case: { $eq: ['$_id', 80] }, then: '80-100' }
            ],
            default: 'Other'
          }
        },
        count: 1,
        avgScore: { $round: ['$avgScore', 0] },
        _id: 0
      }
    },
    {
      $sort: { range: 1 }
    }
  ]);

  return {
    labels: result.map(item => item.range),
    datasets: [
      {
        label: 'Number of Matches',
        data: result.map(item => item.count),
      }
    ],
    raw: result
  };
};

/**
 * Get Resume Completeness Score
 * Analyzes how complete resumes are based on key sections
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Completeness score data
 */
export const getResumeCompletenessScore = async (userId) => {
  const resumes = await Resume.find({
    user: userId,
    parsingStatus: 'completed',
    structuredData: { $exists: true }
  }).select('originalName structuredData').lean();

  const completenessData = resumes.map(resume => {
    const data = resume.structuredData || {};
    let score = 0;
    let maxScore = 6; // Total number of key sections

    // Check key sections (each worth ~16.67 points)
    if (data.contactInfo && Object.keys(data.contactInfo).length > 0) score++;
    if (data.summary && data.summary.trim().length > 0) score++;
    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) score++;
    if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) score++;
    if (data.education && Array.isArray(data.education) && data.education.length > 0) score++;
    if (data.certifications || data.projects || data.languages) score++;

    const completeness = Math.round((score / maxScore) * 100);

    return {
      name: resume.originalName,
      completeness,
      sections: score,
      maxSections: maxScore
    };
  });

  // Sort by completeness
  completenessData.sort((a, b) => b.completeness - a.completeness);

  return {
    labels: completenessData.map(item => item.name),
    datasets: [
      {
        label: 'Completeness (%)',
        data: completenessData.map(item => item.completeness),
      }
    ],
    raw: completenessData
  };
};

/**
 * Get Most Common Missing Skills
 * Analyzes what skills are most frequently missing from job matches
 * @param {string} userId - User ID
 * @param {number} limit - Top N missing skills (default: 10)
 * @returns {Promise<Object>} Missing skills data
 */
export const getMostCommonMissingSkills = async (userId, limit = 10) => {
  // Get all completed job matches
  const jobMatches = await JobMatch.find({
    user: userId,
    matchStatus: 'completed',
    missingTechnicalSkills: { $exists: true, $ne: null }
  }).select('missingTechnicalSkills missingSoftSkills').lean();

  // Count frequency of missing skills
  const skillCount = {};

  jobMatches.forEach(match => {
    const technicalSkills = match.missingTechnicalSkills || [];
    const softSkills = match.missingSoftSkills || [];
    
    [...technicalSkills, ...softSkills].forEach(skill => {
      const normalizedSkill = skill.trim();
      if (normalizedSkill) {
        if (!skillCount[normalizedSkill]) {
          skillCount[normalizedSkill] = {
            count: 0,
            type: technicalSkills.includes(skill) ? 'technical' : 'soft'
          };
        }
        skillCount[normalizedSkill].count++;
      }
    });
  });

  // Sort and get top N missing skills
  const sortedSkills = Object.entries(skillCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([skill, data]) => ({
      skill,
      count: data.count,
      type: data.type
    }));

  return {
    labels: sortedSkills.map(item => item.skill),
    datasets: [
      {
        label: 'Frequency',
        data: sortedSkills.map(item => item.count),
      }
    ],
    raw: sortedSkills
  };
};

/**
 * Get ATS Score Distribution
 * Shows distribution of ATS scores across all analyses
 * @param {string} userId - User ID
 * @returns {Promise<Object>} ATS score distribution data
 */
export const getATSScoreDistribution = async (userId) => {
  const result = await Analysis.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        analysisStatus: 'completed',
        atsScore: { $ne: null }
      }
    },
    {
      $bucket: {
        groupBy: '$atsScore',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          avgScore: { $avg: '$atsScore' }
        }
      }
    },
    {
      $project: {
        range: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 0] }, then: '0-20 (Poor)' },
              { case: { $eq: ['$_id', 20] }, then: '20-40 (Fair)' },
              { case: { $eq: ['$_id', 40] }, then: '40-60 (Good)' },
              { case: { $eq: ['$_id', 60] }, then: '60-80 (Very Good)' },
              { case: { $eq: ['$_id', 80] }, then: '80-100 (Excellent)' }
            ],
            default: 'Other'
          }
        },
        count: 1,
        avgScore: { $round: ['$avgScore', 0] },
        _id: 0
      }
    },
    {
      $sort: { range: 1 }
    }
  ]);

  return {
    labels: result.map(item => item.range),
    datasets: [
      {
        label: 'Number of Resumes',
        data: result.map(item => item.count),
      }
    ],
    raw: result
  };
};

/**
 * Get Analysis Success Rate over time
 * Shows success vs failure rate of analyses
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Object>} Success rate data
 */
export const getAnalysisSuccessRate = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await Analysis.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$analysisStatus', 'completed'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$analysisStatus', 'failed'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        date: '$_id',
        total: 1,
        completed: 1,
        failed: 1,
        successRate: {
          $round: [
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            0
          ]
        },
        _id: 0
      }
    }
  ]);

  return {
    labels: result.map(item => item.date),
    datasets: [
      {
        label: 'Success Rate (%)',
        data: result.map(item => item.successRate),
      }
    ],
    raw: result
  };
};

/**
 * Get all chart data at once
 * Combines all chart data for dashboard
 * @param {string} userId - User ID
 * @param {Object} options - Options for customization
 * @returns {Promise<Object>} All chart data
 */
export const getAllChartData = async (userId, options = {}) => {
  const {
    days = 30,
    topSkills = 10,
    topMissingSkills = 10
  } = options;

  console.log(`📊 Generating all chart data for user: ${userId}`);

  try {
    // Run all aggregations in parallel
    const [
      atsScoreTrend,
      resumeUploadTimeline,
      skillsDistribution,
      jobMatchScoreDistribution,
      resumeCompletenessScore,
      mostCommonMissingSkills,
      atsScoreDistribution,
      analysisSuccessRate,
    ] = await Promise.all([
      getATSScoreTrend(userId, days),
      getResumeUploadTimeline(userId, days),
      getSkillsDistribution(userId, topSkills),
      getJobMatchScoreDistribution(userId),
      getResumeCompletenessScore(userId),
      getMostCommonMissingSkills(userId, topMissingSkills),
      getATSScoreDistribution(userId),
      getAnalysisSuccessRate(userId, days),
    ]);

    console.log(`✅ All chart data generated successfully`);

    return {
      atsScoreTrend,
      resumeUploadTimeline,
      skillsDistribution,
      jobMatchScoreDistribution,
      resumeCompletenessScore,
      mostCommonMissingSkills,
      atsScoreDistribution,
      analysisSuccessRate,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId,
        options
      }
    };
  } catch (error) {
    console.error('❌ Error generating chart data:', error);
    throw error;
  }
};
