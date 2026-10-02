import type {} from '../src/types/express';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { i18nMiddleware } from '../src/middleware/i18n';
import blogCategoryRoutes from '../src/routes/blogCategoryRoutes';
import blogSubCategoryRoutes from '../src/routes/blogSubCategoryRoutes';
import tourRoutes from '../src/routes/tourRoutes';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import Tour from '../src/models/Tour';
import TourCategory from '../src/models/TourCategory';
import TourSubcategory from '../src/models/TourSubcategory';
import User from '../src/models/User';

/*
 * The four by-id category reads are public and shared with the Admin's
 * editors. Their featured destinations are landing-page cards, so an
 * anonymous caller must get published destinations only, while the Admin's
 * token gets every saved reference back (its editor re-saves them).
 *
 * Everything real runs: the Express routers with optionalProtect and a signed
 * JWT, the controllers, and Mongoose's own populate. Only the driver is
 * replaced, by in-memory collections that refuse every write, so nothing
 * reaches a database and a test that wrote would fail.
 */

const { ObjectId } = mongoose.Types;
type Doc = Record<string, any>;
process.env.JWT_SECRET = 'featured-destination-visibility-test';

// ── destinations ────────────────────────────────────────────────────────────
const name = (en: string) => ({ en, de: en, it: en, es: en });
const cairo: Doc = {
  _id: new ObjectId(), name: name('Cairo'), slug: name('cairo'),
  description: name('<p>Cairo public copy</p>'), status: 'published', isActive: true,
};
const draft: Doc = {
  _id: new ObjectId(), name: name('Secret Oasis'), slug: name('secret-oasis'),
  description: name('<p>Unreleased draft copy</p>'), heroTitle: name('Draft hero title'),
  metaTitle: name('Draft meta title'), status: 'draft', isActive: true,
};
const switchedOff: Doc = {
  _id: new ObjectId(), name: name('Retired Port'), slug: name('retired-port'), status: 'published', isActive: false,
};
// Everything that identifies the draft or its content.
const DRAFT_MARKERS = [String(draft._id), 'Secret Oasis', 'secret-oasis', 'Unreleased draft copy', 'Draft hero title', 'Draft meta title', '"status":"draft"'];

// ── the four families, each with a mixed, a published-only and a draft-only parent
const parents = (prefix: string, extra: Doc = {}) => ({
  mixed: { _id: new ObjectId(), name: name(`${prefix} mixed`), slug: name(`${prefix}-mixed`), featuredDestinations: [cairo._id, draft._id, switchedOff._id], featuredBlogs: [], isActive: true, ...extra },
  publishedOnly: { _id: new ObjectId(), name: name(`${prefix} published`), slug: name(`${prefix}-published`), featuredDestinations: [cairo._id], featuredBlogs: [], isActive: true, ...extra },
  draftOnly: { _id: new ObjectId(), name: name(`${prefix} draft`), slug: name(`${prefix}-draft`), featuredDestinations: [draft._id], featuredBlogs: [], isActive: true, ...extra },
});
const blogCategories = parents('blog-category');
const blogSubcategories = parents('blog-subcategory', { category: blogCategories.mixed._id });
const tourCategories = parents('tour-category');
const tourSubcategories = parents('tour-subcategory', { category: tourCategories.mixed._id });

const FAMILIES = [
  { label: 'Blog Category', url: '/api/blog/categories', model: BlogCategory, docs: blogCategories },
  { label: 'Blog SubCategory', url: '/api/blog/subcategories', model: BlogSubCategory, docs: blogSubcategories },
  { label: 'Tour Category', url: '/api/tours/categories', model: TourCategory, docs: tourCategories },
  { label: 'Tour SubCategory', url: '/api/tours/subcategories', model: TourSubcategory, docs: tourSubcategories },
] as const;

// ── in-memory driver ────────────────────────────────────────────────────────
const read = (doc: Doc, key: string) => key.split('.').reduce<unknown>((value, part) => (value as Doc | undefined)?.[part], doc);
/** Enough of MongoDB's matching for the filters these reads and populates send. */
function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    const value = read(doc, key);
    if (condition && typeof condition === 'object' && !(condition instanceof ObjectId)) {
      if ('$in' in condition) return (condition.$in as unknown[]).some((item) => String(item) === String(value));
      if ('$ne' in condition) return value !== condition.$ne;
    }
    return String(value) === String(condition);
  });
}

