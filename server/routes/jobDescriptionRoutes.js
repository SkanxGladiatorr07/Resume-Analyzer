/**
 * JobDescription Routes
 * API endpoints for job description management
 */

import express from 'express';
import {
  createJobDescription,
  getJobDescriptions,
  getJobDescriptionById,
  updateJobDescription,
  deleteJobDescription,
} from '../controllers/jobDescriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/job-descriptions
 * @desc    Create a new job description
 * @access  Private
 * @body    { title, company, description, metadata }
 * @example POST /api/job-descriptions
 *          Body: {
 *            "title": "Senior Software Engineer",
 *            "company": "Tech Corp",
 *            "description": "We are looking for...",
 *            "metadata": {
 *              "location": "Remote",
 *              "employmentType": "full-time",
 *              "experienceLevel": "senior"
 *            }
 *          }
 */
router.post('/', createJobDescription);

/**
 * @route   GET /api/job-descriptions
 * @desc    Get all job descriptions for the authenticated user
 * @access  Private
 * @query   page, limit (optional pagination)
 * @example GET /api/job-descriptions
 * @example GET /api/job-descriptions?page=1&limit=10
 */
router.get('/', getJobDescriptions);

/**
 * @route   GET /api/job-descriptions/:id
 * @desc    Get a single job description by ID
 * @access  Private
 * @example GET /api/job-descriptions/668f7a1b2c3d4e5f6a7b8c9d
 */
router.get('/:id', getJobDescriptionById);

/**
 * @route   PUT /api/job-descriptions/:id
 * @desc    Update a job description
 * @access  Private
 * @body    { title, company, description, metadata } (all optional)
 * @example PUT /api/job-descriptions/668f7a1b2c3d4e5f6a7b8c9d
 *          Body: {
 *            "title": "Updated Title",
 *            "description": "Updated description..."
 *          }
 */
router.put('/:id', updateJobDescription);

/**
 * @route   DELETE /api/job-descriptions/:id
 * @desc    Delete a job description
 * @access  Private
 * @example DELETE /api/job-descriptions/668f7a1b2c3d4e5f6a7b8c9d
 */
router.delete('/:id', deleteJobDescription);

export default router;
