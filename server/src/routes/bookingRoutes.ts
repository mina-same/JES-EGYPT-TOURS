import express from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingStats,
} from '../controllers/bookingController';
import { protect, authorize } from '../middleware/auth';
import { bookingValidation } from '../middleware/validation';

const router = express.Router();

// Public route - anyone can submit a booking
router.post('/', bookingValidation, createBooking);

// Admin only routes
router.get('/stats', protect, authorize('admin'), getBookingStats);
router.get('/', protect, authorize('admin'), getAllBookings);
router.get('/:id', protect, authorize('admin'), getBookingById);
router.patch('/:id', protect, authorize('admin'), updateBooking);
router.delete('/:id', protect, authorize('admin'), deleteBooking);

export default router;

