import { updateRequestRecord } from '../utils/requestWorkflow';
import { notifySubmission } from '../utils/submissionNotification';
import { budgetAmount } from '../utils/tailorMade';
import { paginationInput, publicSubmissionReceipt, respondSubmissionError, savePublicSubmission } from '../utils/submission';
import { Request, Response } from 'express';
import { matchedData, validationResult } from 'express-validator';
import TailorMadeRequest from '../models/TailorMadeRequest';
import { emitDashboardStatsUpdate } from '../realtime/socket';
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
    const { document: tailorMadeRequest, replay } = await savePublicSubmission(TailorMadeRequest, req, {
      ...matchedData(req, { locations: ['body'] }),
      status: 'pending',
      budgetCurrency: 'USD',
      budgetMinAmount: budgetAmount(req.body.minBudget),
      budgetMaxAmount: budgetAmount(req.body.maxBudget),
    });

    if (!replay) await notifySubmission('tailorMade', tailorMadeRequest, 'New Tailor-Made', `Tailor-made request from ${tailorMadeRequest.fullName} (${tailorMadeRequest.email})`);

    res.status(201).json({
      success: true,
      message: 'Your travel request has been submitted successfully! Our team will contact you within 24 hours.',
      data: publicSubmissionReceipt(tailorMadeRequest),
    });
  } catch (error: any) {
    console.error('Error creating tailor-made request:', error);
    respondSubmissionError(res, error, 'Failed to submit your travel request. Please try again later.');
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
    const { status, search } = req.query;
    const { page, limit, skip } = paginationInput(req.query);

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
    respondSubmissionError(res, error, 'Failed to fetch travel requests');
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
    respondSubmissionError(res, error, 'Failed to fetch travel request');
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
    const request = await updateRequestRecord(TailorMadeRequest, req, ['pending', 'contacted', 'in-progress', 'completed', 'cancelled']);

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Travel request updated successfully',
      data: request,
    });
  } catch (error: any) {
    console.error('Error updating tailor-made request:', error);
    respondSubmissionError(res, error, 'Failed to update travel request');
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
    respondSubmissionError(res, error, 'Failed to delete travel request');
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
    respondSubmissionError(res, error, 'Failed to fetch statistics');
  }
};
