import assert from 'node:assert/strict';
import test from 'node:test';
// Declares `req.locale`, which these controllers read.
import '../src/middleware/i18n';
import type {} from '../src/types/express';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import { getBlogsByCategory, getBlogsBySubCategory } from '../src/controllers/blogController';
import { getBlogsByDestination } from '../src/controllers/destinationController';
import { MAX_PUBLIC_PAGE_SIZE, readPublicPagination } from '../src/utils/publicPagination';

/*
 * `page` and `limit` on the three public article listings — a category's, a
 * topic's and a destination's. They are public endpoints: what they are sent
 * is the caller's, and a value that is not a positive integer is answered as
 * the caller's mistake (400), before the database is asked anything. It used
 * to reach skip() and limit() as it came.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type Handler = (req: never, res: never) => Promise<void>;

const TOTAL = 24;

type Reads = { finds: number; counts: number; parents: number; skip?: number; limit?: number };

/** Swaps the model reads for in-memory ones holding TOTAL articles, and records what was asked. */
const withStore = async (run: (reads: Reads) => Promise<void>, failWith?: Error) => {
  const originals = {
    find: Blog.find,
    count: Blog.countDocuments,
    category: BlogCategory.findOne,
    topic: BlogSubCategory.findOne,
  };
  const reads: Reads = { finds: 0, counts: 0, parents: 0 };

  Blog.find = (() => {
    reads.finds += 1;
    const chain = {
      select: () => chain,
      populate: () => chain,
      sort: () => chain,
      skip(count: number) {
        reads.skip = count;
        return chain;
      },
      limit(count: number) {
        reads.limit = count;
        return chain;
      },
      lean: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        (failWith ? Promise.reject(failWith) : Promise.resolve([{ _id: 'a', slug: { en: 'an-article' } }])).then(resolve, reject),
    };
    return chain;
  }) as unknown as typeof Blog.find;
  Blog.countDocuments = (() => {
    reads.counts += 1;
    return Promise.resolve(TOTAL);
  }) as unknown as typeof Blog.countDocuments;

  const parent = ((filter: Doc) => {
    reads.parents += 1;
    const known = (filter.$or as Doc[]).some((branch) => Object.values(branch).includes('egypt-blog'));
    const chain = {
      select: () => chain,
      lean: () => Promise.resolve(known ? { _id: 'parent' } : null),
    };
    return chain;
  });
  BlogCategory.findOne = parent as unknown as typeof BlogCategory.findOne;
  BlogSubCategory.findOne = parent as unknown as typeof BlogSubCategory.findOne;

  try {
    await run(reads);
  } finally {
    Blog.find = originals.find;
    Blog.countDocuments = originals.count;
    BlogCategory.findOne = originals.category;
    BlogSubCategory.findOne = originals.topic;
  }
};

const respond = async (handler: Handler, req: unknown) => {
  let status = 0;
  let body: Doc = {};
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: Doc) {
      body = payload;
      return res;
    },
  };
  await handler(req as never, res as never);
  return { status, body: JSON.parse(JSON.stringify(body)) as Doc };
};

type Endpoint = { name: string; defaultLimit: number; call: (query: Doc, id?: string) => ReturnType<typeof respond> };
const ENDPOINTS: Endpoint[] = [
  {
    name: 'category posts',
    defaultLimit: 10,
    call: (query, slug = 'egypt-blog') => respond(getBlogsByCategory as unknown as Handler, { params: { slug }, query, locale: 'en' }),
  },
  {
    name: 'topic posts',
    defaultLimit: 10,
    call: (query, slug = 'egypt-blog') => respond(getBlogsBySubCategory as unknown as Handler, { params: { slug }, query, locale: 'en' }),
  },
  {
    name: 'destination blogs',
    defaultLimit: 9,
    call: (query, id = 'cairo') => respond(getBlogsByDestination as unknown as Handler, { params: { id }, query, locale: 'en' }),
  },
];

