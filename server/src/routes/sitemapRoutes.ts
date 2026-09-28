import express from 'express';
import { getSitemapData } from '../controllers/sitemapController';

const router = express.Router();

/**
 * @route   GET /api/sitemap
 * @desc    Slugs, dates and indexing flags of every visible page family
 * @access  Public
 */
router.get('/', getSitemapData);

export default router;
