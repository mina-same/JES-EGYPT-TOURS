import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tourCategoryServerAPI,
  tourServerAPI,
  tourSubcategoryServerAPI,
} from '../src/lib/api/tour.server';
import { getBlogBySlug, getCategoryBySlug, getSubCategoryBySlug } from '../src/lib/api/blog';

/*
 * The document a page is about: null for a 404, so the route answers 404, and
 * a throw for anything else, so the route answers 500. Null for an outage
 * would make the route call notFound() on a live page.
 */

const DOC = { _id: 'doc-1', name: 'Cairo' };

type Reader = {
  name: string;
  slug: string;
  read: (slug: string) => Promise<unknown>;
  /** What the reader returns for a 200 carrying `{ success: true, data: DOC }`. */
  expected: unknown;
};

const ENTITY_READERS: Reader[] = [
  { name: 'tour', slug: 'nile-cruise', read: (slug) => tourServerAPI.getBySlug(slug, 'de'), expected: { success: true, data: DOC } },
  { name: 'tour category', slug: 'day-tours', read: (slug) => tourCategoryServerAPI.getBySlug(slug, 'de'), expected: { success: true, data: DOC } },
  { name: 'tour subcategory', slug: 'cairo-day-tours', read: (slug) => tourSubcategoryServerAPI.getBySlug(slug, 'de'), expected: { success: true, data: DOC } },
  { name: 'blog category', slug: 'travel-guides', read: (slug) => getCategoryBySlug(slug, 'de'), expected: DOC },
  { name: 'blog subcategory', slug: 'cairo-guides', read: (slug) => getSubCategoryBySlug(slug, 'de'), expected: DOC },
  { name: 'article', slug: 'pyramids-guide', read: (slug) => getBlogBySlug(slug, 'de'), expected: DOC },
];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const FAILURES: Array<[label: string, status: number, make: () => Response]> = [
  ['500 with a JSON body', 500, () => json({ success: false, error: 'BODY_TEXT' }, 500)],
  ['502 with an HTML body', 502, () => new Response('<html><body>BODY_TEXT</body></html>', { status: 502, headers: { 'Content-Type': 'text/html' } })],
  ['503 with no body', 503, () => new Response(null, { status: 503 })],
];

/** Runs `body` with fetch answering `reply` and console.error captured. */
async function withStubs(reply: () => Promise<Response>, body: (logged: string[]) => Promise<void>) {
  const realFetch = globalThis.fetch;
  const realError = console.error;
  const logged: string[] = [];
  globalThis.fetch = (() => reply()) as typeof fetch;
  console.error = (...args: unknown[]) => {
    logged.push(args.map(String).join(' '));
  };
  try {
    await body(logged);
  } finally {
    globalThis.fetch = realFetch;
    console.error = realError;
  }
}

for (const reader of ENTITY_READERS) {
  test(`${reader.name}: a 200 returns the document`, async () => {
    await withStubs(async () => json({ success: true, data: DOC }, 200), async (logged) => {
      assert.deepEqual(await reader.read(reader.slug), reader.expected);
      assert.deepEqual(logged, []);
    });
  });

  test(`${reader.name}: a 404 is null, and nothing is logged`, async () => {
    await withStubs(async () => json({ success: false, error: 'Not found' }, 404), async (logged) => {
      assert.equal(await reader.read(reader.slug), null);
      assert.deepEqual(logged, []);
    });
  });

  for (const [label, status, make] of FAILURES) {
    test(`${reader.name}: a ${label} throws and logs the status, never the body`, async () => {
      let response: Response | undefined;
      await withStubs(async () => (response = make()), async (logged) => {
        await assert.rejects(reader.read(reader.slug), (error) => error instanceof Error && error.message.includes(String(status)));
        assert.equal(response?.bodyUsed, false);
        assert.equal(logged.length, 1);
        assert.ok(logged[0].includes(String(status)) && logged[0].includes(reader.slug) && logged[0].includes('locale=de'), logged[0]);
        assert.ok(!logged[0].includes('BODY_TEXT'), logged[0]);
      });
    });
  }

  test(`${reader.name}: an unreachable API throws the fetch error`, async () => {
    const refused = new TypeError('fetch failed', { cause: new Error('connect ECONNREFUSED 127.0.0.1:5001') });
    await withStubs(() => Promise.reject(refused), async (logged) => {
      await assert.rejects(reader.read(reader.slug), (error) => error === refused);
      assert.equal(logged.length, 1);
      assert.ok(logged[0].includes(reader.slug) && logged[0].includes('locale=de'), logged[0]);
    });
  });
}

test('the tour listing and the subcategory rail still fail soft', async () => {
  const replies = [async () => json({ success: false }, 500), () => Promise.reject(new TypeError('fetch failed'))];
  for (const reply of replies) {
    await withStubs(reply, async () => {
      assert.equal(await tourServerAPI.getListing({ page: 1 }, 'de', true), null);
      assert.equal(await tourSubcategoryServerAPI.getByCategory('cat-1', 'de'), null);
    });
  }
});