// What Express hands over for ?page=2&page=3 and ?page[a]=1.
const NOT_A_PAGE = ['0', '-1', '1.5', '2.9', 'abc', '', ' 2', '+2', '2e1', '0x2', 'Infinity', 'NaN', '1e308', ['2', '3'], { a: '1' }];
const NOT_A_LIMIT = ['0', '-1', '1.5', 'abc', '', '+9', '9e0', String(MAX_PUBLIC_PAGE_SIZE + 1), '1000', ['9', '9']];

// ── The reader ──────────────────────────────────────────────────────────────

const read = (query: Doc, defaultLimit = 10) => {
  let answered: { status: number; body: Doc } | null = null;
  const res = {
    status(code: number) {
      return { json: (body: Doc) => { answered = { status: code, body }; } };
    },
  };
  const pagination = readPublicPagination(query, res as never, defaultLimit);
  return { pagination, answered: answered as { status: number; body: Doc } | null };
};

test('absent values keep their defaults; present ones are positive integers', () => {
  assert.deepEqual(read({}).pagination, { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(read({}, 9).pagination, { page: 1, limit: 9, skip: 0 });
  assert.deepEqual(read({ page: '2', limit: '9' }).pagination, { page: 2, limit: 9, skip: 9 });
  assert.deepEqual(read({ page: '3' }, 9).pagination, { page: 3, limit: 9, skip: 18 });
  assert.deepEqual(read({ limit: String(MAX_PUBLIC_PAGE_SIZE) }).pagination, { page: 1, limit: 100, skip: 0 });
  // Digits are digits: a leading zero is the same integer.
  assert.deepEqual(read({ page: '02', limit: '09' }).pagination, { page: 2, limit: 9, skip: 9 });
  // A parameter these endpoints do not read is not theirs to judge.
  assert.deepEqual(read({ page: '2', limit: '9', locale: 'de' }).pagination, { page: 2, limit: 9, skip: 9 });
});

test('a value that is not a positive integer is answered 400, and names the parameter', () => {
  for (const page of NOT_A_PAGE) {
    const { pagination, answered } = read({ page, limit: '9' });
    assert.equal(pagination, null, JSON.stringify(page));
    assert.deepEqual(answered, { status: 400, body: { success: false, error: 'Invalid page parameter' } }, JSON.stringify(page));
  }
  for (const limit of NOT_A_LIMIT) {
    const { pagination, answered } = read({ page: '1', limit });
    assert.equal(pagination, null, JSON.stringify(limit));
    assert.deepEqual(answered, { status: 400, body: { success: false, error: 'Invalid limit parameter' } }, JSON.stringify(limit));
  }
});

test('a page whose offset is no longer an exact integer is not a page', () => {
  // The largest page that still is one, and the first that is not, at 9 per page.
  const lastExact = Math.floor(Number.MAX_SAFE_INTEGER / 9) + 1;
  assert.equal(read({ page: String(lastExact), limit: '9' }).pagination?.page, lastExact);
  assert.deepEqual(read({ page: String(lastExact + 1), limit: '9' }).answered?.body, { success: false, error: 'Invalid page parameter' });
  assert.equal(read({ page: '99999999999999999999' }).answered?.status, 400);
});

// ── The three endpoints ─────────────────────────────────────────────────────

for (const endpoint of ENDPOINTS) {
  test(`${endpoint.name}: a request with no page or limit gets page 1 at the default size`, async () => {
    await withStore(async (reads) => {
      const { status, body } = await endpoint.call({});
      assert.equal(status, 200);
      assert.equal(reads.skip, 0);
      assert.equal(reads.limit, endpoint.defaultLimit);
      assert.equal(body.pagination.page, 1);
      assert.equal(body.pagination.limit, endpoint.defaultLimit);
      assert.equal(body.pagination.total, TOTAL);
      assert.equal(body.pagination.pages, Math.ceil(TOTAL / endpoint.defaultLimit));
    });
  });

  test(`${endpoint.name}: the visitor pages read page N at 9 a page`, async () => {
    await withStore(async (reads) => {
      const { status, body } = await endpoint.call({ page: '3', limit: '9', locale: 'en' });
      assert.equal(status, 200);
      assert.equal(reads.skip, 18);
      assert.equal(reads.limit, 9);
      // Numbers, as before — never the strings they arrived as.
      assert.equal(body.pagination.page, 3);
      assert.equal(body.pagination.limit, 9);
      assert.equal(body.pagination.pages, 3);
      assert.equal(body.success, true);
      assert.equal(body.data.length, 1);
    });
  });

  test(`${endpoint.name}: a page past the last is still a valid request for an empty page`, async () => {
    // Whether page 4 of 3 exists is the visitor route's question, which it
    // answers with a 404; the API reports what it has.
    await withStore(async () => {
      const { status, body } = await endpoint.call({ page: '4', limit: '9' });
      assert.equal(status, 200);
      assert.equal(body.pagination.page, 4);
      assert.equal(body.pagination.pages, 3);
    });
  });

  test(`${endpoint.name}: an invalid page is a 400, and the database is not asked`, async () => {
    for (const page of NOT_A_PAGE) {
      await withStore(async (reads) => {
        const { status, body } = await endpoint.call({ page, limit: '9' });
        assert.equal(status, 400, JSON.stringify(page));
        assert.deepEqual(body, { success: false, error: 'Invalid page parameter' }, JSON.stringify(page));
        assert.deepEqual([reads.finds, reads.counts, reads.parents], [0, 0, 0], JSON.stringify(page));
      });
    }
  });

  test(`${endpoint.name}: an invalid limit is a 400 — never every row, never a negative page count`, async () => {
    for (const limit of NOT_A_LIMIT) {
      await withStore(async (reads) => {
        const { status, body } = await endpoint.call({ page: '1', limit });
        assert.equal(status, 400, JSON.stringify(limit));
        assert.deepEqual(body, { success: false, error: 'Invalid limit parameter' }, JSON.stringify(limit));
        assert.deepEqual([reads.finds, reads.counts, reads.parents], [0, 0, 0], JSON.stringify(limit));
      });
    }
  });

  test(`${endpoint.name}: a failure of its own is a 500 that says nothing of the driver`, async () => {
    const failure = new Error("BSON field 'skip' value must be >= 0, actual value '-9'");
    await withStore(async () => {
      const { status, body } = await endpoint.call({ page: '1', limit: '9' });
      assert.equal(status, 500);
      assert.equal(body.success, false);
      assert.deepEqual(Object.keys(body).sort(), ['error', 'success']);
      assert.doesNotMatch(JSON.stringify(body), /BSON|skip|actual value/);
    }, failure);
  });
}

test('category and topic posts: an unknown slug is still a 404, checked after the query', async () => {
  for (const endpoint of ENDPOINTS.slice(0, 2)) {
    await withStore(async (reads) => {
      const missing = await endpoint.call({ page: '1', limit: '9' }, 'no-such-slug');
      assert.equal(missing.status, 404, endpoint.name);
      assert.equal(reads.finds, 0);
      const invalid = await endpoint.call({ page: '0', limit: '9' }, 'no-such-slug');
      assert.equal(invalid.status, 400, `${endpoint.name}: the query is judged first`);
    });
  }
});

test('destination blogs: an id that cannot be one names no destination — 404, without the cast error', async () => {
  const cast = Object.assign(new Error('Cast to ObjectId failed for value "not-an-id" (type string) at path "destination" for model "Blog"'), {
    name: 'CastError',
  });
  await withStore(async () => {
    const { status, body } = await ENDPOINTS[2].call({ page: '1', limit: '9' }, 'not-an-id');
    assert.equal(status, 404);
    assert.deepEqual(body, { success: false, error: 'Destination not found' });
  }, cast);
});
