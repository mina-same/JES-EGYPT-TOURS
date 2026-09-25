import assert from 'node:assert/strict';
import test from 'node:test';
import { structuredTourFilters, parseFilterIds } from '../src/utils/tourFilterContract';
import { migrateDurationHours, planTourFilterMigration } from '../src/utils/tourFilterMigration';
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

test('duration migration preserves hours and only converts explicit day counts', () => {
  assert.equal(migrateDurationHours({ en: '4 Hours' }), 4);
  assert.equal(migrateDurationHours({ en: '8 Hours' }), 8);
  assert.equal(migrateDurationHours({ en: '2 days / 1 night' }), 48);
  assert.equal(migrateDurationHours({ en: '8 Days / 7 Nights' }), 192);
  assert.equal(migrateDurationHours({ en: 'Full Day Tour' }), undefined);
  assert.equal(migrateDurationHours({ en: '' }), undefined);
});

test('migration reports ambiguity instead of inferring classifications from prose or titles', () => {
  const plan = planTourFilterMigration({ heading: { en: 'Luxury Multi-Day Tour' }, tourType: { en: 'Private' },
    tourStyle: { en: 'Cultural, Luxury, Beach' }, duration: { en: 'Full Day' } });
  assert.deepEqual(plan.set, {});
  assert.deepEqual(plan.unset, {});
  assert.deepEqual(plan.review, ['tourType', 'tourStyles', 'durationHours', 'destinations']);
});

test('safe migration is idempotent and retains multiple canonical styles', () => {
  const original = { tourType: 'day-tour', tourStyle: { en: 'Luxury' }, duration: { en: '4 Hours' }, destinations: ['id'] };
  const first = planTourFilterMigration(original);
  assert.deepEqual(first.set, { durationHours: 4 });
  assert.deepEqual(first.unset, {});
  assert.ok(first.review.includes('tourStyles'));
  const migrated: any = { ...original, ...first.set };
  delete migrated.tourStyle;
  assert.deepEqual(planTourFilterMigration(migrated), { set: {}, unset: {}, review: ['tourStyles'] });
  assert.deepEqual(planTourFilterMigration({ ...migrated, tourStyles: ['luxury', 'honeymoon'] }).set, {});
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

test('status-only validation tolerates an unmigrated type without rewriting it', async () => {
  const tour = Tour.hydrate({ _id: '000000000000000000000001', tourType: { en: 'Private' }, isFeatured: false });
  tour.isFeatured = true;
  await tour.validate(undefined, { validateModifiedOnly: true });
  assert.equal(tour.isModified('tourType'), false);
});

