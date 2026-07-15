import { Request, Response } from 'express';
import Blog from '../models/Blog';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';

/**
 * @desc    Get all published blogs with pagination
 * @route   GET /api/blog/posts
 * @access  Public
 */
export const getAllBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tags,
      isFeatured,
      search,
      sort,
      subCategory
    } = req.query;

    const query: any = { status: 'published' };

    // Filter by subCategory
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Filter by featured status (if false or not provided, show non-featured only)
    if (isFeatured === 'true') {
      query.isFeatured = true;
    } else if (isFeatured === 'false') {
      query.isFeatured = false;
    }
    // If not specified, show all (both featured and non-featured)

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Search in title and excerpt (English)
    if (search) {
      const escapedSearch = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'title.en': { $regex: escapedSearch, $options: 'i' } },
        { 'excerpt.en': { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortParam = String(sort || '').toLowerCase();
    const sortExpr = sortParam === 'popular' ? '-viewCount -publishedAt' : '-publishedAt';

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .select('-comments') // Exclude comments from list view
      .sort(sortExpr)
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blogs',
    });
  }
};

export const getAllBlogsAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      tags,
      isFeatured,
      search,
      status,
      destination,
    } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    // Filter by destination (valid ObjectId only, to avoid cast errors).
    if (typeof destination === 'string' && /^[0-9a-fA-F]{24}$/.test(destination)) {
      query.destination = destination;
    }

    if (isFeatured === 'true') {
      query.isFeatured = true;
    } else if (isFeatured === 'false') {
      query.isFeatured = false;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    if (search) {
      const escapedSearch = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'title.en': { $regex: escapedSearch, $options: 'i' } },
        { 'excerpt.en': { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      // Resolve the destination reference so the admin list can show its
      // name (it was previously returned as a raw ObjectId → shown as "-").
      .populate('destination', 'name slug')
      .select('-comments')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching blogs (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blogs',
    });
  }
};

/**
 * @desc    Get featured blogs for homepage
 * @route   GET /api/blog/posts/featured
 * @access  Public
 */
export const getFeaturedBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit = 6 } = req.query;

    const blogs = await Blog.find({ 
      status: 'published',
      isFeatured: true 
    })
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .select('-comments')
      .sort({ publishedAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error: any) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured blogs',
    });
  }
};


/**
 * @desc    Get single blog by slug
 * @route   GET /api/blog/posts/slug/:slug
 * @access  Public
 */
export const getBlogBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ 
      status: 'published',
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
      ]
    })
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('relatedPosts', 'title slug featuredImage excerpt publishedAt tags')
      .populate('relatedTours', 'heading slug images gallery duration tourLocation priceStartingFrom reviews videoLink minAge');

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    // Increment view count
    blog.viewCount += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post',
    });
  }
};

/**
 * @desc    Get single blog by ID (public - only published)
 * @route   GET /api/blog/posts/id/:id
 * @access  Public
 */
export const getBlogByIdPublic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await Blog.findOne({ 
      _id: req.params.id,
      status: 'published' 
    })
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('relatedPosts', 'title slug featuredImage excerpt publishedAt tags')
      .populate('relatedTours', 'heading slug images gallery duration tourLocation priceStartingFrom reviews videoLink minAge');

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    // Increment view count
    blog.viewCount += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post',
    });
  }
};

/**
 * @desc    Create new blog post
 * @route   POST /api/blog/posts
 * @access  Private/Admin
 */
/**
 * Helper function to normalize featuredImage from old format (string) to new format (IImage object)
 */
const normalizeFeaturedImage = (featuredImage: any, featuredImageAlt?: string): any => {
  // If it's already an object with url, return it (new format)
  if (featuredImage && typeof featuredImage === 'object' && featuredImage.url) {
    // Ensure fileName is set
    if (!featuredImage.fileName && featuredImage.url) {
      const urlParts = featuredImage.url.split('/');
      featuredImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
    }
    return featuredImage;
  }
  
  // If it's a string, convert to new format (backward compatibility)
  if (typeof featuredImage === 'string' && featuredImage) {
    const urlParts = featuredImage.split('/');
    return {
      url: featuredImage,
      fileName: urlParts[urlParts.length - 1] || 'image.jpg',
      alt: featuredImageAlt || '',
      title: '',
    };
  }
  
  return featuredImage;
};

/**
 * Helper function to normalize metaImage
 */
const normalizeMetaImage = (metaImage: any): any => {
  if (!metaImage) return metaImage;
  
  // If it's already an object with url, return it (new format)
  if (metaImage && typeof metaImage === 'object' && metaImage.url) {
    // Ensure fileName is set
    if (!metaImage.fileName && metaImage.url) {
      const urlParts = metaImage.url.split('/');
      metaImage.fileName = urlParts[urlParts.length - 1] || 'meta-image.jpg';
    }
    return metaImage;
  }
  
  return metaImage;
};

