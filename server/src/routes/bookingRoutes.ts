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
import { bookingValidation } from '../middleware/validation';

const router = express.Router();

// Public route - anyone can submit a booking
router.post('/', bookingValidation, createBooking);

// Admin only routes
router.get('/stats', protect, permit(PERMISSIONS.BOOKING_READ), getBookingStats);
router.get('/', protect, permit(PERMISSIONS.BOOKING_READ), getAllBookings);
router.get('/:id', protect, permit(PERMISSIONS.BOOKING_READ), getBookingById);
router.patch('/:id', protect, permit(PERMISSIONS.BOOKING_UPDATE), updateBooking);
router.delete('/:id', protect, permit(PERMISSIONS.BOOKING_DELETE), deleteBooking);

export default router;

