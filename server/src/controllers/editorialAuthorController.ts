import { Request, Response } from 'express';
import EditorialAuthor from '../models/EditorialAuthor';
import Blog from '../models/Blog';

const DEFAULT_AUTHOR_SLUG = 'madonna-roshdey';

export const ensureDefaultEditorialAuthor = async () => EditorialAuthor.findOneAndUpdate(
  { slug: DEFAULT_AUTHOR_SLUG },
  {
    $setOnInsert: {
      name: 'Madonna Roshdey',
      slug: 'madonna-roshdey',
      role: { en: 'Travel Specialist at Jes Egypt Tours' },
      bio: { en: 'Madonna Roshdey is a travel specialist at Jes Egypt Tours, helping international travelers plan private tours across Egypt. She writes from real experience — so every tip you read has been lived, not just researched.' },
      image: {
        url: '/images/authors/madonna-roshdey-author.jpg',
        alt: { en: 'Madonna Roshdey, Travel Specialist at Jes Egypt Tours' },
      },
      isActive: true,
    },
  },
  { upsert: true, new: true }
);

const assignUnattributedBlogsToDefaultAuthor = async (authorId: unknown) => {
  await Blog.updateMany(
    { $or: [{ editorialAuthor: { $exists: false } }, { editorialAuthor: null }] },
    { $set: { editorialAuthor: authorId } }
  );
};

export const getEditorialAuthors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const defaultAuthor = await ensureDefaultEditorialAuthor();
    await assignUnattributedBlogsToDefaultAuthor(defaultAuthor._id);
    const authors = await EditorialAuthor.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: authors });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load editorial authors' });
  }
};

export const getEditorialAuthorBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedSlug = req.params.slug.trim().toLowerCase();
    const author = requestedSlug === DEFAULT_AUTHOR_SLUG
      ? await ensureDefaultEditorialAuthor()
      : await EditorialAuthor.findOne({ slug: requestedSlug, isActive: true });

    if (!author || !author.isActive) {
      res.status(404).json({ success: false, error: 'Author not found' });
      return;
    }

    if (author.slug === DEFAULT_AUTHOR_SLUG) {
      await assignUnattributedBlogsToDefaultAuthor(author._id);
    }

    const articles = await Blog.find({
      editorialAuthor: author._id,
      status: 'published',
    })
      .select(
        'title slug featuredImage excerpt tags publishedAt createdAt author editorialAuthor readingTime'
      )
      .populate('author', 'name')
      .populate('editorialAuthor', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...author.toObject(),
        articles,
      },
    });
  } catch (error) {
    console.error('Error loading editorial author:', error);
    res.status(500).json({ success: false, error: 'Failed to load editorial author' });
  }
};
