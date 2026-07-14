/**
 * Dashboard Service
 * Handles data aggregation and analytics calculations for dashboard
 */

import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import JobMatch from '../models/JobMatch.js';

/**
 * Get total number of resumes for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total resume count
 */
export const getTotalResumes = async (userId) => {
  return await Resume.countDocuments({ user: userId });
};

/**
 * Get total number of completed analyses for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total completed analysis count
 */
export const getTotalAnalyses = async (userId) => {
  return await Analysis.countDocuments({ 
    user: userId,
    analysisStatus: 'completed'
  });
};

/**
 * Get total number of job matches for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total job match count
 */
export const getTotalJobMatches = async (userId) => {
  return await JobMatch.countDocuments({ 
    user: userId,
    matchStatus: 'completed'
  });
};

/**
 * Calculate average ATS score from completed analyses
 * @param {string} userId - User ID
 * @returns {Promise<number|null>} Average ATS score or null if no analyses
 */
export const getAverageATSScore = async (userId) => {
  const result = await Analysis.aggregate([
    {
      $match: {
        user: userId,
        analysisStatus: 'completed',
        atsScore: { $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$atsScore' }
      }
    }
  ]);

  if (result.length === 0) {
    return null;
  }

  return Math.round(result[0].averageScore);
};

/**
 * Get highest ATS score from completed analyses
 * @param {string} userId - User ID
 * @returns {Promise<number|null>} Highest ATS score or null if no analyses
 */
export const getHighestATSScore = async (userId) => {
  const result = await Analysis.aggregate([
    {
      $match: {
        user: userId,
        analysisStatus: 'completed',
        atsScore: { $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        highestScore: { $max: '$atsScore' }
      }
    }
  ]);

  if (result.length === 0) {
    return null;
  }

  return result[0].highestScore;
};

/**
 * Get average job match score from completed matches
 * @param {string} userId - User ID
 * @returns {Promise<number|null>} Average match score or null if no matches
 */
export const getAverageMatchScore = async (userId) => {
  const result = await JobMatch.aggregate([
    {
      $match: {
        user: userId,
        matchStatus: 'completed',
        matchScore: { $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$matchScore' }
      }
    }
  ]);

  if (result.length === 0) {
    return null;
  }

  return Math.round(result[0].averageScore);
};

/**
 * Get latest uploaded resume
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Latest resume or null
 */
export const getLatestResume = async (userId) => {
  const resume = await Resume.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .select('originalName fileSize parsingStatus createdAt')
    .lean();

  return resume;
};

/**
 * Get latest completed analysis
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Latest analysis or null
 */
export const getLatestAnalysis = async (userId) => {
  const analysis = await Analysis.findOne({ 
    user: userId,
    analysisStatus: 'completed'
  })
    .sort({ completedAt: -1 })
    .populate('resume', 'originalName')
    .select('atsScore summary completedAt')
    .lean();

  return analysis;
};

/**
 * Get latest completed job match
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Latest job match or null
 */
export const getLatestJobMatch = async (userId) => {
  const jobMatch = await JobMatch.findOne({ 
    user: userId,
    matchStatus: 'completed'
  })
    .sort({ generatedAt: -1 })
    .populate('resume', 'originalName')
    .populate('jobDescription', 'title company')
    .select('matchScore summary generatedAt')
    .lean();

  return jobMatch;
};

/**
 * Get resume status breakdown
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Status counts
 */
export const getResumeStatusBreakdown = async (userId) => {
  const result = await Resume.aggregate([
    {
      $match: { user: userId }
    },
    {
      $group: {
        _id: '$parsingStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const breakdown = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };

  result.forEach(item => {
    if (breakdown.hasOwnProperty(item._id)) {
      breakdown[item._id] = item.count;
    }
  });

  return breakdown;
};

/**
 * Get analysis status breakdown
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Status counts
 */
export const getAnalysisStatusBreakdown = async (userId) => {
  const result = await Analysis.aggregate([
    {
      $match: { user: userId }
    },
    {
      $group: {
        _id: '$analysisStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const breakdown = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };

  result.forEach(item => {
    if (breakdown.hasOwnProperty(item._id)) {
      breakdown[item._id] = item.count;
    }
  });

  return breakdown;
};

/**
 * Get job match status breakdown
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Status counts
 */
export const getJobMatchStatusBreakdown = async (userId) => {
  const result = await JobMatch.aggregate([
    {
      $match: { user: userId }
    },
    {
      $group: {
        _id: '$matchStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const breakdown = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };

  result.forEach(item => {
    if (breakdown.hasOwnProperty(item._id)) {
      breakdown[item._id] = item.count;
    }
  });

  return breakdown;
};

/**
 * Get recent activity timeline
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to return (default: 10)
 * @returns {Promise<Array>} Recent activities
 */
export const getRecentActivity = async (userId, limit = 10) => {
  const activities = [];

  // Get recent resumes
  const recentResumes = await Resume.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('originalName parsingStatus createdAt')
    .lean();

  recentResumes.forEach(resume => {
    activities.push({
      type: 'resume',
      action: 'uploaded',
      title: resume.originalName,
      status: resume.parsingStatus,
      timestamp: resume.createdAt,
    });
  });

  // Get recent analyses
  const recentAnalyses = await Analysis.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('resume', 'originalName')
    .select('analysisStatus atsScore createdAt completedAt')
    .lean();

  recentAnalyses.forEach(analysis => {
    activities.push({
      type: 'analysis',
      action: 'completed',
      title: analysis.resume?.originalName || 'Unknown Resume',
      status: analysis.analysisStatus,
      atsScore: analysis.atsScore,
      timestamp: analysis.completedAt || analysis.createdAt,
    });
  });

  // Get recent job matches
  const recentMatches = await JobMatch.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('resume', 'originalName')
    .populate('jobDescription', 'title')
    .select('matchStatus matchScore createdAt generatedAt')
    .lean();

  recentMatches.forEach(match => {
    activities.push({
      type: 'jobMatch',
      action: 'matched',
      title: `${match.resume?.originalName || 'Resume'} → ${match.jobDescription?.title || 'Job'}`,
      status: match.matchStatus,
      matchScore: match.matchScore,
      timestamp: match.generatedAt || match.createdAt,
    });
  });

  // Sort by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return activities.slice(0, limit);
};

/**
 * Get comprehensive dashboard data
 * Main aggregation function that combines all dashboard metrics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Complete dashboard data
 */
export const getDashboardData = async (userId) => {
  try {
    console.log(`📊 Aggregating dashboard data for user: ${userId}`);

    // Run all aggregations in parallel for better performance
    const [
      totalResumes,
      totalAnalyses,
      totalJobMatches,
      averageATSScore,
      highestATSScore,
      averageMatchScore,
      latestResume,
      latestAnalysis,
      latestJobMatch,
      resumeStatusBreakdown,
      analysisStatusBreakdown,
      jobMatchStatusBreakdown,
      recentActivity,
    ] = await Promise.all([
      getTotalResumes(userId),
      getTotalAnalyses(userId),
      getTotalJobMatches(userId),
      getAverageATSScore(userId),
      getHighestATSScore(userId),
      getAverageMatchScore(userId),
      getLatestResume(userId),
      getLatestAnalysis(userId),
      getLatestJobMatch(userId),
      getResumeStatusBreakdown(userId),
      getAnalysisStatusBreakdown(userId),
      getJobMatchStatusBreakdown(userId),
      getRecentActivity(userId, 10),
    ]);

    console.log(`✅ Dashboard data aggregated successfully`);
    console.log(`   Resumes: ${totalResumes}, Analyses: ${totalAnalyses}, Matches: ${totalJobMatches}`);

    return {
      // Overview metrics
      overview: {
        totalResumes,
        totalAnalyses,
        totalJobMatches,
        averageATSScore,
        highestATSScore,
        averageMatchScore,
      },

      // Latest items
      latest: {
        resume: latestResume,
        analysis: latestAnalysis,
        jobMatch: latestJobMatch,
      },

      // Status breakdowns
      statusBreakdown: {
        resumes: resumeStatusBreakdown,
        analyses: analysisStatusBreakdown,
        jobMatches: jobMatchStatusBreakdown,
      },

      // Recent activity timeline
      recentActivity,

      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        userId,
      },
    };
  } catch (error) {
    console.error('❌ Error aggregating dashboard data:', error);
    throw error;
  }
};
