import assert from 'node:assert/strict';
import test from 'node:test';
// Declares `req.locale`, which these controllers read. The full build sees it
// through tsconfig's include; a single test file only when it loads it.
import '../src/middleware/i18n';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import TourCategory from '../src/models/TourCategory';
import TourSubcategory from '../src/models/TourSubcategory';
import { getCategoryById as getBlogCategoryById } from '../src/controllers/blogCategoryController';
import { getSubcategoryById as getBlogSubcategoryById } from '../src/controllers/blogSubCategoryController';
import { getBlogsByDestination, getDestinationById } from '../src/controllers/destinationController';
import { getCategoryById as getTourCategoryById } from '../src/controllers/tourCategoryController';
import { getSubcategoryById as getTourSubcategoryById } from '../src/controllers/tourSubcategoryController';
import { BLOG_LISTING_FIELDS, BLOG_LISTING_POPULATE } from '../src/utils/blogCardPopulate';

type Doc = Record<string, unknown>;
type Handler = (req: never, res: never) => Promise<void>;

// An article as stored: one approved and one pending comment, both carrying
// the commenter's email. Nothing here touches a database.
const storedArticle = (id: string): Doc => ({
  _id: id,
  title: { en: `Article ${id}` },
  slug: { en: `article-${id}` },
  status: 'published',
  cardDescription: { en: 'What the card shows' },
  contentBlocks: [{ type: 'html', content: { en: '<p>Body</p>' } }],
  comments: [
    { _id: `${id}-c1`, name: 'Approved Reader', email: 'approved@example.test', text: 'An approved comment', isApproved: true },
    { _id: `${id}-c2`, name: 'Pending Reader', email: 'pending@example.test', text: 'A comment awaiting moderation', isApproved: false },
  ],
});
const ARTICLES = [storedArticle('a1'), storedArticle('a2')];

// What MongoDB sends back for a stored document under a projection, in the
// forms these handlers use: none, an exclusion list or an inclusion list.
const applyProjection = (doc: Doc, select?: unknown): Doc => {
  const fields = typeof select === 'string' ? select.split(/\s+/).filter(Boolean) : [];
  if (!fields.length) return { ...doc };
  if (fields.every((field) => field.startsWith('-'))) {
    const out = { ...doc };
    for (const field of fields) delete out[field.slice(1)];
    return out;
  }
  const keep = new Set(['_id', ...fields]);
  return Object.fromEntries(Object.entries(doc).filter(([key]) => keep.has(key)));
};

// Stands in for a by-id query: records every populate, then resolves to the
// entity with `featuredBlogs` filled as MongoDB would fill it under the
// projection the handler asked for.
const entityQuery = (entity: Doc) => {
  const populated: { path: string; select?: unknown }[] = [];
  const chain = {
    populate(arg: string | { path: string; select?: unknown }, select?: unknown) {
      populated.push(typeof arg === 'string' ? { path: arg, select } : arg);
      return chain;
    },
    lean: () => chain,
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
      const featured = populated.find((entry) => entry.path === 'featuredBlogs');
      const doc = { ...entity, featuredBlogs: featured ? ARTICLES.map((article) => applyProjection(article, featured.select)) : [] };
      return Promise.resolve(doc).then(resolve, reject);
    },
  };
  return chain;
};

// Stands in for a list query: records what the handler selected and
// populated, and resolves to the documents under that projection.
const listQuery = (docs: Doc[], seen: { select?: unknown; populate?: unknown } = {}) => {
  const chain = {
    select(fields: unknown) {
      seen.select = fields;
      return chain;
    },
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    populate(paths: unknown) {
      seen.populate = paths;
      return chain;
    },
    lean: () => chain,
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(docs.map((doc) => applyProjection(doc, seen.select))).then(resolve, reject),
  };
  return chain;
};

// Runs a handler and returns what Express would put on the wire.
const respond = async (handler: Handler, req: unknown) => {
  let status = 0;
  let body: unknown;
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  };
  await handler(req as never, res as never);
  return { status, json: JSON.stringify(body) };
};

