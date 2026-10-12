import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  BLOG_LISTING_PAGE_SIZE,
  getBlogListingAlternates,
  getBlogListingRobots,
  parseBlogListingQuery,
  resolveBlogListingRequest,
  servesBlogListingPage,
  withPageNumber,
  type BlogListingOutcome,
  type ListingQuery,
} from '../src/lib/blog/listingPage';
import { buildSitemapEntries } from '../src/lib/seo/sitemapEntries';

/*
 * The Blog listing URL contract (lib/blog/listingPage.ts): a Blog category, a
 * topic and the article section of a destination page answer `?page=` by one
 * set of rules, and differ only in what a page that exists is — a page of its
 * own on an archive, a state of the landing page on a destination.
 *
 * Everything the route decides is decided by resolveBlogListingRequest, so it
 * is exercised here against in-memory listings; the last test repeats the
 * matrix over HTTP against a running build when given one.
 */

const BASE = 'https://www.jesegypttours.com';
const LOCALES = ['en', 'de', 'it', 'es'] as const;

type Article = { _id: string; slug: Record<string, string> };
type Listing = { data: Article[]; pagination: { page: number; limit: number; total: number; pages: number } };

const article = (index: number, locales: readonly string[] = LOCALES): Article => ({
  _id: `article-${index}`,
  slug: Object.fromEntries(locales.map((locale) => [locale, `${locale}-article-${index}`])),
});

/** A listing of `articles` as the API pages it, and how often it was read. */
const listingOf = (articles: Article[]) => {
  const reads: number[] = [];
  const read = async (page: number): Promise<Listing> => {
    reads.push(page);
    const start = (page - 1) * BLOG_LISTING_PAGE_SIZE;
    return {
      data: articles.slice(start, start + BLOG_LISTING_PAGE_SIZE),
      pagination: {
        page,
        limit: BLOG_LISTING_PAGE_SIZE,
        total: articles.length,
        pages: Math.ceil(articles.length / BLOG_LISTING_PAGE_SIZE),
      },
    };
  };
  return { read, reads };
};
const articles = (count: number) => Array.from({ length: count }, (_, index) => article(index + 1));

type Entity = { name: string; role: 'archive' | 'landing'; slugs: Record<string, string>; count: number };
// The current shape of the real data: 24 articles in the category and in its
// one topic (three pages), seven in Cairo (one page), none in Hurghada.
const CATEGORY: Entity = {
  name: 'category', role: 'archive', count: 24,
  slugs: { en: 'egypt-blog', de: 'aegypten-blog', it: 'blog-egitto', es: 'blog-de-egipto' },
};
const TOPIC: Entity = {
  name: 'topic', role: 'archive', count: 24,
  slugs: { en: 'egypt-travel-tips', de: 'aegypten-reisetipps', it: 'consigli-viaggio-egitto', es: 'consejos-viaje-egipto' },
};
const CAIRO: Entity = {
  name: 'destination', role: 'landing', count: 7,
  slugs: { en: 'cairo', de: 'kairo', it: 'il-cairo', es: 'el-cairo' },
};
const HURGHADA: Entity = {
  name: 'empty destination', role: 'landing', count: 0,
  slugs: { en: 'hurghada', de: 'hurghada', it: 'hurghada', es: 'hurghada' },
};

/** A request for `/{locale}/{slug}?{query}` on an entity. `slug` defaults to its own in that language. */
const request = async (
  entity: Entity,
  query: ListingQuery,
  { locale = 'en', slug, store = articles(entity.count) }: { locale?: string; slug?: string; store?: Article[] } = {},
) => {
  const { read, reads } = listingOf(store);
  const outcome: BlogListingOutcome<Listing> = await resolveBlogListingRequest({
    query,
    locale,
    slug: slug ?? entity.slugs[locale],
    canonicalSlug: entity.slugs[locale],
    read,
  });
  return { outcome, reads };
};

const ids = (outcome: BlogListingOutcome<Listing>) =>
  outcome.status === 200 ? outcome.listing.data.map((item) => item._id) : null;

const withFlag = <T,>(value: string | undefined, run: () => T): T => {
  const previous = process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  else process.env.NEXT_PUBLIC_SITE_INDEXABLE = value;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_INDEXABLE;
    else process.env.NEXT_PUBLIC_SITE_INDEXABLE = previous;
  }
};

