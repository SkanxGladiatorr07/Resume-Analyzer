/**
 * AI History Controller
 * Unified controller for all AI generation history
 */

import RewriteHistory from '../models/RewriteHistory.js';
import StarHistory from '../models/StarHistory.js';
import InterviewHistory from '../models/InterviewHistory.js';
import ProjectHistory from '../models/ProjectHistory.js';
import RoadmapHistory from '../models/RoadmapHistory.js';

/**
 * Get rewrite history
 * GET /api/ai/history/rewrite
 */
export const getRewriteHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resumeId, limit = 20, skip = 0 } = req.query;

    let query = { user: userId, status: 'completed' };
    if (resumeId) {
      query.resume = resumeId;
    }

    const history = await RewriteHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v')
      .lean();

    const total = await RewriteHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        history,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error('[History] Error getting rewrite history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rewrite history',
    });
  }
};

/**
 * Get STAR history
 * GET /api/ai/history/star
 */
export const getStarHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resumeId, limit = 20, skip = 0 } = req.query;

    let query = { user: userId, status: 'completed' };
    if (resumeId) {
      query.resume = resumeId;
    }

    const history = await StarHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v')
      .lean();

    const total = await StarHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        history,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error('[History] Error getting STAR history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get STAR history',
    });
  }
};

/**
 * Get interview history
 * GET /api/ai/history/interview
 */
export const getInterviewHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resumeId, limit = 20, skip = 0 } = req.query;

    let query = { user: userId, status: 'completed' };
    if (resumeId) {
      query.resumeId = resumeId;
    }

    const history = await InterviewHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v')
      .lean();

    const total = await InterviewHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        history,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error('[History] Error getting interview history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview history',
    });
  }
};

/**
 * Get projects history
 * GET /api/ai/history/projects
 */
export const getProjectsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const query = { user: userId, status: 'completed' };

    const history = await ProjectHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v')
      .lean();

    const total = await ProjectHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        history,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error('[History] Error getting projects history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects history',
    });
  }
};

/**
 * Get roadmap history
 * GET /api/ai/history/roadmap
 */
export const getRoadmapHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit = 20, skip = 0 } = req.query;

    let query = { user: userId, status: 'completed' };
    if (type && ['learning', 'career'].includes(type)) {
      query.type = type;
    }

    const history = await RoadmapHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-__v')
      .lean();

    const total = await RoadmapHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        history,
        total,
        type: type || 'all',
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error('[History] Error getting roadmap history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get roadmap history',
    });
  }
};

/**
 * Get all AI history combined
 * GET /api/ai/history/all
 */
export const getAllHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const [rewrites, stars, interviews, projects, roadmaps] = await Promise.all([
      RewriteHistory.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('section tone createdAt')
        .lean(),
      StarHistory.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('createdAt')
        .lean(),
      InterviewHistory.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('jobDescription createdAt')
        .lean(),
      ProjectHistory.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('careerGoal createdAt')
        .lean(),
      RoadmapHistory.find({ user: userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type targetRole targetCareerRole createdAt')
        .lean(),
    ]);

    // Combine and sort by date
    const combined = [
      ...rewrites.map((r) => ({ ...r, feature: 'rewrite' })),
      ...stars.map((s) => ({ ...s, feature: 'star' })),
      ...interviews.map((i) => ({ ...i, feature: 'interview' })),
      ...projects.map((p) => ({ ...p, feature: 'projects' })),
      ...roadmaps.map((r) => ({ ...r, feature: 'roadmap' })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        history: combined,
        total: combined.length,
        counts: {
          rewrites: rewrites.length,
          stars: stars.length,
          interviews: interviews.length,
          projects: projects.length,
          roadmaps: roadmaps.length,
        },
      },
    });
  } catch (error) {
    console.error('[History] Error getting all history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history',
    });
  }
};

/**
 * Regenerate from history
 * POST /api/ai/history/regenerate/:feature/:id
 */
export const regenerateFromHistory = async (req, res) => {
  try {
    const { feature, id } = req.params;
    const userId = req.user.id;

    // Map feature to model and service
    const featureMap = {
      rewrite: {
        model: RewriteHistory,
        service: () => import('../services/aiRewriteService.js'),
        method: 'rewriteContent',
      },
      star: {
        model: StarHistory,
        service: () => import('../services/aiStarService.js'),
        method: 'generateStarBullet',
      },
      interview: {
        model: InterviewHistory,
        service: () => import('../services/aiInterviewService.js'),
        method: 'generateInterviewQuestions',
      },
      projects: {
        model: ProjectHistory,
        service: () => import('../services/aiProjectsService.js'),
        method: 'generateProjectSuggestions',
      },
      roadmap: {
        model: RoadmapHistory,
        service: () => import('../services/aiRoadmapService.js'),
        method: null, // Will determine based on type
      },
    };

    if (!featureMap[feature]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature',
      });
    }

    // Get original request from history
    const Model = featureMap[feature].model;
    const historyRecord = await Model.findOne({ _id: id, user: userId });

    if (!historyRecord) {
      return res.status(404).json({
        success: false,
        message: 'History record not found',
      });
    }

    // Build request parameters from history
    let requestParams = { userId };

    switch (feature) {
      case 'rewrite':
        requestParams = {
          ...requestParams,
          resumeId: historyRecord.resume,
          section: historyRecord.section,
          content: historyRecord.originalContent,
          tone: historyRecord.tone,
        };
        break;
      case 'star':
        requestParams = {
          ...requestParams,
          resumeId: historyRecord.resume,
          experience: historyRecord.originalExperience,
        };
        break;
      case 'interview':
        requestParams = {
          ...requestParams,
          resumeId: historyRecord.resumeId,
          jobDescription: historyRecord.jobDescription,
        };
        break;
      case 'projects':
        requestParams = {
          ...requestParams,
          existingSkills: historyRecord.existingSkills,
          missingSkills: historyRecord.missingSkills,
          careerGoal: historyRecord.careerGoal,
        };
        break;
      case 'roadmap':
        if (historyRecord.type === 'learning') {
          requestParams = {
            ...requestParams,
            currentSkills: historyRecord.currentSkills,
            targetRole: historyRecord.targetRole,
            timeframe: historyRecord.timeframe,
          };
        } else {
          requestParams = {
            ...requestParams,
            currentRole: historyRecord.currentRole,
            targetCareerRole: historyRecord.targetCareerRole,
            yearsOfExperience: historyRecord.yearsOfExperience,
          };
        }
        break;
    }

    // Import service and call method
    const serviceModule = await featureMap[feature].service();
    let method = featureMap[feature].method;

    // Special handling for roadmap
    if (feature === 'roadmap') {
      method =
        historyRecord.type === 'learning' ? 'generateLearningRoadmap' : 'generateCareerRoadmap';
    }

    const result = await serviceModule[method](requestParams);

    res.status(200).json({
      ...result,
      regenerated: true,
      originalId: id,
    });
  } catch (error) {
    console.error('[History] Error regenerating:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to regenerate',
    });
  }
};

export default {
  getRewriteHistory,
  getStarHistory,
  getInterviewHistory,
  getProjectsHistory,
  getRoadmapHistory,
  getAllHistory,
  regenerateFromHistory,
};
