import express from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingStats,
} from '../controllers/bookingController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';
import {
  bookingIdempotencyValidation,
  bookingValidation,
} from '../middleware/validation';
import { bookingSubmissionLimiter } from '../middleware/bookingRateLimit';
import { bookingHoneypotGuard } from '../middleware/bookingHoneypot';

const router = express.Router();

// Public route - anyone can submit a booking
router.post(
  '/',
  bookingSubmissionLimiter,
  bookingHoneypotGuard,
  bookingIdempotencyValidation,
  bookingValidation,
  createBooking
);

// Admin only routes
router.get('/stats', protect, permit(PERMISSIONS.BOOKING_READ), getBookingStats);
router.get('/', protect, permit(PERMISSIONS.BOOKING_READ), getAllBookings);
router.get('/:id', protect, permit(PERMISSIONS.BOOKING_READ), getBookingById);
router.patch('/:id', protect, permit(PERMISSIONS.BOOKING_UPDATE), updateBooking);
router.delete('/:id', protect, permit(PERMISSIONS.BOOKING_DELETE), deleteBooking);

export default router;

