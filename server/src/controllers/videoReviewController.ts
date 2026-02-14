import { Request, Response } from 'express';
import VideoReview from '../models/VideoReview';

// @desc    Get all active video reviews
// @route   GET /api/video-reviews
// @access  Public
export const getVideoReviews = async (_req: Request, res: Response) => {
  try {
    const reviews = await VideoReview.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all video reviews (Admin)
// @route   GET /api/video-reviews/admin
// @access  Private/Admin
export const getAllVideoReviewsAdmin = async (_req: Request, res: Response) => {
  try {
    const reviews = await VideoReview.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create/Upsert video review
// @route   POST /api/video-reviews
// @access  Private/Admin
export const upsertVideoReview = async (req: Request, res: Response) => {
  try {
    const { id, title, url, tourName, isActive, order } = req.body;

    // Helper to extract Video ID
    const getYouTubeVideoId = (url: string): string => {
      if (!url) return '';
      const trimmed = url.trim();
      const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
      if (shortMatch?.[1]) return shortMatch[1];
      const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
      if (watchMatch?.[1]) return watchMatch[1];
      const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
      if (embedMatch?.[1]) return embedMatch[1];
      const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
      if (shortsMatch?.[1]) return shortsMatch[1];
      return '';
    };

    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      });
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    let review;
    if (id) {
      review = await VideoReview.findByIdAndUpdate(
        id,
        { title, url, videoId, tourName, thumbnail, isActive, order },
        { new: true, runValidators: true }
      );
    } else {
      review = await VideoReview.create({
        title, url, videoId, tourName, thumbnail, isActive, order
      });
    }

    return res.status(review ? 200 : 201).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete video review
// @route   DELETE /api/video-reviews/:id
// @access  Private/Admin
export const deleteVideoReview = async (req: Request, res: Response) => {
  try {
    const review = await VideoReview.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Video review not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Video review removed'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle active status
// @route   PATCH /api/video-reviews/toggle/:id
// @access  Private/Admin
export const toggleVideoReviewStatus = async (req: Request, res: Response) => {
  try {
    const review = await VideoReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Video review not found'
      });
    }
    review.isActive = !review.isActive;
    await review.save();
    return res.status(200).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
