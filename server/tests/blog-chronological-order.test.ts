import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
// Declares `req.locale`, which these controllers read.
import '../src/middleware/i18n';
import type {} from '../src/types/express';
import sift from 'sift';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import EditorialAuthor from '../src/models/EditorialAuthor';
import User from '../src/models/User';
import {
  getAllBlogs,
  getBlogBySlug,
  getBlogsByCategory,
  getBlogsBySubCategory,
  getFeaturedBlogs,
} from '../src/controllers/blogController';
import { getBlogsByDestination } from '../src/controllers/destinationController';
import { getEditorialAuthorBySlug } from '../src/controllers/editorialAuthorController';
import { BLOG_CHRONOLOGICAL_SORT, blogCardPopulate } from '../src/utils/blogCardPopulate';
import { BLOG_LOCALES, getBlogLocaleAvailabilityFilter } from '../src/utils/blogAvailability';

/*
 * One chronological order for every chronological article list: newest first,
 * then `_id` (utils/blogCardPopulate.ts, BLOG_CHRONOLOGICAL_SORT).
 *
 * Each listing page is a query of its own, and MongoDB gives no order among
 * articles that share a publishedAt — the scheduler gives every article it
 * publishes in one run the same one. The store below therefore hands every
 * query its documents in a DIFFERENT physical order (what another plan, a
 * resync or a failover can do) and applies the sort it is given the way
 * MongoDB does; the pages must still be slices of one fixed sequence.
 *
 * Nothing here touches a database — except the opt-in check against a real
 * server, which sorts inline documents and reads no collection.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type Handler = (req: never, res: never) => Promise<void>;
type Sort = Record<string, number>;

const LANGS = ['en', 'de', 'it', 'es'] as const;
const CATEGORY = 'cat-egypt-blog';
const TOPIC = 'topic-travel-tips';
const DESTINATION = 'dest-cairo';
const AUTHOR = 'author-jane';
const PAGE = 9;

/** A 24-hex ObjectId string; a higher `n` is a later _id. */
const oid = (n: number) => `65a0000000000000000000${n.toString(16).padStart(2, '0')}`;
const day = (d: number) => new Date(Date.UTC(2026, 6, d, 9, 30));

const article = (n: number, publishedAt: Date | null | undefined, langs: readonly string[] = LANGS, extra: Doc = {}): Doc => ({
  _id: oid(n),
  status: 'published',
  category: CATEGORY,
  subCategory: TOPIC,
  destination: DESTINATION,
  editorialAuthor: AUTHOR,
  ...(publishedAt === undefined ? {} : { publishedAt }),
  createdAt: day(1),
  title: Object.fromEntries(langs.map((l) => [l, `Article ${n} guide (${l})`])),
  slug: Object.fromEntries(langs.map((l) => [l, `article-${n}-${l}`])),
  contentBlocks: [{ type: 'html', content: Object.fromEntries(langs.map((l) => [l, `<p>Article ${n} in ${l}</p>`])) }],
  ...extra,
});

/*
 * Twenty-two articles. Six share one publishedAt across the 9|10 page edge
 * (positions 7–12) and six another across the 18|19 edge (positions 16–21),
 * like scheduler batches. Within a tie, the later _id comes first. Three of the
 * tied articles are missing a language, so each language's list is a
 * subsequence with edges of its own.
 */
const BATCH_1 = day(20);
const BATCH_2 = day(10);
const TIED: Doc[] = [
  article(1, day(30)), article(2, day(29)), article(3, day(28)), article(4, day(27)), article(5, day(26)), article(6, day(25)),
  // Inserted oldest _id first, as a scheduler run would — the opposite of the order they list in.
  article(40, BATCH_1), article(41, BATCH_1, ['en', 'de', 'it']), article(42, BATCH_1), article(43, BATCH_1, ['en', 'de']), article(44, BATCH_1), article(45, BATCH_1),
  article(50, day(15)), article(51, day(14)), article(52, day(13)),
  article(60, BATCH_2), article(61, BATCH_2), article(62, BATCH_2, ['en', 'de']), article(63, BATCH_2), article(64, BATCH_2), article(65, BATCH_2),
  article(70, day(5)),
];
/** The order, written out: publishedAt DESC, then _id DESC. */
const ORDER = [1, 2, 3, 4, 5, 6, 45, 44, 43, 42, 41, 40, 50, 51, 52, 65, 64, 63, 62, 61, 60, 70];
const expectedIn = (locale: string, store: Doc[] = TIED, order: number[] = ORDER) =>
  order.map(oid).filter((id) => sift(getBlogLocaleAvailabilityFilter(locale as never))(store.find((a) => a._id === id)));

