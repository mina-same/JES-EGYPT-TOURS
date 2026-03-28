import { Request, Response } from 'express';
import Tour from '../models/Tour';
import { FilterQuery } from 'mongoose';
import { ITour } from '../models/Tour';
import { emitDashboardStatsUpdate } from '../realtime/socket';
import { localize } from '../utils/localize';

// ==================== INTERFACES ====================

interface QueryParams {
  subcategory?: string;
  category?: string;
  isActive?: string;
  isFeatured?: string;
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

  // Filter by active status
  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive === 'true';
  }

  // Filter by featured status
  if (queryParams.isFeatured !== undefined) {
    filter.isFeatured = queryParams.isFeatured === 'true';
  }

  // Search by heading or description in all languages
  if (queryParams.search) {
    const searchRegex = { $regex: queryParams.search, $options: 'i' };
    filter.$or = [
      { 'heading.en': searchRegex },
      { 'heading.de': searchRegex },
      { 'heading.it': searchRegex },
      { 'Description.text.en': searchRegex },
      { 'Description.text.de': searchRegex },
      { 'Description.text.it': searchRegex },
      { tourLocation: searchRegex },
    ];
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
    filter['pricingPlans.seasons.prices.solo'] = priceFilter;
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
  const validSortFields = ['heading', 'createdAt', 'updatedAt', 'viewCount', 'tourLocation', 'priceStartingFrom'];
  
  if (!sortParam) return '-createdAt';

  // Handle descending sort (e.g., '-createdAt')
  const isDescending = sortParam.startsWith('-');
  const field = isDescending ? sortParam.substring(1) : sortParam;

  if (!validSortFields.includes(field)) {
    return '-createdAt';
  }

  return sortParam;
};

/**
 * Parse fields for selective field return
 */
const parseFields = (fieldsParam?: string): string => {
  if (!fieldsParam) return '';
  
  // Convert comma-separated fields to space-separated
  return fieldsParam.split(',').join(' ');
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

    // Build query
    let query = Tour.find(filter)
      .populate('subcategory', 'name slug category')
      .populate({
        path: 'subcategory',
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
      .populate('subcategory', 'name slug')
      .sort('-viewCount -createdAt')
      .limit(limit)
      .select('heading slug images Description tourLocation tourType pricingPlans')
      .lean();

    res.status(200).json({
      success: true,
      count: tours.length,
      data: localize(tours, req.locale),
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
 * @desc    Get popular tours (by view count)
 * @route   GET /api/tours/popular
 * @access  Public
 */
export const getPopularTours = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string || '10', 10);

    const tours = await Tour.find({ isActive: true })
      .populate('subcategory', 'name slug')
      .sort('-viewCount')
      .limit(limit)
      .select('heading slug images Description tourLocation viewCount pricingPlans')
      .lean();

    res.status(200).json({
      success: true,
      count: tours.length,
      data: localize(tours, req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching popular tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular tours',
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
    const { isActive, page = '1', limit = '10' } = req.query;

    const filter: FilterQuery<ITour> = { subcategory: subcategoryId };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [tours, total] = await Promise.all([
      Tour.find(filter)
        .populate('subcategory', 'name slug')
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
      .populate('subcategory', 'name slug description category')
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
      data: localize(tour, req.locale),
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
      $or: [
        { 'slug.en': req.params.slug },
        { 'slug.de': req.params.slug },
        { 'slug.it': req.params.slug },
        { 'slug.es': req.params.slug },
      ],
    })
      .populate('subcategory', 'name slug description category')
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

    // Increment view count asynchronously (don't wait for it)
    Tour.findByIdAndUpdate(tour._id, { $inc: { viewCount: 1 } }).exec();

    res.status(200).json({
      success: true,
      data: localize(tour, req.locale),
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
      .populate('subcategory', 'name slug')
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
      .select('heading slug images Description tourLocation pricingPlans')
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
    const tour = await Tour.create(req.body);

    // Populate subcategory details
    await tour.populate('subcategory', 'name slug');

    void emitDashboardStatsUpdate();

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: tour,
    });
  } catch (error: any) {
    console.error('Error creating tour:', error);

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
    // Filter out empty gallery items (items with empty fileName)
    if (req.body.gallery && Array.isArray(req.body.gallery)) {
      req.body.gallery = req.body.gallery.filter((item: any) => 
        item && item.fileName && item.fileName.trim() !== ''
      );
    }

    // Sanitize pricingPlans: remove empty date objects from seasons
    if (req.body.pricingPlans && Array.isArray(req.body.pricingPlans)) {
      const isEmptyDateObj = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (val instanceof Date) return false;
        if (typeof val !== 'object') return false;
        return Object.keys(val).length === 0;
      };

      req.body.pricingPlans = req.body.pricingPlans.map((plan: any) => {
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

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('subcategory', 'name slug');

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
                totalViews: { $sum: '$viewCount' },
                avgViews: { $avg: '$viewCount' },
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
