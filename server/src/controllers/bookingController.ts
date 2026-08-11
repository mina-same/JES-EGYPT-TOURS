import { Request, Response } from 'express';
import { matchedData, validationResult } from 'express-validator';
import Booking, { type IBooking, BOOKING_PACKAGE_NOT_SURE } from '../models/Booking';
import Tour from '../models/Tour';
import Notification from '../models/Notification';
import CurrencyConfig from '../models/CurrencyConfig';
import { emitAdminNotification, emitDashboardStatsUpdate } from '../realtime/socket';
import { createSearchRegex } from '../utils/search';
import {
  type BookingCurrency,
  type TourStartingPrice,
  createBookingRequestFingerprint,
  resolveTourStartingQuote,
} from '../utils/booking';

interface PublicBookingInput {
  tour: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  dateFrom: string;
  dateTo: string;
  adults: number;
  children?: number;
  infants?: number;
  requirements?: string;
  currency?: BookingCurrency;
  /** Verified against the tour's real plans below before it is stored. */
  selectedPackage?: string;
}

const BOOKING_SUCCESS_MESSAGE =
  'Your booking has been submitted successfully! We will contact you soon to confirm your reservation.';

interface MongoDuplicateKeyError {
  code?: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
  message?: string;
}

const isIdempotencyKeyCollision = (error: unknown): boolean => {
  const mongoError = error as MongoDuplicateKeyError;
  if (mongoError?.code !== 11000) return false;

  return Boolean(
    mongoError.keyPattern?.idempotencyKey ||
    mongoError.keyValue?.idempotencyKey ||
    mongoError.message?.includes('idempotencyKey')
  );
};

const findBookingByIdempotencyKey = async (idempotencyKey: string) =>
  Booking.findOne({ idempotencyKey }).select('+requestFingerprint');