// sparse unique indexes on slug.de/it/es only fire when the field is present,
// so "" must be deleted — an absent field means that language page does not exist.
const stripEmptyLocalizedSlugs = (slug: any): void => {
  if (!slug || typeof slug !== 'object') return;
  const optionalLangs = ['de', 'it', 'es'] as const;
  for (const lang of optionalLangs) {
    if (typeof slug[lang] === 'string' && slug[lang].trim() === '') {
      delete slug[lang];
    }
  }
};

export const createBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title } = req.body;

    // Validation
    if (!title || !title.en) {
      res.status(400).json({
        success: false,
        error: 'English title is required',
      });
      return;
    }

    // Normalize image fields for backward compatibility
    const body = { ...req.body };
    
    // Handle featuredImage migration
    if (body.featuredImage || body.featuredImageAlt) {
      body.featuredImage = normalizeFeaturedImage(body.featuredImage, body.featuredImageAlt);
      // Remove old featuredImageAlt field
      delete body.featuredImageAlt;
    }
    
    // Handle metaImage migration
    if (body.metaImage) {
      body.metaImage = normalizeMetaImage(body.metaImage);
      body.ogImage = body.metaImage?.url || body.ogImage;
    }
    
    stripEmptyLocalizedSlugs(body.slug);

    const blog = await Blog.create(body);
    await blog.populate('author', 'name email');
    await blog.populate('editorialAuthor');

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog,
    });
  } catch (error: any) {
    console.error('Error creating blog:', error);
    
    if (error.code === 11000) {
      const conflictField = error.keyValue
        ? Object.keys(error.keyValue)[0]
        : 'slug';
      const conflictValue = error.keyValue
        ? Object.values(error.keyValue)[0]
        : '';
      res.status(400).json({
        success: false,
        error: `Duplicate value on field "${conflictField}": "${conflictValue}". Please use a unique slug.`,
        keyValue: error.keyValue,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create blog post',
    });
  }
};

/**
 * @desc    Update blog post
 * @route   PUT /api/blog/posts/:id
 * @access  Private/Admin
 */
export const updateBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title } = req.body;

    // Validation if title is being updated
    if (title !== undefined && (!title || !title.en)) {
      res.status(400).json({
        success: false,
        error: 'English title is required',
      });
      return;
    }

    // Normalize image fields for backward compatibility
    const body = { ...req.body };

    // --- Stale-save conflict guard ---
    // Extract the client-submitted edit version. Missing or non-numeric is treated as absent.
    const submittedVersion: number | undefined =
      typeof body._editVersion === 'number' ? body._editVersion : undefined;
    delete body._editVersion; // never persist this control field to the document

    const existingBlog = await Blog.findById(req.params.id, 'editVersion').lean();
    if (!existingBlog) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }
    const currentVersion: number = (existingBlog as any).editVersion ?? 0;

    if (submittedVersion === undefined || submittedVersion !== currentVersion) {
      res.status(409).json({
        success: false,
        error: 'This article was updated elsewhere. Please reload before saving.',
        currentVersion,
      });
      return;
    }

    // Version matches — bump it for the new save
    body.editVersion = currentVersion + 1;
    // --- End conflict guard ---

    // Handle featuredImage migration
    if (body.featuredImage !== undefined || body.featuredImageAlt !== undefined) {
      body.featuredImage = normalizeFeaturedImage(body.featuredImage, body.featuredImageAlt);
      // Remove old featuredImageAlt field
      delete body.featuredImageAlt;
    }

    // Handle metaImage migration
    if (body.metaImage !== undefined) {
      body.metaImage = normalizeMetaImage(body.metaImage);
      body.ogImage = body.metaImage?.url || body.ogImage;
    }

    stripEmptyLocalizedSlugs(body.slug);

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: blog,
    });
  } catch (error: any) {
    const body: any = req.body || {};
    const contentBlocks = Array.isArray(body.contentBlocks) ? body.contentBlocks : [];
    const contentBlocksSummary = contentBlocks.map((b: any) => {
      const type = b?.type;
      const imagesCount = Array.isArray(b?.images) ? b.images.length : 0;
      return { type, imagesCount };
    });

    const bodySummary = {
      title: body.title,
      slug: body.slug,
      author: body.author,
      tagsCount: Array.isArray(body.tags) ? body.tags.length : 0,
      metaKeywordsCount: Array.isArray(body.metaKeywords) ? body.metaKeywords.length : 0,
      featuredImage: body.featuredImage
        ? { hasUrl: !!body.featuredImage?.url, hasFileName: !!body.featuredImage?.fileName }
        : undefined,
      metaImage: body.metaImage
        ? { hasUrl: !!body.metaImage?.url, hasFileName: !!body.metaImage?.fileName }
        : undefined,
      contentBlocksCount: contentBlocks.length,
      contentBlocksSummary,
    };

    console.error('Error updating blog:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      keyValue: error?.keyValue,
    });
    console.error('Update blog params:', req.params);
    console.error('Update blog body summary:', bodySummary);
    if (error?.errors) {
      console.error('Mongoose errors:', error.errors);
    }

    // Make common errors actionable for the client
    if (error?.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
        errors: error.errors,
      });
      return;
    }

    // Duplicate key (usually slug uniqueness)
    if (error?.code === 11000) {
      const conflictField = error.keyValue
        ? Object.keys(error.keyValue)[0]
        : 'slug';
      const conflictValue = error.keyValue
        ? Object.values(error.keyValue)[0]
        : '';
      res.status(400).json({
        success: false,
        error: `Duplicate value on field "${conflictField}": "${conflictValue}". Please use a unique slug.`,
        keyValue: error.keyValue,
      });
      return;
    }

    // Invalid ObjectId
    if (error?.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid identifier',
        details: error.message,
        errors: {
          [error.path]: {
            name: 'CastError',
            message: `Invalid format for field: ${error.path}`,
            path: error.path,
          }
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update blog post',
      details: error?.message || 'Unknown error',
    });
  }
};

