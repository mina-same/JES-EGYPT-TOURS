import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Booking from '../models/Booking';
import Tour from '../models/Tour';
import { emitAdminNotification, emitDashboardStatsUpdate } from '../realtime/socket';

/**
 * @desc    Create a new tour booking
 * @route   POST /api/bookings
 * @access  Public
 */
export const createBooking = async (
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

    // Verify tour exists
    const tour = await Tour.findById(req.body.tour);
    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    // Create booking
    const booking = await Booking.create(req.body);

    // Populate tour details
    await booking.populate('tour', 'heading slug images');

    emitAdminNotification({
      type: 'booking',
      title: `Booking from ${booking.name}`,
      entityId: booking._id.toString(),
      createdAt: booking.createdAt?.toISOString?.() || new Date().toISOString(),
    });

    void emitDashboardStatsUpdate();

    res.status(201).json({
      success: true,
      message: 'Your booking has been submitted successfully! We will contact you soon to confirm your reservation.',
      data: booking,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit your booking. Please try again later.',
    });
  }
};

/**
 * @desc    Get all bookings (Admin only)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
export const getAllBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, tour, page = 1, limit = 10, search } = req.query;

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (tour) {
      query.tour = tour;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('tour', 'heading slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
    });
  }
};

/**
 * @desc    Get single booking by ID (Admin only)
 * @route   GET /api/bookings/:id
 * @access  Private/Admin
 */
export const getBookingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      'tour',
      'heading slug images Description'
    );

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
    });
  }
};

/**
 * @desc    Update booking status (Admin only)
 * @route   PATCH /api/bookings/:id
 * @access  Private/Admin
 */
export const updateBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, adminNotes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
      return;
    }

    // Update fields
    if (status) booking.status = status;
    if (adminNotes !== undefined) booking.adminNotes = adminNotes;

    await booking.save();

    // Populate tour details
    await booking.populate('tour', 'heading slug images');

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
    });
  }
};

/**
 * @desc    Delete booking (Admin only)
 * @route   DELETE /api/bookings/:id
 * @access  Private/Admin
 */
export const deleteBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
      return;
    }

    await booking.deleteOne();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking',
    });
  }
};

/**
 * @desc    Get booking statistics (Admin only)
 * @route   GET /api/bookings/stats
 * @access  Private/Admin
 */
export const getBookingStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ status: 'pending' });
    const confirmed = await Booking.countDocuments({ status: 'confirmed' });
    const cancelled = await Booking.countDocuments({ status: 'cancelled' });
    const completed = await Booking.countDocuments({ status: 'completed' });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        cancelled,
        completed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};