// Nothing comment-shaped may cross: no key, no address, no text of either kind.
const assertNoComments = (json: string, label: string) => {
  assert.doesNotMatch(json, /"comments"/, `${label}: comments key`);
  assert.doesNotMatch(json, /@example\.test|"email"/, `${label}: commenter email`);
  assert.doesNotMatch(json, /An approved comment|A comment awaiting moderation/, `${label}: comment text`);
};

const entity = { _id: 'e1', name: { en: 'Entity' }, slug: { en: 'entity' }, featuredBlogs: ['a1', 'a2'], featuredDestinations: [] };
const BY_ID_ROUTES: [string, { findById: unknown }, Handler][] = [
  ['/blog/categories/:id', BlogCategory, getBlogCategoryById],
  ['/blog/subcategories/:id', BlogSubCategory, getBlogSubcategoryById],
  ['/destinations/:id', Destination, getDestinationById],
  ['/tours/categories/:id', TourCategory, getTourCategoryById],
  ['/tours/subcategories/:id', TourSubcategory, getTourSubcategoryById],
];

for (const [route, model, handler] of BY_ID_ROUTES) {
  test(`${route} embeds its featured articles without their stored comments`, async () => {
    const original = model.findById;
    model.findById = () => entityQuery(entity);
    try {
      const { status, json } = await respond(handler, { params: { id: 'e1' }, locale: 'bypass' });
      const featured = JSON.parse(json).data.featuredBlogs;

      assert.equal(status, 200);
      assertNoComments(json, route);
      // Still the whole article otherwise, in the same order.
      assert.deepEqual(featured.map((article: Doc) => article._id), ['a1', 'a2']);
      assert.ok(featured.every((article: Doc) => Array.isArray(article.contentBlocks)));
    } finally {
      model.findById = original;
    }
  });
}

test('/destinations/:id/blogs lists article cards, never their stored comments', async () => {
  const originals = {
    blogFind: Blog.find,
    count: Blog.countDocuments,
    categoryFind: BlogCategory.find,
    subcategoryFind: BlogSubCategory.find,
  };
  const seen: { select?: unknown; populate?: unknown } = {};
  Blog.find = (() => listQuery(ARTICLES, seen)) as unknown as typeof Blog.find;
  Blog.countDocuments = (() => Promise.resolve(ARTICLES.length)) as unknown as typeof Blog.countDocuments;
  BlogCategory.find = (() => listQuery([])) as unknown as typeof BlogCategory.find;
  BlogSubCategory.find = (() => listQuery([])) as unknown as typeof BlogSubCategory.find;

  try {
    const { status, json } = await respond(getBlogsByDestination, {
      params: { id: 'd1' },
      query: { page: '1', limit: '9' },
      locale: 'en',
    });
    const body = JSON.parse(json);

    assert.equal(status, 200);
    assertNoComments(json, '/destinations/:id/blogs');
    // The blog listings' card, from their field list and populate: never the
    // whole article.
    assert.equal(seen.select, BLOG_LISTING_FIELDS);
    assert.deepEqual(seen.populate, BLOG_LISTING_POPULATE);
    assert.deepEqual(body.data.map((article: Doc) => article._id), ['a1', 'a2']);
    assert.ok(body.data.every((article: Doc) => !('contentBlocks' in article)));
    // Localized for the request, with the slug kept whole for per-language links.
    assert.equal(body.data[0].title, 'Article a1');
    assert.deepEqual(body.data[0].slug, { en: 'article-a1' });
    assert.deepEqual(body.pagination, { page: 1, pages: 1, total: 2, limit: 9 });
  } finally {
    Blog.find = originals.blogFind;
    Blog.countDocuments = originals.count;
    BlogCategory.find = originals.categoryFind;
    BlogSubCategory.find = originals.subcategoryFind;
  }
});
