import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from '../controllers/tourCategoryController';
import {
  getAllSubcategories,
  getSubcategoriesByCategory,
  getSubcategoryById,
  getSubcategoryBySlug,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryStatus,
} from '../controllers/tourSubcategoryController';
import {
  getAllTours,
  getFeaturedTours,
  getPopularTours,
  getToursBySubcategory,
  getTourById,
  getTourBySlug,
  getTourByExternalId,
  getRelatedTours,
  createTour,
  updateTour,
  deleteTour,
  toggleTourStatus,
  toggleTourFeatured,
  getTourStats,
} from '../controllers/tourController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// ==================== CATEGORY ROUTES ====================

/**
 * @route   GET /api/tours/categories
 * @desc    Get all tour categories with pagination and filtering
 * @access  Public
 * @query   ?isActive=true&search=adventure&page=1&limit=10&sort=name
 */
router.get('/categories', getAllCategories);

/**
 * @route   GET /api/tours/categories/slug/:slug
 * @desc    Get single tour category by slug
 * @access  Public
 */
router.get('/categories/slug/:slug', getCategoryBySlug);

/**
 * @route   GET /api/tours/categories/:id
 * @desc    Get single tour category by ID
 * @access  Public
 */
router.get('/categories/:id', getCategoryById);

/**
 * @route   POST /api/tours/categories
 * @desc    Create new tour category
 * @access  Private/Admin
 */
router.post('/categories', protect, authorize('admin'), createCategory);

/**
 * @route   PUT /api/tours/categories/:id
 * @desc    Update tour category
 * @access  Private/Admin
 */
router.put('/categories/:id', protect, authorize('admin'), updateCategory);

/**
 * @route   PATCH /api/tours/categories/:id/toggle-active
 * @desc    Toggle category active status
 * @access  Private/Admin
 */
router.patch('/categories/:id/toggle-active', protect, authorize('admin'), toggleCategoryStatus);

/**
 * @route   DELETE /api/tours/categories/:id
 * @desc    Delete tour category
 * @access  Private/Admin
 */
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

// ==================== SUBCATEGORY ROUTES ====================

/**
 * @route   GET /api/tours/subcategories
 * @desc    Get all tour subcategories with pagination and filtering
 * @access  Public
 * @query   ?category=categoryId&isActive=true&search=safari&page=1&limit=10&sort=name
 */
router.get('/subcategories', getAllSubcategories);

/**
 * @route   GET /api/tours/categories/:categoryId/subcategories
 * @desc    Get subcategories by category ID
 * @access  Public
 * @query   ?isActive=true
 */
router.get('/categories/:categoryId/subcategories', getSubcategoriesByCategory);

/**
 * @route   GET /api/tours/subcategories/slug/:slug
 * @desc    Get single tour subcategory by slug
 * @access  Public
 * @query   ?category=categoryId (optional, for uniqueness)
 */
router.get('/subcategories/slug/:slug', getSubcategoryBySlug);

/**
 * @route   GET /api/tours/subcategories/:id
 * @desc    Get single tour subcategory by ID
 * @access  Public
 */
router.get('/subcategories/:id', getSubcategoryById);

/**
 * @route   POST /api/tours/subcategories
 * @desc    Create new tour subcategory
 * @access  Private/Admin
 */
router.post('/subcategories', protect, authorize('admin'), createSubcategory);

/**
 * @route   PUT /api/tours/subcategories/:id
 * @desc    Update tour subcategory
 * @access  Private/Admin
 */
router.put('/subcategories/:id', protect, authorize('admin'), updateSubcategory);

/**
 * @route   PATCH /api/tours/subcategories/:id/toggle-active
 * @desc    Toggle subcategory active status
 * @access  Private/Admin
 */
router.patch('/subcategories/:id/toggle-active', protect, authorize('admin'), toggleSubcategoryStatus);

/**
 * @route   DELETE /api/tours/subcategories/:id
 * @desc    Delete tour subcategory
 * @access  Private/Admin
 */
router.delete('/subcategories/:id', protect, authorize('admin'), deleteSubcategory);

// ==================== TOUR ROUTES ====================

/**
 * @route   GET /api/tours/stats
 * @desc    Get tour statistics
 * @access  Private/Admin
 */
router.get('/stats', protect, authorize('admin'), getTourStats);

/**
 * @route   GET /api/tours/featured
 * @desc    Get featured tours
 * @access  Public
 * @query   ?limit=6
 */
router.get('/featured', getFeaturedTours);

/**
 * @route   GET /api/tours/popular
 * @desc    Get popular tours (by view count)
 * @access  Public
 * @query   ?limit=10
 */
router.get('/popular', getPopularTours);

/**
 * @route   GET /api/tours/slug/:slug
 * @desc    Get single tour by slug (increments view count)
 * @access  Public
 */
router.get('/slug/:slug', getTourBySlug);

/**
 * @route   GET /api/tours/external/:idExternal
 * @desc    Get tour by external ID
 * @access  Public
 */
router.get('/external/:idExternal', getTourByExternalId);

/**
 * @route   GET /api/tours/:id/related
 * @desc    Get related tours
 * @access  Public
 * @query   ?limit=4
 */
router.get('/:id/related', getRelatedTours);

/**
 * @route   GET /api/tours/subcategories/:subcategoryId/tours
 * @desc    Get tours by subcategory
 * @access  Public
 * @query   ?isActive=true&page=1&limit=10
 */
router.get('/subcategories/:subcategoryId/tours', getToursBySubcategory);

/**
 * @route   GET /api/tours
 * @desc    Get all tours with advanced filtering, pagination, and sorting
 * @access  Public
 * @query   ?subcategory=id&category=id&isActive=true&isFeatured=true&search=dubai
 *          &minPrice=100&maxPrice=500&tourType=private&tourStyle=luxury
 *          &page=1&limit=10&sort=-createdAt&fields=heading,slug,images
 */
router.get('/', getAllTours);

/**
 * @route   GET /api/tours/:id
 * @desc    Get single tour by ID
 * @access  Public
 */
router.get('/:id', getTourById);

/**
 * @route   POST /api/tours
 * @desc    Create new tour
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), createTour);

/**
 * @route   PUT /api/tours/:id
 * @desc    Update tour
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), updateTour);

/**
 * @route   PATCH /api/tours/:id/toggle-active
 * @desc    Toggle tour active status
 * @access  Private/Admin
 */
router.patch('/:id/toggle-active', protect, authorize('admin'), toggleTourStatus);

/**
 * @route   PATCH /api/tours/:id/toggle-featured
 * @desc    Toggle tour featured status
 * @access  Private/Admin
 */
router.patch('/:id/toggle-featured', protect, authorize('admin'), toggleTourFeatured);

/**
 * @route   DELETE /api/tours/:id
 * @desc    Delete tour
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), deleteTour);

export default router;