// ── A store with MongoDB's sort, and a new physical order for every query ───

/** MongoDB's order for the values these keys hold: missing and null together, below any date; ObjectIds by their hex. */
const rank = (value: unknown): [number, number | string] =>
  value === undefined || value === null ? [0, 0] : value instanceof Date ? [1, value.getTime()] : [2, String(value)];
const mongoSort = (spec: Sort) => (a: Doc, b: Doc) => {
  for (const [key, direction] of Object.entries(spec)) {
    const [ta, va] = rank(a[key]);
    const [tb, vb] = rank(b[key]);
    const order = ta !== tb ? ta - tb : va < vb ? -1 : va > vb ? 1 : 0;
    if (order) return order * direction;
  }
  return 0;
};
const permute = (rows: Doc[], seed: number) => {
  const out = [...rows];
  let s = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

type Reads = { sorts: unknown[]; populates: unknown[] };
let physicalSeed = 0;

/** One query: the filter, then `spec` over the rows in this query's own physical order, then skip/limit. */
const query = (store: Doc[], filter: Doc, spec: Sort | null, skip = 0, limit = Infinity) => {
  physicalSeed += 1;
  let rows = permute(store, physicalSeed).filter(sift(filter));
  if (spec) rows = [...rows].sort(mongoSort(spec));
  return rows.slice(skip, skip + limit);
};

const withStore = async (store: Doc[], run: (reads: Reads) => Promise<void>) => {
  const originals = {
    find: Blog.find,
    count: Blog.countDocuments,
    category: BlogCategory.findOne,
    topic: BlogSubCategory.findOne,
    user: User.find,
    author: EditorialAuthor.find,
  };
  const reads: Reads = { sorts: [], populates: [] };
  Blog.find = ((filter: Doc) => {
    let spec: Sort | null = null;
    let skip = 0;
    let limit = Infinity;
    const chain: Doc = {
      select: () => chain,
      populate: (option: unknown) => {
        reads.populates.push(option);
        return chain;
      },
      sort: (order: Sort) => {
        reads.sorts.push(order);
        spec = order;
        return chain;
      },
      skip: (n: number) => {
        skip = n;
        return chain;
      },
      limit: (n: number) => {
        limit = n;
        return chain;
      },
      lean: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(query(store, filter, spec, skip, limit).map((row) => ({ ...row }))).then(resolve, reject),
    };
    return chain;
  }) as unknown as typeof Blog.find;
  Blog.countDocuments = ((filter: Doc) => Promise.resolve(store.filter(sift(filter)).length)) as unknown as typeof Blog.countDocuments;
  const parent = (id: string) => (() => ({ select: () => ({ lean: () => Promise.resolve({ _id: id }) }) }));
  BlogCategory.findOne = parent(CATEGORY) as unknown as typeof BlogCategory.findOne;
  BlogSubCategory.findOne = parent(TOPIC) as unknown as typeof BlogSubCategory.findOne;
  // Search also looks up authors by name; none match here.
  User.find = (() => ({ distinct: async () => [] })) as unknown as typeof User.find;
  EditorialAuthor.find = (() => ({ distinct: async () => [] })) as unknown as typeof EditorialAuthor.find;
  try {
    await run(reads);
  } finally {
    Blog.find = originals.find;
    Blog.countDocuments = originals.count;
    BlogCategory.findOne = originals.category;
    BlogSubCategory.findOne = originals.topic;
    User.find = originals.user;
    EditorialAuthor.find = originals.author;
  }
};

const respond = async (handler: Handler, req: Doc) => {
  let status = 0;
  let body: Doc = {};
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: Doc) {
      body = payload;
      if (!status) status = 200;
      return res;
    },
  };
  await handler(req as never, res as never);
  return { status, body: JSON.parse(JSON.stringify(body)) as Doc };
};
const ids = (list: Doc[]) => list.map((a) => a._id as string);

