import type {} from '../src/types/express';
import '../src/middleware/i18n';
import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import Tour from '../src/models/Tour';
import TourCategory from '../src/models/TourCategory';
import TourSubcategory from '../src/models/TourSubcategory';
import EditorialAuthor from '../src/models/EditorialAuthor';
import Faq from '../src/models/Faq';
import { updateDestination } from '../src/controllers/destinationController';
import { getSitemapData, type SitemapData } from '../src/controllers/sitemapController';

/*
 * Page-level robots flags (`noIndex` / `noFollow`) no longer exist. Unfinished
 * content is a draft; the site-wide switch decides robots for everything else.
 *
 * These tests pin the removal down where it could quietly come back: a schema
 * path, a stale Admin tab or old client still sending the keys, and a document
 * that still stores them being read by the sitemap. Real Mongoose code runs;
 * only driver calls are stubbed, so nothing reaches a database.
 */

const { ObjectId } = mongoose.Types;
const LEGACY = { noIndex: true, noFollow: true };
const MODELS = [Blog, BlogCategory, BlogSubCategory, Destination];
const hasLegacyKey = (value: unknown) => /"no(Index|Follow)"/.test(JSON.stringify(value));

// No revalidation request leaves the process.
const realFetch = globalThis.fetch;
globalThis.fetch = (async () => new globalThis.Response('{}', { status: 200 })) as typeof fetch;
test.after(() => {
  globalThis.fetch = realFetch;
});

/** Captures what a write would send to MongoDB. */
function captureDriver(model: { collection: unknown }) {
  const sent: unknown[] = [];
  const collection = model.collection as Record<string, unknown>;
  collection.insertOne = async (doc: unknown) => { sent.push(doc); return { acknowledged: true, insertedId: new ObjectId() }; };
  collection.updateOne = async (_filter: unknown, update: unknown) => { sent.push(update); return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 }; };
  collection.findOneAndUpdate = async (_filter: unknown, update: unknown) => { sent.push(update); return { _id: new ObjectId() }; };
  // The duplicate-internal-links plugin reads the documents an update matches.
  collection.find = () => ({ toArray: async () => [], close: async () => {} });
  return sent;
}

const name = (en: string) => ({ en, de: en, it: en, es: en });
const fresh = {
  Blog: () => new Blog({ title: name('Article'), slug: name('article'), status: 'draft', author: new ObjectId(), contentBlocks: [], ...LEGACY }),
  BlogCategory: () => new BlogCategory({ name: name('Category'), slug: name('category'), ...LEGACY }),
  BlogSubCategory: () => new BlogSubCategory({ name: name('Topic'), slug: name('topic'), category: new ObjectId(), ...LEGACY }),
  Destination: () => new Destination({ name: name('Edfu'), slug: name('edfu'), ...LEGACY }),
};

test('no content model declares a page-level robots field', () => {
  for (const model of MODELS) {
    for (const field of ['noIndex', 'noFollow']) {
      const schema = model.schema as unknown as { path: (name: string) => unknown };
      assert.equal(schema.path(field), undefined, `${model.modelName}.${field}`);
    }
  }
});

test('a stale payload with the old flags creates documents without them', async () => {
  for (const [modelName, make] of Object.entries(fresh)) {
    const model = MODELS.find((candidate) => candidate.modelName === modelName)!;
    const sent = captureDriver(model);
    const doc = make();
    assert.equal(hasLegacyKey(doc.toObject()), false, `${modelName} document`);
    await doc.save();
    assert.equal(sent.length, 1, `${modelName} insert`);
    assert.equal(hasLegacyKey(sent[0]), false, `${modelName} insert payload`);
  }
  // A destination is still a draft unless it is published explicitly.
  assert.equal(fresh.Destination().status, 'draft');
});

test('a stale Admin update with the old flags writes neither and leaves the status alone', async (context) => {
  // Destination edits go through the controller: findById, Object.assign, save.
  const sent = captureDriver(Destination);
  const existing = new Destination({ name: name('Cairo'), slug: name('cairo'), filterKey: 'cairo', status: 'published' });
  existing.isNew = false;
  context.mock.method(Destination, 'findById', async () => existing);
  context.mock.method(console, 'log', () => {});
  let status = 0;
  const res = { status(code: number) { status = code; return res; }, json() { return res; } } as unknown as Response;
  await updateDestination({ params: { id: String(existing._id) }, body: { ...LEGACY, subheader: name('Capital') }, locale: 'en' } as unknown as Request, res);
  assert.equal(status, 200);
  assert.equal(existing.status, 'published');
  assert.equal(hasLegacyKey(existing.toObject()), false);
  assert.equal(sent.length, 1);
  assert.equal(hasLegacyKey(sent[0]), false, 'destination update payload');

  // Articles, categories and topics are edited with findByIdAndUpdate(id, body).
  for (const model of [Blog, BlogCategory, BlogSubCategory] as const) {
    const updates = captureDriver(model);
    await (model as unknown as { findByIdAndUpdate: (id: unknown, body: unknown) => Promise<unknown> })
      .findByIdAndUpdate(new ObjectId(), { ...LEGACY, isActive: true });
    assert.equal(updates.length, 1, model.modelName);
    assert.equal(hasLegacyKey(updates[0]), false, `${model.modelName} update payload`);
  }
});

test('the sitemap carries no robots flag, even from a document that still stores one', async (context) => {
  const updatedAt = new Date('2026-09-01T10:00:00.000Z');
  const stored = (slug: string) => [{ _id: new ObjectId(), slug: { en: slug }, updatedAt, ...LEGACY }];
  const replace = (model: unknown, method: string, implementation: (...args: never[]) => unknown) =>
    context.mock.method(model as Record<string, () => unknown>, method, implementation as () => unknown);
  const chain = (result: unknown) => ({ sort: () => ({ lean: async () => result }) });
  replace(Tour, 'find', () => chain([]));
  replace(Tour, 'aggregate', async () => []);
  replace(TourCategory, 'find', () => chain([]));
  replace(TourSubcategory, 'find', () => chain([]));
  replace(BlogCategory, 'find', () => chain(stored('egypt-blog')));
  replace(BlogSubCategory, 'find', () => chain(stored('egypt-travel-tips')));
  replace(Destination, 'find', () => chain(stored('cairo')));
  replace(Blog, 'aggregate', async () => []);
  replace(EditorialAuthor, 'find', () => chain([]));
  replace(Faq, 'find', () => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) }));

  let body: { data?: SitemapData } = {};
  const res = { status() { return res; }, json(payload: typeof body) { body = payload; return res; } } as unknown as Response;
  await getSitemapData({} as Request, res);
  const data = body.data as SitemapData;
  for (const family of ['blogCategories', 'blogSubcategories', 'destinations'] as const) {
    assert.deepEqual(data[family], [{ slug: data[family][0].slug, updatedAt: updatedAt.toISOString() }], family);
    assert.equal(hasLegacyKey(data[family]), false, family);
  }
});
