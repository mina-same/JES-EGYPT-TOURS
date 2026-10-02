import type { MetadataRoute } from 'next';
import {
  getLocalizedStaticPath,
  getStrictLocalizedSlug,
  LOCALIZED_STATIC_SLUGS,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/lib/url';
import { SITEMAP_FAMILIES, type SitemapData, type SitemapEntity } from '@/lib/api/sitemap';

type Entry = MetadataRoute.Sitemap[number];
type Family = (typeof SITEMAP_FAMILIES)[number];

/** Route folders under app/(visitor)/[locale]/(home), listed in every language. */
export const STATIC_PAGES = ['', '/faq', '/tours', '/blogs', '/privacy-policy', '/payment-cancellation-policy'];

/** Static pages with a per-locale slug (lib/url/staticSlugs.ts). */
export const LOCALIZED_STATIC_PAGES = ['special-offers', 'tailor-made', 'contact', 'about', 'travel-trade'];

/**
 * Every route folder next to [slug] in app/(visitor)/[locale]/(home). A request
 * whose first segment is one of these — or a localized static slug, which
 * next.config.ts rewrites or redirects — never reaches the [slug] route, so a
 * database slug equal to one cannot be served there. tests/sitemap-entries
 * checks this list against the folders on disk.
 */
export const ROUTE_FOLDERS = [
  '404', 'about', 'authors', 'blogs', 'contact', 'faq', 'login', 'payment-cancellation-policy',
  'privacy-policy', 'search', 'special-offers', 'tailor-made', 'tours', 'travel-trade', 'wishlist',
];

const RESERVED_SEGMENTS = new Set<string>([
  ...ROUTE_FOLDERS,
  ...Object.entries(LOCALIZED_STATIC_SLUGS).flatMap(([canonical, slugs]) => [canonical, ...Object.values(slugs)]),
]);

/**
 * The content families in the slug resolver's precedence order
 * (server/src/controllers/resolveController.ts CANDIDATES). The order decides
 * which entity answers a slug two of them share, so it must stay identical.
 */
const FAMILY_SETTINGS: Record<Family, Pick<Entry, 'changeFrequency' | 'priority'>> = {
  tours: { changeFrequency: 'daily', priority: 0.9 },
  tourCategories: { changeFrequency: 'weekly', priority: 0.8 },
  tourSubcategories: { changeFrequency: 'weekly', priority: 0.8 },
  blogCategories: { changeFrequency: 'weekly', priority: 0.6 },
  blogSubcategories: { changeFrequency: 'weekly', priority: 0.6 },
  blogs: { changeFrequency: 'monthly', priority: 0.7 },
  destinations: { changeFrequency: 'weekly', priority: 0.7 },
};

/**
 * Which entity a request for /{locale}/{slug} resolves to, decided the way the
 * API resolver decides it: families in precedence order; within a family, the
 * first document holding the slug in ANY language; and that document answers
 * only if it has a slug of its own in the requested language — otherwise the
 * resolver moves on to the next family. A URL is listed only for the entity
 * that answers it with that exact slug, so no alias, wrong-language slug or
 * redirecting URL can enter the sitemap.
 */
function createResolver(data: SitemapData) {
  const holders = SITEMAP_FAMILIES.map((family) => {
    const first = new Map<string, SitemapEntity>();
    for (const entity of data[family]) {
      for (const value of Object.values(entity.slug)) {
        if (value && !first.has(value)) first.set(value, entity);
      }
    }
    return first;
  });
  return (slug: string, locale: SupportedLocale): SitemapEntity | null => {
    for (const byValue of holders) {
      const entity = byValue.get(slug);
      if (entity?.slug[locale]) return entity;
    }
    return null;
  };
}

/** The entity's own last-write time, when it has a usable one; never "now". */
const lastModifiedOf = (updatedAt: string | undefined): Pick<Entry, 'lastModified'> =>
  updatedAt && !Number.isNaN(Date.parse(updatedAt)) ? { lastModified: updatedAt } : {};

/**
 * The sitemap's entries.
 *
 * One URL per language a page is served in — the same scheme the pages' own
 * hreflang alternates use — and only:
 *   - the canonical slug for that language, under the pages' strict slug rule,
 *     and exactly as stored (a slug that needs trimming does not resolve);
 *   - for the entity the resolver actually answers that URL with (the API
 *     sends published entities only, so a draft has no URL here);
 *   - for articles, only in the languages the article has text in (the page
 *     404s in the others);
 *   - never under a segment a static route or redirect owns.
 * `lastModified` is the entity's own write time. Static pages and author pages
 * have no reliable one — the default author's is rewritten by an upsert on
 * every API start — so theirs is omitted rather than invented.
 */
export function buildSitemapEntries(data: SitemapData, baseUrl: string): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PAGES) {
    for (const locale of SUPPORTED_LOCALES) {
      // /faq 404s in a language with no questions of its own.
      if (path === '/faq' && !data.faqLocales.includes(locale)) continue;
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : path.endsWith('policy') ? 0.4 : 0.8,
      });
    }
  }

  for (const canonicalSlug of LOCALIZED_STATIC_PAGES) {
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}${getLocalizedStaticPath(canonicalSlug, locale)}`,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  const resolve = createResolver(data);
  for (const family of SITEMAP_FAMILIES) {
    for (const entity of data[family]) {
      for (const locale of SUPPORTED_LOCALES) {
        const slug = getStrictLocalizedSlug(entity.slug, locale);
        if (!slug || slug !== entity.slug[locale]) continue;
        if (RESERVED_SEGMENTS.has(slug)) continue;
        if (resolve(slug, locale) !== entity) continue;
        if (family === 'blogs' && !entity.locales?.includes(locale)) continue;
        entries.push({
          url: `${baseUrl}/${locale}/${slug}`,
          ...lastModifiedOf(entity.updatedAt),
          ...FAMILY_SETTINGS[family],
        });
        if (family === 'tourCategories' || family === 'tourSubcategories') {
          for (let page = 2; page <= (entity.pageCounts?.[locale] || 1); page += 1) {
            entries.push({
              url: `${baseUrl}/${locale}/${slug}?page=${page}`,
              ...lastModifiedOf(entity.updatedAt),
              ...FAMILY_SETTINGS[family],
            });
          }
        }
      }
    }
  }

  // Author pages: the slug is a person's name, the same in every language; the
  // page is served in the languages the author has a biography in.
  for (const author of data.authors) {
    const slug = getStrictLocalizedSlug(author.slug, 'en');
    if (!slug || slug !== author.slug) continue;
    for (const locale of SUPPORTED_LOCALES) {
      if (!author.locales.includes(locale)) continue;
      entries.push({
        url: `${baseUrl}/${locale}/authors/${slug}`,
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  }

  // A URL is listed once; the first claim wins (static pages come first).
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
