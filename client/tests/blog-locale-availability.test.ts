import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as client from '../src/lib/blog/availability';
import * as server from '../../server/src/utils/blogAvailability';
import { getLocaleCompleteness } from '../src/lib/localeCompleteness';
import { getBlogListingAlternates } from '../src/lib/blog/listingPage';
import { getStrictSlugLocaleAlternates } from '../src/lib/seo/localeAlternates';

/*
 * The visitor site never decides on its own whether an article exists in a
 * language: the API filters with server/src/utils/blogAvailability.ts and says
 * where an article is public (`availableLocales`). What the client does with
 * that — and the Admin's own copy of the rule — is checked here.
 */

const LANGS = ['en', 'de', 'it', 'es'] as const;
const BASE = 'https://www.jesegypttours.com';
type Doc = Record<string, unknown>;

// ── The Admin's copy of the rule is the server's ────────────────────────────

test('the browser copy of the rule uses the server\'s patterns, character for character', () => {
  assert.equal(client.BLOG_SLUG_PATTERN, server.BLOG_SLUG_PATTERN);
  assert.equal(client.NON_BLANK_PATTERN, server.NON_BLANK_PATTERN);
  assert.equal(client.VISIBLE_TEXT_PATTERN, server.VISIBLE_TEXT_PATTERN);
  assert.deepEqual([...client.TEXT_BLOCK_TYPES], [...server.TEXT_BLOCK_TYPES]);
  assert.deepEqual([...client.BLOG_LOCALES], [...server.BLOG_LOCALES]);
});

const html = (content: Doc, extra: Doc = {}) => ({ type: 'html', content, ...extra });
const FIXTURES: Doc[] = [
  { status: 'published', slug: { en: 'pyramids' }, title: { en: 'Pyramids' }, contentBlocks: [html({ en: '<p>Text</p>' })] },
  { status: 'published', slug: { en: 'Pyramids' }, title: { en: 'Pyramids' }, contentBlocks: [html({ en: '<p>Text</p>' })] },
  { status: 'published', slug: { en: 'pyramids' }, title: { en: ' ' }, contentBlocks: [html({ en: '<p>Text</p>' })] },
  { status: 'published', slug: { en: 'pyramids' }, title: { en: 'Pyramids' }, contentBlocks: [html({ en: '<p><br /></p>' })] },
  { status: 'published', slug: { en: 'pyramids' }, title: { en: 'Pyramids' }, contentBlocks: [html({ en: '<p>&nbsp;</p>' })] },
  { status: 'published', slug: { en: 'pyramids' }, title: { en: 'Pyramids' }, contentBlocks: [html({}, { title: { en: 'Heading' } })] },
  { status: 'published', slug: { en: 'pyramids' }, title: { en: 'Pyramids' }, contentBlocks: [html({ en: '<p>Text</p>' }, { languages: ['de'] })] },
  { status: 'draft', slug: { en: 'pyramids' }, title: { en: 'Pyramids' }, contentBlocks: [html({ en: '<p>Text</p>' })] },
  {
    status: 'published',
    slug: { en: 'khan', de: 'khan-basar', it: 'mercato-khan', es: 'khan-el-khalili' },
    title: { en: 'Khan', de: 'Khan', it: 'Khan', es: 'Khan' },
    contentBlocks: [html({ en: '<p>a</p>', de: '<p>b</p>', it: '<p>c</p>', es: '' })],
  },
];

test('…and answers every fixture as the server does', () => {
  for (const [index, article] of FIXTURES.entries()) {
    assert.deepEqual(client.availableBlogLocales(article), server.availableBlogLocales(article), `fixture ${index}`);
    for (const locale of LANGS) {
      assert.equal(client.hasLocalizedBody(article.contentBlocks, locale), server.hasLocalizedBody(article.contentBlocks, locale), `fixture ${index} / ${locale}`);
      assert.equal(client.isBlogLocaleReady(article, locale), server.isBlogLocaleReady(article, locale), `fixture ${index} / ${locale}`);
    }
  }
  assert.deepEqual(client.availableBlogLocales(FIXTURES[8]), ['en', 'de', 'it']);
});

// ── Admin language badges ───────────────────────────────────────────────────

