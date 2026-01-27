import { Request, Response } from 'express';
import Review from '../models/Review';
import Tour from '../models/Tour';

// ==================== CONTROLLERS ====================

/**
 * @desc    Create new review
 * @route   POST /api/reviews
 * @access  Public
 */
export const createReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tourId, name, email, rating, comment, avatar } = req.body;

    // Check if tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
      return;
    }

    const review = await Review.create({
      tour: tourId,
      name,
      email,
      rating,
      comment,
      avatar,
      status: 'pending' // Default to pending
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      data: review
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create review',
      message: error.message
    });
  }
};

/**
 * @desc    Get reviews for a tour (Approved only)
 * @route   GET /api/reviews/tour/:tourId
 * @access  Public
 */
export const getReviewsByTour = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tourId } = req.params;

    const reviews = await Review.find({ 
      tour: tourId, 
      status: 'approved' 
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews',
      message: error.message
    });
  }
};

/**
 * @desc    Get all reviews (Admin)
 * @route   GET /api/reviews/admin
 * @access  Private/Admin
 */
export const getAllReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tourId, status } = req.query;
    
    const filter: any = {};
    if (tourId) filter.tour = tourId;
    if (status) filter.status = status;

    const reviews = await Review.find(filter)
      .populate('tour', 'heading')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error: any) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews',
      message: error.message
    });
  }
};

/**
 * @desc    Update review status
 * @route   PATCH /api/reviews/:id/status
 * @access  Private/Admin
 */
export const updateReviewStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
       res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
      return;
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) {
      res.status(404).json({
        success: false,
        error: 'Review not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Review ${status}`,
      data: review
    });
  } catch (error: any) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review status',
      message: error.message
    });
  }
};

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private/Admin
 */
export const deleteReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      res.status(404).json({
        success: false,
        error: 'Review not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete review',
      message: error.message
    });
  }
};
