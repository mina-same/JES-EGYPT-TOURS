import { Request, Response } from 'express';
import BlogCategory, { IBlogCategory } from '../models/BlogCategory';
import { FilterQuery } from 'mongoose';
import { normalizeDocumentImage, normalizeImageValue } from '../utils/image';

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
const buildQueryFilter = (queryParams: QueryParams): FilterQuery<IBlogCategory> => {
  const filter: FilterQuery<IBlogCategory> = {};

  // Filter by active status
  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive === 'true';
  }

  // Search by name or description (target English by default for admin search)
  if (queryParams.search) {
    filter.$or = [
      { 'name.en': { $regex: queryParams.search, $options: 'i' } },
      { 'description.en': { $regex: queryParams.search, $options: 'i' } },
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
 * @desc    Get all blog categories with pagination and filtering
 * @route   GET /api/blog/categories
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
      BlogCategory.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('subcategoriesCount')
        .lean(),
      BlogCategory.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const normalizedCategories = categories.map((category) =>
      normalizeDocumentImage(category, category.name)
    );

    res.status(200).json({
      success: true,
      count: normalizedCategories.length,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: normalizedCategories,
    });
  } catch (error: any) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog categories',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single blog category by ID
 * @route   GET /api/blog/categories/:id
 * @access  Public
 */
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await BlogCategory.findById(req.params.id)
      .populate('subcategoriesCount')
      .populate('featuredBlogs')
      .populate('featuredDestinations')
      .lean();

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Blog category not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: normalizeDocumentImage(category, category.name),
    });
  } catch (error: any) {
    console.error('Error fetching blog category:', error);
    
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
      error: 'Failed to fetch blog category',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single blog category by slug
 * @route   GET /api/blog/categories/slug/:slug
 * @access  Public
 */
export const getCategoryBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const category = await BlogCategory.findOne({ 
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
      ]
    })
      .populate('subcategoriesCount')
      .populate({
        path: 'featuredBlogs',
        select: 'title slug featuredImage excerpt readingTime publishedAt',
      })
      .populate({
        path: 'featuredDestinations',
        select: 'name slug coverImage',
      })
      .lean();

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Blog category not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: normalizeDocumentImage(category, category.name),
    });
  } catch (error: any) {
    console.error('Error fetching blog category by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog category',
      message: error.message,
    });
  }
};

/**
 * @desc    Create new blog category
 * @route   POST /api/blog/categories
 * @access  Private/Admin
 */
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || !name.en) {
      res.status(400).json({
        success: false,
        error: 'English name is required',
      });
      return;
    }

    const body = {
      ...req.body,
      image: normalizeImageValue(req.body.image, name),
    };

    if ((body as any).metaImage?.url) {
      (body as any).ogImage = (body as any).metaImage.url;
    }

    const category = await BlogCategory.create(body);
    const categoryObject = category.toObject();

    res.status(201).json({
      success: true,
      message: 'Blog category created successfully',
      data: normalizeDocumentImage(categoryObject, categoryObject.name),
    });
  } catch (error: any) {
    console.error('Error creating blog category:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        error: `Blog category with this ${field} already exists`,
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

    res.status(500).json({
      success: false,
      error: 'Failed to create blog category',
      message: error.message,
    });
  }
};

/**
 * @desc    Update blog category
 * @route   PUT /api/blog/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    // Validation if name is being updated
    if (name !== undefined && (!name || !name.en)) {
      res.status(400).json({
        success: false,
        error: 'English name is required',
      });
      return;
    }

    const body = {
      ...req.body,
      image: req.body.image !== undefined ? normalizeImageValue(req.body.image, name) : undefined,
    };

    if ((body as any).metaImage?.url) {
      (body as any).ogImage = (body as any).metaImage.url;
    }

    if (req.body.image === undefined) {
      delete body.image;
    }

    const category = await BlogCategory.findByIdAndUpdate(
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
        error: 'Blog category not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Blog category updated successfully',
      data: normalizeDocumentImage(category.toObject(), category.name),
    });
  } catch (error: any) {
    console.error('Error updating blog category:', error);

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
        error: `Blog category with this ${field} already exists`,
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

    res.status(500).json({
      success: false,
      error: 'Failed to update blog category',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete blog category
 * @route   DELETE /api/blog/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await BlogCategory.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Blog category not found',
      });
      return;
    }

    // This will trigger any pre-remove middleware (if we add checks later)
    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog category deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting blog category:', error);

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
      error: 'Failed to delete blog category',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle category active status
 * @route   PATCH /api/blog/categories/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleCategoryStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await BlogCategory.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Blog category not found',
      });
      return;
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Blog category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
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