// ── The page parameter ──────────────────────────────────────────────────────

test('a page is a plain positive integer; the clean URL is page 1', () => {
  assert.deepEqual(parseBlogListingQuery({}), { page: 1, search: '', isCanonical: true });
  for (const value of ['2', '3', '17']) {
    assert.deepEqual(parseBlogListingQuery({ page: value }), { page: Number(value), search: `?page=${value}`, isCanonical: true });
  }
});

test('another spelling of a page is that page, and not its canonical URL', () => {
  assert.deepEqual(parseBlogListingQuery({ page: '1' }), { page: 1, search: '', isCanonical: false });
  assert.deepEqual(parseBlogListingQuery({ page: '01' }), { page: 1, search: '', isCanonical: false });
  assert.deepEqual(parseBlogListingQuery({ page: '02' }), { page: 2, search: '?page=2', isCanonical: false });
  assert.deepEqual(parseBlogListingQuery({ page: '003' }), { page: 3, search: '?page=3', isCanonical: false });
});

test('anything else names no page: nothing is floored, clamped or defaulted', () => {
  // "+2" reaches the route as " 2" (a query-string plus is a space) and "%2B2" as "+2".
  const malformed = ['0', '-1', '1.5', '2.9', '1.2', 'abc', '', ' 2', '+2', '0x2', '2e1', 'Infinity', 'NaN', '2 ', '٢', '99999999999999999999'];
  for (const value of malformed) {
    assert.equal(parseBlogListingQuery({ page: value }), null, JSON.stringify(value));
  }
});

test('a repeated page parameter is invalid, whatever its values', () => {
  assert.equal(parseBlogListingQuery({ page: ['2', '3'] }), null);
  assert.equal(parseBlogListingQuery({ page: ['2', '2'] }), null);
});

test('tracking parameters ride along; any other parameter is not part of the URL space', () => {
  assert.deepEqual(parseBlogListingQuery({ utm_source: 'x' }), { page: 1, search: '?utm_source=x', isCanonical: true });
  assert.deepEqual(parseBlogListingQuery({ page: '2', utm_source: 'x' }), { page: 2, search: '?page=2&utm_source=x', isCanonical: true });
  assert.deepEqual(parseBlogListingQuery({ page: '1', gclid: 'abc' }), { page: 1, search: '?gclid=abc', isCanonical: false });
  for (const query of [{ foo: 'bar' }, { page: '2', foo: 'bar' }, { PAGE: '2' }, { tag: 'aswan' }]) {
    assert.equal(parseBlogListingQuery(query), null, JSON.stringify(query));
  }
  // The Tour listing's own filters are as unknown here as anything else —
  // even in a form that parser would accept or normalize away.
  for (const query of [{ q: 'nile' }, { sort: 'recommended' }, { sort: 'price-asc' }, { destinations: 'cairo' }, { minPrice: '5' }, { q: '' }]) {
    assert.equal(parseBlogListingQuery(query), null, JSON.stringify(query));
  }
});

// ── The route: category and topic ───────────────────────────────────────────

