import { localizePreservingSlugs } from '../utils/localize';
import { Request, Response } from 'express';
import SliderContent from '../models/SliderContent';
import { FilterQuery } from 'mongoose';
import { ISliderContent } from '../models/SliderContent';

// ==================== INTERFACES ====================

interface QueryParams {
  isActive?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

// ==================== NORMALIZATION HELPERS ====================

const SLIDER_LOCALES = ['en', 'de', 'it', 'es'] as const;

/** Trims every language and removes stray spaces before punctuation
 *  (e.g. "You , Your Guide" → "You, Your Guide") so admin-entered text can
 *  never break the hero title's spacing. */
const normalizeLocalizedText = (value: any): any => {
  if (!value || typeof value !== 'object') return value;
  const out: any = { ...value };
  for (const l of SLIDER_LOCALES) {
    if (typeof out[l] === 'string') {
      out[l] = out[l].replace(/\s+([,.;:!?…])/g, '$1').trim();
    }
  }
  return out;
};

/** Optional localized fields (titleSpan/titleEnd): store as ABSENT when the
 *  English text is empty, instead of failing the schema's "English version is
 *  required" on an empty string. */
const emptyLocalizedToUndefined = (value: any): any =>
  value && typeof value === 'object' && typeof value.en === 'string' && value.en.trim()
    ? value
    : undefined;

/** Button link: accepts the localized { en, de, it, es } object or a legacy
 *  plain string (treated as the English link). */
const normalizeButtonLink = (link: any): { en: string; de: string; it: string; es: string } => {
  if (typeof link === 'string') {
    return { en: link.trim(), de: '', it: '', es: '' };
  }
  const clean = (v: any) => (typeof v === 'string' ? v.trim() : '');
  return { en: clean(link?.en), de: clean(link?.de), it: clean(link?.it), es: clean(link?.es) };
};

/** Normalizes a full button payload (text + localized link + direction). */
const normalizeButton = (button: any) => ({
  text: normalizeLocalizedText(button?.text),
  link: normalizeButtonLink(button?.link),
  linkDirection: button?.linkDirection === '_blank' ? '_blank' : '_self',
});

// ==================== PUBLIC ENDPOINTS ====================

/**
 * GET /api/slider-content
 * Get all active slider content for public display
 */
export const getActiveSliderContent = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', sort = 'order' } = req.query as QueryParams;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    let sortObj: any = {};
    if (sort === 'order') {
      sortObj = { order: 1 };
    } else if (sort === '-order') {
      sortObj = { order: -1 };
    } else if (sort === 'createdAt') {
      sortObj = { createdAt: -1 };
    }

    const filter: FilterQuery<ISliderContent> = { isActive: true };

