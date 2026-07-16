import { Request, Response } from 'express';
import SliderPromoConfig from '../models/SliderPromoConfig';

const GLOBAL_KEY = 'global' as const;

type UnderPromoPayload = {
  text: any;
  linkText: any;
  /** Localized { en, de, it, es } object; legacy clients may send a string. */
  link: any;
  linkDirection?: '_blank' | '_self';
  /** false = disabled (kept in the admin, hidden from visitors). */
  isActive?: boolean;
};

/** Normalizes the link payload: a legacy plain string becomes the English
 *  link; object values are trimmed. */
const normalizeLink = (link: any): { en: string; de: string; it: string; es: string } => {
  if (typeof link === 'string') {
    return { en: link.trim(), de: '', it: '', es: '' };
  }
  const clean = (v: any) => (typeof v === 'string' ? v.trim() : '');
  return {
    en: clean(link?.en),
    de: clean(link?.de),
    it: clean(link?.it),
    es: clean(link?.es),
  };
};

export const getSliderPromoPublic = async (_req: Request, res: Response) => {
  try {
    const doc = await SliderPromoConfig.findOne({ key: GLOBAL_KEY }).lean();
    const promo = doc?.underPromo ?? null;

    return res.status(200).json({
      success: true,
      // A disabled promo stays stored for the admin but is invisible to
      // visitors (legacy documents without the flag count as active).
      data: promo && promo.isActive === false ? null : promo,
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

    const link = normalizeLink(underPromo?.link);

    if (!underPromo?.text?.en?.trim() || !underPromo?.linkText?.en?.trim() || !link.en) {
      return res.status(400).json({
        success: false,
        message: 'English Promo text, linkText, and link are required',
      });
    }

    const payload = {
      text: underPromo.text,
      linkText: underPromo.linkText,
      link,
      linkDirection: underPromo.linkDirection === '_blank' ? '_blank' : '_self',
      // Default active; only an explicit false disables it.
      isActive: underPromo.isActive !== false,
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
