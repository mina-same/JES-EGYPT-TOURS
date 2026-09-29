import type {} from '../src/types/express';
import '../src/middleware/i18n';
import assert from 'node:assert/strict';
import test from 'node:test';
import Tour from '../src/models/Tour';
import { validTourType } from '../src/utils/tourType';
import { createTour, updateTour } from '../src/controllers/tourController';

const types = ['multi-day', 'nile-cruise', 'day-tour', 'shore-excursion'];
const invalid = [undefined, '', null, 'Private', 'unknown', { en: 'day-tour' }, { en: 'Private' }, ['day-tour'], 1];
const response = () => ({ code: 0, data: null as any, status(code: number) { this.code = code; return this; }, json(data: unknown) { this.data = data; } });

test('schema requires a stable type, including for inactive tours, without changing kind/styles', async () => {
  for (const tourType of types) {
    const tour = new Tour({ tourType, tourKind: 'DAY_TOUR', tourStyles: [] });
    await tour.validate(['tourType']);
    assert.equal(tour.tourType, tourType);
    assert.equal(tour.tourKind, 'DAY_TOUR');
    assert.deepEqual(tour.toObject().tourStyles, []);
    assert.equal(validTourType(tourType), true);
  }
  for (const tourType of invalid) {
    assert.equal(validTourType(tourType), false);
    await assert.rejects(new Tour({ tourType, isActive: false }).validate(['tourType']), /tourType/);
  }
});

test('create and explicit type updates reject invalid values before writes', async () => {
  for (const handler of [createTour, updateTour]) {
    for (const tourType of invalid) {
      const res = response();
      await handler({ body: { tourType }, params: {} } as any, res as any);
      assert.equal(res.code, 400);
      assert.equal(res.data.path, 'tourType');
    }
  }
  const res = response();
  await createTour({ body: {}, params: {} } as any, res as any);
  assert.equal(res.code, 400);
});

test('valid API create and edit preserve choices and allow partial updates to omit type', async context => {
  let stored: any;
  context.mock.method(Tour, 'create', async (body: any) => {
    stored = { ...body, editVersion: 0 };
    return { ...stored, populate: async () => undefined };
  });
  context.mock.method(Tour, 'findById', () => ({ lean: async () => stored }));
  context.mock.method(Tour, 'findByIdAndUpdate', (_id: unknown, update: any) => ({ populate: async () => {
    stored = { ...stored, ...update.$set };
    return stored;
  } }));
  for (const tourType of types) {
    const created = response();
    await createTour({ body: { tourType, tourKind: 'DAY_TOUR', tourStyles: ['classic', 'family'], slug: { en: 'test-tour' } } } as any, created as any);
    assert.equal(created.code, 201);
    assert.equal(stored.tourType, tourType);
    for (const change of [{ tourType }, {}]) {
      const updated = response();
      await updateTour({ params: { id: '000000000000000000000001' }, body: { ...change, tourStyles: [], _editVersion: stored.editVersion } } as any, updated as any);
      assert.equal(updated.code, 200);
      assert.equal(stored.tourType, tourType);
      assert.equal(stored.tourKind, 'DAY_TOUR');
      assert.deepEqual(stored.tourStyles, []);
    }
  }
});

test('create and update reject dotted type writes before any database access', async context => {
  const unexpected = () => { throw new Error('Validation must precede database access'); };
  const read = context.mock.method(Tour, 'findById', unexpected);
  const create = context.mock.method(Tour, 'create', unexpected);
  const update = context.mock.method(Tour, 'findByIdAndUpdate', unexpected);
  for (const handler of [createTour, updateTour]) {
    for (const body of [
      { 'tourType.en': 'day-tour' },
      { 'tourType.es': 'Privado' },
      { tourType: 'multi-day', 'tourType.en': 'day-tour' },
      { 'tourType.en.nested': 'day-tour' },
    ]) {
      const res = response();
      await handler({ body: { ...body, _editVersion: 0 }, params: { id: '000000000000000000000001' } } as any, res as any);
      assert.equal(res.code, 400);
      assert.equal(res.data.path, 'tourType');
    }
  }
  for (const method of [read, create, update]) assert.equal(method.mock.callCount(), 0);
});

test('valid type changes reach document saves and reload correctly', async context => {
  let write: any;
  context.mock.method(Tour.collection, 'updateOne', async (_filter: unknown, update: any) => {
    write = update;
    return { acknowledged: true, modifiedCount: 1, matchedCount: 1 };
  });
  const tour = Tour.hydrate({ _id: '000000000000000000000001', tourType: 'day-tour', tourKind: 'PACKAGE', tourStyles: ['luxury'] });
  tour.tourType = 'multi-day';
  await tour.save({ validateModifiedOnly: true });
  assert.equal(write.$set.tourType, 'multi-day');
  assert.equal(write.$set.tourKind, undefined);
  assert.equal(write.$set.tourStyles, undefined);
  assert.equal(Tour.hydrate({ tourType: write.$set.tourType }).tourType, 'multi-day');
});