for (const entity of [CATEGORY, TOPIC]) {
  const clean = `/en/${entity.slugs.en}`;

  test(`${entity.name}: the clean URL and every page it has answer 200 with that page's cards`, async () => {
    const first = await request(entity, {});
    assert.equal(first.outcome.status, 200);
    assert.deepEqual(ids(first.outcome), articles(9).map((item) => item._id));

    const second = await request(entity, { page: '2' });
    assert.equal(second.outcome.status, 200);
    assert.deepEqual(ids(second.outcome), articles(18).slice(9).map((item) => item._id));

    const last = await request(entity, { page: '3' });
    assert.equal(last.outcome.status, 200);
    assert.deepEqual(ids(last.outcome), articles(24).slice(18).map((item) => item._id), 'the last page holds the six left');
  });

  test(`${entity.name}: page 1 has one URL — ?page=1 and ?page=01 redirect to it unread`, async () => {
    for (const value of ['1', '01', '001']) {
      const { outcome, reads } = await request(entity, { page: value });
      assert.deepEqual(outcome, { status: 308, location: clean }, value);
      assert.deepEqual(reads, [], 'page 1 always exists, so nothing is read to redirect');
    }
  });

  test(`${entity.name}: a leading-zero spelling of a page that exists redirects to ?page=N`, async () => {
    assert.deepEqual((await request(entity, { page: '02' })).outcome, { status: 308, location: `${clean}?page=2` });
    assert.deepEqual((await request(entity, { page: '003' })).outcome, { status: 308, location: `${clean}?page=3` });
  });

  test(`${entity.name}: a page past the last is a 404 — and is never the target of a redirect`, async () => {
    for (const value of ['4', '5', '21', '999999']) {
      assert.deepEqual((await request(entity, { page: value })).outcome, { status: 404 }, value);
    }
    // "?page=04" must not be sent on to "?page=4", which does not exist.
    assert.deepEqual((await request(entity, { page: '04' })).outcome, { status: 404 });
  });

  test(`${entity.name}: malformed and repeated page values are a 404 before anything is read`, async () => {
    const malformed: ListingQuery[] = [
      { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: '2.9' }, { page: 'abc' }, { page: '' },
      { page: ' 2' }, { page: '+2' }, { page: '0x2' }, { page: '2e1' }, { page: 'Infinity' },
      { page: ['2', '3'] }, { page: '2', foo: 'bar' }, { foo: 'bar' },
    ];
    for (const query of malformed) {
      const { outcome, reads } = await request(entity, query);
      assert.deepEqual(outcome, { status: 404 }, JSON.stringify(query));
      assert.deepEqual(reads, [], `${JSON.stringify(query)}: no listing read`);
    }
  });

  test(`${entity.name}: a slug alias redirects to the localized slug and keeps the page`, async () => {
    const german = `/de/${entity.slugs.de}`;
    const alias = { locale: 'de', slug: entity.slugs.en };
    assert.deepEqual((await request(entity, {}, alias)).outcome, { status: 308, location: german });
    assert.deepEqual((await request(entity, { page: '2' }, alias)).outcome, { status: 308, location: `${german}?page=2` });
    assert.deepEqual((await request(entity, { page: '02' }, alias)).outcome, { status: 308, location: `${german}?page=2` });
    // Page 1 lands on the clean localized URL, tracking kept.
    assert.deepEqual((await request(entity, { page: '1' }, alias)).outcome, { status: 308, location: german });
    assert.deepEqual((await request(entity, { page: '01', utm_source: 'x' }, alias)).outcome, { status: 308, location: `${german}?utm_source=x` });
    // An alias rescues neither a malformed page nor one that does not exist.
    assert.deepEqual((await request(entity, { page: 'abc' }, alias)).outcome, { status: 404 });
    assert.deepEqual((await request(entity, { page: '4' }, alias)).outcome, { status: 404 });
    // The localized slug itself is served, not redirected.
    assert.equal((await request(entity, { page: '2' }, { locale: 'de' })).outcome.status, 200);
  });

  test(`${entity.name}: with no articles the landing page is still page 1, and it has no page 2`, async () => {
    const empty = { store: [] as Article[] };
    assert.equal((await request(entity, {}, empty)).outcome.status, 200);
    assert.deepEqual((await request(entity, { page: '1' }, empty)).outcome, { status: 308, location: clean });
    assert.deepEqual((await request(entity, { page: '2' }, empty)).outcome, { status: 404 });
  });

  test(`${entity.name}: a page the API counts but this language cannot draw a card for is a 404 there`, async () => {
    // Ten articles, the tenth with no Italian or Spanish URL: page 2 holds it alone.
    const store = [...articles(9), article(10, ['en', 'de'])];
    assert.equal((await request(entity, { page: '2' }, { store })).outcome.status, 200);
    assert.equal((await request(entity, { page: '2' }, { store, locale: 'de' })).outcome.status, 200);
    assert.deepEqual((await request(entity, { page: '2' }, { store, locale: 'it' })).outcome, { status: 404 });
    assert.deepEqual((await request(entity, { page: '2' }, { store, locale: 'es' })).outcome, { status: 404 });
    // Its page 1 is unaffected.
    assert.equal((await request(entity, {}, { store, locale: 'it' })).outcome.status, 200);
  });

  test(`${entity.name}: page 1 is self-canonical with the normal language cluster`, () => {
    assert.deepEqual(
      getBlogListingAlternates({ role: entity.role, page: 1, locale: 'en', slug: entity.slugs.en, slugs: entity.slugs, baseUrl: BASE }),
      {
        canonical: `${BASE}${clean}`,
        languages: {
          en: `${BASE}${clean}`,
          de: `${BASE}/de/${entity.slugs.de}`,
          it: `${BASE}/it/${entity.slugs.it}`,
          es: `${BASE}/es/${entity.slugs.es}`,
          'x-default': `${BASE}${clean}`,
        },
      },
    );
  });

  test(`${entity.name}: page 2 is self-canonical and its alternates are page 2, never page 1`, () => {
    for (const locale of LOCALES) {
      const alternates = getBlogListingAlternates({
        role: entity.role, page: 2, locale, slug: entity.slugs[locale], slugs: entity.slugs, baseUrl: BASE,
        articles: articles(18).slice(9),
      });
      assert.equal(alternates.canonical, `${BASE}/${locale}/${entity.slugs[locale]}?page=2`, locale);
      assert.deepEqual(alternates.languages, {
        en: `${BASE}${clean}?page=2`,
        de: `${BASE}/de/${entity.slugs.de}?page=2`,
        it: `${BASE}/it/${entity.slugs.it}?page=2`,
        es: `${BASE}/es/${entity.slugs.es}?page=2`,
        'x-default': `${BASE}${clean}?page=2`,
      }, locale);
    }
  });

  test(`${entity.name}: a language that does not serve the page gets no alternate for it`, () => {
    const alternates = getBlogListingAlternates({
      role: entity.role, page: 2, locale: 'en', slug: entity.slugs.en, slugs: entity.slugs, baseUrl: BASE,
      articles: [article(10, ['en', 'de'])],
    });
    assert.deepEqual(Object.keys(alternates.languages ?? {}).sort(), ['de', 'en', 'x-default']);
  });

  test(`${entity.name}: every page it has is indexable once the site is, and none before`, () => {
    for (const page of [1, 2, 3]) {
      assert.deepEqual(withFlag('true', () => getBlogListingRobots(entity.role, page)), { index: true, follow: true }, `page ${page}`);
      assert.deepEqual(withFlag(undefined, () => getBlogListingRobots(entity.role, page)), { index: false, follow: false }, `page ${page}`);
    }
  });
}