/** An author page for `jane-writer` (not the default author, so no backfill runs); returns the undo. */
const stubAuthor = async () => {
  const original = EditorialAuthor.findOne;
  const author = { _id: AUTHOR, slug: 'jane-writer', isActive: true, name: 'Jane', bio: { en: 'Bio' } };
  EditorialAuthor.findOne = (async () => ({ ...author, toObject: () => ({ ...author }) })) as unknown as typeof EditorialAuthor.findOne;
  return () => {
    EditorialAuthor.findOne = original;
  };
};

/** Every page of a listing, each its own request: the pages laid end to end, and how many there were. */
const traverse = async (handler: Handler, req: Doc, locale: string, limit = PAGE) => {
  const first = await respond(handler, { ...req, query: { ...req.query, page: '1', limit: String(limit) }, locale });
  assert.equal(first.status, 200);
  const pages = [ids(first.body.data)];
  for (let page = 2; page <= first.body.pagination.pages; page += 1) {
    pages.push(ids((await respond(handler, { ...req, query: { ...req.query, page: String(page), limit: String(limit) }, locale })).body.data));
  }
  return { pages, total: first.body.pagination.total as number };
};

const LISTINGS: [string, Handler, Doc][] = [
  ['category', getBlogsByCategory as unknown as Handler, { params: { slug: 'egypt-blog' }, query: {} }],
  ['topic', getBlogsBySubCategory as unknown as Handler, { params: { slug: 'egypt-travel-tips' }, query: {} }],
  ['destination', getBlogsByDestination as unknown as Handler, { params: { id: DESTINATION }, query: {} }],
];

// ── The sort itself, and who uses it ────────────────────────────────────────

test('the chronological sort is publishedAt DESC, then _id DESC — in that key order, and frozen', () => {
  assert.deepEqual(Object.entries(BLOG_CHRONOLOGICAL_SORT), [['publishedAt', -1], ['_id', -1]]);
  assert.ok(Object.isFrozen(BLOG_CHRONOLOGICAL_SORT));
});

test('every chronological list hands the shared sort itself to its query', async () => {
  const withAuthor = await stubAuthor();
  try {
    await withStore(TIED, async (reads) => {
      const cases: [string, Handler, Doc][] = [
        ...LISTINGS.map(([name, handler, req]) => [name, handler, { ...req, query: { page: '1', limit: '9' } }] as [string, Handler, Doc]),
        ['search', getAllBlogs as unknown as Handler, { query: { search: 'guide', page: '1', limit: '6' } }],
        ['all posts / tour references by id', getAllBlogs as unknown as Handler, { query: { page: '1', limit: '9' } }],
        ['featured feed', getFeaturedBlogs as unknown as Handler, { query: { limit: '6' } }],
        ['author', getEditorialAuthorBySlug as unknown as Handler, { params: { slug: 'jane-writer' }, query: { page: '1', limit: '8', featuredLimit: '3' } }],
      ];
      for (const [name, handler, req] of cases) {
        const before = reads.sorts.length;
        const { status } = await respond(handler, { ...req, locale: 'en' });
        assert.equal(status, 200, name);
        const sorts = reads.sorts.slice(before);
        assert.equal(sorts.length, 1, `${name}: one sorted article query`);
        assert.equal(sorts[0], BLOG_CHRONOLOGICAL_SORT, `${name}: the shared constant, not a copy`);
      }
    });
  } finally {
    withAuthor();
  }
});

// ── Ties on the page edges ──────────────────────────────────────────────────

