import express from 'express';
import * as resolveController from '../controllers/resolveController';

const router = express.Router();

/**
 * @route   GET /api/resolve/:slug
 * @desc    Resolve a slug to { type, id, canonicalSlug }
 * @access  Public
 */
router.get('/:slug', resolveController.resolveSlug);

export default router;
