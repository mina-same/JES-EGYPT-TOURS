import assert from 'node:assert/strict';
import test from 'node:test';
import { structuredTourFilters, parseFilterIds } from '../src/utils/tourFilterContract';
import { parseTourSort } from '../src/utils/tourQuery';
import Tour from '../src/models/Tour';
import Destination from '../src/models/Destination';

test('multiple styles and places use membership while duration OR cannot overwrite search OR', () => {
  const filter: any = structuredTourFilters({ tourType: 'multi-day', tourStyles: 'luxury,honeymoon,luxury',
    destinations: '000000000000000000000001,000000000000000000000002', durationRange: '1-3,7-9' });
  assert.deepEqual(filter.tourStyles, { $in: ['honeymoon', 'luxury'] });
  assert.equal(filter.destinations.$in.length, 2);
  assert.equal(filter.destinations.$in[0].toHexString(), '000000000000000000000001');
  assert.equal(filter.tourType, 'multi-day');
  assert.equal(filter.$or, undefined);
  assert.deepEqual(filter.$and[0].$or, [{ durationHours: { $gt: 0, $lte: 72 } }, { durationHours: { $gt: 144, $lte: 216 } }]);
});

test('unknown IDs and injection-shaped values are rejected', () => {
  assert.throws(() => structuredTourFilters({ tourType: 'Private' }));
  assert.throws(() => structuredTourFilters({ tourStyles: 'luxury,unknown' }));
  assert.throws(() => structuredTourFilters({ destinations: 'Cairo' }));
  assert.throws(() => parseFilterIds({ $ne: null }));
});




test('recommended is default and duration sort remains numeric in either direction', () => {
  assert.equal(parseTourSort(undefined, 'de', 'EUR'), 'recommended');
  assert.equal(parseTourSort('durationHours', 'de', 'EUR'), 'durationHours');
  assert.equal(parseTourSort('-durationHours', 'es', 'GBP'), '-durationHours');
});

test('admin schema preserves multiple styles, rejects invalid duration and permits a blank short label', async () => {
  const tour = Tour.hydrate({ _id: '000000000000000000000001', tourType: 'multi-day', tourStyles: ['luxury', 'honeymoon'], durationHours: 4 });
  assert.deepEqual(Array.from(tour.tourStyles || []), ['luxury', 'honeymoon']);
  tour.durationHours = 0;
  await assert.rejects(() => tour.validate(undefined, { validateModifiedOnly: true }), /durationHours/);
  const destination = Destination.hydrate({ shortName: { en: '', de: '' } });
  destination.shortName = { en: '' };
  await destination.validate(undefined, { validateModifiedOnly: true });
});
