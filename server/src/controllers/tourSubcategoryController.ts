import { Request, Response } from 'express';
import TourSubcategory from '../models/TourSubcategory';
import { FilterQuery } from 'mongoose';
import { ITourSubcategory } from '../models/TourSubcategory';

// ==================== INTERFACES ====================

interface QueryParams {
  category?: string;
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
const buildQueryFilter = (queryParams: QueryParams): FilterQuery<ITourSubcategory> => {
  const filter: FilterQuery<ITourSubcategory> = {};

  // Filter by category
  if (queryParams.category) {
    filter.category = queryParams.category;
  }

  // Filter by active status
  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive === 'true';
  }

  // Search by name or description
  if (queryParams.search) {
    filter.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { description: { $regex: queryParams.search, $options: 'i' } },
    ];
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
 * @desc    Get all tour subcategories with pagination and filtering
 * @route   GET /api/tours/subcategories
 * @access  Public
 */
export const getAllSubcategories = async (
  req: Request<{}, {}, {}, QueryParams>,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildQueryFilter(req.query);
    const sort = parseSort(req.query.sort);

    // Execute query with pagination
    const [subcategories, total] = await Promise.all([
      TourSubcategory.find(filter)
        .populate('category', 'name slug')
        .populate('toursCount')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      TourSubcategory.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count: subcategories.length,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: subcategories,
    });
  } catch (error: any) {
    console.error('Error fetching tour subcategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour subcategories',
      message: error.message,
    });
  }
};

/**
 * @desc    Get subcategories by category ID
 * @route   GET /api/tours/categories/:categoryId/subcategories
 * @access  Public
 */
export const getSubcategoriesByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { isActive } = req.query;

    const filter: FilterQuery<ITourSubcategory> = { category: categoryId };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const subcategories = await TourSubcategory.find(filter)
      .populate('toursCount')
      .sort('name')
      .lean();

    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories,
    });
  } catch (error: any) {
    console.error('Error fetching subcategories by category:', error);
    
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
      error: 'Failed to fetch subcategories',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour subcategory by ID
 * @route   GET /api/tours/subcategories/:id
 * @access  Public
 */
export const getSubcategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await TourSubcategory.findById(req.params.id)
      .populate('category', 'name slug description')
      .populate('toursCount')
      .populate('featuredBlogs')
      .lean();

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Tour subcategory not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subcategory,
    });
  } catch (error: any) {
    console.error('Error fetching tour subcategory:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour subcategory by slug
 * @route   GET /api/tours/subcategories/slug/:slug
 * @access  Public
 */
export const getSubcategoryBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const { category } = req.query;

    const filter: FilterQuery<ITourSubcategory> = {
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
      ],
    };
    
    // Optionally filter by category to ensure uniqueness
    if (category) {
      filter.category = category as string;
    }

    const subcategory = await TourSubcategory.findOne(filter)
      .populate('category', 'name slug description')
      .populate('toursCount')
      .populate('featuredBlogs')
      .lean();

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Tour subcategory not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subcategory,
    });
  } catch (error: any) {
    console.error('Error fetching tour subcategory by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Create new tour subcategory
 * @route   POST /api/tours/subcategories
 * @access  Private/Admin
 */
export const createSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await TourSubcategory.create(req.body);

    // Populate category details
    await subcategory.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Tour subcategory created successfully',
      data: subcategory,
    });
  } catch (error: any) {
    console.error('Error creating tour subcategory:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Tour subcategory with this slug already exists in this category',
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        messages,
      });
      return;
    }

    // Handle invalid category reference
    if (error.message.includes('Invalid category reference')) {
      res.status(400).json({
        success: false,
        error: 'Invalid category reference',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create tour subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Update tour subcategory
 * @route   PUT /api/tours/subcategories/:id
 * @access  Private/Admin
 */
export const updateSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await TourSubcategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('category', 'name slug');

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Tour subcategory not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tour subcategory updated successfully',
      data: subcategory,
    });
  } catch (error: any) {
    console.error('Error updating tour subcategory:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory ID format',
      });
      return;
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Tour subcategory with this slug already exists in this category',
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        messages,
      });
      return;
    }

    // Handle invalid category reference
    if (error.message.includes('Invalid category reference')) {
      res.status(400).json({
        success: false,
        error: 'Invalid category reference',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update tour subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete tour subcategory
 * @route   DELETE /api/tours/subcategories/:id
 * @access  Private/Admin
 */
export const deleteSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await TourSubcategory.findById(req.params.id);

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Tour subcategory not found',
      });
      return;
    }

    // This will trigger the pre-remove middleware that checks for tours
    await subcategory.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tour subcategory deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tour subcategory:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory ID format',
      });
      return;
    }

    // Handle pre-remove middleware errors (e.g., tours exist)
    if (error.message.includes('Cannot delete subcategory')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete tour subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle subcategory active status
 * @route   PATCH /api/tours/subcategories/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleSubcategoryStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await TourSubcategory.findById(req.params.id);

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Tour subcategory not found',
      });
      return;
    }

    subcategory.isActive = !subcategory.isActive;
    await subcategory.save();

    res.status(200).json({
      success: true,
      message: `Tour subcategory ${subcategory.isActive ? 'activated' : 'deactivated'} successfully`,
      data: subcategory,
    });
  } catch (error: any) {
    console.error('Error toggling subcategory status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle subcategory status',
      message: error.message,
    });
  }
};
