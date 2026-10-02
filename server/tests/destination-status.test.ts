import type {} from '../src/types/express';
import '../src/middleware/i18n';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import Destination, { PUBLIC_DESTINATION_FILTER } from '../src/models/Destination';
import Tour from '../src/models/Tour';
import TourCategory from '../src/models/TourCategory';
import TourSubcategory from '../src/models/TourSubcategory';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import EditorialAuthor from '../src/models/EditorialAuthor';
import Faq from '../src/models/Faq';
import { resolveSlug } from '../src/controllers/resolveController';
import { getSitemapData, SITEMAP_VISIBILITY, type SitemapData } from '../src/controllers/sitemapController';
import {
  createDestination,
  getAllDestinations,
  getDestinationById,
  getDestinationBySlug,
  updateDestination,
} from '../src/controllers/destinationController';
import * as blogCategories from '../src/controllers/blogCategoryController';
import * as blogSubcategories from '../src/controllers/blogSubCategoryController';
import * as tourCategories from '../src/controllers/tourCategoryController';
import * as tourSubcategories from '../src/controllers/tourSubcategoryController';
import { getTourFilterOptions } from '../src/controllers/tourController';

/*
 * A destination's publication status: `draft` has no public landing page,
 * `published` has one. It governs the page only; a tour may reference a draft
 * destination and keeps showing and filtering by it.
 *
 * The real models, controllers and middleware run. Model statics and driver
 * calls are replaced per test, so nothing reaches a database, and fetch is
 * replaced, so a revalidation request is captured instead of sent.
 */

const { ObjectId } = mongoose.Types;
const PUBLIC = { status: 'published', isActive: { $ne: false } };

// ── captured revalidation webhook ───────────────────────────────────────────
const sent: string[][] = [];
process.env.REVALIDATE_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://front.test';
const realFetch = globalThis.fetch;
globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body)).tags);
  return new globalThis.Response('{}', { status: 200 });
}) as typeof fetch;
test.after(() => {
  globalThis.fetch = realFetch;
});
async function tagsSentBy(write: () => Promise<unknown>): Promise<string[][]> {
  sent.length = 0;
  await write();
  await new Promise((resolve) => setImmediate(resolve));
  return sent.map((tags) => tags);
}

// ── helpers ─────────────────────────────────────────────────────────────────
type Doc = Record<string, unknown>;
/** Replaces a model static (or console.log) for one test; node:test restores it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const replace = (context: { mock: { method: (...args: any[]) => unknown } }, target: unknown, method: string, implementation: (...args: any[]) => unknown) =>
  context.mock.method(target, method, implementation);
const read = (doc: Doc, key: string) => key.split('.').reduce<unknown>((value, part) => (value as Doc | undefined)?.[part], doc);
/** Enough of MongoDB's matching for the filters these controllers build. */
function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') return (condition as Doc[]).some((branch) => matches(doc, branch));
    const value = read(doc, key);
    if (condition && typeof condition === 'object' && '$ne' in (condition as Doc)) return value !== (condition as Doc).$ne;
    if (condition && typeof condition === 'object' && '$in' in (condition as Doc)) {
      return ((condition as Doc).$in as unknown[]).some((item) => String(item) === String(value));
    }
    return String(value) === String(condition);
  });
}

/** A query chain: records populate() arguments, resolves to `result` on lean(). */
function chain(result: unknown, populated: unknown[] = []) {
  const query: Record<string, unknown> = {
    populate: (arg: unknown) => { populated.push(arg); return query; },
    select: () => query,
    sort: () => query,
    skip: () => query,
    limit: () => query,
    lean: async () => result,
  };
  return query;
}

function fakeResponse() {
  const out: { status?: number; body?: Record<string, unknown> } = {};
  const res = {
    status(code: number) { out.status = code; return res; },
    json(body: Record<string, unknown>) { out.body = body; return res; },
  };
  return { res: res as unknown as Response, out };
}
const request = (parts: Record<string, unknown>) => ({ query: {}, params: {}, body: {}, locale: 'en', ...parts }) as unknown as Request;
const admin = { role: 'superadmin', permissions: [], isActive: true };

const name = (en: string) => ({ en, de: en, it: en, es: en });
const cairo = { _id: new ObjectId(), name: name('Cairo'), slug: name('cairo'), filterKey: 'cairo', status: 'published', isActive: true };
const abuSimbel = { _id: new ObjectId(), name: name('Abu Simbel'), slug: name('abu-simbel'), filterKey: 'abu-simbel', status: 'draft', isActive: true };
const retired = { _id: new ObjectId(), name: name('Retired'), slug: name('retired'), status: 'published', isActive: false };
const legacy = { _id: new ObjectId(), name: name('Legacy'), slug: name('legacy'), isActive: true };
const ALL = [cairo, abuSimbel, retired, legacy];

