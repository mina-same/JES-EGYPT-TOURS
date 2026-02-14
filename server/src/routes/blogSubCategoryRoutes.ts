import express from 'express';
import {
  getAllSubcategories,
  getSubcategoriesByCategory,
  getSubcategoryById,
  getSubcategoryBySlug,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryStatus,
} from '../controllers/blogSubCategoryController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';

const router = express.Router();

// Public routes
router.get('/', getAllSubcategories);
// Use 'categories' to match consistency with other APIs if preferred, or 'category' to match param name.
// Tour routes use: /categories/:categoryId/subcategories in the main file, but here we are in a sub-router.
// If mounted at /api/blog/subcategories:
// GET /api/blog/subcategories/category/:categoryId
router.get('/category/:categoryId', getSubcategoriesByCategory);
router.get('/slug/:slug', getSubcategoryBySlug);
router.get('/:id', getSubcategoryById);

// Admin routes
router.post('/', protect, permit(PERMISSIONS.BLOG_CREATE), createSubcategory);
router.put('/:id', protect, permit(PERMISSIONS.BLOG_UPDATE), updateSubcategory);
router.patch('/:id/toggle-active', protect, permit(PERMISSIONS.BLOG_UPDATE), toggleSubcategoryStatus);
router.delete('/:id', protect, permit(PERMISSIONS.BLOG_DELETE), deleteSubcategory);

export default router;