const ARTICLE_CHECKS = [
  { label: 'Article text', isPresent: (entity: unknown, lang: string) => client.hasLocalizedBody((entity as Doc)?.contentBlocks, lang) },
];

test('a Blog article language with a title, a slug and metadata but no body is not complete', () => {
  // The Khan el Khalili case: every Spanish field but the body.
  const khan = {
    title: { en: 'Khan', de: 'Khan', it: 'Khan', es: 'Khan' },
    slug: { en: 'khan', de: 'khan-basar', it: 'mercato-khan', es: 'khan-el-khalili' },
    excerpt: { en: 'e', de: 'e', it: 'e', es: 'e' },
    metaTitle: { en: 'm', de: 'm', it: 'm', es: 'm' },
    contentBlocks: [html({ en: '<p>a</p>', de: '<p>b</p>', it: '<p>c</p>', es: '' })],
  };
  const before = getLocaleCompleteness(khan);
  assert.equal(before.es.state, 'complete', 'without the body check, Spanish looked complete');

  const report = getLocaleCompleteness(khan, { localizedChecks: ARTICLE_CHECKS });
  assert.equal(report.en.state, 'complete');
  assert.equal(report.de.state, 'complete');
  assert.equal(report.it.state, 'complete');
  assert.equal(report.es.state, 'partial');
  assert.deepEqual(report.es.missing, ['Article text']);
});

test('the body check is the Blog list\'s alone: other editors\' badges are unchanged', () => {
  const tour = { heading: { en: 'Nile cruise', de: 'Nilkreuzfahrt' }, contentBlocks: [] };
  assert.deepEqual(getLocaleCompleteness(tour), getLocaleCompleteness(tour, {}));
  assert.equal(getLocaleCompleteness(tour).de.state, 'complete');
  const page = readFileSync(new URL('../src/app/(admin)/admin/blogs/articles/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /localizedChecks=\{ARTICLE_LOCALIZED_CHECKS\}/);
  assert.match(page, /hasLocalizedBody\(/);
});

// ── Category and topic: page N names only the languages that have it ────────

test('page N alternates follow each language\'s own page count', () => {
  const slugs = { en: 'egypt-blog', de: 'aegypten-blog', it: 'blog-egitto', es: 'blog-de-egipto' };
  const pagesByLocale = { en: 4, de: 4, it: 3, es: 2 };
  const alternatesFor = (page: number) =>
    getBlogListingAlternates({ role: 'archive', page, locale: 'en', slug: 'egypt-blog', slugs, baseUrl: BASE, pagesByLocale });

  assert.deepEqual(Object.keys(alternatesFor(2).languages ?? {}).sort(), ['de', 'en', 'es', 'it', 'x-default']);
  assert.deepEqual(Object.keys(alternatesFor(3).languages ?? {}).sort(), ['de', 'en', 'it', 'x-default']);
  // EN has a page 4; Italian and Spanish do not.
  assert.deepEqual(alternatesFor(4).languages, {
    en: `${BASE}/en/egypt-blog?page=4`,
    de: `${BASE}/de/aegypten-blog?page=4`,
    'x-default': `${BASE}/en/egypt-blog?page=4`,
  });
  // x-default only where English has the page.
  const italian = getBlogListingAlternates({
    role: 'archive', page: 3, locale: 'it', slug: 'blog-egitto', slugs, baseUrl: BASE, pagesByLocale: { en: 2, de: 2, it: 3, es: 3 },
  });
  assert.deepEqual(Object.keys(italian.languages ?? {}).sort(), ['es', 'it']);
  // A destination's page N still has none.
  assert.deepEqual(
    getBlogListingAlternates({ role: 'landing', page: 2, locale: 'en', slug: 'cairo', slugs: { en: 'cairo' }, baseUrl: BASE, pagesByLocale }),
    { canonical: `${BASE}/en/cairo` },
  );
});

// ── The article page ────────────────────────────────────────────────────────

const route = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/[slug]/page.tsx', import.meta.url), 'utf8');

test('the article page exists where the API says it is public, and nowhere else', () => {
  assert.match(route, /if \(!blog\.availableLocales\?\.includes\(locale\)\) return null;/);
  assert.doesNotMatch(route, /hasNoContentForLocale/, 'no second copy of the rule in the route');
});

test('article alternates name only the languages the article is public in', () => {
  assert.match(route, /const availableSlugs = slugsInLocales\(blog\.slug, blog\.availableLocales\);/);
  assert.match(route, /getStrictSlugLocaleAlternates\(\{ locale, currentSlug: slug, slugs: availableSlugs, baseUrl \}\)/);
  // What that produces for the Khan el Khalili article (public en/de/it).
  const slugs = { en: 'khan', de: 'khan-basar', it: 'mercato-khan', es: 'khan-el-khalili' };
  const available = ['en', 'de', 'it'];
  const restricted = Object.fromEntries(Object.entries(slugs).filter(([language]) => available.includes(language)));
  const alternates = getStrictSlugLocaleAlternates({ locale: 'en', currentSlug: 'khan', slugs: restricted, baseUrl: BASE });
  assert.deepEqual(Object.keys(alternates.languages ?? {}).sort(), ['de', 'en', 'it', 'x-default']);
  // An article public only in German has no x-default (it follows English).
  const german = getStrictSlugLocaleAlternates({ locale: 'de', currentSlug: 'nur-deutsch', slugs: { de: 'nur-deutsch' }, baseUrl: BASE });
  assert.deepEqual(Object.keys(german.languages ?? {}), ['de']);
});

test('the language switcher on an article offers its available languages only', () => {
  const view = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/[slug]/_views/BlogDetailView.tsx', import.meta.url), 'utf8');
  assert.match(view, /Object\.entries\(allSlugs\)\.filter\(\(\[language\]\) => blog\.availableLocales\?\.includes\(language\)\)/);
  assert.match(view, /<SlugManager slugs=\{localizedSlugs\} \/>/);
});

// ── Search ──────────────────────────────────────────────────────────────────

test('Search sends the visitor\'s language with its article request', async () => {
  const page = readFileSync(new URL('../src/components/sections/SearchResultsPage/SearchResultsPage.tsx', import.meta.url), 'utf8');
  const request = page.slice(page.indexOf('const fetchBlogs = async () => {'), page.indexOf('void fetchBlogs();'));
  assert.match(request, /\r?\n\s+locale,\r?\n/, 'the request options carry the locale');
  assert.match(page, /void fetchBlogs\(\);\s+\}, \[q, blogPage, appliedFilters\.blogSubCategory, locale\]\);/);

  // …which getAllBlogs turns into the X-Locale header the API reads.
  const { getAllBlogs } = await import('../src/lib/api/blog');
  const calls: { url: string; init?: RequestInit }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 6, total: 0, pages: 0 } }));
  }) as typeof fetch;
  try {
    await getAllBlogs({ page: 1, limit: 6, search: 'khan', locale: 'es' });
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /[?&]locale=es(?:&|$)/);
  assert.deepEqual((calls[0].init?.headers as Record<string, string>)['X-Locale'], 'es');
});

