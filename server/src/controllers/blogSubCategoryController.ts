import { Request, Response } from 'express';
import BlogSubCategory from '../models/BlogSubCategory';
import { FilterQuery } from 'mongoose';
import { IBlogSubCategory } from '../models/BlogSubCategory';
import { normalizeDocumentImage, normalizeImageValue } from '../utils/image';

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
const buildQueryFilter = (queryParams: QueryParams): FilterQuery<IBlogSubCategory> => {
  const filter: FilterQuery<IBlogSubCategory> = {};

  // Filter by category
  if (queryParams.category) {
    filter.category = queryParams.category;
  }

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
 * @desc    Get all blog subcategories with pagination and filtering
 * @route   GET /api/blog/subcategories
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
      BlogSubCategory.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogSubCategory.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const normalizedSubcategories = subcategories.map((subcategory) =>
      normalizeDocumentImage(subcategory, subcategory.name)
    );

    res.status(200).json({
      success: true,
      count: normalizedSubcategories.length,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: normalizedSubcategories,
    });
  } catch (error: any) {
    console.error('Error fetching blog subcategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog subcategories',
      message: error.message,
    });
  }
};

/**
 * @desc    Get subcategories by category ID
 * @route   GET /api/blog/categories/:categoryId/subcategories
 * @access  Public
 */
export const getSubcategoriesByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { isActive } = req.query;

    const filter: FilterQuery<IBlogSubCategory> = { category: categoryId };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const subcategories = await BlogSubCategory.find(filter)
      .sort('name')
      .lean();

    const normalizedSubcategories = subcategories.map((subcategory) =>
      normalizeDocumentImage(subcategory, subcategory.name)
    );

    res.status(200).json({
      success: true,
      count: normalizedSubcategories.length,
      data: normalizedSubcategories,
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
 * @desc    Get single blog subcategory by ID
 * @route   GET /api/blog/subcategories/:id
 * @access  Public
 */
export const getSubcategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await BlogSubCategory.findById(req.params.id)
      .populate('category', 'name slug description')
      .populate('featuredBlogs')
      .populate('featuredDestinations')
      .lean();

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Blog subcategory not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: normalizeDocumentImage(subcategory, subcategory.name),
    });
  } catch (error: any) {
    console.error('Error fetching blog subcategory:', error);
    
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
      error: 'Failed to fetch blog subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single blog subcategory by slug
 * @route   GET /api/blog/subcategories/slug/:slug
 * @access  Public
 */
export const getSubcategoryBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const { category } = req.query;

    const filter: FilterQuery<IBlogSubCategory> = {
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
      ]
    };
    
    // Optionally filter by category to ensure uniqueness if needed
    if (category) {
      filter.category = category as string;
    }

    const subcategory = await BlogSubCategory.findOne(filter)
      .populate('category', 'name slug description')
      .populate('featuredBlogs')
      .populate('featuredDestinations')
      .lean();

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Blog subcategory not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: normalizeDocumentImage(subcategory, subcategory.name),
    });
  } catch (error: any) {
    console.error('Error fetching blog subcategory by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Create new blog subcategory
 * @route   POST /api/blog/subcategories
 * @access  Private/Admin
 */
export const createSubcategory = async (
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

    const subcategory = await BlogSubCategory.create(body);

    // Populate category details
    await subcategory.populate('category', 'name slug');
    const subcategoryObject = subcategory.toObject();

    res.status(201).json({
      success: true,
      message: 'Blog subcategory created successfully',
      data: normalizeDocumentImage(subcategoryObject, subcategoryObject.name),
    });
  } catch (error: any) {
    console.error('Error creating blog subcategory:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Blog subcategory with this slug already exists in this category',
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
      error: 'Failed to create blog subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Update blog subcategory
 * @route   PUT /api/blog/subcategories/:id
 * @access  Private/Admin
 */
export const updateSubcategory = async (
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

    if (req.body.image === undefined) {
      delete body.image;
    }

    const subcategory = await BlogSubCategory.findByIdAndUpdate(
      req.params.id,
      body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('category', 'name slug');

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Blog subcategory not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Blog subcategory updated successfully',
      data: normalizeDocumentImage(subcategory.toObject(), subcategory.name),
    });
  } catch (error: any) {
    console.error('Error updating blog subcategory:', error);

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
        error: 'Blog subcategory with this slug already exists in this category',
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
      error: 'Failed to update blog subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete blog subcategory
 * @route   DELETE /api/blog/subcategories/:id
 * @access  Private/Admin
 */
export const deleteSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await BlogSubCategory.findById(req.params.id);

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Blog subcategory not found',
      });
      return;
    }

    // This will trigger any pre-remove middleware
    await subcategory.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog subcategory deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting blog subcategory:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory ID format',
      });
      return;
    }

    // Handle pre-remove middleware errors (e.g., blogs exist)
    if (error.message.includes('Cannot delete subcategory')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete blog subcategory',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle subcategory active status
 * @route   PATCH /api/blog/subcategories/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleSubcategoryStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subcategory = await BlogSubCategory.findById(req.params.id);

    if (!subcategory) {
      res.status(404).json({
        success: false,
        error: 'Blog subcategory not found',
      });
      return;
    }

    subcategory.isActive = !subcategory.isActive;
    await subcategory.save();

    res.status(200).json({
      success: true,
      message: `Blog subcategory ${subcategory.isActive ? 'activated' : 'deactivated'} successfully`,
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
