import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  getSitemapData,
  isSitemapData,
  SITEMAP_TTL,
  type SitemapData,
  type SitemapEntity,
} from '../src/lib/api/sitemap';
import { buildSitemapEntries, ROUTE_FOLDERS } from '../src/lib/seo/sitemapEntries';
import { getLocalizedStaticPath } from '../src/lib/url';

const BASE = 'https://www.example.test';
const LOCALES = ['en', 'de', 'it', 'es'] as const;

const empty = (): SitemapData => ({
  tours: [],
  tourCategories: [],
  tourSubcategories: [],
  blogCategories: [],
  blogSubcategories: [],
  blogs: [],
  destinations: [],
  authors: [],
  faqLocales: ['en', 'de', 'it', 'es'],
});

const urls = (data: SitemapData) => buildSitemapEntries(data, BASE).map((entry) => entry.url);
const contentUrls = (data: SitemapData) => {
  const statics = new Set(urls(empty()));
  return urls(data).filter((url) => !statics.has(url));
};

test('static pages: the same URLs the sitemap always listed, with no invented dates', () => {
  // The previous sitemap's static block, reproduced.
  const expected: string[] = [];
  for (const path of ['', '/faq', '/tours', '/blogs', '/privacy-policy', '/payment-cancellation-policy']) {
    for (const locale of LOCALES) {
      if (path === '/faq' && locale === 'it') continue;
      expected.push(`${BASE}/${locale}${path}`);
    }
  }
  for (const slug of ['special-offers', 'tailor-made', 'contact', 'about', 'travel-trade']) {
    for (const locale of LOCALES) expected.push(`${BASE}${getLocalizedStaticPath(slug, locale)}`);
  }

  const data = { ...empty(), faqLocales: ['en', 'de', 'es'] as SitemapData['faqLocales'] };
  const entries = buildSitemapEntries(data, BASE);
  assert.deepEqual(entries.map((e) => e.url), expected);
  assert.ok(entries.every((e) => !('lastModified' in e)), 'static pages have no reliable timestamp');
  assert.equal(entries.find((e) => e.url === `${BASE}/de/aegypten-dmc`)?.priority, 0.9);
});

