import { localizePreservingSlugs } from '../utils/localize';
import { Request, Response } from 'express';
import EditorialAuthor from '../models/EditorialAuthor';
import Blog from '../models/Blog';
import { BLOG_CARD_FIELDS } from '../utils/blogCardPopulate';
import { hasTextForLocale } from '../utils/blogBlocks';
import {
  BACKFILLABLE_AUTHOR_FIELDS,
  DEFAULT_AUTHOR_SEED,
  DEFAULT_AUTHOR_SLUG,
} from '../seeds/defaultEditorialAuthor';

const assignUnattributedBlogsToDefaultAuthor = async (authorId: unknown) => {
  await Blog.updateMany(
    { $or: [{ editorialAuthor: { $exists: false } }, { editorialAuthor: null }] },
    { $set: { editorialAuthor: authorId } }
  );
};

/**
 * Seeding is a startup concern, not a per-request one.
 *
 * Both author endpoints are public GETs, and both used to upsert the author AND
 * run a `updateMany` across the whole blog collection on every single call — so
 * a crawler walking the author page, or the sitemap fetching the author list,
 * wrote to the database once per hit. Memoising the promise makes it run at
 * most once per process while keeping it lazy, which is what serverless needs:
 * there is no startup hook there to hang it on.
 *
 * The promise is cleared on failure so a transient error does not poison the
 * process into never seeding. It resolves to nothing on purpose — callers read
 * the author back with a fresh query, because a document cached here would go
 * stale the moment anyone edited the author.
 */
let defaultAuthorSetup: Promise<void> | null = null;

export const ensureDefaultEditorialAuthor = async (): Promise<void> => {
  if (!defaultAuthorSetup) {
    defaultAuthorSetup = (async () => {
      const author = await EditorialAuthor.findOneAndUpdate(
        { slug: DEFAULT_AUTHOR_SLUG },
        { $setOnInsert: DEFAULT_AUTHOR_SEED },
        { upsert: true, new: true }
      );

      /*
       * Fill in profile fields the document does not have yet.
       *
       * The author page's About narrative, its fact rows and its editorial
       * focus cards used to be hard-coded JSX; they are author data now, and a
       * document created before that change has none of them. `$setOnInsert`
       * cannot help there — it only fires on insert — so the missing keys are
       * filled once, here.
       *
       * Only ABSENT keys are written. A field the author already has, even one
       * edited to something different from the seed, is never touched: this
       * backfills a gap, it does not re-assert the seed.
       */
      const missing = BACKFILLABLE_AUTHOR_FIELDS.reduce<Record<string, unknown>>(
        (acc, field) => {
          const current = (author as Record<string, any>)[field];
          const isEmpty =
            current === undefined ||
            current === null ||
            (Array.isArray(current) && current.length === 0);
          if (isEmpty && field in DEFAULT_AUTHOR_SEED) {
            acc[field] = (DEFAULT_AUTHOR_SEED as Record<string, unknown>)[field];
          }
          return acc;
        },
        {}
      );

      if (Object.keys(missing).length > 0) {
        await EditorialAuthor.updateOne({ _id: author._id }, { $set: missing });
      }

      await assignUnattributedBlogsToDefaultAuthor(author._id);
    })().catch((error) => {
      defaultAuthorSetup = null;
      throw error;
    });
  }

  return defaultAuthorSetup;
};

export const getEditorialAuthors = async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureDefaultEditorialAuthor();
    const authors = await EditorialAuthor.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: authors });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load editorial authors' });
  }
};

export const getEditorialAuthorBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedSlug = req.params.slug.trim().toLowerCase();
    if (requestedSlug === DEFAULT_AUTHOR_SLUG) {
      await ensureDefaultEditorialAuthor();
    }
    const author = await EditorialAuthor.findOne({ slug: requestedSlug, isActive: true });

    if (!author || !author.isActive) {
      res.status(404).json({ success: false, error: 'Author not found' });
      return;
    }

    /*
     * Articles by this author — and, for the default author, the ones that
     * carry no editorial author at all.
     *
     * The backfill above now runs once per process instead of once per
     * request, so an article created after it ran keeps `editorialAuthor:
     * null` until the next restart. Every byline surface already treats that
     * as the house author (resolveBlogByline falls back to her), so the author
     * page has to resolve it the same way on READ — otherwise a freshly
     * published article shows "By Madonna Roshdey" everywhere except on
     * Madonna's own page, which is the one place it is expected.
     */
    const isDefaultAuthor = author.slug === DEFAULT_AUTHOR_SLUG;
    const authorFilter = isDefaultAuthor
      ? {
          $or: [
            { editorialAuthor: author._id },
            { editorialAuthor: { $exists: false } },
            { editorialAuthor: null },
          ],
        }
      : { editorialAuthor: author._id };

    const articles = await Blog.find({
      ...authorFilter,
      status: 'published',
    })
      // The shared card field set, plus the admin `author` this page resolves
      // its byline through. `subCategory` was the omission: without it an
      // author's articles were the one place a card could not show the
      // section it belongs to.
      //
      // `isFeatured` lets the author page promote the articles an editor
      // actually marked, rather than inventing a "featured" set out of
      // whichever three happen to be newest.
      //
      // `contentBlocks` is fetched but never returned — see the filter below.
      .select(`${BLOG_CARD_FIELDS} author isFeatured contentBlocks`)
      .populate('author', 'name')
      .populate('editorialAuthor', 'name slug')
      .populate('subCategory', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    /*
     * An article only counts for this language when it has TEXT of its own in
     * it — the same rule the article page 404s on.
     *
     * The client filtered these cards on the localized slug alone, which is a
     * weaker promise: an article can carry an Italian slug while every one of
     * its text blocks is scoped to other languages, and the route resolver
     * then refuses to render it. The author grid was linking straight to those
     * 404s. Deciding it here, where `contentBlocks` is already in hand, keeps
     * the rule on the server that owns it.
     *
     * The blocks are dropped before the response goes out: a card needs a
     * title and a thumbnail, and shipping every block of every article is the
     * payload blow-up BLOG_CARD_FIELDS exists to prevent.
     */
    const localizedArticles = articles
      .filter((article: any) => hasTextForLocale(article.contentBlocks, req.locale))
      .map((article: any) => {
        const card = { ...article };
        delete card.contentBlocks;
        return card;
      });

    res.json({
      success: true,
      // Localized, with every `slug` kept raw so the article links still resolve
      // per language. This response used to carry all four languages of the bio,
      // role and every article title — 86 KB on a single page.
      data: localizePreservingSlugs(
        {
          ...author.toObject(),
          articles: localizedArticles,
        },
        req.locale
      ),
    });
  } catch (error) {
    console.error('Error loading editorial author:', error);
    res.status(500).json({ success: false, error: 'Failed to load editorial author' });
  }
};
