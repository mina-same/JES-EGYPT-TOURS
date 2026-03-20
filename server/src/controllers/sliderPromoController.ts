import { Request, Response } from 'express';
import SliderPromoConfig from '../models/SliderPromoConfig';

const GLOBAL_KEY = 'global' as const;

type UnderPromoPayload = {
  text: any;
  linkText: any;
  link: string;
  linkDirection?: '_blank' | '_self';
};

export const getSliderPromoPublic = async (_req: Request, res: Response) => {
  try {
    const doc = await SliderPromoConfig.findOne({ key: GLOBAL_KEY }).lean();

    return res.status(200).json({
      success: true,
      data: doc?.underPromo ?? null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch slider promo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getSliderPromoAdmin = async (_req: Request, res: Response) => {
  try {
    const doc = await SliderPromoConfig.findOne({ key: GLOBAL_KEY }).lean();

    return res.status(200).json({
      success: true,
      data: doc?.underPromo ?? null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch slider promo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const upsertSliderPromoAdmin = async (req: Request, res: Response) => {
  try {
    const underPromo = (req.body?.underPromo ?? null) as UnderPromoPayload | null;

    if (underPromo === null) {
      const updated = await SliderPromoConfig.findOneAndUpdate(
        { key: GLOBAL_KEY },
        { $unset: { underPromo: 1 } },
        { new: true, upsert: true }
      ).lean();

      return res.status(200).json({
        success: true,
        message: 'Slider promo cleared',
        data: updated?.underPromo ?? null,
      });
    }

    if (!underPromo?.text?.en?.trim() || !underPromo?.linkText?.en?.trim() || !underPromo?.link) {
      return res.status(400).json({
        success: false,
        message: 'English Promo text, linkText, and link are required',
      });
    }

    const payload = {
      text: underPromo.text,
      linkText: underPromo.linkText,
      link: underPromo.link,
      linkDirection: underPromo.linkDirection === '_blank' ? '_blank' : '_self',
    };

    const updated = await SliderPromoConfig.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $set: { underPromo: payload, key: GLOBAL_KEY } },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: 'Slider promo updated',
      data: updated?.underPromo ?? null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update slider promo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const clearSliderPromoAdmin = async (_req: Request, res: Response) => {
  try {
    const updated = await SliderPromoConfig.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $unset: { underPromo: 1 } },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: 'Slider promo cleared',
      data: updated?.underPromo ?? null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to clear slider promo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
