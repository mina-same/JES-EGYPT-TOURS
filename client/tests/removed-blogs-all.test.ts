import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { buildBlogCardViewModel } from '../src/lib/blog/cardViewModel';
import { buildSitemapEntries } from '../src/lib/seo/sitemapEntries';
import type { SitemapData } from '../src/lib/api/sitemap';

const clientSource = new URL('../src/', import.meta.url);
const serverSource = new URL('../../server/src/', import.meta.url);
const locales = ['en', 'de', 'it', 'es'] as const;

/** The removed listing, and the Tour hub removed before it. */
const removedPath = /^\/(?:en|de|it|es)\/(?:blogs\/all|tours(?:\/all)?)\/?$/;
/** A route literal or href builder for the removed listing or its tag filter. */
const routeReference = /blogs\/all|\/all\?tag=/;
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

test('the /blogs/all route is gone and the Blog hub route is untouched', () => {
  const blogs = new URL('app/(visitor)/[locale]/(home)/blogs/', clientSource);
  assert.equal(existsSync(new URL('all', blogs)), false);
  for (const file of ['page.tsx', 'layout.tsx', '_views/BlogsHubView.tsx']) {
    assert.ok(existsSync(new URL(file, blogs)), file);
  }
});

test('no source writes a /blogs/all href, tag link, menu entry or language exception', () => {
  const references: string[] = [];
  for (const root of [clientSource, serverSource]) {
    for (const file of sourceFiles(root)) {
      if (file.pathname.endsWith(retiredUrlMigration)) continue;
      if (routeReference.test(readFileSync(file, 'utf8'))) references.push(file.pathname);
    }
  }
  assert.deepEqual(references, []);
});

test('LanguageSelector keeps /blogs and has no /blogs/all special case', () => {
  const selector = readFileSync(
    new URL('components/common/LanguageSelector/LanguageSelector.tsx', clientSource),
    'utf8'
  );
  assert.ok(selector.includes('"/blogs"'));
  assert.equal(selector.includes('/blogs/all'), false);
});

test('a card never links to a tag listing; a sub-category still links to its page', () => {
  const slug = Object.fromEntries(locales.map(locale => [locale, 'travel-to-aswan']));
  const tags = Object.fromEntries(locales.map(locale => [locale, ['Aswan', 'Travel Tips']]));
  for (const locale of locales) {
    const tagged = buildBlogCardViewModel({ _id: 'a1', title: 'Aswan', slug, tags }, locale);
    assert.ok(tagged);
    assert.equal(tagged.categoryLink, '');
    assert.equal(tagged.link, `/${locale}/travel-to-aswan`);

    const classified = buildBlogCardViewModel({
      _id: 'a1', title: 'Aswan', slug, tags,
      subCategory: { name: 'Travel Tips', slug: Object.fromEntries(locales.map(l => [l, 'egypt-travel-tips'])) },
    }, locale);
    assert.ok(classified);
    assert.equal(classified.categoryLink, `/${locale}/egypt-travel-tips`);
  }
});

test('the sitemap lists the Blog hub and its real hierarchy, never /blogs/all', () => {
  const localized = (slug: string) => Object.fromEntries(locales.map(locale => [locale, slug]));
  const data: SitemapData = {
    tours: [], tourCategories: [], tourSubcategories: [],
    blogCategories: [{ slug: localized('egypt-blog') }],
    blogSubcategories: [{ slug: localized('egypt-travel-tips') }],
    blogs: [{ slug: localized('karnak-temple-visitor-guide'), locales: [...locales] }],
    destinations: [{ slug: localized('luxor') }],
    authors: [], faqLocales: [],
  };
  const paths = buildSitemapEntries(data, 'https://www.example.test').map(entry => {
    const url = new URL(entry.url);
    return url.pathname + url.search;
  });
  assert.ok(paths.every(path => !/\/blogs\/all/.test(path)));
  for (const locale of locales) {
    for (const slug of ['blogs', 'egypt-blog', 'egypt-travel-tips', 'karnak-temple-visitor-guide', 'luxor']) {
      assert.ok(paths.includes(`/${locale}/${slug}`), `${locale}/${slug}`);
    }
  }
});

test('the route-only labels are gone in every language and shared Blog labels remain', () => {
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(new URL(`i18n/locales/${locale}/blogs.json`, clientSource), 'utf8'));
    for (const key of ['allNews', 'viewAllNews', 'browseAllArticles']) assert.equal(key in messages, false, `${locale}.${key}`);
    for (const key of ['ourBlog', 'pageMetaTitle', 'exploreArticles', 'planYourJourney']) assert.ok(messages[key], `${locale}.${key}`);
  }
});

const origin = process.env.BLOGS_ALL_REMOVAL_TEST_ORIGIN;
test('HTTP: /blogs/all answers 404 in every state and the Blog pages keep working', { skip: !origin }, async () => {
  assert.match(origin!, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/, 'Verification is local only');

  // Removed: no redirect, no fallback to /blogs, no slug resolution, no 200 shell.
  for (const locale of locales) {
    for (const suffix of ['blogs/all', 'blogs/all?page=2', 'blogs/all?tag=aswan', 'tours', 'tours/all']) {
      const response = await fetch(`${origin}/${locale}/${suffix}`, { redirect: 'manual' });
      assert.equal(response.status, 404, `${locale}/${suffix}`);
      assert.equal(response.headers.get('location'), null, `${locale}/${suffix}`);
    }
  }

  // Kept: hub in four languages, then a category, a topic, a destination, an
  // article and Search with its Blog filter and Blog pagination.
  const paths = [
    ...locales.map(locale => `/${locale}/blogs`),
    '/en/egypt-blog', '/en/egypt-blog?page=2', '/en/egypt-travel-tips', '/en/luxor',
    '/en/what-to-see-at-saqqara', '/en/search', '/en/search?q=pyramids&blogPage=2',
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

  const hub = await (await fetch(`${origin}/en/blogs`)).text();
  assert.match(hub, /href="\/en\/egypt-blog"/, 'the hub still lists its categories');
  assert.match(hub, /href="\/en\/egypt-travel-tips"/, 'the hub still lists its topics');

  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    assert.equal(removedPath.test(new URL(match[1]).pathname), false, match[1]);
  }
  assert.ok(sitemap.includes('/en/blogs</loc>'));
});