const respondWithIdempotentReplay = async (
  res: Response,
  booking: IBooking,
  requestFingerprint: string
): Promise<void> => {
  if (booking.requestFingerprint !== requestFingerprint) {
    res.status(409).json({
      success: false,
      code: 'IDEMPOTENCY_KEY_REUSED',
      error: 'This Idempotency-Key was already used with different booking data',
    });
    return;
  }

  try {
    await booking.populate('tour', 'heading slug images');
  } catch (populateError) {
    console.error('Booking replay succeeded but tour population failed:', populateError);
  }

  res.status(200).json({
    success: true,
    message: BOOKING_SUCCESS_MESSAGE,
    data: booking,
    idempotentReplay: true,
  });
};

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

    // `matchedData` is the public endpoint's allowlist. Fields that belong to
    // admins or the server itself (status, adminNotes, quotedPrice, etc.) never
    // reach Booking.create even if a caller includes them in the JSON body.
    const input = matchedData(req, {
      locations: ['body'],
      includeOptionals: false,
    }) as PublicBookingInput;

    // Validation guarantees a UUID v4. Lowercasing makes textual UUID variants
    // share one unique database key as they represent the same attempt.
    const rawIdempotencyKey = req.get('Idempotency-Key');
    if (!rawIdempotencyKey) {
      res.status(400).json({
        success: false,
        error: 'Idempotency-Key header is required',
      });
      return;
    }
    const idempotencyKey = rawIdempotencyKey.toLowerCase();
    const requestFingerprint = createBookingRequestFingerprint(input);

    // Fast replay path: a response may have been lost after the durable insert.
    // Return the original booking without re-running notifications or pricing.
    const existingBooking = await findBookingByIdempotencyKey(idempotencyKey);
    if (existingBooking) {
      await respondWithIdempotentReplay(res, existingBooking, requestFingerprint);
      return;
    }

    // Verify tour exists
    const tour = await Tour.findById(input.tour);
    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    // A scheduled tour remains inactive until the publishing scheduler enables
    // it, so this also prevents early bookings for scheduled/unpublished tours.
    if (tour.isActive !== true) {
      res.status(409).json({
        success: false,
        error: 'This tour is currently unavailable for booking',
      });
      return;
    }

    // The package is a claim from a public form until it is matched against the
    // tour's real plans. Without this, anyone could post 'AFFORDABLE' for a
    // tour that only sells the top tier and the office would quote the wrong
    // rate off its own booking record.
    const claimedPackage = input.selectedPackage?.trim() || undefined;

    if (claimedPackage) {
      const tourPlanNames = (tour.pricingPlans || [])
        .map((plan) => plan?.planName)
        .filter(Boolean) as string[];

      const isRealPlan = tourPlanNames.includes(claimedPackage);
      // "Not sure" is only meaningful where a choice was actually offered.
      const isNotSure =
        claimedPackage === BOOKING_PACKAGE_NOT_SURE && tourPlanNames.length > 1;

      if (!isRealPlan && !isNotSure) {
        res.status(400).json({
          success: false,
          error: 'Selected package is not available for this tour',
        });
        return;
      }
    }

    const { currency: requestedCurrency, ...publicFields } = input;
    const currency: BookingCurrency = requestedCurrency || 'USD';
    const legacyUsdPrice = (tour as unknown as { price?: unknown }).price;
    const startingPrice: TourStartingPrice | undefined =
      tour.priceStartingFrom ||
      (typeof legacyUsdPrice === 'number' ? { USD: legacyUsdPrice } : undefined);

    // Same safe defaults used by the public currency context. The persisted
    // configuration replaces them when present.
    let rates: { EUR?: number; GBP?: number } = { EUR: 0.92, GBP: 0.79 };
    if (
      startingPrice &&
      currency !== 'USD' &&
      typeof startingPrice[currency] !== 'number'
    ) {
      const config = await CurrencyConfig.findOne().lean();
      rates = config?.rates || rates;
    }

    const quotedPrice = resolveTourStartingQuote(startingPrice, currency, rates);

    // Only publicFields are accepted. Status is forced here even though the
    // schema also defaults it, making the authorization boundary explicit.
    // Await the model's cached initialization promise so even the first request
    // after a deployment cannot race ahead of the unique idempotency index.
    await Booking.init();
    let booking: IBooking;
    try {
      booking = await Booking.create({
        ...publicFields,
        tour: tour._id,
        status: 'pending',
        idempotencyKey,
        requestFingerprint,
        ...(quotedPrice !== undefined ? { currency, quotedPrice } : {}),
      });
    } catch (createError) {
      // Two identical requests can pass the fast lookup concurrently. The
      // unique MongoDB index is the final atomic guard; the loser replays the
      // winner instead of returning an error or producing a second booking.
      if (isIdempotencyKeyCollision(createError)) {
        const concurrentBooking = await findBookingByIdempotencyKey(idempotencyKey);
        if (concurrentBooking) {
          await respondWithIdempotentReplay(
            res,
            concurrentBooking,
            requestFingerprint
          );
          return;
        }
      }
      throw createError;
    }

    // Everything below is enrichment/notification after the durable write. A
    // failure here must never tell the visitor the booking failed and invite a
    // duplicate retry after the booking already exists.
    try {
      await booking.populate('tour', 'heading slug images');
    } catch (populateError) {
      console.error('Booking created but tour population failed:', populateError);
    }

    try {
      emitAdminNotification({
        type: 'booking',
        title: `Booking from ${booking.name}`,
        entityId: booking._id.toString(),
        createdAt: booking.createdAt?.toISOString?.() || new Date().toISOString(),
      });
    } catch (realtimeError) {
      console.error('Booking created but realtime notification failed:', realtimeError);
    }

    // Save notification to database (supports polling fallback on Vercel)
    try {
      await Notification.create({
        type: 'booking',
        title: 'New Booking',
        message: `Booking from ${booking.name} (${booking.email})`,
        entityId: booking._id,
      });
    } catch (notificationError) {
      console.error('Booking created but persisted notification failed:', notificationError);
    }

    void emitDashboardStatsUpdate();

    res.status(201).json({
      success: true,
      message: BOOKING_SUCCESS_MESSAGE,
      data: booking,
      idempotentReplay: false,
    });
  } catch (error: unknown) {
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
    const searchRegex = createSearchRegex(search);
    if (searchRegex) {
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
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

