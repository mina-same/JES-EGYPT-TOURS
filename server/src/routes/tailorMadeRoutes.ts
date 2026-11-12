import { publicSubmissionKeyValidation } from '../middleware/validation';
import { createBookingSubmissionLimiter } from '../middleware/bookingRateLimit';
import { createHoneypotGuard } from '../middleware/bookingHoneypot';
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
const submissionLimiter = createBookingSubmissionLimiter({
  rejection: { code: 'TAILOR_MADE_RATE_LIMITED', error: 'Too many tailor-made requests. Please wait before trying again.' },
});
// The tour booking form's spam trap (the form's hidden "website" field), in
// the same place: counted by the limiter, ahead of every other check.
const honeypotGuard = createHoneypotGuard({
  code: 'INVALID_TAILOR_MADE_REQUEST',
  error: 'Unable to process tailor-made request.',
});

// Public route - anyone can submit a tailor-made request
router.post('/', submissionLimiter, honeypotGuard, publicSubmissionKeyValidation, tailorMadeRequestValidation, createTailorMadeRequest);

// Admin only routes
router.get('/stats', protect, permit(PERMISSIONS.TAILOR_MADE_READ), getTailorMadeStats);
router.get('/', protect, permit(PERMISSIONS.TAILOR_MADE_READ), getAllTailorMadeRequests);
router.get('/:id', protect, permit(PERMISSIONS.TAILOR_MADE_READ), getTailorMadeRequestById);
router.patch('/:id', protect, permit(PERMISSIONS.TAILOR_MADE_UPDATE), updateTailorMadeRequest);
router.delete('/:id', protect, permit(PERMISSIONS.TAILOR_MADE_DELETE), deleteTailorMadeRequest);

export default router;
