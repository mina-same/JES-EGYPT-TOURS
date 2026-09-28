import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOG_ENTITY_TTL,
  BLOG_LISTING_TTL,
  blogCacheOptions,
  blogListingCacheOptions,
  MAX_CACHEABLE_BLOG_PAGE,
  normalizeBlogPage,
} from '../src/lib/api/blogCachePolicy';
import {
  getAllBlogs,
  getAllSubCategories,
  getBlogBySlug,
  getBlogTags,
  getBlogsByCategory,
  getBlogsByIds,
  getBlogsBySubCategory,
  getCategories,
  getCategoryBySlug,
  getFeaturedBlogs,
  getSubCategoriesByCategory,
  getSubCategoryBySlug,
} from '../src/lib/api/blog';
import { getBlogsByDestination } from '../src/lib/api/destination';

type Call = { url: string; init: Record<string, unknown> };

/** Runs `read` with fetch recording its calls; every call answers an empty 200. */
async function callsOf(read: () => Promise<unknown>): Promise<Call[]> {
  const realFetch = globalThis.fetch;
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url).replace(/^https?:\/\/[^/]+\/api/, ''), init: (init ?? {}) as Record<string, unknown> });
    return new Response(JSON.stringify({ success: true, data: [], pagination: {} }), { status: 200 });
  }) as typeof fetch;
  try {
    await read();
  } finally {
    globalThis.fetch = realFetch;
  }
  return calls;
}

const listing = (tags = ['blog']) => ({ next: { revalidate: BLOG_LISTING_TTL, tags } });
const entity = (tags = ['blog']) => ({ next: { revalidate: BLOG_ENTITY_TTL, tags } });

test('pages are normalized to the page the listing shows', () => {
  const cases: Array<[unknown, number]> = [
    [1, 1], [2, 2], ['2', 2], ['01', 1], ['1.0', 1], [2.7, 2], ['2.7', 2], ['1e1', 10],
    ['abc', 1], [0, 1], ['0', 1], [-1, 1], [0.5, 1], ['', 1], [undefined, 1], [null, 1], [Infinity, 1], [NaN, 1],
  ];
  for (const [input, page] of cases) assert.equal(normalizeBlogPage(input), page, `normalizeBlogPage(${String(input)})`);
});

test('only canonical listing pages within the bound are stored', () => {
  assert.equal(MAX_CACHEABLE_BLOG_PAGE, 20);
  assert.deepEqual(blogListingCacheOptions(1), listing());
  assert.deepEqual(blogListingCacheOptions(MAX_CACHEABLE_BLOG_PAGE), listing());
  assert.deepEqual(blogListingCacheOptions(MAX_CACHEABLE_BLOG_PAGE + 1), { cache: 'no-store' });
  assert.deepEqual(blogListingCacheOptions(1, false), { cache: 'no-store' });
  assert.deepEqual(blogCacheOptions(BLOG_ENTITY_TTL, ['author:a', 'blog']), entity(['author:a', 'blog']));
  assert.deepEqual(blogCacheOptions(BLOG_ENTITY_TTL, ['blog'], false), { cache: 'no-store' });
});

test('category, subcategory and destination listings are tagged, bounded and normalized', async () => {
  const [category] = await callsOf(() => getBlogsByCategory('egypt-blog', 2, 9, 'de'));
  assert.equal(category.url, '/blog/categories/egypt-blog/posts?page=2&limit=9&locale=de');
  assert.deepEqual(category.init, { ...listing(), headers: { 'X-Locale': 'de' } });

  const [subcategory] = await callsOf(() => getBlogsBySubCategory('egypt-travel-tips', 0, 9, 'it'));
  assert.equal(subcategory.url, '/blog/subcategories/egypt-travel-tips/posts?page=1&limit=9&locale=it');
  assert.deepEqual(subcategory.init, { ...listing(), headers: { 'X-Locale': 'it' } });

  const [destination] = await callsOf(() => getBlogsByDestination('d1', 2.7, 9, 'es'));
  assert.equal(destination.url, '/destinations/d1/blogs?page=2&limit=9&locale=es');
  assert.deepEqual(destination.init, { ...listing(), headers: { 'X-Locale': 'es' } });

  for (const read of [
    () => getBlogsByCategory('egypt-blog', 21, 9, 'en'),
    () => getBlogsBySubCategory('egypt-travel-tips', 999999, 9, 'en'),
    () => getBlogsByDestination('d1', 21, 9, 'en'),
  ]) {
    const [call] = await callsOf(read);
    assert.deepEqual(call.init, { cache: 'no-store', headers: { 'X-Locale': 'en' } }, call.url);
  }
});

