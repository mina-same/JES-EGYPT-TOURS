import assert from 'node:assert/strict';
import test from 'node:test';
// Declares `req.locale`, which these controllers read.
import '../src/middleware/i18n';
import type {} from '../src/types/express';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import { PUBLIC_DESTINATION_FILTER } from '../src/models/Destination';
import { getBlogBySlug } from '../src/controllers/blogController';
import { getBlogsByDestination } from '../src/controllers/destinationController';
import { ARTICLE_DESTINATION_FIELDS } from '../src/utils/blogClassification';
import sift from 'sift';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type Handler = (req: never, res: never) => Promise<void>;

const CAIRO = 'cairo';
const LUXOR = 'luxor';
const HURGHADA = 'hurghada';
const EGYPT_BLOG = 'egypt-blog';
const TRAVEL_TIPS = 'travel-tips';

// One category and one topic hold every article, and both feature Cairo,
// Luxor and Hurghada — the arrangement that used to put every article on
// every one of those destinations' pages.
const CATEGORIES: Doc[] = [{ _id: EGYPT_BLOG, featuredDestinations: [CAIRO, LUXOR, HURGHADA] }];
const TOPICS: Doc[] = [{ _id: TRAVEL_TIPS, category: EGYPT_BLOG, featuredDestinations: [CAIRO, LUXOR, HURGHADA] }];

const article = (id: string, destination: string, day: number, status = 'published'): Doc => ({
  _id: id,
  title: { en: `Article ${id}` },
  slug: { en: `article-${id}` },
  status,
  category: EGYPT_BLOG,
  subCategory: TRAVEL_TIPS,
  destination,
  publishedAt: new Date(Date.UTC(2026, 0, day)),
  // An English body, so each article is public in English (utils/blogAvailability.ts).
  contentBlocks: [{ type: 'html', content: { en: `<p>Article ${id}</p>` } }],
});

const ARTICLES: Doc[] = [
  article('a-cairo', CAIRO, 20),
  article('b-luxor', LUXOR, 19),
  article('c-cairo', CAIRO, 18),
  article('d-cairo-draft', CAIRO, 21, 'draft'),
];

// MongoDB's answer to the filters used here, through sift (MongoDB query
// semantics, the matcher mongoose itself depends on): equality, $in, $ne, $or,
// $and, and the language-availability filter's $regex and $elemMatch. A query
// that went back to "its own destination OR its category's featured ones"
// would be evaluated faithfully and fail these tests.
const matches = (doc: Doc, filter: Doc): boolean => sift(filter)(doc);

type Reads = { category: number; topic: number; sort?: unknown };

