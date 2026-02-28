import { Router } from 'express';
import {
  getAllFaqs,
  getHomeFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqCategories
} from '../controllers/faqController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllFaqs);
router.get('/home', getHomeFaqs);
router.get('/categories', getFaqCategories);
router.get('/:id', getFaqById);

// Admin routes (protected)
router.post('/', protect, authorize('admin', 'superadmin'), createFaq);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateFaq);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteFaq);

export default router;
