import express from 'express';
import {
  getActiveSliderContent,
  getAllSliderContent,
  getSliderContentById,
  createSliderContent,
  updateSliderContent,
  deleteSliderContent,
  toggleSliderContentActive,
} from '../controllers/sliderContentController';
import {
  getSliderPromoPublic,
  getSliderPromoAdmin,
  upsertSliderPromoAdmin,
  clearSliderPromoAdmin,
} from '../controllers/sliderPromoController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/slider-content
 * Get all active slider content for public display
 * Query params: page, limit, sort
 */
router.get('/', getActiveSliderContent);

router.get('/promo', getSliderPromoPublic);

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/slider-content
 * Get all slider content (including inactive) for admin
 * Query params: isActive, page, limit, sort
 */
router.get('/admin/slider-content', protect, authorize('admin', 'superadmin'), getAllSliderContent);

router.get('/admin/promo', protect, authorize('admin', 'superadmin'), getSliderPromoAdmin);
router.put('/admin/promo', protect, authorize('admin', 'superadmin'), upsertSliderPromoAdmin);
router.delete('/admin/promo', protect, authorize('admin', 'superadmin'), clearSliderPromoAdmin);

/**
 * GET /api/admin/slider-content/:id
 * Get single slider content by ID
 */
router.get('/admin/slider-content/:id', protect, authorize('admin', 'superadmin'), getSliderContentById);

/**
 * POST /api/admin/slider-content
 * Create new slider content
 */
router.post('/admin/slider-content', protect, authorize('admin', 'superadmin'), createSliderContent);

/**
 * PUT /api/admin/slider-content/:id
 * Update slider content
 */
router.put('/admin/slider-content/:id', protect, authorize('admin', 'superadmin'), updateSliderContent);

/**
 * DELETE /api/admin/slider-content/:id
 * Delete slider content
 */
router.delete('/admin/slider-content/:id', protect, authorize('admin', 'superadmin'), deleteSliderContent);

/**
 * PUT /api/admin/slider-content/:id/toggle-active
 * Toggle active status of slider content
 */
router.put('/admin/slider-content/:id/toggle-active', protect, authorize('admin', 'superadmin'), toggleSliderContentActive);

export default router;
