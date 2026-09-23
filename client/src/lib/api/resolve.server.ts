/**
 * Slug -> content type, in one cached request.
 *
 * The shared [slug] route serves seven content types behind one URL shape and
 * used to find out which by asking seven endpoints in turn. Next never caches
 * a non-OK response, so every miss ahead of the real type hit the API on every
 * request — six wasted round trips for a destination, five for an article,
 * warm cache or not. This reader replaces that chain with one lookup that is
 * itself cached.
 *
 * It returns identity only. The entity is still read from its own endpoint,
 * because those reads are already cached and tagged individually.
 */
import { API_URL } from '@/config/api';
import { TOUR_TAG, TOUR_CATEGORY_TAG, TOUR_SUBCATEGORY_TAG } from './tour.server';

/** Mirrors the union the API returns. */
export type SlugResolutionType =
  | 'tour'
  | 'tour-category'
  | 'tour-subcategory'
  | 'blog-category'
  | 'blog-subcategory'
  | 'blog'
  | 'destination';

export type SlugResolution = {
  type: SlugResolutionType;
  id: string;
  /** The slug for the REQUESTED locale — what the route redirects to. */
  canonicalSlug: string;
};

/**
 * Catalog slugs change only when an editor saves, so an hour is safe as a
 * backstop; the tags below are what actually keep it fresh.
 */
const RESOLVE_TTL = 3600;

/**
 * Every family whose mutation can change what a slug resolves to — a new
 * entity, a deleted one, or a renamed slug.
 *
 * These are the existing, already-verified tags rather than a new
 * `slug-resolver` one: a new tag would have to be emitted by seven models'
 * hooks, and any model that forgot it would leave a stale resolution behind
 * with nothing to show for it. Reusing the graph means the invalidation that
 * already covers each entity covers its resolution too.
 *
 * `blog` covers blog posts, categories and subcategories — all three emit it
 * (BlogCategory and BlogSubCategory gained their hooks in the invalidation
 * task, and Blog's document-delete gap was closed after that).
 */
const RESOLVE_TAGS = [
  TOUR_TAG,
  TOUR_CATEGORY_TAG,
  TOUR_SUBCATEGORY_TAG,
  'blog',
  'destinations',
];

/**
 * Resolves a slug for one locale.
 *
 * Returns null when the slug genuinely does not exist for this locale — which
 * includes an entity that exists but has no slug in this language, because the
 * API applies the same strict rule the route always did.
 *
 * Throws on anything else. That distinction matters: a 404 means notFound(),
 * but a 500 or a dead API must NOT become a soft 404, or an outage would
 * deindex live pages. The caller decides what to do with the failure.
 */
export async function resolveSlug(
  slug: string,
  locale: string
): Promise<SlugResolution | null> {
  // Locale rides in the query string as well as the header: the header is what
  // the API reads, the query string is what gives each language its own Data
  // Cache entry. Header alone would let one locale's resolution — and its
  // canonical slug — be replayed to another.
  const url = `${API_URL}/resolve/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`;

  const res = await fetch(url, {
    headers: { 'X-Locale': locale },
    next: { revalidate: RESOLVE_TTL, tags: RESOLVE_TAGS },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    console.error(`[resolve.server] ${res.status} resolving "${slug}" (locale=${locale})`);
    throw new Error(`Slug resolution failed with ${res.status}`);
  }

  const json = (await res.json()) as { success?: boolean; data?: SlugResolution };
  if (!json?.success || !json.data?.type) return null;

  return json.data;
}
