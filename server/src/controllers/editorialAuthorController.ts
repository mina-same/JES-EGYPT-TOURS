import { Request, Response } from 'express';
import EditorialAuthor from '../models/EditorialAuthor';
import Blog from '../models/Blog';

export const ensureDefaultEditorialAuthor = async () => EditorialAuthor.findOneAndUpdate(
  { slug: 'madonna-roshdey' },
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

export const getEditorialAuthors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const defaultAuthor = await ensureDefaultEditorialAuthor();
    await Blog.updateMany(
      { $or: [{ editorialAuthor: { $exists: false } }, { editorialAuthor: null }] },
      { $set: { editorialAuthor: defaultAuthor._id } }
    );
    const authors = await EditorialAuthor.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: authors });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load editorial authors' });
  }
};

export const getEditorialAuthorBySlug = async (req: Request, res: Response): Promise<void> => {
  const author = await EditorialAuthor.findOne({ slug: req.params.slug, isActive: true });
  if (!author) { res.status(404).json({ success: false, error: 'Author not found' }); return; }
  res.json({ success: true, data: author });
};
