import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import TailorMadeRequest from '../models/TailorMadeRequest';
import Notification from '../models/Notification';
import { emitAdminNotification, emitDashboardStatsUpdate } from '../realtime/socket';
import { createSearchRegex } from '../utils/search';

/**
 * @desc    Create a new tailor-made travel request
 * @route   POST /api/tailor-made
 * @access  Public
 */
export const createTailorMadeRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        errors: errors.array(),
      });
      return;
    }

    // Create tailor-made request
    const tailorMadeRequest = await TailorMadeRequest.create(req.body);

    emitAdminNotification({
      type: 'tailorMade',
      title: `Tailor-made request from ${tailorMadeRequest.fullName}`,
      entityId: tailorMadeRequest._id.toString(),
      createdAt: tailorMadeRequest.createdAt?.toISOString?.() || new Date().toISOString(),
    });

    // Save notification to database (supports polling fallback on Vercel)
    await Notification.create({
      type: 'tailorMade',
      title: 'New Tailor-Made',
      message: `Tailor-made request from ${tailorMadeRequest.fullName} (${tailorMadeRequest.email})`,
      entityId: tailorMadeRequest._id,
    });

    void emitDashboardStatsUpdate();

    res.status(201).json({
      success: true,
      message: 'Your travel request has been submitted successfully! Our team will contact you within 24 hours.',
      data: tailorMadeRequest,
    });
  } catch (error: any) {
    console.error('Error creating tailor-made request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit your travel request. Please try again later.',
    });
  }
};

/**
 * @desc    Get all tailor-made requests (Admin only)
 * @route   GET /api/tailor-made
 * @access  Private/Admin
 */
export const getAllTailorMadeRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    const searchRegex = createSearchRegex(search);
    if (searchRegex) {
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { country: searchRegex },
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get requests with pagination
    const requests = await TailorMadeRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const total = await TailorMadeRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching tailor-made requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch travel requests',
    });
  }
};

/**
 * @desc    Get single tailor-made request by ID (Admin only)
 * @route   GET /api/tailor-made/:id
 * @access  Private/Admin
 */
export const getTailorMadeRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const request = await TailorMadeRequest.findById(req.params.id);

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Travel request not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    console.error('Error fetching tailor-made request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch travel request',
    });
  }
};

/**
 * @desc    Update tailor-made request status (Admin only)
 * @route   PATCH /api/tailor-made/:id
 * @access  Private/Admin
 */
export const updateTailorMadeRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, adminNotes } = req.body;

    const request = await TailorMadeRequest.findById(req.params.id);

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Travel request not found',
      });
      return;
    }

    // Update fields
    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;

    await request.save();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Travel request updated successfully',
      data: request,
    });
  } catch (error: any) {
    console.error('Error updating tailor-made request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update travel request',
    });
  }
};

/**
 * @desc    Delete tailor-made request (Admin only)
 * @route   DELETE /api/tailor-made/:id
 * @access  Private/Admin
 */
export const deleteTailorMadeRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const request = await TailorMadeRequest.findById(req.params.id);

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Travel request not found',
      });
      return;
    }

    await request.deleteOne();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Travel request deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tailor-made request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete travel request',
    });
  }
};

/**
 * @desc    Get tailor-made request statistics (Admin only)
 * @route   GET /api/tailor-made/stats
 * @access  Private/Admin
 */
export const getTailorMadeStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const total = await TailorMadeRequest.countDocuments();
    const pending = await TailorMadeRequest.countDocuments({ status: 'pending' });
    const contacted = await TailorMadeRequest.countDocuments({ status: 'contacted' });
    const inProgress = await TailorMadeRequest.countDocuments({ status: 'in-progress' });
    const completed = await TailorMadeRequest.countDocuments({ status: 'completed' });
    const cancelled = await TailorMadeRequest.countDocuments({ status: 'cancelled' });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        contacted,
        inProgress,
        completed,
        cancelled,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tailor-made stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};
