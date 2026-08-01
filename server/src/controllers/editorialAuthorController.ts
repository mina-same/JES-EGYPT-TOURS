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
      isActive: true,
    },
    $set: {
      role: {
        en: 'Travel Specialist at Jes Egypt Tours',
        de: 'Reisespezialistin bei Jes Egypt Tours',
        it: 'Travel Specialist di Jes Egypt Tours',
        es: 'Especialista en viajes en Jes Egypt Tours',
      },
      bio: {
        en: "Madonna Roshdey is a travel specialist at Jes Egypt Tours, where she helps international travelers plan private tours across Egypt. The tips she shares come from trips she's actually taken, not just research she's done.",
        de: 'Madonna Roshdey ist Reisespezialistin bei Jes Egypt Tours und hilft internationalen Reisenden dabei, private Touren durch Ägypten zu planen. Die Tipps, die sie teilt, stammen aus Reisen, die sie selbst gemacht hat – nicht nur aus Recherchen am Schreibtisch.',
        it: "Madonna Roshdey è una travel specialist di Jes Egypt Tours e aiuta viaggiatori internazionali a organizzare tour privati in tutto l'Egitto. I consigli che condivide nascono da viaggi che ha realmente vissuto, non da semplici ricerche.",
        es: 'Madonna Roshdey es especialista en viajes en Jes Egypt Tours y ayuda a viajeros internacionales a planificar tours privados por todo Egipto. Los consejos que comparte vienen de viajes que ella misma ha vivido, no solo de investigaciones de escritorio.',
      },
      image: {
        url: '/images/authors/madonna-roshdey-author.jpg',
        alt: {
          en: 'Madonna Roshdey, Travel Specialist at Jes Egypt Tours',
          de: 'Madonna Roshdey, Reisespezialistin bei Jes Egypt Tours',
          it: 'Madonna Roshdey, Travel Specialist di Jes Egypt Tours',
          es: 'Madonna Roshdey, Especialista en viajes en Jes Egypt Tours',
        },
      },
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