// ── The route: destination ──────────────────────────────────────────────────

test('destination: one page of articles — the clean URL is it, and page 2 does not exist', async () => {
  const first = await request(CAIRO, {});
  assert.equal(first.outcome.status, 200);
  assert.equal(ids(first.outcome)?.length, 7);
  assert.deepEqual((await request(CAIRO, { page: '1' })).outcome, { status: 308, location: '/en/cairo' });
  assert.deepEqual((await request(CAIRO, { page: '01' })).outcome, { status: 308, location: '/en/cairo' });
  for (const value of ['2', '02', '3', '999999']) {
    assert.deepEqual((await request(CAIRO, { page: value })).outcome, { status: 404 }, value);
  }
  for (const value of ['0', 'abc', '', '1.5']) {
    assert.deepEqual((await request(CAIRO, { page: value })).outcome, { status: 404 }, value);
  }
});

test('destination with no articles: the landing page is valid, and no page value makes another', async () => {
  const clean = await request(HURGHADA, {});
  assert.equal(clean.outcome.status, 200);
  assert.deepEqual(ids(clean.outcome), []);
  assert.deepEqual((await request(HURGHADA, { page: '1' })).outcome, { status: 308, location: '/en/hurghada' });
  for (const value of ['2', '3', '21', '999999', '0', 'abc']) {
    assert.deepEqual((await request(HURGHADA, { page: value })).outcome, { status: 404 }, value);
  }
  for (const locale of ['de', 'it', 'es']) {
    assert.deepEqual((await request(HURGHADA, { page: '2' }, { locale })).outcome, { status: 404 }, locale);
  }
});

test('destination: a slug alias keeps the page it can keep', async () => {
  const alias = { locale: 'de', slug: 'cairo' };
  assert.deepEqual((await request(CAIRO, {}, alias)).outcome, { status: 308, location: '/de/kairo' });
  assert.deepEqual((await request(CAIRO, { page: '1' }, alias)).outcome, { status: 308, location: '/de/kairo' });
  assert.deepEqual((await request(CAIRO, { page: '2' }, alias)).outcome, { status: 404 }, 'Cairo has one page');
  const store = articles(11);
  assert.deepEqual((await request(CAIRO, { page: '2' }, { ...alias, store })).outcome, { status: 308, location: '/de/kairo?page=2' });
});

