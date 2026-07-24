import { Request, Response } from 'express';
import TourCategory from '../models/TourCategory';
import { FilterQuery } from 'mongoose';
import { ITourCategory } from '../models/TourCategory';
import { createSearchRegex, localizedSearchFilters } from '../utils/search';

// ==================== INTERFACES ====================

interface QueryParams {
  isActive?: string;
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Build query filter from request parameters
 */
const buildQueryFilter = (queryParams: QueryParams): FilterQuery<ITourCategory> => {
  const filter: FilterQuery<ITourCategory> = {};

  // Filter by active status
  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive === 'true';
  }

  const searchRegex = createSearchRegex(queryParams.search);
  if (searchRegex) {
    filter.$or = localizedSearchFilters(['name', 'slug', 'description'], searchRegex);
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
  const validSortFields = ['name', 'createdAt', 'updatedAt'];
  
  if (!sortParam) return 'name';

  // Handle descending sort (e.g., '-createdAt')
  const isDescending = sortParam.startsWith('-');
  const field = isDescending ? sortParam.substring(1) : sortParam;

  if (!validSortFields.includes(field)) {
    return 'name';
  }

  return sortParam;
};

// ==================== CONTROLLERS ====================

/**
 * @desc    Get all tour categories with pagination and filtering
 * @route   GET /api/tours/categories
 * @access  Public
 */
export const getAllCategories = async (
  req: Request<{}, {}, {}, QueryParams>,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildQueryFilter(req.query);
    const sort = parseSort(req.query.sort);

    // Execute query with pagination
    const [categories, total] = await Promise.all([
      TourCategory.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('subcategoriesCount')
        .lean(),
      TourCategory.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching tour categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour categories',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour category by ID
 * @route   GET /api/tours/categories/:id
 * @access  Public
 */
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await TourCategory.findById(req.params.id)
      .populate('subcategoriesCount')
      .populate('featuredBlogs')
      .populate('featuredDestinations')
      .lean();

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Tour category not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error('Error fetching tour category:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid category ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour category',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour category by slug
 * @route   GET /api/tours/categories/slug/:slug
 * @access  Public
 */
export const getCategoryBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await TourCategory.findOne({
      $or: [
        { 'slug.en': req.params.slug },
        { 'slug.de': req.params.slug },
        { 'slug.it': req.params.slug },
        { 'slug.es': req.params.slug },
      ],
    })
      .populate('subcategoriesCount')
      .populate('featuredBlogs')
      .populate('featuredDestinations')
      .lean();

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Tour category not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error('Error fetching tour category by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour category',
      message: error.message,
    });
  }
};

/**
 * @desc    Create new tour category
 * @route   POST /api/tours/categories
 * @access  Private/Admin
 */
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await TourCategory.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Tour category created successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Error creating tour category:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        error: `Tour category with this ${field} already exists`,
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

    res.status(500).json({
      success: false,
      error: 'Failed to create tour category',
      message: error.message,
    });
  }
};

/**
 * @desc    Update tour category
 * @route   PUT /api/tours/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawEditVersion = req.body._editVersion;
    const submittedEditVersion = Number(rawEditVersion);
    delete req.body._editVersion;

    const currentCategory = await TourCategory.findById(req.params.id).select('editVersion');

    if (!currentCategory) {
      res.status(404).json({
        success: false,
        error: 'Tour category not found',
      });
      return;
    }

    const currentVersion = currentCategory.editVersion ?? 0;
    if (rawEditVersion === undefined || rawEditVersion === null || rawEditVersion === '' || !Number.isFinite(submittedEditVersion) || submittedEditVersion !== currentVersion) {
      res.status(409).json({
        success: false,
        error: 'This item was updated elsewhere. Please reload before saving.',
      });
      return;
    }

    const body = {
      ...req.body,
      editVersion: currentVersion + 1,
    };

    const category = await TourCategory.findByIdAndUpdate(
      req.params.id,
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Tour category not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tour category updated successfully',
      data: category,
    });
  } catch (error: any) {
    console.error('Error updating tour category:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid category ID format',
      });
      return;
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        error: `Tour category with this ${field} already exists`,
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

    res.status(500).json({
      success: false,
      error: 'Failed to update tour category',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete tour category
 * @route   DELETE /api/tours/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await TourCategory.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Tour category not found',
      });
      return;
    }

    // This will trigger the pre-remove middleware that checks for subcategories
    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tour category deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tour category:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid category ID format',
      });
      return;
    }

    // Handle pre-remove middleware errors (e.g., subcategories exist)
    if (error.message.includes('Cannot delete category')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete tour category',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle category active status
 * @route   PATCH /api/tours/categories/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleCategoryStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await TourCategory.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Tour category not found',
      });
      return;
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Tour category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category,
    });
  } catch (error: any) {
    console.error('Error toggling category status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle category status',
      message: error.message,
    });
  }
};