for (const [name, handler, req] of LISTINGS) {
  test(`${name}: with ties across the 9|10 and 18|19 edges, every page request gives slices of one sequence, in every language`, async () => {
    await withStore(TIED, async () => {
      for (const locale of LANGS) {
        const expected = expectedIn(locale);
        for (let run = 0; run < 8; run += 1) {
          const { pages, total } = await traverse(handler, req, locale);
          const all = pages.flat();
          assert.equal(total, expected.length, `${name} ${locale}: the total is unchanged`);
          assert.deepEqual(all, expected, `${name} ${locale} run ${run}: one sequence, _id deciding each tie`);
          assert.equal(new Set(all).size, all.length, `${name} ${locale}: no article on two pages`);
          assert.deepEqual(pages.map((p) => p.length), [PAGE, PAGE, expected.length - 2 * PAGE], `${name} ${locale}: full pages`);
        }
      }
    });
  });
}

test('Search stays chronological, and its pages (6 a page) are slices of the same sequence', async () => {
  await withStore(TIED, async () => {
    for (const locale of LANGS) {
      const expected = expectedIn(locale);
      for (let run = 0; run < 8; run += 1) {
        const { pages, total } = await traverse(getAllBlogs as unknown as Handler, { query: { search: 'guide' } }, locale, 6);
        assert.equal(total, expected.length, locale);
        assert.deepEqual(pages.flat(), expected, `${locale} run ${run}`);
      }
    }
  });
});

test('the store is a real test: publishedAt DESC alone, over the same data, repeats or loses articles between pages', () => {
  // Not a controller: the same store, given the sort every list used before.
  const filter = { category: CATEGORY, ...getBlogLocaleAvailabilityFilter('en') };
  let broken = 0;
  for (let run = 0; run < 20; run += 1) {
    const all = [0, 1, 2].flatMap((p) => ids(query(TIED, filter, { publishedAt: -1 }, p * PAGE, PAGE)));
    if (new Set(all).size !== TIED.length || all.join() !== expectedIn('en').join()) broken += 1;
  }
  assert.ok(broken > 0, 'without _id, a tie on a page edge is not one order');
  // And with the shared sort, never.
  for (let run = 0; run < 20; run += 1) {
    const all = [0, 1, 2].flatMap((p) => ids(query(TIED, filter, { ...BLOG_CHRONOLOGICAL_SORT }, p * PAGE, PAGE)));
    assert.deepEqual(all, expectedIn('en'));
  }
});

test('a scheduler batch — articles published in one run, one publishedAt — always lists in the same order', async () => {
  const runAt = new Date('2026-08-01T08:00:30.000Z');
  // The scheduler's updateMany gives every due article this same instant.
  const batch = [11, 12, 13, 14, 15].map((n) => article(n, runAt));
  // One article published after the run, one long before it.
  const store = [article(1, new Date('2026-08-02T10:00:00.000Z')), ...batch, article(2, day(1))];
  await withStore(store, async () => {
    for (let run = 0; run < 10; run += 1) {
      const { pages } = await traverse(getBlogsByCategory as unknown as Handler, LISTINGS[0][2], 'en', 3);
      assert.deepEqual(pages, [[oid(1), oid(15), oid(14)], [oid(13), oid(12), oid(11)], [oid(2)]], `run ${run}`);
    }
  });
});

// ── No publishedAt ──────────────────────────────────────────────────────────

test('articles without a publishedAt come after every dated one, in _id order among themselves — no createdAt fallback', async () => {
  // The undated ones were created early; a createdAt fallback would lift them above the dated ones.
  const store = [
    article(1, day(30)), article(2, day(20)), article(3, day(10)),
    article(7, undefined, LANGS, { createdAt: day(28) }), article(8, null, LANGS, { createdAt: day(29) }), article(9, undefined, LANGS, { createdAt: day(27) }),
  ];
  await withStore(store, async () => {
    for (const [name, handler, req] of LISTINGS) {
      for (let run = 0; run < 6; run += 1) {
        const { pages } = await traverse(handler, req, 'en', 4);
        assert.deepEqual(pages.flat(), [1, 2, 3, 9, 8, 7].map(oid), `${name} run ${run}`);
      }
    }
  });
});

// ── The featured feed's limit is an edge too ────────────────────────────────

