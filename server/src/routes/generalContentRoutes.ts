import express from 'express';
import * as generalContentController from '../controllers/generalContentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/:slug', generalContentController.getContentBySlug);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.get('/admin/list', generalContentController.getAllContent);
router.post('/', generalContentController.upsertContent);
router.patch('/:slug/toggle-active', generalContentController.toggleActive);
router.delete('/:slug', generalContentController.deleteContent);

export default router;
