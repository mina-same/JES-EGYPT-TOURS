import { Request, Response } from 'express';
import type { PipelineStage } from 'mongoose';

import Tour from '../models/Tour';
import TourCategory from '../models/TourCategory';
import TourSubcategory from '../models/TourSubcategory';
import Blog from '../models/Blog';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';
import Destination from '../models/Destination';
import EditorialAuthor from '../models/EditorialAuthor';
import Faq from '../models/Faq';
import { hasTextForLocale } from '../utils/blogBlocks';
import { narrowFaqsToLocale } from '../utils/localize';

/**
 * Everything the sitemap needs, and nothing else, in one request.
 *
 * ── Why this exists ──
 * The sitemap used to assemble itself from visitor endpoints that answer other
 * questions:
 *   - /blog/posts?limit=1000&fields=slug — `fields` is not a parameter there,
 *     so every article came back whole (author, category, SEO fields, excerpt)
 *     to read one slug from each;
 *   - /tours?limit=1000&fields=slug — the listing's paginator caps `limit` at
 *     100, so a hundred-and-first tour would silently never be listed;
 *   - /blog/authors — runs the default-author upsert, a database write, on a
 *     process's first call.
 * None of them could say what a sitemap has to know: which URLs the live pages
 * answer, in which languages, and when each one last changed.
 *
 * ── Visibility ──
 * Every family uses the same filter as the slug resolver (resolveController
 * CANDIDATES), which copies each type's own by-slug endpoint, so an entity is
 * listed exactly when its URL resolves. tests/sitemap.test.ts compares the two;
 * change them together.
 *
 * ── Shape ──
 * Raw per-locale slugs, not URLs. Which slugs become URLs is decided in one
 * place, the front end's sitemap builder, with the same strict slug rule the
 * pages use for hreflang. `noIndex` travels as a flag instead of filtering the
 * entity out here: a noIndex entity still answers its URLs, so the builder has
 * to know those slugs are taken even though it will not list them.
 *
 * All of it is projection: no article bodies, FAQs, images or SEO text leave
 * the database — for articles, MongoDB itself reduces each content block to
 * "has text in this language", see blogTextFlags below.
 */

const LOCALES = ['en', 'de', 'it', 'es'] as const;
type Locale = (typeof LOCALES)[number];
type LocalizedSlugs = Partial<Record<Locale, string>>;

/** One content entity as the sitemap sees it. */
export interface SitemapEntity {
  slug: LocalizedSlugs;
  /** ISO timestamp of the document's last write, when it has one. */
  updatedAt?: string;
  /** The editor's "No Index" switch (articles, blog categories/topics, destinations). */
  noIndex?: true;
  /** Articles only: the languages the article has text of its own in. */
  locales?: Locale[];
}

export interface SitemapData {
  tours: SitemapEntity[];
  tourCategories: SitemapEntity[];
  tourSubcategories: SitemapEntity[];
  blogCategories: SitemapEntity[];
  blogSubcategories: SitemapEntity[];
  blogs: SitemapEntity[];
  destinations: SitemapEntity[];
  /** Active editorial authors and the languages their page is served in. */
  authors: { slug: string; locales: Locale[] }[];
  /** The languages whose /faq page has questions of its own. */
  faqLocales: Locale[];
}

/**
 * The resolver's visibility filters (resolveController CANDIDATES), per model.
 * Exported for tests/sitemap.test.ts, which checks them against the resolver.
 */
export const SITEMAP_VISIBILITY = {
  tours: { isActive: { $ne: false } },
  tourCategories: { isActive: { $ne: false } },
  tourSubcategories: { isActive: { $ne: false } },
  blogCategories: { isActive: { $ne: false } },
  blogSubcategories: { isActive: { $ne: false } },
  blogs: { status: 'published' },
  destinations: { isActive: { $ne: false } },
} as const;

const ENTITY_PROJECTION = { slug: 1, updatedAt: 1, noIndex: 1 } as const;

/**
 * Only string values of the four languages. A slug stored as a bare string
 * never resolves (the resolver reads `slug[locale]`), so it yields nothing.
 */
const pickSlugs = (slug: unknown): LocalizedSlugs => {
  if (!slug || typeof slug !== 'object' || Array.isArray(slug)) return {};
  const out: LocalizedSlugs = {};
  for (const locale of LOCALES) {
    const value = (slug as Record<string, unknown>)[locale];
    if (typeof value === 'string' && value) out[locale] = value;
  }
  return out;
};

const toEntity = (doc: { slug?: unknown; updatedAt?: unknown; noIndex?: unknown }): SitemapEntity => ({
  slug: pickSlugs(doc.slug),
  ...(doc.updatedAt instanceof Date && !Number.isNaN(doc.updatedAt.getTime())
    ? { updatedAt: doc.updatedAt.toISOString() }
    : {}),
  ...(doc.noIndex === true ? { noIndex: true as const } : {}),
});

type ProjectableModel = {
  find: (
    filter: Record<string, unknown>,
    projection: Record<string, number>
  ) => { sort: (sort: Record<string, 1 | -1>) => { lean: () => Promise<unknown[]> } };
};

/** Visible documents of one family, oldest first — the resolver's natural order. */
const readFamily = async (model: ProjectableModel, filter: Record<string, unknown>) => {
  const docs = await model.find(filter, ENTITY_PROJECTION).sort({ _id: 1 }).lean();
  return (docs as Parameters<typeof toEntity>[0][]).map(toEntity);
};

/**
 * `true` when the value at `path` is a string with more than whitespace in it.
 * The one piece of the article rule MongoDB evaluates, so that no article text
 * has to leave the database; $cond keeps $trim away from non-strings.
 */