test('the featured limit always cuts at the same article', async () => {
  const featured = (n: number, at: Date) => article(n, at, LANGS, { isFeatured: true });
  // Positions 2–5 share one publishedAt; a limit of 3 cuts inside that tie.
  const store = [featured(1, day(30)), featured(10, day(20)), featured(11, day(20)), featured(12, day(20)), featured(13, day(20)), featured(20, day(10)), article(30, day(31))];
  await withStore(store, async () => {
    for (let run = 0; run < 10; run += 1) {
      const three = await respond(getFeaturedBlogs as unknown as Handler, { query: { limit: '3' }, locale: 'en' });
      assert.deepEqual(ids(three.body.data), [oid(1), oid(13), oid(12)], `limit 3, run ${run}`);
      const six = await respond(getFeaturedBlogs as unknown as Handler, { query: { limit: '6' }, locale: 'en' });
      assert.deepEqual(ids(six.body.data), [1, 13, 12, 11, 10, 20].map(oid), `limit 6, run ${run}`);
    }
  });
});

// ── The author page: one sequence, then its own featured split and pages ────

test('author page: featured split and pages are slices of the shared order, and the clamp is as before', async () => {
  const restore = await stubAuthor();
  // Two featured articles, each inside a tie.
  const store = TIED.map((a) => ({ ...a, isFeatured: a._id === oid(44) || a._id === oid(63) }));
  try {
    await withStore(store, async () => {
      for (const locale of LANGS) {
        const sequence = expectedIn(locale, store);
        const featured = sequence.filter((id) => id === oid(44) || id === oid(63));
        const remainder = sequence.filter((id) => !featured.includes(id));
        for (let run = 0; run < 4; run += 1) {
          const pages: string[][] = [];
          let body: Doc = {};
          for (let page = 1; page <= Math.ceil(remainder.length / 8); page += 1) {
            body = (await respond(getEditorialAuthorBySlug as unknown as Handler, { params: { slug: 'jane-writer' }, query: { page: String(page), limit: '8', featuredLimit: '3' }, locale })).body;
            pages.push(ids(body.data.articles));
            assert.deepEqual(ids(body.data.featured), featured, `${locale}: the editor's featured articles, in the shared order`);
          }
          assert.deepEqual(pages.flat(), remainder, `${locale} run ${run}: the rest, once each, in order`);
          assert.equal(body.data.pagination.total, remainder.length);
        }
        // A page past the last still answers the last page — the existing clamp.
        const past = (await respond(getEditorialAuthorBySlug as unknown as Handler, { params: { slug: 'jane-writer' }, query: { page: '99', limit: '8', featuredLimit: '3' }, locale })).body;
        assert.equal(past.data.pagination.page, Math.ceil(remainder.length / 8), locale);
        assert.deepEqual(ids(past.data.articles), remainder.slice((past.data.pagination.page - 1) * 8), locale);
      }
    });
  } finally {
    restore();
  }
});

// ── Lists an editor ordered keep that order ─────────────────────────────────

test('related posts and curated featured lists are populated in their stored order: no sort is asked for', () => {
  for (const path of ['relatedPosts', 'featuredBlogs']) {
    for (const locale of [...BLOG_LOCALES, 'bypass']) {
      const option = blogCardPopulate(path, locale) as Doc;
      assert.equal('options' in option, false, `${path} ${locale}`);
      assert.equal('sort' in option, false, `${path} ${locale}`);
      assert.equal('perDocumentLimit' in option, false, `${path} ${locale}`);
    }
  }
});

test('the article page populates its related posts without a sort', async () => {
  const original = Blog.findOne;
  const populates: Doc[] = [];
  const stored = { ...TIED[0], relatedPosts: [oid(70), oid(1), oid(45)], comments: [] };
  Blog.findOne = (() => {
    const chain: Doc = {
      populate: (option: Doc) => {
        populates.push(option);
        return chain;
      },
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve({ ...stored }).then(resolve, reject),
    };
    return chain;
  }) as unknown as typeof Blog.findOne;
  try {
    const { status } = await respond(getBlogBySlug as unknown as Handler, { params: { slug: 'article-1-en' }, locale: 'en' });
    assert.equal(status, 200);
    const related = populates.find((option) => option?.path === 'relatedPosts');
    assert.deepEqual(related, blogCardPopulate('relatedPosts', 'en'));
    assert.equal(related?.options, undefined);
  } finally {
    Blog.findOne = original;
  }
});

