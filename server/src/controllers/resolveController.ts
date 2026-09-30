import { Request, Response } from 'express';

import Tour from '../models/Tour';
import TourCategory from '../models/TourCategory';
import TourSubcategory from '../models/TourSubcategory';
import Blog from '../models/Blog';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';
import Destination, { PUBLIC_DESTINATION_FILTER } from '../models/Destination';

/**
 * Slug -> content type, in one request.
 *
 * ── Why this exists ──
 * The shared visitor route /[locale]/[slug] serves seven content types behind
 * one URL shape, and used to discover which by asking seven endpoints in turn
 * until one answered 200. Next never caches a non-OK response, so every miss
 * ahead of the real type hit this API on EVERY request, warm cache or not:
 * six wasted round trips for a destination, five for an article. That waterfall
 * was the dominant cost of a warm request on those pages.
 *
 * ── What it does NOT do ──
 * It returns identity only — type, id, canonical slug. The entity itself is
 * still read from its own endpoint, because those reads are already cached and
 * tagged individually; duplicating them here would mean a second copy of seven
 * detail endpoints to keep in sync, and a resolver payload of tens of KB where
 * a couple of hundred bytes will do.
 */

/** The response's `type` values. Mirrors the union the Next route already had. */
type SlugType =
  | 'tour'
  | 'tour-category'
  | 'tour-subcategory'
  | 'blog-category'
  | 'blog-subcategory'
  | 'blog'
  | 'destination';

/** The shape of a slug document after projection: identity plus slugs. */
type SlugDoc = { _id: unknown; slug?: Record<string, string> };

type Candidate = {
  type: SlugType;
  model: {
    findOne: (
      filter: Record<string, unknown>,
      projection: Record<string, number>
    ) => { lean: () => Promise<SlugDoc | null> };
  };
  /** Visibility filter — copied from each type's own by-slug controller. */
  filter: Record<string, unknown>;
};

/**
 * Matches the slug against EVERY locale, not just the requested one.
 *
 * That is deliberate and matches the existing by-slug controllers: a visitor on
 * /de/<english-slug> has to find the entity so the route can 308 them to the
 * German slug. Resolving only the request locale would turn those redirects
 * into 404s.
 */
const slugMatch = (slug: string) => ({
  $or: [
    { 'slug.en': slug },
    { 'slug.de': slug },
    { 'slug.it': slug },
    { 'slug.es': slug },
  ],
});

/**
 * PRECEDENCE. This order is load-bearing and is copied from the route's old
 * sequential probe chain — first match wins, so changing the order changes
 * which type a colliding slug resolves to. A database audit found zero
 * cross-type slug collisions today, but the order is preserved rather than
 * rationalised so that behaviour cannot drift if one ever appears.
 *
 * Each `filter` is the visibility rule that type's own by-slug endpoint
 * applies, so the resolver cannot surface something the detail endpoint would
 * then refuse to return.
 */
const CANDIDATES: Candidate[] = [
  { type: 'tour', model: Tour, filter: { isActive: { $ne: false } } },
  { type: 'tour-category', model: TourCategory, filter: { isActive: { $ne: false } } },
  { type: 'tour-subcategory', model: TourSubcategory, filter: { isActive: { $ne: false } } },
  { type: 'blog-category', model: BlogCategory, filter: { isActive: { $ne: false } } },
  { type: 'blog-subcategory', model: BlogSubCategory, filter: { isActive: { $ne: false } } },
  { type: 'blog', model: Blog, filter: { status: 'published' } },
  // A draft destination has no landing page, so its slug does not resolve.
  { type: 'destination', model: Destination, filter: PUBLIC_DESTINATION_FILTER },
];

const SUPPORTED_LOCALES = ['en', 'de', 'it', 'es'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const toLocale = (value: unknown): SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value as string)
    ? (value as SupportedLocale)
    : 'en';

/**
 * @desc    Resolve a slug to its content type, id and canonical slug
 * @route   GET /api/resolve/:slug
 * @access  Public
 */
export const resolveSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string' || slug.length > 200) {
      res.status(400).json({ success: false, error: 'Invalid slug' });
      return;
    }

    // `bypass` is an admin reading convention, not a language; it has no
    // canonical slug of its own, so it resolves as English here.
    const locale = toLocale(req.locale);
    const match = slugMatch(slug);

    /*
     * All seven lookups run together rather than in sequence. Each is a
     * findOne over an $or of four indexed slug paths, projected down to
     * { _id, slug } and lean() — the documents come back at a few dozen bytes,
     * so the wall clock is one round trip rather than seven.
     *
     * Precedence is applied afterwards, in code. Promise.all preserves input
     * order regardless of which query finishes first, so resolution can never
     * be decided by timing.
     */
    const results = await Promise.all(
      CANDIDATES.map((candidate) =>
        candidate.model
          .findOne({ ...candidate.filter, ...match }, { _id: 1, slug: 1 })
          .lean()
          .catch(() => null)
      )
    );

    for (let i = 0; i < CANDIDATES.length; i += 1) {
      const doc = results[i] as { _id: unknown; slug?: Record<string, string> } | null;
      if (!doc) continue;

      /*
       * Strict, exactly as the route's getLocaleSlug was: an entity that has
       * no slug in the REQUESTED language does not exist at this URL. It is
       * not served under another language's slug, and it does not fall back to
       * English — it drops through to the next candidate, and a 404 if none
       * match. That is what keeps each language to one indexable URL.
       */
      const canonicalSlug = doc.slug?.[locale];
      if (!canonicalSlug) continue;

      res.status(200).json({
        success: true,
        data: {
          type: CANDIDATES[i].type,
          id: String(doc._id),
          canonicalSlug,
        },
      });
      return;
    }

    /*
     * A real 404, not `{ type: null }` with a 200. Next must be able to tell
     * "no such slug" from "the resolver is broken": the first is notFound(),
     * the second must not become a soft 404 that removes a live page from the
     * index. It also means the miss is never stored in the Data Cache, so a
     * newly published slug resolves on its very next request.
     */
    res.status(404).json({ success: false, error: 'Slug not found' });
  } catch (error: unknown) {
    console.error('Error resolving slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve slug',
      message: error instanceof Error ? error.message : undefined,
    });
  }
};
