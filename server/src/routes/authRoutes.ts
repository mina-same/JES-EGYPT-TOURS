import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
} from '../controllers/authController';
import { protect, authorize } from '../middleware/auth';
import { registerValidation, loginValidation } from '../middleware/validation';

const router = express.Router();

// Public routes
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Admin only routes
router.post('/register', protect, authorize('superadmin'), registerValidation, register);

export default router;