function stubDriver() {
  const collection = Destination.collection as unknown as Record<string, unknown>;
  collection.insertOne = async () => ({ acknowledged: true, insertedId: new ObjectId() });
  collection.updateOne = async () => ({ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 });
  // The duplicate-internal-links plugin reads the documents an update matches.
  collection.find = () => ({ toArray: async () => [], close: async () => {} });
}

// ── model ───────────────────────────────────────────────────────────────────
test('a new destination is a draft, and only draft or published is accepted', async () => {
  const fresh = new Destination({ name: name('Edfu'), slug: name('edfu') });
  assert.equal(fresh.status, 'draft');
  await fresh.validate();

  const published = new Destination({ name: name('Cairo'), slug: name('cairo'), status: 'published' });
  await published.validate();
  assert.equal(published.status, 'published');

  for (const status of ['scheduled', 'PUBLISHED', '', 'live']) {
    const invalid = new Destination({ name: name('X'), slug: name('x'), status });
    await assert.rejects(() => invalid.validate(), /status/, `status ${JSON.stringify(status)}`);
  }
});

test('the public rule is published and active, shared by the resolver and the sitemap', () => {
  assert.deepEqual(PUBLIC_DESTINATION_FILTER, PUBLIC);
  assert.equal(SITEMAP_VISIBILITY.destinations, PUBLIC_DESTINATION_FILTER);
  for (const doc of ALL) {
    assert.equal(matches(doc, PUBLIC_DESTINATION_FILTER), doc === cairo, String(doc.name.en));
  }
});

// ── resolver ────────────────────────────────────────────────────────────────
test('the resolver answers a published destination and treats a draft as not found', async (context) => {
  for (const model of [Tour, TourCategory, TourSubcategory, BlogCategory, BlogSubCategory, Blog]) {
    replace(context,model as unknown as { findOne: unknown }, 'findOne', () => chain(null));
  }
  replace(context,Destination, 'findOne', (filter: Doc) =>
    chain(ALL.find((doc) => matches(doc, filter)) ?? null));

  const resolve = async (slug: string) => {
    const { res, out } = fakeResponse();
    await resolveSlug(request({ params: { slug } }), res);
    return out;
  };

  const live = await resolve('cairo');
  assert.equal(live.status, 200);
  assert.equal((live.body?.data as Doc).type, 'destination');

  // A draft: the same answer as a slug that does not exist, with no identity
  // in the response. Its status alone decides it; there is no robots flag.
  const missing = await resolve('no-such-slug');
  for (const slug of ['abu-simbel', 'retired', 'legacy']) {
    const draft = await resolve(slug);
    assert.equal(draft.status, 404, slug);
    assert.deepEqual(draft.body, missing.body, slug);
  }
});

// ── sitemap ─────────────────────────────────────────────────────────────────
test('the sitemap lists published destinations and never a draft', async (context) => {
  const updatedAt = new Date('2026-09-01T10:00:00.000Z');
  const giza = { ...cairo, _id: new ObjectId(), slug: name('giza'), updatedAt };
  const stored = [{ ...cairo, updatedAt }, { ...abuSimbel, updatedAt }, { ...retired, updatedAt }, giza];
  for (const model of [Tour, TourCategory, TourSubcategory, BlogCategory, BlogSubCategory]) {
    replace(context,model as unknown as { find: unknown }, 'find', () => chain([]));
  }
  replace(context,Tour, 'aggregate', async () => []);
  replace(context,Destination, 'find', (filter: Doc) => chain(stored.filter((doc) => matches(doc, filter))));
  replace(context,Blog, 'aggregate', async () => []);
  replace(context,EditorialAuthor, 'find', () => chain([]));
  replace(context,Faq, 'find', () => chain([]));

  const { res, out } = fakeResponse();
  await getSitemapData(request({}), res);
  assert.equal(out.status, 200);
  const destinations = (out.body?.data as SitemapData).destinations;
  assert.deepEqual(destinations.map((entity) => entity.slug.en), ['cairo', 'giza']);
});

