import express from 'express';
import { getRates, updateRates } from '../controllers/currencyController';
import { permit, protect } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';

const router = express.Router();

/**
 * @route   GET /api/currency/rates
 * @desc    Get current exchange rates
 * @access  Public
 */
router.get('/rates', getRates);

/**
 * @route   PUT /api/currency/rates
 * @desc    Update exchange rates (Admin → Tour → Exchange Rates)
 * @access  Users who may edit tour prices (tour:update); superadmins always.
 *          The rates change every converted tour price on the site.
 */
router.put('/rates', protect, permit(PERMISSIONS.TOUR_UPDATE), updateRates);

export default router;
