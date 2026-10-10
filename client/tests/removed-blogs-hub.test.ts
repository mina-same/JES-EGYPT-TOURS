import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { BLOG_HUB_HREF_BY_LOCALE } from '../src/data/blogHub';
import { buildSitemapEntries, ROUTE_FOLDERS, STATIC_PAGES } from '../src/lib/seo/sitemapEntries';
import type { SitemapData } from '../src/lib/api/sitemap';

const clientSource = new URL('../src/', import.meta.url);
const serverSource = new URL('../../server/src/', import.meta.url);
const locales = ['en', 'de', 'it', 'es'] as const;

/** Every removed hub and listing: /blogs, /blogs/all, /tours, /tours/all. */
const removedPath = /^\/(?:en|de|it|es)\/(?:blogs|tours)(?:\/all)?\/?$/;
/**
 * A visitor route literal or href builder for /blogs: "/blogs", '/en/blogs',
 * `/${locale}/blogs?page=2`. API paths (/destinations/:id/blogs), the Admin
 * area (/admin/blogs/…) and the `blogs` translation namespace are unrelated.
 */
const routeLiteral = /["'`](?:\/(?:en|de|it|es|\$\{[^}]+\}))?\/blogs(?:\/all)?["'`?#]/;
const routeField = /\b(?:link|href|url|path):\s*["'`]blogs(?:\/all)?["'`]/;
/** Lists retired menu URLs in order to DELETE them from stored menus. */
const retiredUrlMigration = 'scripts/removeContentViews.ts';

function sourceFiles(directory: URL, found: URL[] = []): URL[] {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) sourceFiles(file, found);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) found.push(file);
  }
  return found;
}

test('the /blogs route folder is gone', () => {
  assert.equal(existsSync(new URL('app/(visitor)/[locale]/(home)/blogs', clientSource)), false);
});

test('no source writes a /blogs href, menu URL, sitemap entry or language exception', () => {
  const references: string[] = [];
  for (const root of [clientSource, serverSource]) {
    for (const file of sourceFiles(root)) {
      if (file.pathname.endsWith(retiredUrlMigration)) continue;
      const content = readFileSync(file, 'utf8');
      if (routeLiteral.test(content) || routeField.test(content)) references.push(file.pathname);
    }
  }
  assert.deepEqual(references, []);
  assert.equal(STATIC_PAGES.includes('/blogs'), false);
  assert.equal(ROUTE_FOLDERS.includes('blogs'), false);
});

test('the sitemap lists the Egypt Blog hub in each language and no removed route', () => {
  const hubSlug = Object.fromEntries(locales.map(locale => [locale, BLOG_HUB_HREF_BY_LOCALE[locale].split('/')[2]]));
  const localized = (slug: string) => Object.fromEntries(locales.map(locale => [locale, slug]));
  const data: SitemapData = {
    tours: [{ slug: localized('sample-tour') }],
    tourCategories: [{ slug: localized('egypt-tour-packages') }],
    tourSubcategories: [],
    blogCategories: [{ slug: hubSlug }],
    blogSubcategories: [{ slug: localized('egypt-travel-tips') }],
    blogs: [{ slug: localized('karnak-temple-visitor-guide'), locales: [...locales] }],
    destinations: [{ slug: localized('luxor') }],
    authors: [], faqLocales: [...locales],
  };
  const paths = buildSitemapEntries(data, 'https://www.example.test').map(entry => new URL(entry.url).pathname);
  assert.deepEqual(paths.filter(path => removedPath.test(path)), []);
  for (const locale of locales) {
    assert.ok(paths.includes(BLOG_HUB_HREF_BY_LOCALE[locale]), BLOG_HUB_HREF_BY_LOCALE[locale]);
    for (const slug of ['egypt-travel-tips', 'karnak-temple-visitor-guide', 'luxor', 'sample-tour', 'egypt-tour-packages']) {
      assert.ok(paths.includes(`/${locale}/${slug}`), `${locale}/${slug}`);
    }
  }
});

test('the hub-only labels are gone in every language and shared Blog labels remain', () => {
  const hubOnly = [
    'blogCategoriesTitle', 'exploreStories', 'knowledgeBase', 'exploreByTopics',
    'topics', 'exploreArticles', 'pageMetaTitle', 'pageMetaDescription',
  ];
  for (const locale of locales) {
    const blogs = JSON.parse(readFileSync(new URL(`i18n/locales/${locale}/blogs.json`, clientSource), 'utf8'));
    for (const key of hubOnly) assert.equal(key in blogs, false, `${locale}.${key}`);
    for (const key of ['ourBlog', 'planYourJourney', 'browseArticles', 'allArticles']) assert.ok(blogs[key], `${locale}.${key}`);

    const common = JSON.parse(readFileSync(new URL(`i18n/locales/${locale}/common.json`, clientSource), 'utf8'));
    assert.equal('blog' in common.pageNames, false, `${locale}.pageNames.blog`);
    assert.ok(common.footer.destinations.blog, `${locale}: the footer still names its Blog link`);
  }
});

const origin = process.env.BLOGS_HUB_REMOVAL_TEST_ORIGIN;
test('HTTP: /blogs answers 404 in every language and the Blog pages keep working', { skip: !origin }, async () => {
  assert.match(origin!, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/, 'Verification is local only');

  // Removed: no redirect, no fallback to the Egypt Blog or Home, no slug resolution.
  for (const locale of locales) {
    for (const suffix of ['blogs', 'blogs?page=2', 'blogs/all', 'tours', 'tours/all']) {
      const response = await fetch(`${origin}/${locale}/${suffix}`, { redirect: 'manual' });
      assert.equal(response.status, 404, `${locale}/${suffix}`);
      assert.equal(response.headers.get('location'), null, `${locale}/${suffix}`);
    }
  }

  // Kept: the Egypt Blog hub in four languages, then a topic, a destination,
  // an article and Search.
  const paths = [
    ...locales.map(locale => `/${locale}`),
    ...locales.map(locale => BLOG_HUB_HREF_BY_LOCALE[locale]),
    '/en/egypt-travel-tips', '/en/luxor', '/en/what-to-see-at-saqqara', '/en/search',
  ];
  for (const path of paths) {
    const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    const html = await response.text();
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const pathname = new URL(match[1].replace(/&amp;/g, '&'), origin).pathname;
      assert.equal(removedPath.test(pathname), false, `${path}: ${match[1]}`);
    }
    assert.match(html, /noindex, nofollow/, 'Pre-launch protection remains');
  }

  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    assert.equal(removedPath.test(new URL(match[1]).pathname), false, match[1]);
  }
  for (const locale of locales) {
    assert.ok(sitemap.includes(`${BLOG_HUB_HREF_BY_LOCALE[locale]}</loc>`), BLOG_HUB_HREF_BY_LOCALE[locale]);
  }
});
