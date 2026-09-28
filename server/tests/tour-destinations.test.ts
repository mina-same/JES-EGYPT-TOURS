import type {} from '../src/types/express';
import '../src/middleware/i18n';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';
import Tour from '../src/models/Tour';
import Destination from '../src/models/Destination';
import TourSubcategory from '../src/models/TourSubcategory';
import { getAllTours, getToursByIds, getFeaturedTours, getToursBySubcategory, getTourById, getTourBySlug, getTourByExternalId, getRelatedTours, createTour, updateTour } from '../src/controllers/tourController';
import { parseTourFields, parseTourSort } from '../src/utils/tourQuery';

const first = '000000000000000000000001';
const second = '000000000000000000000002';
function response() {
  return { code: 0, body: null as any, status(code: number) { this.code = code; return this; }, json(body: any) { this.body = body; } };
}

test('search resolves localized destination names to references and retains AND with other filters', async context => {
  const lookups: any[] = [];
  const populations: any[] = [];
  let pipeline: any[] = [];
  context.mock.method(TourSubcategory, 'find', () => ({ select: async () => [] }));
  context.mock.method(Destination, 'find', (filter: any) => {
    lookups.push(filter);
    return { select: async () => [{ _id: new Types.ObjectId(first) }] };
  });
  context.mock.method(Tour, 'countDocuments', async () => 1);
  context.mock.method(Tour, 'aggregate', async (stages: any[]) => { pipeline = stages; return [{ destinations: [first] }]; });
  context.mock.method(Tour, 'populate', async (_docs: any, options: any) => {
    populations.push(options);
    return [{ destinations: [{ _id: first, name: { en: 'Cairo', de: 'Kairo' }, shortName: { en: 'Cairo', de: '' } }] }];
  });
  const res = response();
  await getAllTours({ locale: 'de', query: { search: 'Kairo', tourStyles: 'luxury,honeymoon', destinations: second } } as any, res as any);
  assert.equal(res.code, 200);
  assert.deepEqual(Object.keys(lookups[0].$or[0]), ['name.de']);
  assert.deepEqual(Object.keys(lookups[0].$or[1]), ['shortName.de']);
  const filter = pipeline[0].$match;
  assert.deepEqual([...filter.tourStyles.$in].sort(), ['honeymoon', 'luxury']);
  assert.equal(String(filter.destinations.$in[0]), second);
  assert.equal(String(filter.$or.find((part: any) => part.destinations).destinations.$in[0]), first);
  assert.ok(!JSON.stringify(filter).includes('tourLocation'));
  assert.deepEqual(populations[0].find((p: any) => p.path === 'destinations'), { path: 'destinations', select: 'name shortName' });
  assert.equal(res.body.data[0].destinations[0].name, 'Kairo');
  assert.deepEqual(res.body.data[0].destinations[0].shortName, { en: 'Cairo', de: '' });
});

test('wishlist batches destination population for all requested tours', async context => {
  const populations: any[] = [];
  const query: any = { select() { return this; }, populate(options: any) { populations.push(options); return this; }, async lean() { return [{ destinations: [] }, { destinations: [{ name: { en: 'Luxor' } }] }]; } };
  let calls = 0;
  context.mock.method(Tour, 'find', () => { calls++; return query; });
  const res = response();
  await getToursByIds({ locale: 'en', query: { ids: `${first},${second}` } } as any, res as any);
  assert.equal(res.code, 200);
  assert.equal(calls, 1);
  assert.equal(populations.filter(p => p.path === 'destinations').length, 1);
  assert.deepEqual(res.body.data[0].destinations, []);
  assert.equal(res.body.data[1].destinations[0].name, 'Luxor');
});

test('create and update reject display objects, invalid IDs and missing references', async context => {
  context.mock.method(Destination, 'countDocuments', async () => 0);
  for (const handler of [createTour, updateTour]) {
    for (const destinations of [[{ _id: first }], ['Luxor'], [first]]) {
      const res = response();
      await handler({ params: { id: first }, body: { destinations } } as any, res as any);
      assert.equal(res.code, 400);
    }
  }
});

test('single, multiple and empty references save and reload without changing accommodation locations', async context => {
  let saved: any;
  context.mock.method(Tour.collection, 'updateOne', async (_filter: unknown, update: any) => {
    saved = update;
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  });
  for (const ids of [[first], [first, second], []]) {
    const tour = Tour.hydrate({ _id: first, destinations: [second], pricingPlans: [{ accommodations: [{ location: { en: 'Hotel area' } }] }] });
    const accommodations = JSON.stringify(tour.toObject().pricingPlans);
    tour.set('destinations', ids);
    await tour.save({ validateModifiedOnly: true });
    assert.deepEqual(saved.$set.destinations.map(String), ids);
    assert.ok(!Object.keys(saved.$set).some(key => key.startsWith('pricingPlans')));
    assert.equal(JSON.stringify(tour.toObject().pricingPlans), accommodations);
    assert.deepEqual(Tour.hydrate({ destinations: saved.$set.destinations }).destinations?.map(String), ids);
  }
});

