import express from 'express';
import {
  createReview,
  getReviewsByTour,
  getAllReviews,
  updateReviewStatus,
  deleteReview
} from '../controllers/reviewController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Create new review
 * @access  Public
 */
router.post('/', createReview);

/**
 * @route   GET /api/reviews/tour/:tourId
 * @desc    Get reviews for a tour (Approved only)
 * @access  Public
 */
router.get('/tour/:tourId', getReviewsByTour);

/**
 * @route   GET /api/reviews/admin
 * @desc    Get all reviews (Admin)
 * @access  Private/Admin
 * @query   ?tourId=xxx&status=pending
 */
router.get('/admin', protect, permit(PERMISSIONS.REVIEW_READ), getAllReviews);

/**
 * @route   PATCH /api/reviews/:id/status
 * @desc    Update review status
 * @access  Private/Admin
 */
router.patch('/:id/status', protect, permit(PERMISSIONS.REVIEW_UPDATE), updateReviewStatus);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private/Admin
 */
router.delete('/:id', protect, permit(PERMISSIONS.REVIEW_DELETE), deleteReview);

export default router;