/** Swaps the model reads for in-memory ones over `articles` and counts the featured-list lookups. */
const withStore = async (articles: Doc[], run: (reads: Reads) => Promise<void>) => {
  const originals = {
    find: Blog.find,
    count: Blog.countDocuments,
    categoryFind: BlogCategory.find,
    topicFind: BlogSubCategory.find,
  };
  const reads: Reads = { category: 0, topic: 0 };

  Blog.find = ((filter: Doc) => {
    let rows = articles.filter((doc) => matches(doc, filter));
    const chain = {
      select: () => chain,
      populate: () => chain,
      sort(order: unknown) {
        reads.sort = order;
        rows = [...rows].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        return chain;
      },
      skip(count: number) {
        rows = rows.slice(count);
        return chain;
      },
      limit(count: number) {
        rows = rows.slice(0, count);
        return chain;
      },
      lean: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(rows.map((row) => ({ ...row }))).then(resolve, reject),
    };
    return chain;
  }) as unknown as typeof Blog.find;
  Blog.countDocuments = ((filter: Doc) =>
    Promise.resolve(articles.filter((doc) => matches(doc, filter)).length)) as unknown as typeof Blog.countDocuments;

  // What the stored documents would answer if anyone asked which categories
  // and topics feature a destination.
  const featuring = (docs: Doc[], counter: 'category' | 'topic') => (filter: Doc) => {
    reads[counter] += 1;
    const rows = docs.filter((doc) => doc.featuredDestinations.includes(filter.featuredDestinations));
    const chain = {
      select: () => chain,
      lean: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(rows).then(resolve, reject),
    };
    return chain;
  };
  BlogCategory.find = featuring(CATEGORIES, 'category') as unknown as typeof BlogCategory.find;
  BlogSubCategory.find = featuring(TOPICS, 'topic') as unknown as typeof BlogSubCategory.find;

  try {
    await run(reads);
  } finally {
    Blog.find = originals.find;
    Blog.countDocuments = originals.count;
    BlogCategory.find = originals.categoryFind;
    BlogSubCategory.find = originals.topicFind;
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

const listFor = (destination: string, query: Doc = {}) =>
  respond(getBlogsByDestination, { params: { id: destination }, query, locale: 'en' });

const ids = (body: Doc) => (body.data as Doc[]).map((item) => item._id);

test('a destination lists the articles filed under it, and no other destination\'s', async () => {
  await withStore(ARTICLES, async () => {
    const cairo = await listFor(CAIRO);
    assert.equal(cairo.status, 200);
    assert.deepEqual(ids(cairo.body), ['a-cairo', 'c-cairo']);

    const luxor = await listFor(LUXOR);
    assert.equal(luxor.status, 200);
    assert.deepEqual(ids(luxor.body), ['b-luxor']);
  });
});

test('a category or topic featuring a destination adds none of its articles to that destination', async () => {
  await withStore(ARTICLES, async (reads) => {
    // Every article is in the one category and the one topic, and both feature
    // all three destinations: were that membership, each list would hold all three.
    for (const [destination, expected] of [
      [CAIRO, ['a-cairo', 'c-cairo']],
      [LUXOR, ['b-luxor']],
      [HURGHADA, []],
    ] as const) {
      const { body } = await listFor(destination);
      assert.deepEqual(ids(body), expected, destination);
      assert.equal(body.pagination.total, expected.length, destination);
    }
    // The featured lists are presentation for their own page: not read here at all.
    assert.deepEqual({ category: reads.category, topic: reads.topic }, { category: 0, topic: 0 });
  });
});

test('only published articles are listed, newest first', async () => {
  await withStore(ARTICLES, async (reads) => {
    const { body } = await listFor(CAIRO);
    assert.ok(!ids(body).includes('d-cairo-draft'));
    assert.deepEqual(ids(body), ['a-cairo', 'c-cairo']);
    assert.equal(reads.sort, '-publishedAt');
  });
});

test('the total and the pages count the same direct membership as the list', async () => {
  // Eleven Cairo articles and one Luxor article in the same category and topic.
  const eleven = Array.from({ length: 11 }, (_, index) => article(`cairo-${String(index + 1).padStart(2, '0')}`, CAIRO, 28 - index));
  const store = [...eleven, article('b-luxor', LUXOR, 1)];

  await withStore(store, async () => {
    const first = await listFor(CAIRO, { page: '1', limit: '9' });
    assert.deepEqual(first.body.pagination, { page: 1, pages: 2, total: 11, limit: 9 });
    assert.equal(first.body.data.length, 9);
    assert.equal(ids(first.body)[0], 'cairo-01');

    const second = await listFor(CAIRO, { page: '2', limit: '9' });
    assert.deepEqual(second.body.pagination, { page: 2, pages: 2, total: 11, limit: 9 });
    assert.deepEqual(ids(second.body), ['cairo-10', 'cairo-11']);

    // One article: one page, so the destination page draws no pager.
    const luxor = await listFor(LUXOR, { page: '1', limit: '9' });
    assert.deepEqual(luxor.body.pagination, { page: 1, pages: 1, total: 1, limit: 9 });
    assert.deepEqual(ids(luxor.body), ['b-luxor']);
  });
});

test('a destination with no article of its own answers an empty list, not an error', async () => {
  await withStore(ARTICLES, async () => {
    const { status, body } = await listFor(HURGHADA, { page: '1', limit: '9' });
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, []);
    assert.deepEqual(body.pagination, { page: 1, pages: 0, total: 0, limit: 9 });
  });
});

// ── The article's own page names its destination ────────────────────────────

const DESTINATIONS: Doc[] = [
  {
    _id: CAIRO,
    name: { en: 'Cairo', de: 'Kairo', it: 'Il Cairo', es: 'El Cairo' },
    shortName: { en: 'Cairo', de: 'Kairo', it: 'Il Cairo', es: 'El Cairo' },
    slug: { en: 'cairo', de: 'kairo', it: 'il-cairo', es: 'el-cairo' },
    description: { en: 'The capital.' },
    faqs: [{ question: { en: 'Q' }, answer: { en: 'A' } }],
    status: 'published',
    isActive: true,
  },
  {
    _id: 'abu-simbel',
    name: { en: 'Abu Simbel' },
    slug: { en: 'abu-simbel' },
    status: 'draft',
    isActive: true,
  },
];

const publishedArticle = (destination: string): Doc => ({
  _id: 'article-1',
  title: { en: 'Saladin Citadel', de: 'Zitadelle von Saladin', it: 'Cittadella di Saladino', es: 'Ciudadela de Saladino' },
  slug: { en: 'saladin-citadel', de: 'zitadelle-von-saladin', it: 'cittadella-di-saladino', es: 'ciudadela-de-saladino' },
  status: 'published',
  destination,
  // Written in all four languages, so the article is public in each of them.
  contentBlocks: [{ type: 'html', content: { en: '<p>The citadel.</p>', de: '<p>Die Zitadelle.</p>', it: '<p>La cittadella.</p>', es: '<p>La ciudadela.</p>' } }],
  comments: [],
});

/** Stands in for the by-slug read: fills `destination` the way the handler's populate asks MongoDB to. */
const withArticle = async (stored: Doc, run: (populates: Doc[]) => Promise<void>) => {
  const original = Blog.findOne;
  const populates: Doc[] = [];
  Blog.findOne = (() => {
    const chain = {
      populate(arg: string | Doc) {
        populates.push(typeof arg === 'string' ? { path: arg } : arg);
        return chain;
      },
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
        const asked = populates.find((entry) => entry.path === 'destination');
        const found = DESTINATIONS.find((doc) => doc._id === stored.destination);
        const visible = Boolean(found && asked && (!asked.match || matches(found, asked.match)));
        const fields = new Set(['_id', ...String(asked?.select ?? '').split(/\s+/).filter(Boolean)]);
        const destination = !asked
          ? stored.destination
          : visible
            ? Object.fromEntries(Object.entries(found as Doc).filter(([key]) => !asked.select || fields.has(key)))
            : null;
        return Promise.resolve({ ...stored, destination }).then(resolve, reject);
      },
    };
    return chain;
  }) as unknown as typeof Blog.findOne;

  try {
    await run(populates);
  } finally {
    Blog.findOne = original;
  }
};