const WRITES = ['insertOne', 'insertMany', 'updateOne', 'updateMany', 'replaceOne', 'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete', 'deleteOne', 'deleteMany', 'bulkWrite'];
const writes: string[] = [];
const failingReads = new Set<unknown>();
const stores = new Map<unknown, Doc[]>([
  [Destination, [cairo, draft, switchedOff]],
  [BlogCategory, Object.values(blogCategories)],
  [BlogSubCategory, Object.values(blogSubcategories)],
  [TourCategory, Object.values(tourCategories)],
  [TourSubcategory, Object.values(tourSubcategories)],
  [Blog, []],
  [Tour, []],
]);
// A deep copy, as the driver would hand out, that keeps ObjectIds and Dates.
const copy = (value: any): any => {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object' && !(value instanceof ObjectId) && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
  }
  return value;
};
/** A top-level projection, inclusive or exclusive, as the server applies it. */
const project = (doc: Doc, projection?: Record<string, unknown>): Doc => {
  const entries = Object.entries(projection || {});
  if (!entries.length) return doc;
  const included = entries.filter(([key, on]) => on && key !== '_id').map(([key]) => key);
  if (included.length) {
    return Object.fromEntries(Object.entries(doc).filter(([key]) => included.includes(key) || (key === '_id' && projection!._id !== 0)));
  }
  return Object.fromEntries(Object.entries(doc).filter(([key]) => !entries.some(([off]) => off === key)));
};
for (const [model, docs] of stores) {
  const collection = (model as { collection: Record<string, unknown> }).collection;
  const fail = () => { if (failingReads.has(model)) throw new Error('connection reset'); };
  type Options = { projection?: Record<string, unknown> };
  collection.findOne = async (filter: Doc, options?: Options) => {
    fail();
    const doc = docs.find((d) => matches(d, filter));
    return doc ? project(copy(doc), options?.projection) : null;
  };
  collection.find = (filter: Doc, options?: Options) => ({
    toArray: async () => { fail(); return docs.filter((d) => matches(d, filter)).map((d) => project(copy(d), options?.projection)); },
    close: async () => {},
  });
  collection.countDocuments = async (filter: Doc) => docs.filter((d) => matches(d, filter)).length;
  for (const method of WRITES) {
    collection[method] = async () => { writes.push(`${(model as { modelName: string }).modelName}.${method}`); throw new Error('a read test must not write'); };
  }
}
test.after(() => {
  for (const model of stores.keys()) {
    const collection = (model as { collection: Record<string, unknown> }).collection;
    for (const method of ['findOne', 'find', 'countDocuments', ...WRITES]) delete collection[method];
  }
});

// ── users behind the tokens ─────────────────────────────────────────────────
const USERS: Record<string, Doc> = {
  superadmin: { _id: new ObjectId(), role: 'superadmin', permissions: [], isActive: true },
  blogEditor: { _id: new ObjectId(), role: 'admin', permissions: ['blog:read', 'blog:update'], isActive: true },
  tourEditor: { _id: new ObjectId(), role: 'admin', permissions: ['tour:read', 'tour:update'], isActive: true },
  noReadPermission: { _id: new ObjectId(), role: 'admin', permissions: ['booking:read'], isActive: true },
  deactivated: { _id: new ObjectId(), role: 'superadmin', permissions: [], isActive: false },
};
const tokenFor = (user: string) => jwt.sign({ id: String(USERS[user]._id) }, process.env.JWT_SECRET as string, { expiresIn: '5m' });
const lookUpUser = (id: unknown) => ({ select: async () => Object.values(USERS).find((user) => String(user._id) === String(id)) ?? null });