/**
 * @desc    Delete blog post
 * @route   DELETE /api/blog/posts/:id
 * @access  Private/Admin
 */
export const deleteBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog post',
    });
  }
};

/**
 * @desc    Add comment to blog post
 * @route   POST /api/blog/posts/:id/comments
 * @access  Public
 */
export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, text } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    if (!blog.commentsEnabled) {
      res.status(403).json({
        success: false,
        error: 'Comments are disabled for this post',
      });
      return;
    }

    blog.comments.push({
      name,
      email,
      text,
      isApproved: false,
      createdAt: new Date(),
    } as any);

    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully. It will be visible after approval.',
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
};

/**
 * @desc    Get popular/trending blogs
 * @route   GET /api/blog/posts/popular
 * @access  Public
 */
export const getPopularBlogs = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .select('title slug featuredImage excerpt viewCount publishedAt tags isFeatured')
      .sort({ viewCount: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error: any) {
    console.error('Error fetching popular blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular blogs',
    });
  }
};

/**
 * @desc    Get blog post by ID
 * @route   GET /api/blog/posts/:id
 * @access  Private/Admin
 */
export const getBlogById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('relatedTours', 'heading slug images gallery duration tourLocation priceStartingFrom reviews videoLink minAge');

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post',
    });
  }
};

/**
 * @desc    Publish blog post
 * @route   PATCH /api/blog/posts/:id/publish
 * @access  Private/Admin
 */
export const publishBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    blog.status = 'published';
    blog.publishedAt = new Date();
    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog post published successfully',
      data: blog,
    });
  } catch (error: any) {
    console.error('Error publishing blog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish blog post',
    });
  }
};

/**
 * @desc    Unpublish blog post
 * @route   PATCH /api/blog/posts/:id/unpublish
 * @access  Private/Admin
 */
export const unpublishBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    blog.status = 'draft';
    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog post unpublished successfully',
      data: blog,
    });
  } catch (error: any) {
    console.error('Error unpublishing blog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unpublish blog post',
    });
  }
};

/**
 * @desc    Toggle comments on blog post
 * @route   PATCH /api/blog/posts/:id/toggle-comments
 * @access  Private/Admin
 */
export const toggleComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
      return;
    }

    blog.commentsEnabled = !blog.commentsEnabled;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Comments ${blog.commentsEnabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        _id: blog._id,
        commentsEnabled: blog.commentsEnabled,
      },
    });
  } catch (error: any) {
    console.error('Error toggling comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle comments',
    });
  }
};

/**
 * @desc    Get blogs by category slug
 * @route   GET /api/blog/categories/:slug/posts
 * @access  Public
 */
export const getBlogsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 1. Find category by slug
    const category = await BlogCategory.findOne({
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
        { 'slug.fr': slug },
        { 'slug.ru': slug },
      ]
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Blog category not found',
      });
      return;
    }

    // 2. Find blogs in this category
    const skip = (Number(page) - 1) * Number(limit);
    const query = { category: category._id, status: 'published' };

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .select('-comments')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching blogs by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blogs by category',
    });
  }
};

/**
 * @desc    Get blogs by subcategory slug
 * @route   GET /api/blog/subcategories/:slug/posts
 * @access  Public
 */
export const getBlogsBySubCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 1. Find subcategory by slug
    // Note: Since subcategory slugs might not be unique across categories, we typically search all
    // but in this API we just match any subcategory with this slug.
    const subCategory = await BlogSubCategory.findOne({
      $or: [
        { 'slug.en': slug },
        { 'slug.de': slug },
        { 'slug.it': slug },
        { 'slug.es': slug },
        { 'slug.fr': slug },
        { 'slug.ru': slug },
      ]
    });

    if (!subCategory) {
      res.status(404).json({
        success: false,
        error: 'Blog subcategory not found',
      });
      return;
    }

    // 2. Find blogs in this subcategory
    const skip = (Number(page) - 1) * Number(limit);
    const query = { subCategory: subCategory._id, status: 'published' };

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .populate('editorialAuthor')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .select('-comments')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching blogs by subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blogs by subcategory',
    });
  }
};