test('destination with more than one page (synthetic): page 2 is served as a state of the landing page', async () => {
  // No real destination has ten articles yet; eleven here, so two pages.
  const store = articles(11);
  const second = await request(CAIRO, { page: '2' }, { store });
  assert.equal(second.outcome.status, 200);
  assert.deepEqual(ids(second.outcome), ['article-10', 'article-11']);
  assert.deepEqual((await request(CAIRO, { page: '3' }, { store })).outcome, { status: 404 });

  const alternates = getBlogListingAlternates({
    role: 'landing', page: 2, locale: 'en', slug: 'cairo', slugs: CAIRO.slugs, baseUrl: BASE, articles: store.slice(9),
  });
  // Canonical to the clean destination URL, and no language cluster at all.
  assert.deepEqual(alternates, { canonical: `${BASE}/en/cairo` });

  assert.deepEqual(withFlag('true', () => getBlogListingRobots('landing', 2)), { index: false, follow: true });
  assert.deepEqual(withFlag(undefined, () => getBlogListingRobots('landing', 2)), { index: false, follow: false });
});

test('destination: the clean page keeps its own canonical, language cluster and indexability', () => {
  assert.deepEqual(
    getBlogListingAlternates({ role: 'landing', page: 1, locale: 'de', slug: 'kairo', slugs: CAIRO.slugs, baseUrl: BASE }),
    {
      canonical: `${BASE}/de/kairo`,
      languages: {
        en: `${BASE}/en/cairo`, de: `${BASE}/de/kairo`, it: `${BASE}/it/il-cairo`, es: `${BASE}/es/el-cairo`,
        'x-default': `${BASE}/en/cairo`,
      },
    },
  );
  assert.deepEqual(withFlag('true', () => getBlogListingRobots('landing', 1)), { index: true, follow: true });
  assert.deepEqual(withFlag(undefined, () => getBlogListingRobots('landing', 1)), { index: false, follow: false });
});

// ── Pieces ──────────────────────────────────────────────────────────────────

test('page 1 exists with nothing to list; a later page needs the count and a card', () => {
  assert.equal(servesBlogListingPage({ data: [], pagination: { pages: 0 } }, 1, 'en'), true);
  assert.equal(servesBlogListingPage({ data: [], pagination: { pages: 0 } }, 2, 'en'), false);
  assert.equal(servesBlogListingPage({ data: [article(10)], pagination: { pages: 2 } }, 2, 'en'), true);
  assert.equal(servesBlogListingPage({ data: [article(10)], pagination: { pages: 2 } }, 3, 'en'), false);
  assert.equal(servesBlogListingPage({ data: [], pagination: { pages: 3 } }, 3, 'en'), false, 'counted, but nothing came back');
  // A malformed slug is no URL, so no card.
  assert.equal(servesBlogListingPage({ data: [{ slug: { en: 'Not A Slug' } }], pagination: { pages: 2 } }, 2, 'en'), false);
  assert.equal(servesBlogListingPage({ data: [article(10)] }, 2, 'en'), false, 'no pagination: only page 1');
});

