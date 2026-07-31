import { Request, Response } from 'express';
import Tour from '../models/Tour';
import { FilterQuery } from 'mongoose';
import { ITour } from '../models/Tour';
import { emitDashboardStatsUpdate } from '../realtime/socket';
import { localize, localizePreservingSlugs } from '../utils/localize';
import {
  parseFutureSchedule,
  PublishingValidationError,
} from '../utils/publishing';
import { createSearchRegex, localizedSearchFilters } from '../utils/search';

// ==================== INTERFACES ====================

interface QueryParams {
  subcategory?: string;
  category?: string;
  isActive?: string;
  /**
   * Admin-only opt-in: include deactivated / scheduled tours in the result.
   * Public callers MUST NOT send it — without it the list is active-only, so a
   * caller that forgets to filter can never leak unpublished tours.
   */
  includeInactive?: string;
  scheduled?: string;
  isFeatured?: string;
  isSpecialOffer?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  tourType?: string;
  tourStyle?: string;
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Build query filter from request parameters
 */
const buildQueryFilter = async (queryParams: QueryParams): Promise<FilterQuery<ITour>> => {
  const filter: FilterQuery<ITour> = {};

  // Filter by subcategory
  if (queryParams.subcategory) {
    filter.subcategory = queryParams.subcategory;
  }

  // Filter by category (requires lookup through subcategory)
  if (queryParams.category) {
    const TourSubcategory = (await import('../models/TourSubcategory')).default;
    const subcategories = await TourSubcategory.find({ category: queryParams.category }).select('_id');
    const subcategoryIds = subcategories.map(sub => sub._id);
    filter.subcategory = { $in: subcategoryIds };
  }

  // ── Visibility (secure by default) ──
  // Public callers always get ACTIVE tours only. Deactivated and scheduled
  // tours (scheduled ⇒ isActive === false) stay hidden even if the caller
  // forgot to pass a filter — this also keeps them out of the sitemap.
  // The admin panel opts in explicitly with includeInactive=true.
  const includeInactive = queryParams.includeInactive === 'true';

  if (!includeInactive) {
    filter.isActive = { $ne: false };
  } else {
    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === 'true';
    }

    // `scheduled` only makes sense for the admin view: a scheduled tour is
    // inactive until its publish time, so honouring it publicly would expose
    // exactly the content we are hiding above.
    if (queryParams.scheduled === 'true') {
      filter.isActive = false;
      filter.scheduledAt = { $exists: true, $ne: null };
    } else if (queryParams.scheduled === 'false') {
      filter.scheduledAt = { $exists: false };
    }
  }

  // Filter by featured status
  if (queryParams.isFeatured !== undefined) {
    filter.isFeatured = queryParams.isFeatured === 'true';
  }

  // Filter by special offer status
  if (queryParams.isSpecialOffer !== undefined) {
    filter.isSpecialOffer = queryParams.isSpecialOffer === 'true';
  }

  // Search by heading or description in all languages
  const searchRegex = createSearchRegex(queryParams.search);
  if (searchRegex) {
    filter.$or = localizedSearchFilters(
      ['heading', 'Description.text', 'tourLocation'],
      searchRegex
    );
  }

  // Filter by tour type
  if (queryParams.tourType) {
    filter.tourType = { $regex: queryParams.tourType, $options: 'i' };
  }

  // Filter by tour style
  if (queryParams.tourStyle) {
    filter.tourStyle = { $regex: queryParams.tourStyle, $options: 'i' };
  }

  // Filter by price range (searches within pricingPlans)
  if (queryParams.minPrice || queryParams.maxPrice) {
    const priceFilter: any = {};
    
    if (queryParams.minPrice) {
      priceFilter.$gte = parseFloat(queryParams.minPrice);
    }
    
    if (queryParams.maxPrice) {
      priceFilter.$lte = parseFloat(queryParams.maxPrice);
    }

    // This searches for tours where any pricing plan season has prices in range
    filter['pricingPlans.seasons.prices.solo.USD'] = priceFilter;
  }

  return filter;
};

/**
 * Parse pagination parameters
 */