test('legacy public projection and sorting are unavailable', () => {
  assert.equal(parseTourFields('heading,tourLocation,destinations', false), 'heading destinations');
  assert.equal(parseTourSort('tourLocation', 'en', 'USD'), '-createdAt');
});

test('the removed field is absent from the schema and ignored in new tour data', () => {
  assert.equal(Tour.schema.path('tourLocation'), undefined);
  const tour = new Tour({ tourLocation: { en: 'Old text' }, destinations: [] });
  assert.equal('tourLocation' in tour.toObject(), false);
  assert.deepEqual(tour.toObject().destinations, []);
});

test('strict updates drop the removed field before writing to MongoDB', async context => {
  let write: any;
  const read: any = { session() { return this; }, limit() { return this; }, lean: async () => [{ _id: first, destinations: [] }] };
  context.mock.method(Tour, 'find', () => read);
  context.mock.method(Tour.collection, 'updateOne', async (_filter: unknown, update: any) => {
    write = update;
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  });
  await Tour.updateOne({ _id: first }, { $set: { tourLocation: { en: 'Old text' }, destinations: [] } }, { runValidators: true });
  assert.equal('tourLocation' in write.$set, false);
  assert.deepEqual(write.$set.destinations, []);
});

for (const handler of [getFeaturedTours, getToursBySubcategory, getTourById, getTourBySlug, getTourByExternalId, getRelatedTours]) {
  test(`${handler.name} provides compact populated destinations`, async context => {
    const populations: any[] = [];
    const selections: string[] = [];
    const doc = { _id: first, subcategory: second, destinations: [{ _id: second, name: { en: 'Luxor' } }] };
    const chain = (data: any): any => ({
      populate(value: any) { populations.push(value); return this; },
      select(value: string) { selections.push(value); return this; },
      sort() { return this; }, skip() { return this; }, limit() { return this; }, lean: async () => data,
    });
    context.mock.method(Tour, 'find', () => chain([doc]));
    context.mock.method(Tour, 'findById', () => chain(doc));
    context.mock.method(Tour, 'findOne', () => chain(doc));
    context.mock.method(Tour, 'countDocuments', async () => 1);
    const res = response();
    await handler({ locale: 'en', params: { id: first, subcategoryId: second, slug: 'tour', idExternal: 'external' }, query: {} } as any, res as any);
    assert.equal(res.code, 200);
    assert.equal(populations.filter(p => p.path === 'destinations' && p.select === 'name shortName').length, 1);
    for (const selection of selections.filter(s => s !== 'subcategory')) assert.ok(selection.split(' ').includes('destinations'));
    const data = Array.isArray(res.body.data) ? res.body.data[0] : res.body.data;
    assert.equal(data.destinations.length, 1);
  });
}

test('renaming a Destination invalidates the tours tag used by related blog cards', async context => {
  const before = { secret: process.env.REVALIDATE_SECRET, url: process.env.CLIENT_URL };
  process.env.REVALIDATE_SECRET = 'test-only';
  process.env.CLIENT_URL = 'https://example.invalid';
  context.after(() => {
    if (before.secret === undefined) delete process.env.REVALIDATE_SECRET; else process.env.REVALIDATE_SECRET = before.secret;
    if (before.url === undefined) delete process.env.CLIENT_URL; else process.env.CLIENT_URL = before.url;
  });
  const invalidations: string[][] = [];
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: any) => {
    invalidations.push(JSON.parse(options.body).tags);
    return { ok: true } as Response;
  });
  const read: any = { session() { return this; }, limit() { return this; }, lean: async () => [{ _id: first, name: { en: 'Luxor' } }] };
  context.mock.method(Destination, 'find', () => read);
  context.mock.method(Destination.collection, 'updateOne', async () => ({ acknowledged: true, matchedCount: 1, modifiedCount: 1 }));
  await Destination.updateOne({ _id: first }, { $set: { 'name.en': 'Luxor updated' } }, { runValidators: true });
  assert.deepEqual(invalidations, [['destinations', 'tours']]);
});

test('the three requested catalog records validate with minimal content and no invented SEO prose', async () => {
  for (const name of ['Abu Simbel', 'Edfu', 'Kom Ombo']) {
    const labels = Object.fromEntries(['en', 'de', 'it', 'es'].map(locale => [locale, name]));
    const slugs = Object.fromEntries(['en', 'de', 'it', 'es'].map(locale => [locale, name.toLowerCase().replace(/ /g, '-')]));
    const record = new Destination({ name: labels, shortName: labels, slug: slugs, isActive: true, noIndex: true });
    await record.validate();
    assert.equal(record.description, undefined);
    assert.equal(record.metaDescription, undefined);
  }
});