// ── public destination reads ────────────────────────────────────────────────
test('an anonymous caller gets published destinations only; the Admin gets all of them', async (context) => {
  replace(context,Destination, 'find', (filter: Doc) => chain(ALL.filter((doc) => matches(doc, filter))));
  replace(context,Destination, 'countDocuments', async (filter: Doc) => ALL.filter((doc) => matches(doc, filter)).length);
  const list = async (parts: Record<string, unknown>) => {
    const { res, out } = fakeResponse();
    await getAllDestinations(request(parts) as unknown as Parameters<typeof getAllDestinations>[0], res);
    return ((out.body?.data as Doc[]) || []).map((doc) => (doc.slug as Doc).en);
  };

  assert.deepEqual(await list({}), ['cairo']);
  // No query parameter widens it.
  assert.deepEqual(await list({ query: { status: 'draft' } }), ['cairo']);
  assert.deepEqual(await list({ query: { isActive: 'false' } }), ['cairo']);

  assert.deepEqual(await list({ user: admin }), ['cairo', 'abu-simbel', 'retired', 'legacy']);
  assert.deepEqual(await list({ user: admin, query: { status: 'draft' } }), ['abu-simbel']);
  assert.deepEqual(await list({ user: admin, query: { status: 'published' } }), ['cairo', 'retired']);
  // An editor of tours reads drafts too: the Places Visited picker needs them.
  assert.deepEqual(await list({ user: { role: 'admin', permissions: ['tour:read'] } }), ['cairo', 'abu-simbel', 'retired', 'legacy']);
  assert.deepEqual(await list({ user: { role: 'admin', permissions: [] } }), ['cairo']);
});

test('a draft is a 404 by id and by slug for the public, and readable by the Admin', async (context) => {
  const populated: unknown[] = [];
  replace(context,Destination, 'findOne', (filter: Doc) =>
    chain(ALL.find((doc) => matches(doc, filter)) ?? null, populated));
  const byId = async (doc: Doc, user?: unknown) => {
    const { res, out } = fakeResponse();
    await getDestinationById(request({ params: { id: String(doc._id) }, user }), res);
    return out.status;
  };
  const bySlug = async (slug: string) => {
    const { res, out } = fakeResponse();
    await getDestinationBySlug(request({ params: { slug } }), res);
    return out.status;
  };

  assert.equal(await byId(cairo), 200);
  assert.equal(await byId(abuSimbel), 404);
  assert.equal(await bySlug('cairo'), 200);
  assert.equal(await bySlug('abu-simbel'), 404);
  assert.equal(await bySlug('retired'), 404);
  // Every public read so far populated related destinations as landing pages only.
  const related = populated.filter((arg) => (arg as Doc).path === 'relatedDestinations');
  assert.ok(related.length > 0);
  for (const arg of related) assert.deepEqual((arg as Doc).match, PUBLIC);

  populated.length = 0;
  assert.equal(await byId(abuSimbel, admin), 200);
  // The Admin's editor gets its saved references whole, drafts included.
  assert.equal((populated.find((arg) => (arg as Doc).path === 'relatedDestinations') as Doc).match, undefined);
});

// ── cards that link to a destination page ───────────────────────────────────
test('public category pages feature published destinations; Admin reads keep every reference', async (context) => {
  const families = [
    { model: BlogCategory, controller: blogCategories, bySlug: 'getCategoryBySlug', byId: 'getCategoryById' },
    { model: BlogSubCategory, controller: blogSubcategories, bySlug: 'getSubcategoryBySlug', byId: 'getSubcategoryById' },
    { model: TourCategory, controller: tourCategories, bySlug: 'getCategoryBySlug', byId: 'getCategoryById' },
    { model: TourSubcategory, controller: tourSubcategories, bySlug: 'getSubcategoryBySlug', byId: 'getSubcategoryById' },
  ] as const;
  for (const family of families) {
    const populated: unknown[] = [];
    const model = family.model as unknown as { findOne: unknown; findById: unknown };
    replace(context,model, 'findOne', () => chain(null, populated));
    replace(context,model, 'findById', () => chain(null, populated));
    const handlers = family.controller as unknown as Record<string, (req: Request, res: Response) => Promise<void>>;
    const featured = () => populated.find((arg) => typeof arg === 'object' && (arg as Doc).path === 'featuredDestinations') as Doc | undefined;

    await handlers[family.bySlug](request({ params: { slug: 'any' } }), fakeResponse().res);
    assert.deepEqual(featured()?.match, PUBLIC, `${family.model.modelName} by slug`);

    // By id: the same rule for an anonymous caller; the Admin's editor gets
    // every saved reference back.
    populated.length = 0;
    await handlers[family.byId](request({ params: { id: String(new ObjectId()) } }), fakeResponse().res);
    assert.deepEqual(featured()?.match, PUBLIC, `${family.model.modelName} by id, anonymous`);

    populated.length = 0;
    await handlers[family.byId](request({ params: { id: String(new ObjectId()) }, user: admin }), fakeResponse().res);
    assert.ok(featured() && !('match' in featured()!), `${family.model.modelName} by id, Admin populates every reference`);
  }
});