// ── Caching: every read that carries Blog articles is keyed by language and
//    cleared by the `blog` tag every article write sends ────────────────────

test('reads that embed Blog articles are cleared by the blog tag, and listings are keyed by language', () => {
  const read = (file: string) => readFileSync(new URL(`../src/lib/api/${file}`, import.meta.url), 'utf8');
  const destination = read('destination.ts');
  const tours = read('tour.server.ts');
  const blog = read('blog.ts');
  // A destination's handpicked articles, a tour category's or subcategory's featured ones.
  assert.match(destination, /next: \{ revalidate: 3600, tags: \['destinations', BLOG_TAG\] \}/);
  assert.match(tours, /tags: \[TOUR_CATEGORY_TAG, DESTINATION_TAG, BLOG_TAG\]/);
  assert.match(tours, /tags: \[TOUR_SUBCATEGORY_TAG, DESTINATION_TAG, BLOG_TAG\]/);
  // The three listings: one cache entry per page AND language, so totals never cross languages.
  for (const path of ['/blog/categories/${categorySlug}/posts', '/blog/subcategories/${subCategorySlug}/posts']) {
    assert.ok(blog.includes(`${path}?page=\${listingPage}&limit=\${limit}\${locale ? \`&locale=\${locale}\` : ''}`), path);
  }
  assert.ok(destination.includes("/destinations/${id}/blogs?page=${listingPage}&limit=${limit}${locale ? `&locale=${locale}` : ''}"));
});
