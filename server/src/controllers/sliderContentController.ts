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
      data: sliderItems,
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
      underPromo,
      order,
      isActive = true,
    } = req.body;

    // Validation
    if (!subtitle?.en?.trim() || !title?.en?.trim() || !titleSpan?.en?.trim() || !titleEnd?.en?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'English Subtitle, title, titleSpan, and titleEnd are required',
      });
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

    // Create slider content
    const sliderContent = new SliderContent({
      subtitle,
      title,
      titleSpan,
      titleEnd,
      image,
      lineShape,
      button,
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

    const updatePayload: any = { ...updateData };
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

    const sliderItem = await SliderContent.findById(id);

    if (!sliderItem) {
      return res.status(404).json({
        success: false,
        message: 'Slider content not found',
      });
    }

    sliderItem.isActive = !sliderItem.isActive;
    await sliderItem.save();

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
