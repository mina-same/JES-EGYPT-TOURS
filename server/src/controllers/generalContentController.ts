import { Request, Response } from 'express';
import GeneralContent from '../models/GeneralContent';

/**
 * Get all content blocks (Admin)
 * GET /api/general-content/admin/list
 */
export const getAllContent = async (_req: Request, res: Response) => {
  try {
    const content = await GeneralContent.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error fetching all general content:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get content by slug
 * GET /api/general-content/:slug
 */
export const getContentBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    // For admin, we might want inactive ones too, but usually public only needs active
    // We'll allow finding inactive if it's potentially an admin request in the future
    const content = await GeneralContent.findOne({ slug });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error fetching general content:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Create or update content (Admin)
 * POST /api/general-content
 */
export const upsertContent = async (req: Request, res: Response) => {
  try {
    const { slug, title, subtitle, content, isActive } = req.body;

    const updatedContent = await GeneralContent.findOneAndUpdate(
      { slug },
      { title, subtitle, content, isActive },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedContent,
    });
  } catch (error) {
    console.error('Error upserting general content:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Toggle active status (Admin)
 */
export const toggleActive = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const content = await GeneralContent.findOne({ slug });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    content.isActive = !content.isActive;
    await content.save();

    return res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error toggling general content status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete content (Admin)
 */
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await GeneralContent.findOneAndDelete({ slug });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting general content:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