test('the all-articles listing stores only its canonical shape', async () => {
  const [canonical] = await callsOf(() => getAllBlogs({ page: 3, limit: 9, locale: 'en' }));
  assert.equal(canonical.url, '/blog/posts?page=3&limit=9&locale=en');
  assert.deepEqual(canonical.init, { ...listing(), headers: { 'X-Locale': 'en' } });

  const [negative] = await callsOf(() => getAllBlogs({ page: -1, limit: 9, locale: 'en' }));
  assert.equal(negative.url, '/blog/posts?page=1&limit=9&locale=en');

  for (const options of [{ page: 1, tags: 'cairo' }, { page: 1, search: 'nile' }, { page: 21 }]) {
    const [call] = await callsOf(() => getAllBlogs({ limit: 9, locale: 'de', ...options }));
    assert.deepEqual(call.init, { cache: 'no-store', headers: { 'X-Locale': 'de' } }, call.url);
  }
});

test('entities, the featured strip and the directories are tagged for an hour', async () => {
  const reads: Array<[string, () => Promise<unknown>, Record<string, unknown>]> = [
    ['/blog/posts/slug/karnak-tempel-guide?locale=de', () => getBlogBySlug('karnak-tempel-guide', 'de'), { headers: { 'X-Locale': 'de' } }],
    ['/blog/categories/slug/reisefuehrer?locale=de', () => getCategoryBySlug('reisefuehrer', 'de'), { headers: { 'X-Locale': 'de' } }],
    ['/blog/subcategories/slug/aegypten-reisetipps?locale=de', () => getSubCategoryBySlug('aegypten-reisetipps', 'de'), { headers: { 'X-Locale': 'de' } }],
    ['/blog/posts/featured?limit=6&locale=de', () => getFeaturedBlogs(6, 'de'), { headers: { 'X-Locale': 'de' } }],
    ['/blog/subcategories/category/c1?locale=de', () => getSubCategoriesByCategory('c1', 'de'), { headers: { 'X-Locale': 'de' } }],
    ['/blog/subcategories/category/c1', () => getSubCategoriesByCategory('c1'), {}],
    ['/blog/categories', () => getCategories(), {}],
  ];
  for (const [url, read, extra] of reads) {
    const [call] = await callsOf(read);
    assert.equal(call.url, url);
    const expected = entity();
    if (url.startsWith('/blog/posts/slug/')) expected.next.tags.push('tours');
    assert.deepEqual(call.init, { ...expected, ...extra }, url);
  }
});

test('every locale has its own URL and header', async () => {
  for (const locale of ['en', 'de', 'it', 'es']) {
    for (const read of [
      () => getBlogsByCategory('egypt-blog', 1, 9, locale),
      () => getBlogsBySubCategory('egypt-travel-tips', 1, 9, locale),
      () => getBlogsByDestination('d1', 1, 9, locale),
      () => getAllBlogs({ page: 1, limit: 9, locale }),
      () => getSubCategoriesByCategory('c1', locale),
    ]) {
      const [call] = await callsOf(read);
      assert.match(call.url, new RegExp(`[?&]locale=${locale}(&|$)`));
      assert.deepEqual(call.init.headers, { 'X-Locale': locale });
    }
  }
});

test('in the browser no read carries cache options', async () => {
  const hadWindow = 'window' in globalThis;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  try {
    assert.deepEqual(blogListingCacheOptions(1), {});
    for (const read of [
      () => getAllBlogs({ page: 1, search: 'nile', locale: 'en' }),
      () => getBlogBySlug('karnak-temple-visitor-guide', 'en'),
    ]) {
      const [call] = await callsOf(read);
      assert.deepEqual(call.init, { headers: { 'X-Locale': 'en' } }, call.url);
    }
  } finally {
    if (!hadWindow) Reflect.deleteProperty(globalThis, 'window');
  }
});

test('browser-only readers no longer carry inert Data Cache options', async () => {
  const [tags] = await callsOf(() => getBlogTags(20, 'de'));
  assert.deepEqual(tags.init, { headers: { 'X-Locale': 'de' } });
  const [byIds] = await callsOf(() => getBlogsByIds(['64b000000000000000000001'], 'de'));
  assert.deepEqual(byIds.init, { headers: { 'X-Locale': 'de' } });
  const [subcategories] = await callsOf(() => getAllSubCategories());
  assert.deepEqual(subcategories.init, {});
});
