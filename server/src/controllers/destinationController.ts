import { respondToDuplicateInternalLinks } from '../utils/duplicateInternalLinks';
import { localizePreservingSlugs } from '../utils/localize';
import { Request, Response } from 'express';
import Destination, {
  IDestination,
  PUBLIC_DESTINATION_FILTER,
  isDestinationStatus,
  publicDestinationPopulate,
} from '../models/Destination';
import { canReadAllDestinations } from '../utils/destinationAccess';
import Blog from '../models/Blog';
import { FilterQuery } from 'mongoose';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';
import { createSearchRegex, localizedSearchFilters } from '../utils/search';
import {
  BLOG_LISTING_FIELDS,
  BLOG_LISTING_POPULATE,
  BLOG_WITHOUT_COMMENTS,
  blogCardPopulate,
} from '../utils/blogCardPopulate';

interface QueryParams {
  isActive?: string;
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

// The list and by-id routes are shared with the Admin; canReadAllDestinations
// decides who sees drafts through them.
const buildFilter = (query: QueryParams, includeDrafts: boolean): FilterQuery<IDestination> => {
  const filter: FilterQuery<IDestination> = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (includeDrafts && isDestinationStatus(query.status)) filter.status = query.status;
  const searchRegex = createSearchRegex(query.search);
  if (searchRegex) {
    filter.$or = localizedSearchFilters(['name', 'slug', 'description', 'region'], searchRegex);
  }
  // Applied last, so no query parameter can widen what an anonymous caller sees.
  if (!includeDrafts) Object.assign(filter, PUBLIC_DESTINATION_FILTER);
  return filter;
};

/** `status` decides what is public, so it is the one field checked before a save. */
const hasInvalidStatus = (body: { status?: unknown }): boolean =>
  body.status !== undefined && !isDestinationStatus(body.status);

const RELATED_DESTINATION_FIELDS = 'name slug coverImage';

const parsePagination = (query: QueryParams) => {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '10', 10);
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * @desc    Get all destinations
 * @route   GET /api/destinations
 * @access  Public (published only); Admin token (all, optional ?status=)
 */
export const getAllDestinations = async (
  req: Request<Record<string, never>, unknown, unknown, QueryParams>,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildFilter(req.query, canReadAllDestinations(req));
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
      data: localizePreservingSlugs(destinations, req.locale),
    });
  } catch (error: any) {
    if (respondToDuplicateInternalLinks(error, res)) return;
    res.status(500).json({ success: false, error: 'Failed to fetch destinations', message: error.message });
  }
};

/**
 * @desc    Get destination by ID
 * @route   GET /api/destinations/:id
 * @access  Public (published only); Admin token (all)
 */
export const getDestinationById = async (req: Request, res: Response): Promise<void> => {
  try {
    // The Admin's editor and view read this; its saved references, drafts
    // included, must come back whole or a save would drop them.
    const includeDrafts = canReadAllDestinations(req);
    const destination = await Destination.findOne({
      _id: req.params.id,
      ...(includeDrafts ? {} : PUBLIC_DESTINATION_FILTER),
    })
      .populate('featuredBlogs', BLOG_WITHOUT_COMMENTS)
      .populate(
        includeDrafts
          ? { path: 'relatedDestinations', select: RELATED_DESTINATION_FIELDS }
          : publicDestinationPopulate('relatedDestinations', RELATED_DESTINATION_FIELDS)
      )
      .lean();

    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }
    res.status(200).json({ success: true, data: destination });
  } catch (error: any) {
    if (respondToDuplicateInternalLinks(error, res)) return;
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
    // The landing page's own read: published destinations only, the same rule
    // the slug resolver applies before the page ever asks for this.
    const destination = await Destination.findOne({
      ...PUBLIC_DESTINATION_FILTER,
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
      ],
    })
      // The card's byline is the editorial author, not the admin account that
      // typed the article in — populating `author` here is what produced the
      // "By Admin" bylines on this page.
      .populate(blogCardPopulate('featuredBlogs'))
      .populate(publicDestinationPopulate('relatedDestinations', RELATED_DESTINATION_FIELDS))
      .lean();

    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }
    // Localized, keeping every `slug` raw for per-locale URLs and narrowing
    // `faqs` to the rows this language can render.
    res.status(200).json({ success: true, data: localizePreservingSlugs(destination, req.locale) });
  } catch (error: any) {
    if (respondToDuplicateInternalLinks(error, res)) return;
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
      // The same card as the blog category and subcategory listings: only what
      // the destination page's article grid draws (see BLOG_LISTING_FIELDS),
      // which also leaves `comments` out. The page renders on the server and
      // hands this list to a Client Component, so every field sent here is
      // serialized into its HTML as well.
      Blog.find(filter)
        .select(BLOG_LISTING_FIELDS)
        .populate(BLOG_LISTING_POPULATE)
        .sort('-publishedAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      // Localized like those listings, with every `slug` kept whole so a card
      // still links to its article in each language.
      data: localizePreservingSlugs(blogs, req.locale),
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (error: any) {
    if (respondToDuplicateInternalLinks(error, res)) return;
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
    if (hasInvalidStatus(req.body)) {
      res.status(400).json({ success: false, error: 'Status must be draft or published' });
      return;
    }
    // No status sent: the schema default applies, and a new destination is a draft.
    const body = { ...req.body };
    // Identity is derived by the model, never supplied as translated Admin text.
    delete body.filterKey;
    if (body.metaImage?.url) {
      body.ogImage = body.metaImage.url;
    }
    const destination = await Destination.create(body);
    res.status(201).json({ success: true, message: 'Destination created successfully', data: destination });
  } catch (error: any) {
    if (respondToDuplicateInternalLinks(error, res)) return;
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
    const destination = await Destination.findById(req.params.id);
    
    if (!destination) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }
    if (hasInvalidStatus(req.body)) {
      res.status(400).json({ success: false, error: 'Status must be draft or published' });
      return;
    }

    // Update fields. A body without `status` leaves the publication state as it is.
    const body = { ...req.body };
    delete body.filterKey;
    if (body.metaImage?.url) {
      body.ogImage = body.metaImage.url;
    }

    Object.assign(destination, body);

    // Save triggers pre('save') hooks and full validation
    await destination.save();

    res.status(200).json({ success: true, message: 'Destination updated successfully', data: destination });
  } catch (error: any) {
    if (respondToDuplicateInternalLinks(error, res)) return;
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
    if (respondToDuplicateInternalLinks(error, res)) return;
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
    if (respondToDuplicateInternalLinks(error, res)) return;
    res.status(500).json({ success: false, error: 'Failed to toggle destination status', message: error.message });
  }
};