test('a paged title is the editorial title, then the localized page number', () => {
  const pattern = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}/common.json`, import.meta.url), 'utf8')).pagination.page as string;
  const expected: Record<string, string> = {
    en: 'Egypt Travel Blog – Page 2',
    de: 'Egypt Travel Blog – Seite 2',
    it: 'Egypt Travel Blog – Pagina 2',
    es: 'Egypt Travel Blog – Página 2',
  };
  for (const locale of LOCALES) {
    assert.equal(withPageNumber('Egypt Travel Blog', 2, pattern(locale)), expected[locale], locale);
    assert.equal(withPageNumber('Egypt Travel Blog', 1, pattern(locale)), 'Egypt Travel Blog', `${locale}: page 1 is untouched`);
  }
  assert.equal(withPageNumber('Egypt Travel Tips', 3, 'Page {{page}}'), 'Egypt Travel Tips – Page 3');
  assert.equal(withPageNumber('Egypt Travel Tips', 3, 'pagination.page'), 'Egypt Travel Tips – 3', 'a missing translation still numbers the page');
});

// ── The route file uses the contract, and nothing else ──────────────────────

const route = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/[slug]/page.tsx', import.meta.url), 'utf8');
const between = (from: string, to: string) => {
  const start = route.indexOf(from);
  const end = route.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, `route markers ${from} … ${to}`);
  return route.slice(start, end);
};

test('the route reads ?page= through the contract only', () => {
  assert.doesNotMatch(route, /Number\(rawPage\)|Math\.floor\(parsedPage\)|query\.page/, 'no loose parse of ?page= is left');
  // The contract's three outcomes become the response: a redirect, a 404, or the page.
  assert.match(route, /if \(outcome\.status === 308\) permanentRedirect\(outcome\.location\);\s+return outcome\.status === 404 \? null : outcome;/);
  assert.match(route, /const settled = await settleBlogListing\(\.\.\.request\);\s+if \(!settled\) notFound\(\);/);

  const render = {
    category: between('// ── 3. Blog Category', '// ── 4. Blog Subcategory'),
    topic: between('// ── 4. Blog Subcategory', '// ── 5. Blog Post'),
    destination: between('// ── 5.5. Destination', '// ── 6. Tour'),
  };
  const metadata = {
    category: between('if (resolved?.type === "blogCategory") {', 'if (resolved?.type === "blogSubcategory") {'),
    topic: between('if (resolved?.type === "blogSubcategory") {', 'if (resolved?.type === "blog") {'),
    destination: between('if (resolved?.type === "destination") {', 'if (resolved?.type === "tour") {'),
  };
  for (const [name, source] of Object.entries(render)) {
    assert.match(source, /readBlogListingPage\(/, `${name}: the page is settled by the contract`);
  }
  for (const [name, source] of Object.entries(metadata)) {
    // Where the page answers 404 the metadata is the not-found one — never a
    // canonical, a title or alternates for a page that does not exist.
    assert.match(source, /const settled = await settleBlogListing\([\s\S]*?\);\s+if \(!settled\) return notFoundMetadata\(\);/, `${name}: metadata settled by the contract`);
  }
  for (const [name, source] of [...Object.entries(render), ...Object.entries(metadata)]) {
    // The alias redirect used to be built here, without the query.
    assert.doesNotMatch(source, /redirectTarget/, `${name}: no redirect of its own`);
  }

  // What a page that exists is: its own page on an archive, a state on a landing page.
  for (const name of ['category', 'topic'] as const) {
    assert.match(metadata[name], /role: "archive"/, name);
    assert.match(metadata[name], /robots: getBlogListingRobots\("archive", page\)/, name);
    assert.match(metadata[name], /title: await withListingPage\(/, `${name}: page-numbered title`);
  }
  assert.match(metadata.destination, /role: "landing"/);
  assert.match(metadata.destination, /robots: getBlogListingRobots\("landing", page\)/);
  assert.doesNotMatch(metadata.destination, /withListingPage/, 'a destination keeps its title on every page');
});

test('the visitor page size is 9 on all three listings', () => {
  assert.equal(BLOG_LISTING_PAGE_SIZE, 9);
  assert.equal(route.match(/BLOG_LISTING_PAGE_SIZE, locale\)/g)?.length, 3);
});

test('the topic view brings the list into view on a page change, as the category and destination views do', () => {
  const view = (name: string) =>
    readFileSync(new URL(`../src/app/(visitor)/[locale]/(home)/[slug]/_views/${name}.tsx`, import.meta.url), 'utf8');
  for (const name of ['BlogCategoryView', 'BlogSubcategoryView', 'DestinationView']) {
    const source = view(name);
    assert.match(source, /useSearchParams\(\)/, name);
    // Not on the first render, then on every change of ?page=.
    assert.match(
      source,
      /if \(isFirstRender\.current\) \{ isFirstRender\.current = false; return; \}\s+\w+\.current\?\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\);\s+\}, \[page\]\);/,
      name,
    );
  }
  // The ref is on the section that holds the paged grid.
  const topic = view('BlogSubcategoryView');
  const section = topic.slice(topic.indexOf('<section ref={allArticlesRef}'));
  assert.ok(section.length > 0, 'the All Articles section carries the ref');
  assert.match(section.slice(0, section.indexOf('</section>')), /pagination=\{blogsData\?\.pagination\}/);
});

// ── Sitemap: page 1 only ────────────────────────────────────────────────────

test('the sitemap lists page 1 of a Blog listing and never a later page', () => {
  const pageCounts = { en: 3, de: 3, it: 3, es: 3 };
  const entries = buildSitemapEntries({
    tours: [], tourCategories: [], tourSubcategories: [], blogs: [], authors: [], faqLocales: [],
    blogCategories: [{ slug: CATEGORY.slugs, pageCounts }],
    blogSubcategories: [{ slug: TOPIC.slugs, pageCounts }],
    destinations: [{ slug: CAIRO.slugs, pageCounts }],
  } as never, BASE).map((entry) => entry.url);

  for (const entity of [CATEGORY, TOPIC, CAIRO]) {
    for (const locale of LOCALES) assert.ok(entries.includes(`${BASE}/${locale}/${entity.slugs[locale]}`), `${entity.name} ${locale}`);
  }
  assert.deepEqual(entries.filter((url) => url.includes('?')), [], 'no query-string URL for a Blog listing');
});

// ── Over HTTP, against a running build ──────────────────────────────────────

const origin = process.env.BLOG_PAGINATION_TEST_ORIGIN;
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const decode = (value: string) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const attribute = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
  return match ? decode(match[1]) : null;
};
const path = (url: string | null) => String(url ?? '').replace(/^https?:\/\/[^/]+/, '');
// What a reader gets: no scripts (the i18n bundle rides in them), no React comment nodes.
const visible = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');

async function get(url: string) {
  const response = await fetch(`${origin}${url}`, { redirect: 'manual', headers: { 'User-Agent': GOOGLEBOT } });
  const html = await response.text();
  const links = [...html.matchAll(/<link\s[^>]*>/g)].map((match) => match[0]);
  const grid = (visible(html).match(/<section class="blog-page">[\s\S]*?<\/section>/) ?? [''])[0];
  return {
    status: response.status,
    location: path(response.headers.get('location')) || null,
    canonical: path(links.filter((tag) => attribute(tag, 'rel') === 'canonical').map((tag) => attribute(tag, 'href'))[0] ?? null) || null,
    hreflang: Object.fromEntries(
      links
        .filter((tag) => attribute(tag, 'rel') === 'alternate' && attribute(tag, 'hrefLang'))
        .map((tag) => [attribute(tag, 'hrefLang'), path(attribute(tag, 'href'))]),
    ) as Record<string, string>,
    title: decode((html.match(/<title>([\s\S]*?)<\/title>/) ?? ['', ''])[1]),
    cards: (grid.match(/<article[\s>]/g) ?? []).length,
    hrefs: [...visible(html).matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((match) => decode(match[1])),
    pagerHrefs: [...grid.matchAll(/<nav[\s\S]*?<\/nav>/g)].flatMap((nav) =>
      [...nav[0].matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((match) => decode(match[1])),
    ),
  };
}

test('HTTP: the three Blog listings answer ?page= by the contract in every language', { skip: !origin, timeout: 600_000 }, async () => {
  assert.match(origin!, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/, 'Verification is local only');

  const MALFORMED = ['?page=0', '?page=-1', '?page=1.5', '?page=abc', '?page=', '?page=%2B2', '?page=+2', '?page=2e1', '?page=0x2', '?page=2&page=3', '?foo=bar', '?page=2&foo=bar'];
  const pageLabel: Record<string, string> = { en: 'Page', de: 'Seite', it: 'Pagina', es: 'Página' };

  for (const entity of [CATEGORY, TOPIC]) {
    for (const locale of LOCALES) {
      const clean = `/${locale}/${entity.slugs[locale]}`;
      const first = await get(clean);
      assert.equal(first.status, 200, clean);
      assert.equal(first.canonical, clean);
      assert.ok(first.cards > 0 && first.cards <= BLOG_LISTING_PAGE_SIZE, `${clean}: ${first.cards} cards`);
      assert.equal(first.hrefs.some((href) => /[?&]page=1(?:&|$)/.test(href)), false, `${clean}: no link to ?page=1`);

      // The pages it has, read off its own pager — nothing about the data is assumed.
      const last = Math.max(1, ...first.pagerHrefs.map((href) => Number(new URL(href, origin).searchParams.get('page')) || 1));
      assert.ok(last >= 2, `${clean}: the fixture listing is expected to have more than one page`);
      assert.ok(first.pagerHrefs.includes(`${clean}?page=2`), `${clean}: page 2 is linked`);

      for (const url of [`${clean}?page=1`, `${clean}?page=01`]) {
        const response = await get(url);
        assert.equal(response.status, 308, url);
        assert.equal(response.location, clean, url);
      }
      const zeroed = await get(`${clean}?page=02`);
      assert.equal(zeroed.status, 308);
      assert.equal(zeroed.location, `${clean}?page=2`);

      const second = await get(`${clean}?page=2`);
      assert.equal(second.status, 200);
      assert.equal(second.canonical, `${clean}?page=2`, 'page 2 is self-canonical');
      assert.ok(second.cards > 0, `${clean}?page=2: cards`);
      assert.notDeepEqual(second.hrefs.filter((href) => first.hrefs.includes(href)).length, second.hrefs.length, 'page 2 lists other articles');
      for (const language of LOCALES) {
        assert.equal(second.hreflang[language], `/${language}/${entity.slugs[language]}?page=2`, `${clean}?page=2 → ${language}`);
      }
      assert.equal(second.hreflang['x-default'], `/en/${entity.slugs.en}?page=2`);
      assert.match(second.title, new RegExp(` – ${pageLabel[locale]} 2$`), `${clean}?page=2 title: ${second.title}`);
      assert.equal(second.title.replace(/ – \S+ 2$/, ''), first.title, 'the editorial title is kept');
      // Page 1 is linked as the clean URL: Previous and the numbered "1".
      assert.ok(second.pagerHrefs.filter((href) => href === clean).length >= 2, `${clean}?page=2: Previous and "1" → ${clean}`);
      assert.equal(second.pagerHrefs.some((href) => /[?&]page=1(?:&|$)/.test(href)), false);

      const final = await get(`${clean}?page=${last}`);
      assert.equal(final.status, 200, `${clean}?page=${last}`);
      assert.equal(final.pagerHrefs.some((href) => href.endsWith(`page=${last + 1}`)), false, 'the last page links no further');

      // Past the last page: a 404, so no pager and no Next chain.
      for (const page of [last + 1, last + 2, 999999]) {
        assert.equal((await get(`${clean}?page=${page}`)).status, 404, `${clean}?page=${page}`);
      }
      for (const query of MALFORMED) assert.equal((await get(`${clean}${query}`)).status, 404, `${clean}${query}`);

      // Tracking parameters do not change the page or enter its canonical URL.
      const tracked = await get(`${clean}?page=2&utm_source=x`);
      assert.equal(tracked.status, 200);
      assert.equal(tracked.canonical, `${clean}?page=2`);
    }

    // An alias of the slug keeps the page through the redirect.
    const alias = await get(`/de/${entity.slugs.en}?page=2`);
    assert.equal(alias.status, 308);
    assert.equal(alias.location, `/de/${entity.slugs.de}?page=2`);
    const aliasFirst = await get(`/de/${entity.slugs.en}?page=1`);
    assert.equal(aliasFirst.status, 308);
    assert.equal(aliasFirst.location, `/de/${entity.slugs.de}`);
    assert.equal((await get(`/de/${entity.slugs.en}?page=abc`)).status, 404);
  }

  for (const entity of [CAIRO, HURGHADA]) {
    for (const locale of LOCALES) {
      const clean = `/${locale}/${entity.slugs[locale]}`;
      const first = await get(clean);
      assert.equal(first.status, 200, clean);
      assert.equal(first.canonical, clean);
      assert.deepEqual(Object.keys(first.hreflang).sort(), ['de', 'en', 'es', 'it', 'x-default'], `${clean}: language cluster`);
      assert.equal(first.hrefs.some((href) => href.includes('?page=')), false, `${clean}: one page, so no page link`);

      const explicit = await get(`${clean}?page=1`);
      assert.equal(explicit.status, 308);
      assert.equal(explicit.location, clean);
      for (const query of ['?page=2', '?page=3', '?page=999999', '?page=0', '?page=abc', '?foo=bar']) {
        assert.equal((await get(`${clean}${query}`)).status, 404, `${clean}${query}`);
      }
    }
  }
  assert.equal((await get('/en/hurghada')).cards, 0, 'no article section on a destination without articles');
  const alias = await get('/de/cairo?page=1');
  assert.equal(alias.status, 308);
  assert.equal(alias.location, '/de/kairo');
});