const parsePagination = (queryParams: QueryParams) => {
  const page = parseInt(queryParams.page || '1', 10);
  const limit = parseInt(queryParams.limit || '10', 10);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Parse sort parameter
 */
const parseSort = (sortParam?: string): string => {
  const validSortFields = ['heading', 'createdAt', 'updatedAt', 'tourLocation', 'priceStartingFrom'];
  // Localized fields are {en,de,it,es} objects: sorting on the bare field makes
  // Mongo compare the whole sub-document (i.e. always by EN). Callers may pass
  // a locale suffix ("heading.de") so each language sorts by its OWN text.
  const localizedSortFields = ['heading', 'tourLocation'];
  const supportedLocales = ['en', 'de', 'it', 'es'];

  if (!sortParam) return '-createdAt';

  // Handle descending sort (e.g., '-createdAt')
  const isDescending = sortParam.startsWith('-');
  const raw = isDescending ? sortParam.substring(1) : sortParam;
  const [field, locale] = raw.split('.');

  if (!validSortFields.includes(field)) {
    return '-createdAt';
  }

  // A suffix is only allowed on localized fields, and only a real locale.
  if (locale && !(localizedSortFields.includes(field) && supportedLocales.includes(locale))) {
    return '-createdAt';
  }

  let target = raw;
  if (field === 'priceStartingFrom') {
    // Price is {USD,EUR,GBP} — sort on the always-present USD amount.
    target = 'priceStartingFrom.USD';
  } else if (localizedSortFields.includes(field) && !locale) {
    // Keep the previous effective behaviour explicit instead of implicit.
    target = `${field}.en`;
  }

  return isDescending ? `-${target}` : target;
};

/**
 * Parse fields for selective field return
 */
const parseFields = (fieldsParam?: string): string => {
  if (!fieldsParam) return '';
  
  // Convert comma-separated fields to space-separated
  return fieldsParam.split(',').join(' ');
};

const ensureTourMapSchema = <T>(tour: T): T => {
  if (!tour || typeof tour !== 'object') return tour;

  const normalizedTour = tour as any;
  const mapSchema = normalizedTour.mapSchema || normalizedTour.seo?.mapSchema;
  if (!Array.isArray(mapSchema?.itemListElement) || mapSchema.itemListElement.length === 0) {
    return tour;
  }

  normalizedTour.mapSchema = normalizedTour.mapSchema || mapSchema;
  normalizedTour.seo = normalizedTour.seo || {};
  normalizedTour.seo.mapSchema = normalizedTour.seo.mapSchema || mapSchema;

  return tour;
};

// ==================== CONTROLLERS ====================

/**
 * @desc    Get all tours with advanced filtering, pagination, and sorting
 * @route   GET /api/tours
 * @access  Public
 */
export const getAllTours = async (
  req: Request<{}, {}, {}, QueryParams>,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = await buildQueryFilter(req.query);
    const sort = parseSort(req.query.sort);
    const fields = parseFields(req.query.fields);

    // Build query. NOTE: a single populate call — a second object-form
    // populate on the same path REPLACES the first one's select and ships
    // the full ~23KB subcategory document with every tour in the list.
    let query = Tour.find(filter)
      .populate({
        path: 'subcategory',
        select: 'name slug category',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Apply field selection if specified
    if (fields) {
      query.select(fields);
    }

    // Execute query with count
    const [tours, total] = await Promise.all([
      query.lean(),
      Tour.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count: tours.length,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: localize(tours, req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Get featured tours
 * @route   GET /api/tours/featured
 * @access  Public
 */
export const getFeaturedTours = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string || '6', 10);

    const tours = await Tour.find({ isActive: true, isFeatured: true })
      .populate('subcategory', 'name shortName slug')
      .sort('-createdAt')
      .limit(limit)
      // `reviews.url` only (not full reviews) so we can derive a video link
      // without shipping the heavy reviews array to the client.
      .select(
        // `subcategory` must be selected for the populate above to resolve — the
        // card shows its name as the tour's category label.
        'heading slug images cardDescription Description tourLocation subcategory pricingPlans priceStartingFrom reviewsCount duration specialOfferDiscount isSpecialOffer reviews.url'
      )
      .lean();

    // Collapse reviews into a single lightweight `videoUrl` (first review that
    // has a URL) and drop the reviews array, so the homepage card can show a
    // working video button without receiving all reviews. Tours without a
    // video simply have no `videoUrl` (the client then hides the button).
    const data = tours.map((tour: any) => {
      const { reviews, ...rest } = tour;
      const videoUrl = Array.isArray(reviews)
        ? reviews.find((r: any) => typeof r?.url === 'string' && r.url)?.url
        : undefined;
      return videoUrl ? { ...rest, videoUrl } : rest;
    });

    // Localized, EXCEPT `slug`. The homepage builds per-locale URLs with
    // getStrictLocalizedSlug(tour.slug, locale), which needs slug as an OBJECT
    // { en, de, it, es } — a flattened slug reads as English-only and hides
    // every tour on the de/it/es pages. Returning the rest raw (as this did)
    // shipped all four languages of every field to every visitor.
    const payload = localizePreservingSlugs(data, req.locale);

    res.status(200).json({
      success: true,
      count: payload.length,
      data: payload,
    });
  } catch (error: any) {
    console.error('Error fetching featured tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Get tours by subcategory
 * @route   GET /api/tours/subcategories/:subcategoryId/tours
 * @access  Public
 */
export const getToursBySubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { subcategoryId } = req.params;
    const { isActive, includeInactive, page = '1', limit = '10' } = req.query;

    const filter: FilterQuery<ITour> = { subcategory: subcategoryId };

    // Same secure-by-default visibility rule as the main list (see
    // buildQueryFilter): active-only unless the admin opts in explicitly.
    if (includeInactive === 'true') {
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }
    } else {
      filter.isActive = { $ne: false };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [tours, total] = await Promise.all([
      Tour.find(filter)
        .populate('subcategory', 'name shortName slug')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Tour.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: tours.length,
      total,
      page: pageNum,
      totalPages,
      data: localize(tours, req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tours by subcategory:', error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour by ID
 * @route   GET /api/tours/:id
 * @access  Public
 */
export const getTourById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate('subcategory', 'name shortName slug description category')
      .populate({
        path: 'subcategory',
        populate: {
          path: 'category',
          select: 'name slug description',
        },
      })
      .lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: localize(ensureTourMapSchema(tour), req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tour:', error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid tour ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour by slug
 * @route   GET /api/tours/slug/:slug
 * @access  Public
 */
export const getTourBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findOne({
      isActive: { $ne: false },
      $or: [
        { 'slug.en': req.params.slug },
        { 'slug.de': req.params.slug },
        { 'slug.it': req.params.slug },
        { 'slug.es': req.params.slug },
      ],
    })
      .populate({
        path: 'subcategory',
        select: 'name slug description category',
        populate: {
          path: 'category',
          select: 'name slug description',
        },
      })
      .lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      // Localized, but every `slug` stays raw so the language switcher and the
      // hreflang alternates can still resolve this tour in the other locales.
      data: localizePreservingSlugs(ensureTourMapSchema(tour), req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tour by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Get tour by external ID
 * @route   GET /api/tours/external/:idExternal
 * @access  Public
 */
export const getTourByExternalId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findOne({ idExternal: req.params.idExternal })
      .populate('subcategory', 'name shortName slug')
      .lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: localize(tour, req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tour by external ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Get related tours
 * @route   GET /api/tours/:id/related
 * @access  Public
 */
export const getRelatedTours = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id).select('subcategory').lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string || '4', 10);

    // Find tours in the same subcategory, excluding the current tour
    const relatedTours = await Tour.find({
      subcategory: tour.subcategory,
      _id: { $ne: req.params.id },
      isActive: true,
    })
      .select('heading slug images cardDescription Description tourLocation pricingPlans')
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: relatedTours.length,
      data: relatedTours,
    });
  } catch (error: any) {
    console.error('Error fetching related tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch related tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Create new tour
 * @route   POST /api/tours
 * @access  Private/Admin
 */
export const createTour = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = { ...req.body };

    if (
      Object.prototype.hasOwnProperty.call(body, 'scheduledAt') &&
      body.scheduledAt !== null &&
      body.scheduledAt !== undefined
    ) {
      body.scheduledAt = parseFutureSchedule(body.scheduledAt);
      body.isActive = false;
      delete body.publishedAt;
    } else {
      delete body.scheduledAt;
      if (body.isActive !== false) {
        body.publishedAt = new Date();
      } else {
        delete body.publishedAt;
      }
    }

    const tour = await Tour.create(body);

    // Populate subcategory details
    await tour.populate('subcategory', 'name shortName slug');

    void emitDashboardStatsUpdate();

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: tour,
    });
  } catch (error: any) {
    console.error('Error creating tour:', error);

    if (error instanceof PublishingValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Handle invalid ObjectId/CastError
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: `Invalid format for field: ${error.path}`,
      });
      return;
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        error: `Tour with this ${field} already exists`,
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors,
      });
      return;
    }

    // Handle invalid subcategory reference
    if (error.message.includes('Invalid subcategory reference')) {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory reference',
      });
      return;
    }

    // Handle date range errors
    if (error.message.includes('Invalid date range')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Update tour
 * @route   PUT /api/tours/:id
 * @access  Private/Admin
 */
export const updateTour = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = { ...req.body };

    // Stale-save conflict guard — reject saves from stale drafts or old tabs
    const submittedVersion: number | undefined =
      typeof body._editVersion === 'number' ? body._editVersion : undefined;
    delete body._editVersion;

    const existingTour = await Tour.findById(
      req.params.id,
      'editVersion isActive scheduledAt publishedAt'
    ).lean();
    if (!existingTour) {
      res.status(404).json({ success: false, error: 'Tour not found' });
      return;
    }
    const currentVersion: number = (existingTour as any).editVersion ?? 0;

    if (submittedVersion === undefined || submittedVersion !== currentVersion) {
      res.status(409).json({
        success: false,
        error: 'This tour was updated elsewhere. Please reload before saving.',
        currentVersion,
      });
      return;
    }

    body.editVersion = currentVersion + 1;

    // Filter out empty gallery items (items with empty fileName)
    if (body.gallery && Array.isArray(body.gallery)) {
      body.gallery = body.gallery.filter((item: any) =>
        item && item.fileName && item.fileName.trim() !== ''
      );
    }

    // Sanitize pricingPlans: remove empty date objects from seasons
    if (body.pricingPlans && Array.isArray(body.pricingPlans)) {
      const isEmptyDateObj = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (val instanceof Date) return false;
        if (typeof val !== 'object') return false;
        return Object.keys(val).length === 0;
      };

      body.pricingPlans = body.pricingPlans.map((plan: any) => {
        if (!plan.seasons || !Array.isArray(plan.seasons)) return plan;
        return {
          ...plan,
          seasons: plan.seasons.map((season: any) => {
            const cleaned: any = { ...season };
            if (!cleaned.startDate || isEmptyDateObj(cleaned.startDate)) {
              delete cleaned.startDate;
            }
            if (!cleaned.endDate || isEmptyDateObj(cleaned.endDate)) {
              delete cleaned.endDate;
            }
            return cleaned;
          }),
        };
      });
    }

    const fieldsToUnset: Record<string, 1> = {};
    const hasScheduledAt = Object.prototype.hasOwnProperty.call(body, 'scheduledAt');

    if (
      hasScheduledAt &&
      body.scheduledAt !== null &&
      body.scheduledAt !== undefined
    ) {
      body.scheduledAt = parseFutureSchedule(body.scheduledAt);
      body.isActive = false;
      fieldsToUnset.publishedAt = 1;
      delete body.publishedAt;
    } else if (hasScheduledAt || body.isActive !== undefined) {
      fieldsToUnset.scheduledAt = 1;
      delete body.scheduledAt;

      if (body.isActive === true && !(existingTour as any).isActive) {
        body.publishedAt = new Date();
      }
    }

    const update: any = { $set: body };
    if (Object.keys(fieldsToUnset).length > 0) {
      update.$unset = fieldsToUnset;
    }

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).populate('subcategory', 'name shortName slug');

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Tour updated successfully',
      data: tour,
    });
  } catch (error: any) {
    console.error('Error updating tour:', error);

    if (error instanceof PublishingValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Handle invalid ObjectId/CastError
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: error.path === '_id' 
          ? 'Invalid tour ID format' 
          : `Invalid format for field: ${error.path}`,
      });
      return;
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        error: `Tour with this ${field} already exists`,
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors,
      });
      return;
    }

    // Handle invalid subcategory reference
    if (error.message.includes('Invalid subcategory reference')) {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory reference',
      });
      return;
    }

    // Handle date range errors
    if (error.message.includes('Invalid date range')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete tour
 * @route   DELETE /api/tours/:id
 * @access  Private/Admin
 */
export const deleteTour = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    await tour.deleteOne();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Tour deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tour:', error);

    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid tour ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle tour active status
 * @route   PATCH /api/tours/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleTourStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    tour.isActive = !tour.isActive;
    tour.scheduledAt = undefined;
    if (tour.isActive) {
      tour.publishedAt = new Date();
    }
    tour.editVersion = (tour.editVersion ?? 0) + 1;
    await tour.save();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: `Tour ${tour.isActive ? 'activated' : 'deactivated'} successfully`,
      data: tour,
    });
  } catch (error: any) {
    console.error('Error toggling tour status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle tour status',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle tour featured status
 * @route   PATCH /api/tours/:id/toggle-featured
 * @access  Private/Admin
 */
export const toggleTourFeatured = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    tour.isFeatured = !tour.isFeatured;
    tour.editVersion = (tour.editVersion ?? 0) + 1;
    await tour.save();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: `Tour ${tour.isFeatured ? 'marked as featured' : 'unmarked as featured'} successfully`,
      data: tour,
    });
  } catch (error: any) {
    console.error('Error toggling tour featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle tour featured status',
      message: error.message,
    });
  }
};

/**
 * @desc    Get tour statistics
 * @route   GET /api/tours/stats
 * @access  Private/Admin
 */
export const getTourStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await Tour.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalTours: { $sum: 1 },
                activeTours: {
                  $sum: { $cond: ['$isActive', 1, 0] },
                },
                featuredTours: {
                  $sum: { $cond: ['$isFeatured', 1, 0] },
                },
              },
            },
          ],
          toursBySubcategory: [
            {
              $group: {
                _id: '$subcategory',
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: 'toursubcategories',
                localField: '_id',
                foreignField: '_id',
                as: 'subcategoryInfo',
              },
            },
            {
              $unwind: '$subcategoryInfo',
            },
            {
              $project: {
                _id: 1,
                name: '$subcategoryInfo.name',
                count: 1,
              },
            },
            {
              $sort: { count: -1 },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error: any) {
    console.error('Error fetching tour statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour statistics',
      message: error.message,
    });
  }
};