// ── Admin writes ────────────────────────────────────────────────────────────
test('create: a destination is a draft unless it is published explicitly', async () => {
  stubDriver();
  const create = async (body: Record<string, unknown>) => {
    const { res, out } = fakeResponse();
    const tags = await tagsSentBy(() => createDestination(request({ body }), res));
    return { out, tags };
  };

  const draft = await create({ name: name('Edfu'), slug: name('edfu') });
  assert.equal(draft.out.status, 201);
  assert.equal((draft.out.body?.data as Doc).status, 'draft');
  assert.deepEqual(draft.tags, [['destinations', 'tours']]);

  const live = await create({ name: name('Dahab'), slug: name('dahab'), status: 'published' });
  assert.equal((live.out.body?.data as Doc).status, 'published');

  for (const status of ['scheduled', true, null, '']) {
    const rejected = await create({ name: name('X'), slug: name('x'), status });
    assert.equal(rejected.out.status, 400, `status ${JSON.stringify(status)}`);
    assert.deepEqual(rejected.tags, [], 'nothing was written');
  }
});

test('edit: a draft stays a draft, publishes, and goes back, with one revalidation per save', async (context) => {
  stubDriver();
  const doc = new Destination({ name: name('Abu Simbel'), slug: name('abu-simbel'), filterKey: 'abu-simbel' });
  doc.isNew = false;
  replace(context,Destination, 'findById', async () => doc);
  replace(context,console, 'log', () => {});
  const update = async (body: Record<string, unknown>) => {
    const { res, out } = fakeResponse();
    const tags = await tagsSentBy(() => updateDestination(request({ params: { id: String(doc._id) }, body }), res));
    return { status: out.status, tags };
  };

  // Editing content without sending a status leaves the draft a draft.
  assert.deepEqual(await update({ subheader: name('Temples of Ramses II') }), { status: 200, tags: [['destinations', 'tours']] });
  assert.equal(doc.status, 'draft');

  assert.deepEqual(await update({ status: 'published' }), { status: 200, tags: [['destinations', 'tours']] });
  assert.equal(doc.status, 'published');
  assert.equal(matches(doc.toObject() as unknown as Doc, PUBLIC_DESTINATION_FILTER), true);

  assert.deepEqual(await update({ status: 'draft' }), { status: 200, tags: [['destinations', 'tours']] });
  assert.equal(doc.status, 'draft');
  assert.equal(matches(doc.toObject() as unknown as Doc, PUBLIC_DESTINATION_FILTER), false);

  // An invalid status is refused before anything is saved or revalidated.
  assert.deepEqual(await update({ status: 'live' }), { status: 400, tags: [] });
  assert.equal(doc.status, 'draft');
});

// ── tours stay independent of a destination's publication ───────────────────
test('a draft destination referenced by a live tour stays a tour filter value', async (context) => {
  const seen: Doc[] = [];
  replace(context,TourSubcategory, 'find', () => ({ select: async () => [] }));
  replace(context,Tour, 'distinct', async (field: string) => (field === 'destinations' ? [abuSimbel._id, cairo._id] : []));
  replace(context,Tour, 'find', () => ({ select: () => ({ lean: async () => [] }) }));
  replace(context,Destination, 'find', (filter: Doc) => {
    seen.push(filter);
    return { select: () => ({ lean: async () => ALL.filter((doc) => matches(doc, filter)) }) };
  });
  const { res, out } = fakeResponse();
  await getTourFilterOptions(request({ query: {} }) as unknown as Parameters<typeof getTourFilterOptions>[0], res);

  assert.equal(out.status, 200);
  assert.deepEqual(Object.keys(seen[0]).sort(), ['_id', 'isActive'], 'no publication status in the tour filter query');
  assert.deepEqual(
    ((out.body?.data as Doc).destinations as Doc[]).map((option) => option.label),
    ['Abu Simbel', 'Cairo']
  );
});

test('no tour read applies the destination publication rule', () => {
  for (const file of ['controllers/tourController.ts', 'utils/tourFilterContract.ts']) {
    const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
    assert.ok(!/PUBLIC_DESTINATION_FILTER|publicDestinationPopulate/.test(source), file);
  }
});
