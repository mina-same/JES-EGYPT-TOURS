import express from 'express';
import { 
  getVideoReviews, 
  getAllVideoReviewsAdmin, 
  upsertVideoReview, 
  deleteVideoReview, 
  toggleVideoReviewStatus 
} from '../controllers/videoReviewController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getVideoReviews);

// Admin routes
router.get('/admin/list', protect, authorize('admin'), getAllVideoReviewsAdmin);
router.post('/', protect, authorize('admin'), upsertVideoReview);
router.patch('/toggle/:id', protect, authorize('admin'), toggleVideoReviewStatus);
router.delete('/:id', protect, authorize('admin'), deleteVideoReview);

export default router;
