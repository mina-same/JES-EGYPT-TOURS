import { Request, Response } from 'express';
import CurrencyConfig from '../models/CurrencyConfig';

/**
 * Get current exchange rates (Public)
 * GET /api/currency/rates
 */
export const getRates = async (_req: Request, res: Response) => {
  try {
    let config = await CurrencyConfig.findOne();
    if (!config) {
      // Create default config if none exists
      config = await CurrencyConfig.create({
        baseCurrency: 'USD',
        rates: {
          EUR: 0.92,
          GBP: 0.79,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        baseCurrency: config.baseCurrency,
        rates: {
          USD: 1,
          EUR: config.rates.EUR,
          GBP: config.rates.GBP,
        },
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update exchange rates (Admin only)
 * PUT /api/currency/rates
 */
export const updateRates = async (req: Request, res: Response) => {
  try {
    const { EUR, GBP } = req.body;

    if (!EUR || !GBP) {
      return res.status(400).json({
        success: false,
        message: 'Both EUR and GBP rates are required',
      });
    }

    if (typeof EUR !== 'number' || typeof GBP !== 'number' || EUR <= 0 || GBP <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Rates must be positive numbers',
      });
    }

    let config = await CurrencyConfig.findOne();
    if (!config) {
      config = await CurrencyConfig.create({
        baseCurrency: 'USD',
        rates: { EUR, GBP },
      });
    } else {
      config.rates.EUR = EUR;
      config.rates.GBP = GBP;
      await config.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Exchange rates updated successfully',
      data: {
        baseCurrency: config.baseCurrency,
        rates: {
          USD: 1,
          EUR: config.rates.EUR,
          GBP: config.rates.GBP,
        },
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating currency rates:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