const hasOwnTextExpr = (path: string) => ({
  $cond: [
    { $eq: [{ $type: path }, 'string'] },
    { $gt: [{ $strLenCP: { $trim: { input: path } } }, 0] },
    false,
  ],
});

const textFlags = (base: string) =>
  Object.fromEntries(LOCALES.map((locale) => [locale, hasOwnTextExpr(`${base}.${locale}`)]));

/**
 * Each content block reduced to its type, its language list and, per language,
 * whether its content / title has text. utils/blogBlocks.ts then applies the
 * page's own rule to that skeleton — the rule itself stays in one place.
 */
export const BLOG_TEXT_PIPELINE: PipelineStage[] = [
  { $match: SITEMAP_VISIBILITY.blogs },
  { $sort: { _id: 1 } },
  {
    $project: {
      slug: 1,
      updatedAt: 1,
      noIndex: 1,
      blocks: {
        $map: {
          input: { $cond: [{ $isArray: '$contentBlocks' }, '$contentBlocks', []] },
          as: 'b',
          in: {
            type: '$$b.type',
            languages: '$$b.languages',
            content: textFlags('$$b.content'),
            title: textFlags('$$b.title'),
          },
        },
      },
    },
  },
];

type BlockFlags = { type?: unknown; languages?: unknown; content?: Record<string, boolean>; title?: Record<string, boolean> };

/** A text-less stand-in for each block: "x" where the language has text, "" where not. */
const skeletonOf = (blocks: unknown): unknown[] =>
  (Array.isArray(blocks) ? (blocks as BlockFlags[]) : []).map((block) => ({
    type: block?.type,
    languages: block?.languages,
    content: Object.fromEntries(LOCALES.map((locale) => [locale, block?.content?.[locale] ? 'x' : ''])),
    title: Object.fromEntries(LOCALES.map((locale) => [locale, block?.title?.[locale] ? 'x' : ''])),
  }));

/** The languages an article page is served in: the page 404s on the others. */
export const articleLocales = (blocks: unknown): Locale[] => {
  const skeleton = skeletonOf(blocks);
  return LOCALES.filter((locale) => hasTextForLocale(skeleton, locale));
};

const readBlogs = async (): Promise<SitemapEntity[]> => {
  const docs = (await Blog.aggregate(BLOG_TEXT_PIPELINE)) as (Parameters<typeof toEntity>[0] & { blocks?: unknown })[];
  return docs.map((doc) => ({ ...toEntity(doc), locales: articleLocales(doc.blocks) }));
};

/**
 * Authors exactly as their page decides (editorialAuthorController →
 * availableLocales): active, and served in the languages with a biography.
 * Read-only on purpose — the public author endpoints run the default-author
 * upsert first, which writes to the database.
 */
const readAuthors = async (): Promise<SitemapData['authors']> => {
  const docs = (await EditorialAuthor.find({ isActive: true }, { slug: 1, bio: 1 }).sort({ _id: 1 }).lean()) as {
    slug?: unknown;
    bio?: Record<string, unknown>;
  }[];
  return docs
    .filter((doc): doc is { slug: string; bio?: Record<string, unknown> } => typeof doc.slug === 'string' && doc.slug.length > 0)
    .map((doc) => ({
      slug: doc.slug,
      locales: LOCALES.filter(
        (locale) => typeof doc.bio?.[locale] === 'string' && (doc.bio[locale] as string).trim().length > 0
      ),
    }));
};

/**
 * The /faq page 404s in a language with no questions of its own. It reads
 * GET /faqs?isActive=true&displayOnHome=false&sort=category,order&limit=200
 * (client/src/lib/faqLocales.ts); this is that same query, narrowed per
 * language by the same helper the endpoint uses, so the two cannot disagree.
 */
const readFaqLocales = async (): Promise<Locale[]> => {
  const rows = await Faq.find({ isActive: true, displayOnHome: false }, { question: 1, answer: 1, isActive: 1 })
    .sort({ category: 1, order: 1 })
    .limit(200)
    .lean();
  return LOCALES.filter((locale) => (narrowFaqsToLocale(rows, locale) as unknown[]).length > 0);
};

/**
 * @desc    Sitemap source data: visible entities' slugs, dates and flags
 * @route   GET /api/sitemap
 * @access  Public
 */
export const getSitemapData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      tours,
      tourCategories,
      tourSubcategories,
      blogCategories,
      blogSubcategories,
      blogs,
      destinations,
      authors,
      faqLocales,
    ] = await Promise.all([
      readFamily(Tour as unknown as ProjectableModel, SITEMAP_VISIBILITY.tours),
      readFamily(TourCategory as unknown as ProjectableModel, SITEMAP_VISIBILITY.tourCategories),
      readFamily(TourSubcategory as unknown as ProjectableModel, SITEMAP_VISIBILITY.tourSubcategories),
      readFamily(BlogCategory as unknown as ProjectableModel, SITEMAP_VISIBILITY.blogCategories),
      readFamily(BlogSubCategory as unknown as ProjectableModel, SITEMAP_VISIBILITY.blogSubcategories),
      readBlogs(),
      readFamily(Destination as unknown as ProjectableModel, SITEMAP_VISIBILITY.destinations),
      readAuthors(),
      readFaqLocales(),
    ]);

    const data: SitemapData = {
      tours,
      tourCategories,
      tourSubcategories,
      blogCategories,
      blogSubcategories,
      blogs,
      destinations,
      authors,
      faqLocales,
    };
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    // A 500, never a partial or empty 200: the front end must be able to tell
    // "the site has no URLs" from "the data could not be read".
    console.error('Error building sitemap data:', error);
    res.status(500).json({ success: false, error: 'Failed to build sitemap data' });
  }
};
