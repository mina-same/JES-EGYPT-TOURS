import express from 'express';
import {
  createTailorMadeRequest,
  getAllTailorMadeRequests,
  getTailorMadeRequestById,
  updateTailorMadeRequest,
  deleteTailorMadeRequest,
  getTailorMadeStats,
} from '../controllers/tailorMadeController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';
import { tailorMadeRequestValidation } from '../middleware/validation';

const router = express.Router();

// Public route - anyone can submit a tailor-made request
router.post('/', tailorMadeRequestValidation, createTailorMadeRequest);

// Admin only routes
router.get('/stats', protect, permit(PERMISSIONS.TAILOR_MADE_READ), getTailorMadeStats);
router.get('/', protect, permit(PERMISSIONS.TAILOR_MADE_READ), getAllTailorMadeRequests);
router.get('/:id', protect, permit(PERMISSIONS.TAILOR_MADE_READ), getTailorMadeRequestById);
router.patch('/:id', protect, permit(PERMISSIONS.TAILOR_MADE_UPDATE), updateTailorMadeRequest);
router.delete('/:id', protect, permit(PERMISSIONS.TAILOR_MADE_DELETE), deleteTailorMadeRequest);

export default router;