    const sliderItems = await SliderContent.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await SliderContent.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: localizePreservingSlugs(sliderItems, req.locale),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching slider content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slider content',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/slider-content
 * Get all slider content (including inactive) for admin
 */
export const getAllSliderContent = async (req: Request, res: Response) => {
  try {
    const { isActive, page = '1', limit = '10', sort = 'order' } = req.query as QueryParams;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    let sortObj: any = {};
    if (sort === 'order') {
      sortObj = { order: 1 };
    } else if (sort === '-order') {
      sortObj = { order: -1 };
    } else if (sort === 'createdAt') {
      sortObj = { createdAt: -1 };
    }

    // Build filter
    const filter: FilterQuery<ISliderContent> = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const sliderItems = await SliderContent.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await SliderContent.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: sliderItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching all slider content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slider content',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/admin/slider-content/:id
 * Get single slider content by ID
 */
export const getSliderContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slider content ID',
      });
    }

    const sliderItem = await SliderContent.findById(id);

    if (!sliderItem) {
      return res.status(404).json({
        success: false,
        message: 'Slider content not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: sliderItem,
    });
  } catch (error) {
    console.error('Error fetching slider content by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch slider content',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/admin/slider-content
 * Create new slider content
 */
export const createSliderContent = async (req: Request, res: Response) => {
  try {
    const {
      subtitle,
      title,
      titleSpan,
      titleEnd,
      image,
      lineShape,
      button,
      buttonSecondary,
      underPromo,
      order,
      isActive = true,
    } = req.body;

    // Validation — only subtitle + title are required; titleSpan (gold
    // highlight) and titleEnd are optional parts of the heading.
    if (!subtitle?.en?.trim() || !title?.en?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'English Subtitle and Title are required',
      });
    }

    if (button !== undefined && button !== null) {
      if (!button.text?.en?.trim() || !normalizeButtonLink(button.link).en) {
        return res.status(400).json({
          success: false,
          message: 'English Button text and link are required when the button is enabled',
        });
      }
    }

    if (buttonSecondary !== undefined && buttonSecondary !== null) {
      if (!buttonSecondary.text?.en?.trim() || !normalizeButtonLink(buttonSecondary.link).en) {
        return res.status(400).json({
          success: false,
          message: 'English Secondary Button text and link are required when it is enabled',
        });
      }
    }

    if (!image || !image.url || !image.fileName) {
      return res.status(400).json({
        success: false,
        message: 'Image with URL and fileName is required',
      });
    }

    if (order === undefined || order < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid order is required (minimum 0)',
      });
    }

    if (underPromo !== undefined && underPromo !== null) {
      if (!underPromo.text?.en?.trim() || !underPromo.linkText?.en?.trim() || !underPromo.link) {
        return res.status(400).json({
          success: false,
          message: 'English Promo text, linkText, and a link are required when underPromo is provided',
        });
      }
    }

    // Create slider content (normalized: trimmed text, no stray spaces
    // before punctuation, optional heading parts stored as absent).
    const sliderContent = new SliderContent({
      subtitle: normalizeLocalizedText(subtitle),
      title: normalizeLocalizedText(title),
      titleSpan: emptyLocalizedToUndefined(normalizeLocalizedText(titleSpan)),
      titleEnd: emptyLocalizedToUndefined(normalizeLocalizedText(titleEnd)),
      image,
      lineShape,
      button: button === undefined || button === null ? undefined : normalizeButton(button),
      buttonSecondary:
        buttonSecondary === undefined || buttonSecondary === null
          ? undefined
          : normalizeButton(buttonSecondary),
      underPromo: underPromo === null ? undefined : underPromo,
      order,
      isActive,
    });

    await sliderContent.save();

    return res.status(201).json({
      success: true,
      message: 'Slider content created successfully',
      data: sliderContent,
    });
  } catch (error) {
    console.error('Error creating slider content:', error);
    
    // Handle duplicate key error (unique order)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(400).json({
        success: false,
        message: 'Order value must be unique',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create slider content',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/admin/slider-content/:id
 * Update slider content
 */
export const updateSliderContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slider content ID',
      });
    }

    // Validate order if provided
    if (updateData.order !== undefined && (updateData.order < 0 || isNaN(updateData.order))) {
      return res.status(400).json({
        success: false,
        message: 'Valid order is required (minimum 0)',
      });
    }

    if (updateData.underPromo !== undefined && updateData.underPromo !== null) {
      if (!updateData.underPromo.text?.en?.trim() || !updateData.underPromo.linkText?.en?.trim() || !updateData.underPromo.link) {
        return res.status(400).json({
          success: false,
          message: 'English Promo text, linkText, and a link are required when underPromo is provided',
        });
      }
    }

    if (updateData.button !== undefined && updateData.button !== null) {
      if (!updateData.button.text?.en?.trim() || !normalizeButtonLink(updateData.button.link).en) {
        return res.status(400).json({
          success: false,
          message: 'English Button text and link are required when the button is enabled',
        });
      }
    }

    if (updateData.buttonSecondary !== undefined && updateData.buttonSecondary !== null) {
      if (
        !updateData.buttonSecondary.text?.en?.trim() ||
        !normalizeButtonLink(updateData.buttonSecondary.link).en
      ) {
        return res.status(400).json({
          success: false,
          message: 'English Secondary Button text and link are required when it is enabled',
        });
      }
    }

    const updatePayload: any = { ...updateData };

    // Normalize heading text (trim + no stray spaces before punctuation).
    for (const field of ['subtitle', 'title', 'titleSpan', 'titleEnd']) {
      if (updatePayload[field] !== undefined) {
        updatePayload[field] = normalizeLocalizedText(updatePayload[field]);
      }
    }

    // Optional heading parts: when cleared in the admin, remove them from the
    // document instead of saving an empty-English object (schema rejects it).
    for (const field of ['titleSpan', 'titleEnd']) {
      if (updatePayload[field] !== undefined && !emptyLocalizedToUndefined(updatePayload[field])) {
        delete updatePayload[field];
        updatePayload.$unset = { ...(updatePayload.$unset || {}), [field]: 1 };
      }
    }

    // Buttons: explicit null = "disabled" → actually remove them (previously
    // a dropped key silently kept the old button in the document).
    for (const field of ['button', 'buttonSecondary'] as const) {
      if (updateData[field] === null) {
        delete updatePayload[field];
        updatePayload.$unset = { ...(updatePayload.$unset || {}), [field]: 1 };
      } else if (updateData[field] !== undefined) {
        updatePayload[field] = normalizeButton(updateData[field]);
      }
    }

    if (updateData.underPromo === null) {
      delete updatePayload.underPromo;
      updatePayload.$unset = { ...(updatePayload.$unset || {}), underPromo: 1 };
    }

    const sliderItem = await SliderContent.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!sliderItem) {
      return res.status(404).json({
        success: false,
        message: 'Slider content not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Slider content updated successfully',
      data: sliderItem,
    });
  } catch (error) {
    console.error('Error updating slider content:', error);
    
    // Handle duplicate key error (unique order)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(400).json({
        success: false,
        message: 'Order value must be unique',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update slider content',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * DELETE /api/admin/slider-content/:id
 * Delete slider content
 */
export const deleteSliderContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slider content ID',
      });
    }

    const sliderItem = await SliderContent.findByIdAndDelete(id);

    if (!sliderItem) {
      return res.status(404).json({
        success: false,
        message: 'Slider content not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Slider content deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting slider content:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete slider content',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/admin/slider-content/:id/toggle-active
 * Toggle active status of slider content
 */
export const toggleSliderContentActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slider content ID',
      });
    }

    // Flip ONLY isActive with a targeted update. Loading the doc and calling
    // save() re-validates the WHOLE document, which fails for legacy items
    // (e.g. an old plain-string button.link predating the localized schema)
    // even though the status change itself is valid.
    const current = await SliderContent.findById(id).select('isActive').lean();

    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Slider content not found',
      });
    }

    const sliderItem = await SliderContent.findByIdAndUpdate(
      id,
      { $set: { isActive: !current.isActive } },
      { new: true }
    ).lean();

    if (!sliderItem) {
      return res.status(404).json({
        success: false,
        message: 'Slider content not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Slider content ${sliderItem.isActive ? 'activated' : 'deactivated'} successfully`,
      data: sliderItem,
    });
  } catch (error) {
    console.error('Error toggling slider content active status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle slider content status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