// ── the API, through its real routers ───────────────────────────────────────
let server: Server;
let base = '';
test.before(async () => {
  const app = express();
  app.use(i18nMiddleware);
  app.use('/api/blog/categories', blogCategoryRoutes);
  app.use('/api/blog/subcategories', blogSubCategoryRoutes);
  app.use('/api/tours', tourRoutes);
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.after(() => new Promise((resolve) => server.close(resolve)));

async function get(path: string, authorization?: string) {
  const response = await fetch(`${base}${path}`, { headers: authorization ? { authorization } : {} });
  const text = await response.text();
  return { status: response.status, text, body: JSON.parse(text) as Doc };
}
const featuredSlugs = (body: Doc) => (body.data.featuredDestinations as Doc[]).map((destination) => destination?.slug?.en ?? destination);
const leaks = (text: string) => DRAFT_MARKERS.filter((marker) => text.includes(marker));

// ── anonymous ───────────────────────────────────────────────────────────────
test('anonymous by-id reads feature published destinations only, in all four families', async (context) => {
  context.mock.method(User, 'findById', lookUpUser);
  for (const family of FAMILIES) {
    const cases: [keyof typeof family.docs, string[]][] = [
      ['publishedOnly', ['cairo']],
      ['draftOnly', []],
      ['mixed', ['cairo']],
    ];
    for (const [parent, expected] of cases) {
      const { status, text, body } = await get(`${family.url}/${family.docs[parent]._id}`);
      const label = `${family.label} ${parent}`;
      assert.equal(status, 200, label);
      // A clean array: drafts and switched-off pages are left out, no nulls.
      assert.deepEqual(featuredSlugs(body), expected, label);
      assert.deepEqual(leaks(text), [], `${label}: nothing of the draft in the response`);
      assert.ok(!text.includes('Retired Port'), `${label}: a switched-off destination is not public either`);
    }
    // Published destinations still come back as before: the whole document.
    const { body } = await get(`${family.url}/${family.docs.publishedOnly._id}`);
    assert.equal(body.data.featuredDestinations[0].description.en, '<p>Cairo public copy</p>', family.label);
  }
  // A token that does not carry the Admin's read permission is a public read.
  for (const authorization of [`Bearer ${tokenFor('noReadPermission')}`, `Bearer ${tokenFor('deactivated')}`, 'Bearer not-a-valid-token']) {
    for (const family of FAMILIES) {
      const { status, text, body } = await get(`${family.url}/${family.docs.mixed._id}`, authorization);
      assert.equal(status, 200);
      assert.deepEqual(featuredSlugs(body), ['cairo'], `${family.label} with ${authorization.slice(0, 20)}`);
      assert.deepEqual(leaks(text), []);
    }
  }
  assert.deepEqual(writes, []);
});

// ── Admin ───────────────────────────────────────────────────────────────────
test("the Admin's editor gets every saved reference back, drafts included", async (context) => {
  context.mock.method(User, 'findById', lookUpUser);
  for (const user of ['superadmin', 'blogEditor', 'tourEditor']) {
    for (const family of FAMILIES) {
      const { status, body } = await get(`${family.url}/${family.docs.mixed._id}`, `Bearer ${tokenFor(user)}`);
      const label = `${family.label} as ${user}`;
      assert.equal(status, 200, label);
      // Stored order, every reference: the editor re-saves exactly these ids.
      assert.deepEqual(featuredSlugs(body), ['cairo', 'secret-oasis', 'retired-port'], label);
      assert.deepEqual(
        (body.data.featuredDestinations as Doc[]).map((destination) => destination._id),
        family.docs.mixed.featuredDestinations.map(String),
        label
      );
      assert.equal(body.data.featuredDestinations[1].status, 'draft', label);
    }
  }
  assert.deepEqual(writes, []);
});

// ── publication changes visibility, never the parent ────────────────────────
test("publishing and unpublishing a featured destination changes what the public sees, not the parent's references", async (context) => {
  context.mock.method(User, 'findById', lookUpUser);
  const stored = FAMILIES.map((family) => family.docs.mixed.featuredDestinations.map(String));
  const anonymous = async () => Promise.all(FAMILIES.map(async (family) => featuredSlugs((await get(`${family.url}/${family.docs.mixed._id}`)).body)));
  try {
    draft.status = 'published';
    assert.deepEqual(await anonymous(), FAMILIES.map(() => ['cairo', 'secret-oasis']), 'published: it appears');
    draft.status = 'draft';
    assert.deepEqual(await anonymous(), FAMILIES.map(() => ['cairo']), 'back to draft: it disappears');
    draft.status = 'published';
    assert.deepEqual(await anonymous(), FAMILIES.map(() => ['cairo', 'secret-oasis']), 'published again: it is back');
  } finally {
    draft.status = 'draft';
  }
  // The parents still hold the very same references, and nothing was written.
  assert.deepEqual(FAMILIES.map((family) => family.docs.mixed.featuredDestinations.map(String)), stored);
  assert.deepEqual(writes, []);
});

// ── failures stay failures ──────────────────────────────────────────────────
test('a missing parent is a 404, a bad id a 400 and a backend failure a 500, as before', async (context) => {
  context.mock.method(User, 'findById', lookUpUser);
  context.mock.method(console, 'error', () => {});
  for (const family of FAMILIES) {
    for (const authorization of [undefined, `Bearer ${tokenFor('superadmin')}`]) {
      const who = authorization ? 'Admin' : 'anonymous';
      const missing = await get(`${family.url}/${new ObjectId()}`, authorization);
      assert.equal(missing.status, 404, `${family.label} missing, ${who}`);
      assert.equal(missing.body.success, false);

      assert.equal((await get(`${family.url}/not-an-id`, authorization)).status, 400, `${family.label} bad id, ${who}`);

      failingReads.add(family.model);
      try {
        const failed = await get(`${family.url}/${family.docs.mixed._id}`, authorization);
        assert.equal(failed.status, 500, `${family.label} parent read fails, ${who}`);
        assert.equal(failed.body.success, false);
      } finally {
        failingReads.delete(family.model);
      }

      // The destinations read failing is a failure too, never an empty list.
      failingReads.add(Destination);
      try {
        assert.equal((await get(`${family.url}/${family.docs.mixed._id}`, authorization)).status, 500, `${family.label} populate fails, ${who}`);
      } finally {
        failingReads.delete(Destination);
      }
    }
  }
  assert.deepEqual(writes, []);
});
