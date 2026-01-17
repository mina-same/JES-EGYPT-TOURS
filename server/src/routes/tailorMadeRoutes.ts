import express from 'express';
import {
  createTailorMadeRequest,
  getAllTailorMadeRequests,
  getTailorMadeRequestById,
  updateTailorMadeRequest,
  deleteTailorMadeRequest,
  getTailorMadeStats,
} from '../controllers/tailorMadeController';
import { protect, authorize } from '../middleware/auth';
import { tailorMadeRequestValidation } from '../middleware/validation';

const router = express.Router();

// Public route - anyone can submit a tailor-made request
router.post('/', tailorMadeRequestValidation, createTailorMadeRequest);

// Admin only routes
router.get('/stats', protect, authorize('admin'), getTailorMadeStats);
router.get('/', protect, authorize('admin'), getAllTailorMadeRequests);
router.get('/:id', protect, authorize('admin'), getTailorMadeRequestById);
router.patch('/:id', protect, authorize('admin'), updateTailorMadeRequest);
router.delete('/:id', protect, authorize('admin'), deleteTailorMadeRequest);

export default router;
