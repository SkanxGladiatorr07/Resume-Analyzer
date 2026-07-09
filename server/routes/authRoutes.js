import express from 'express';
import { register, login } from '../controllers/authController.js';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../middleware/validators.js';

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', registerValidation, validate, register);

// @route   POST /api/auth/login
router.post('/login', loginValidation, validate, login);

export default router;