test('an entity is listed in exactly the languages it has a strict, stored slug for', () => {
  const tour: SitemapEntity = {
    slug: { en: 'nile-cruise', de: 'Nil-Kreuzfahrt', it: ' crociera-nilo', es: 'nc' },
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const entries = buildSitemapEntries({ ...empty(), tours: [tour] }, BASE).filter((e) => e.url.includes('nile') || e.url.includes('crociera'));
  // de: uppercase; it: needs trimming, so the stored value would not resolve; es: too short.
  assert.deepEqual(entries.map((e) => e.url), [`${BASE}/en/nile-cruise`]);
  assert.equal(entries[0].lastModified, '2026-09-01T10:00:00.000Z');
  assert.equal(entries[0].changeFrequency, 'daily');
});

test('articles are listed only in the languages they have text in', () => {
  const blog: SitemapEntity = {
    slug: { en: 'pyramids', de: 'pyramiden', it: 'piramidi', es: 'piramides' },
    locales: ['en', 'de', 'it'],
  };
  assert.deepEqual(contentUrls({ ...empty(), blogs: [blog] }), [
    `${BASE}/en/pyramids`,
    `${BASE}/de/pyramiden`,
    `${BASE}/it/piramidi`,
  ]);
  assert.deepEqual(contentUrls({ ...empty(), blogs: [{ slug: { en: 'no-text' } }] }), []);
});

test('every family is included; "No Index" is respected', () => {
  const data: SitemapData = {
    ...empty(),
    tourCategories: [{ slug: { en: 'egypt-tour-packages', de: 'aegypten-rundreise' } }],
    tourSubcategories: [{ slug: { en: 'egypt-classic-tours' } }],
    blogCategories: [{ slug: { en: 'egypt-blog' } }],
    blogSubcategories: [{ slug: { en: 'travel-tips' }, noIndex: true }],
    destinations: [{ slug: { en: 'cairo', de: 'kairo' } }, { slug: { en: 'giza' }, noIndex: true }],
  };
  assert.deepEqual(contentUrls(data), [
    `${BASE}/en/egypt-tour-packages`,
    `${BASE}/de/aegypten-rundreise`,
    `${BASE}/en/egypt-classic-tours`,
    `${BASE}/en/egypt-blog`,
    `${BASE}/en/cairo`,
    `${BASE}/de/kairo`,
  ]);
});

test('a URL is listed only for the entity the resolver answers it with', () => {
  // Same slug in two families: the tour (higher precedence) owns it.
  assert.deepEqual(
    contentUrls({ ...empty(), tours: [{ slug: { en: 'luxor' } }], destinations: [{ slug: { en: 'luxor' } }] }),
    [`${BASE}/en/luxor`]
  );
  const shared = { ...empty(), tours: [{ slug: { en: 'luxor' } }], destinations: [{ slug: { en: 'luxor', de: 'luxor-de' } }] };
  assert.equal(buildSitemapEntries(shared, BASE).filter((e) => e.url === `${BASE}/en/luxor`).length, 1);

  // The tour holds "aswan" in German and has an English slug of its own: the
  // resolver answers /en/aswan with the tour (and redirects), so the
  // destination's /en/aswan is not a page of its own.
  assert.deepEqual(
    contentUrls({ ...empty(), tours: [{ slug: { en: 'aswan-tour', de: 'aswan' } }], destinations: [{ slug: { en: 'aswan' } }] }),
    [`${BASE}/en/aswan-tour`, `${BASE}/de/aswan`]
  );

  // Without an English slug the tour cannot answer /en/aswan; the resolver
  // moves on to destinations, which does.
  assert.deepEqual(
    contentUrls({ ...empty(), tours: [{ slug: { de: 'aswan' } }], destinations: [{ slug: { en: 'aswan' } }] }),
    [`${BASE}/de/aswan`, `${BASE}/en/aswan`]
  );

  // Within a family the first document holding the slug decides.
  assert.deepEqual(
    contentUrls({
      ...empty(),
      blogs: [
        { slug: { en: 'first-article', de: 'shared-slug' }, locales: ['en', 'de'] },
        { slug: { en: 'shared-slug' }, locales: ['en'] },
      ],
    }),
    [`${BASE}/en/first-article`, `${BASE}/de/shared-slug`]
  );

  // A "No Index" entity still answers its URL, so nothing else is listed there.
  assert.deepEqual(
    contentUrls({ ...empty(), tours: [{ slug: { en: 'giza' } }], destinations: [{ slug: { en: 'giza' } }] }).length,
    1
  );
  assert.deepEqual(
    contentUrls({ ...empty(), tourCategories: [{ slug: { en: 'giza' }, noIndex: true }], destinations: [{ slug: { en: 'giza' } }] }),
    []
  );
});

test('slugs owned by a static route or redirect are never listed as content', () => {
  const data = {
    ...empty(),
    tours: [
      { slug: { en: 'faq' } },
      { slug: { de: 'kontakt' } },
      { slug: { en: 'sonderangebote' } },
      { slug: { en: 'wishlist' } },
      { slug: { en: 'real-tour' } },
    ],
  };
  assert.deepEqual(contentUrls(data), [`${BASE}/en/real-tour`]);
});

test('the reserved route list matches the route folders on disk', () => {
  const dir = fileURLToPath(new URL('../src/app/(visitor)/[locale]/(home)/', import.meta.url));
  const folders = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('[') && !d.name.startsWith('(') && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort();
  assert.deepEqual([...ROUTE_FOLDERS].sort(), folders);
});

test('authors: served languages only, a valid slug, no invented date', () => {
  const entries = buildSitemapEntries(
    { ...empty(), authors: [{ slug: 'madonna-roshdey', locales: ['en', 'it'] }, { slug: 'Bad Name', locales: ['en'] }] },
    BASE
  ).filter((e) => e.url.includes('/authors/'));
  assert.deepEqual(entries.map((e) => e.url), [`${BASE}/en/authors/madonna-roshdey`, `${BASE}/it/authors/madonna-roshdey`]);
  assert.ok(entries.every((e) => !('lastModified' in e)));
});

test('the output never repeats a URL', () => {
  const data: SitemapData = {
    ...empty(),
    tours: [{ slug: { en: 'a-tour', de: 'a-tour' } }, { slug: { en: 'a-tour' } }],
    blogs: [{ slug: { en: 'an-article' }, locales: ['en'] }],
    authors: [{ slug: 'x-author', locales: ['en'] }, { slug: 'x-author', locales: ['en'] }],
  };
  const list = urls(data);
  assert.equal(new Set(list).size, list.length);
});

test('the reader: tagged, bounded, and it throws instead of returning nothing', async (t) => {
  const realFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  let seenInit: any;
  const respond = (status: number, body: unknown) => {
    globalThis.fetch = (async (_url: unknown, init?: unknown) => {
      seenInit = init;
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
  };

  respond(200, { success: true, data: empty() });
  assert.deepEqual(await getSitemapData(), empty());
  assert.deepEqual(seenInit.next, { revalidate: SITEMAP_TTL, tags: ['blog', 'tours', 'faq'] });
  assert.equal(SITEMAP_TTL, 3600);

  respond(500, { success: false });
  await assert.rejects(getSitemapData(), /500/);
  respond(200, { success: false });
  await assert.rejects(getSitemapData(), /not sitemap data/);
  respond(200, { success: true, data: { tours: [] } });
  await assert.rejects(getSitemapData(), /not sitemap data/);
  globalThis.fetch = (async () => {
    throw new TypeError('fetch failed');
  }) as typeof fetch;
  await assert.rejects(getSitemapData(), /fetch failed/);

  assert.equal(isSitemapData(empty()), true);
  assert.equal(isSitemapData({ ...empty(), blogs: [{ slug: 'plain-string' }] }), false);
  assert.equal(isSitemapData({ ...empty(), authors: [{ slug: 1, locales: [] }] }), false);
});