test('the public article carries its destination: the name, the short name and the slugs, nothing else', async () => {
  await withArticle(publishedArticle(CAIRO), async (populates) => {
    for (const [locale, name] of [['en', 'Cairo'], ['de', 'Kairo'], ['it', 'Il Cairo'], ['es', 'El Cairo']] as const) {
      const { status, body } = await respond(getBlogBySlug, { params: { slug: 'saladin-citadel' }, locale });
      assert.equal(status, 200, locale);
      assert.deepEqual(body.data.destination, {
        _id: CAIRO,
        // Localized for the request; the slug stays whole so the page links in its own language.
        name,
        shortName: { en: 'Cairo', de: 'Kairo', it: 'Il Cairo', es: 'El Cairo' },
        slug: { en: 'cairo', de: 'kairo', it: 'il-cairo', es: 'el-cairo' },
      }, locale);
    }

    const asked = populates.find((entry) => entry.path === 'destination') as Doc;
    assert.equal(asked.select, ARTICLE_DESTINATION_FIELDS);
    assert.equal(ARTICLE_DESTINATION_FIELDS, 'name shortName slug');
    // Only a destination with a public page: a link to a draft would be a 404.
    assert.deepEqual(asked.match, { ...PUBLIC_DESTINATION_FILTER });
  });
});

test('an article filed under a destination with no public page carries no destination to link', async () => {
  await withArticle(publishedArticle('abu-simbel'), async () => {
    const { status, body } = await respond(getBlogBySlug, { params: { slug: 'saladin-citadel' }, locale: 'en' });
    assert.equal(status, 200);
    assert.equal(body.data.destination, null);
  });
});
