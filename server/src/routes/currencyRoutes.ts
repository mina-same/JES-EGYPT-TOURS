import express from 'express';
import { getRates, updateRates } from '../controllers/currencyController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/currency/rates
 * @desc    Get current exchange rates
 * @access  Public
 */
router.get('/rates', getRates);

/**
 * @route   PUT /api/currency/rates
 * @desc    Update exchange rates
 * @access  Private/Admin
 */
router.put('/rates', protect, updateRates);

export default router;
