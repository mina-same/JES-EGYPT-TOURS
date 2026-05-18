import { Request, Response } from 'express';
import Destination, { IDestination } from '../models/Destination';
import Blog from '../models/Blog';
import { FilterQuery } from 'mongoose';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';

interface QueryParams {
  isActive?: string;
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

const buildFilter = (query: QueryParams): FilterQuery<IDestination> => {
  const filter: FilterQuery<IDestination> = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.search) {
    filter.$or = [
      { 'name.en': { $regex: query.search, $options: 'i' } },
      { 'description.en': { $regex: query.search, $options: 'i' } },
      { 'region.en': { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
};

const parsePagination = (query: QueryParams) => {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '10', 10);
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * @desc    Get all destinations
 * @route   GET /api/destinations
 * @access  Public
 */
export const getAllDestinations = async (
  req: Request<{}, {}, {}, QueryParams>,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildFilter(req.query);
    const sort = req.query.sort || 'name.en';

    const [destinations, total] = await Promise.all([
      Destination.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Destination.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: destinations.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      data: destinations,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch destinations', message: error.message });
  }
};

/**
 * @desc    Get destination by ID
 * @route   GET /api/destinations/:id
 * @access  Public
 */
export const getDestinationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const destination = await Destination.findById(req.params.id)
      .populate('featuredBlogs')
      .populate('relatedDestinations', 'name slug coverImage')
      .lean();

    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }
    res.status(200).json({ success: true, data: destination });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, error: 'Invalid destination ID format' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch destination', message: error.message });
  }
};

/**
 * @desc    Get destination by slug (any language)
 * @route   GET /api/destinations/slug/:slug
 * @access  Public
 */
export const getDestinationBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const destination = await Destination.findOne({
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
      ],
    })
      .populate({ path: 'featuredBlogs', populate: { path: 'author', select: 'name' } })
      .populate('relatedDestinations', 'name slug coverImage')
      .lean();

    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }
    res.status(200).json({ success: true, data: destination });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch destination', message: error.message });
  }
};

/**
 * @desc    Get all published blogs tagged with this destination
 * @route   GET /api/destinations/:id/blogs
 * @access  Public
 */
export const getBlogsByDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '9', 10);
    const skip = (page - 1) * limit;

    const destinationId = req.params.id;

    // 1. Find categories that feature this destination
    const featuredInCategories = await BlogCategory.find({ featuredDestinations: destinationId }).select('_id').lean();
    const categoryIds = featuredInCategories.map(c => c._id);

    // 2. Find subcategories that feature this destination
    const featuredInSubcategories = await BlogSubCategory.find({ featuredDestinations: destinationId }).select('_id').lean();
    const subcategoryIds = featuredInSubcategories.map(s => s._id);

    // 3. Build filter for Blogs
    const filter: FilterQuery<any> = {
      status: 'published',
      $or: [
        { destination: destinationId },
        { category: { $in: categoryIds } },
        { subCategory: { $in: subcategoryIds } }
      ]
    };

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort('-publishedAt')
        .skip(skip)
        .limit(limit)
        .populate('author', 'name')
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch destination blogs', message: error.message });
  }
};

/**
 * @desc    Create destination
 * @route   POST /api/destinations
 * @access  Private/Admin
 */
export const createDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || !name.en) {
      res.status(400).json({ success: false, error: 'English name is required' });
      return;
    }
    const body = { ...req.body };
    if (body.metaImage?.url) {
      body.ogImage = body.metaImage.url;
    }
    const destination = await Destination.create(body);
    res.status(201).json({ success: true, message: 'Destination created successfully', data: destination });
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ success: false, error: `Destination with this ${field} already exists` });
      return;
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ success: false, error: 'Validation failed', messages });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create destination', message: error.message });
  }
};

/**
 * @desc    Update destination
 * @route   PUT /api/destinations/:id
 * @access  Private/Admin
 */
export const updateDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Updating Destination:', req.params.id, req.body);
    let destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }

    // Update fields
    const body = { ...req.body };
    if (body.metaImage?.url) {
      body.ogImage = body.metaImage.url;
    }

    Object.assign(destination, body);

    // Save triggers pre('save') hooks and full validation
    await destination.save();

    res.status(200).json({ success: true, message: 'Destination updated successfully', data: destination });
  } catch (error: any) {
    console.error('Update Destination Server Error:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, error: 'Invalid destination ID format' });
      return;
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ success: false, error: `Destination with this ${field} already exists` });
      return;
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update destination', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

/**
 * @desc    Delete destination
 * @route   DELETE /api/destinations/:id
 * @access  Private/Admin
 */
export const deleteDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }
    await destination.deleteOne();
    res.status(200).json({ success: true, message: 'Destination deleted successfully' });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, error: 'Invalid destination ID format' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to delete destination', message: error.message });
  }
};

/**
 * @desc    Toggle destination active status
 * @route   PATCH /api/destinations/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleDestinationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }
    destination.isActive = !destination.isActive;
    await destination.save();
    res.status(200).json({
      success: true,
      message: `Destination ${destination.isActive ? 'activated' : 'deactivated'} successfully`,
      data: destination,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to toggle destination status', message: error.message });
  }
};
