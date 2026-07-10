import express from 'express';
import {
  uploadResume,
  getResumes,
  deleteResume,
} from '../controllers/resumeController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload a resume file
 * @access  Private
 */
router.post('/upload', upload.single('resume'), uploadResume);

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for authenticated user
 * @access  Private
 */
router.get('/', getResumes);

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete a resume
 * @access  Private
 */
router.delete('/:id', deleteResume);

export default router;