test('the shared sort is used exactly where a list is chronological, and nowhere an editor sets the order', () => {
  const source = (file: string) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const uses = (file: string) => source(file).split('.sort(BLOG_CHRONOLOGICAL_SORT)').length - 1;
  // Search and all-posts (getAllBlogs), the featured feed, and category + topic (findListingPage).
  assert.equal(uses('controllers/blogController.ts'), 3);
  assert.equal(uses('controllers/destinationController.ts'), 1);
  assert.equal(uses('controllers/editorialAuthorController.ts'), 1);
  // No chronological literal is left beside it.
  for (const file of ['controllers/blogController.ts', 'controllers/destinationController.ts', 'controllers/editorialAuthorController.ts']) {
    assert.doesNotMatch(source(file), /\.sort\(\s*(?:'-publishedAt'|\{\s*publishedAt:\s*-1)/, file);
  }
  // Curated lists, the sitemap and the Admin list keep their own order.
  for (const file of ['controllers/blogCategoryController.ts', 'controllers/blogSubCategoryController.ts', 'controllers/tourCategoryController.ts', 'controllers/tourSubcategoryController.ts', 'controllers/sitemapController.ts']) {
    assert.equal(source(file).includes('BLOG_CHRONOLOGICAL_SORT'), false, file);
  }
  assert.match(source('controllers/sitemapController.ts'), /\{ \$sort: \{ _id: 1 \} \}/);
  assert.match(source('controllers/blogController.ts'), /\.sort\(\{ updatedAt: -1 \}\)/, 'the Admin list keeps updatedAt');
});

// ── Opt-in: the same fixtures on a real MongoDB server ──────────────────────

const mongoUri = process.env.BLOG_ORDER_MONGO_URI;
test('…and a real MongoDB server pages the same way (inline documents, no collection read or written)', { skip: !mongoUri }, async () => {
  const { MongoClient, ObjectId } = await import('mongodb');
  const client = new MongoClient(mongoUri!, { serverSelectionTimeoutMS: 20000 });
  const asMongo = (docs: Doc[]) => docs.map((doc) => ({ ...doc, _id: new ObjectId(doc._id) }));
  const run = async (docs: Doc[], match: Doc, skip: number, limit: number) =>
    (await client.db().aggregate([{ $documents: docs }, { $match: match }, { $sort: BLOG_CHRONOLOGICAL_SORT }, { $skip: skip }, { $limit: limit }]).toArray()).map((d) => String(d._id));
  try {
    await client.connect();
    for (let seed = 1; seed <= 12; seed += 1) {
      for (const locale of LANGS) {
        const match = { category: CATEGORY, ...getBlogLocaleAvailabilityFilter(locale) };
        // Each page from its own physical order.
        const all = [
          ...(await run(asMongo(permute(TIED, seed)), match, 0, PAGE)),
          ...(await run(asMongo(permute(TIED, seed + 100)), match, PAGE, PAGE)),
          ...(await run(asMongo(permute(TIED, seed + 200)), match, 2 * PAGE, PAGE)),
        ];
        assert.deepEqual(all, expectedIn(locale), `seed ${seed} ${locale}`);
      }
    }
    const undated = asMongo([article(1, day(30)), article(7, undefined), article(8, null), article(2, day(20)), article(9, undefined)]);
    assert.deepEqual(await run(undated, {}, 0, 10), [1, 2, 9, 8, 7].map(oid));
    const featured = asMongo([1, 10, 11, 12, 13, 20].map((n) => article(n, n === 1 ? day(30) : n === 20 ? day(10) : day(20), LANGS, { isFeatured: true })));
    for (let seed = 1; seed <= 6; seed += 1) {
      assert.deepEqual(await run(permute(featured, seed), { isFeatured: true }, 0, 3), [1, 13, 12].map(oid));
    }
  } finally {
    await client.close();
  }
});
