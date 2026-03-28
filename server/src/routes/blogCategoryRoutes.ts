import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from '../controllers/blogCategoryController';
import { getBlogsByCategory } from '../controllers/blogController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:slug/posts', getBlogsByCategory);
router.get('/:id', getCategoryById);

// Admin routes
router.post('/', protect, permit(PERMISSIONS.BLOG_CREATE), createCategory);
router.put('/:id', protect, permit(PERMISSIONS.BLOG_UPDATE), updateCategory);
router.patch('/:id/toggle-active', protect, permit(PERMISSIONS.BLOG_UPDATE), toggleCategoryStatus);
router.delete('/:id', protect, permit(PERMISSIONS.BLOG_DELETE), deleteCategory);

export default router;
