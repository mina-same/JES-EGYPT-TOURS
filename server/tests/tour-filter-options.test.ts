/// <reference path="../src/types/express.d.ts" />
import '../src/middleware/i18n';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';
import Tour from '../src/models/Tour';
import Destination from '../src/models/Destination';
import TourSubcategory from '../src/models/TourSubcategory';
import { getTourFilterOptions } from '../src/controllers/tourController';

test('options use the complete visible scope and localized short destination labels', async (context) => {
  const category = '000000000000000000000001';
  const subcategory = new Types.ObjectId('000000000000000000000002');
  const cairo = new Types.ObjectId('000000000000000000000003');
  const alexandria = new Types.ObjectId('000000000000000000000004');
  const filters: any[] = [];
  context.mock.method(TourSubcategory, 'find', () => ({ select: async () => [{ _id: subcategory }] }));
  context.mock.method(Tour, 'distinct', async (field: string, filter: any) => {
    filters.push(filter);
    return field === 'destinations' ? [cairo] : field === 'tourType' ? ['multi-day'] : ['luxury', 'honeymoon'];
  });
  context.mock.method(Tour, 'find', () => ({ select: () => ({ lean: async () => [
    { priceStartingFrom: { USD: 0 } }, { priceStartingFrom: { USD: 90 } }, {},
  ] }) }));
  context.mock.method(Destination, 'find', (filter: any) => ({ select: () => ({ lean: async () => [
    { _id: cairo, shortName: { de: 'Kairo' }, name: { en: 'Explore Cairo', de: 'Kairo entdecken' } },
    { _id: alexandria, name: { en: 'Alexandria', de: 'Alexandria' } },
  ].filter(d => filter._id.$in.some((id: Types.ObjectId) => id.equals(d._id))) }) }));
  let status: number | undefined;
  let response: any;
  const res: any = { status(value: number) { status = value; return this; }, json(value: unknown) { response = value; } };
  await getTourFilterOptions({ locale: 'de', query: { category, page: '9', limit: '1', tourStyles: 'classic', search: 'other', sort: '-durationHours' } } as any, res);
  assert.equal(status, 200);
  assert.deepEqual(response.data.destinations, [{ id: String(cairo), label: 'Kairo' }]);
  assert.deepEqual(response.data.tourStyles, [{ id: 'luxury', label: 'Luxus' }, { id: 'honeymoon', label: 'Flitterwochen' }]);
  assert.deepEqual(response.data.priceRange, { min: 90, max: 90, currency: 'USD' });
  for (const filter of filters) {
    assert.deepEqual(filter.subcategory.$in, [subcategory]);
    assert.deepEqual(filter.isActive, { $ne: false });
    assert.equal(filter.tourStyles, undefined);
    assert.equal(filter.$or, undefined);
    assert.ok(filter['slug.de']);
  }
});
