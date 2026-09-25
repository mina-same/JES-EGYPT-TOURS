/// <reference path="../src/types/express.d.ts" />
import '../src/middleware/i18n';
import assert from 'node:assert/strict';
import test from 'node:test';
import Tour from '../src/models/Tour';
import { validTourStyles } from '../src/utils/tourStyles';
import { planTourFilterMigration } from '../src/utils/tourFilterMigration';
import { createTour, updateTour } from '../src/controllers/tourController';

test('saving one or several styles writes only stable IDs and preserves type/kind', async context => {
  const writes: any[] = [];
  context.mock.method(Tour.collection, 'updateOne', async (_filter: unknown, update: unknown) => {
    writes.push(update);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  });
  for (const styles of [['classic'], ['luxury', 'honeymoon']]) {
    const tour = Tour.hydrate({ _id: '000000000000000000000001', tourType: 'multi-day', tourKind: 'PACKAGE' });
    tour.set('tourStyles', styles);
    await tour.save({ validateModifiedOnly: true });
    assert.deepEqual(writes.at(-1).$set.tourStyles, styles);
    assert.equal(writes.at(-1).$set.tourType, undefined);
    assert.equal(writes.at(-1).$set.tourKind, undefined);
    assert.equal(tour.tourType, 'multi-day');
    assert.equal(tour.tourKind, 'PACKAGE');
  }
});

test('write validation accepts empty, single and multiple IDs, rejects invalid and duplicate values', async () => {
  for (const styles of [[], ['classic'], ['luxury', 'honeymoon']]) {
    assert.equal(validTourStyles(styles), true);
    const tour = Tour.hydrate({ tourType: 'multi-day', tourKind: 'PACKAGE' });
    tour.set('tourStyles', styles);
    await tour.validate(undefined, { validateModifiedOnly: true });
    assert.deepEqual(tour.toObject().tourStyles, styles);
    assert.equal(tour.isModified('tourType'), false);
    assert.equal(tour.isModified('tourKind'), false);
  }
  for (const styles of [['Luxury'], ['luxury-tour'], ['random-value'], ['luxury', 'luxury'], 'Cultural, Historical', 'luxury', null]) {
    assert.equal(validTourStyles(styles), false);
    const tour = Tour.hydrate({});
    tour.set('tourStyles', styles);
    await assert.rejects(() => tour.validate(['tourStyles']), /tourStyles/, JSON.stringify(styles));
  }
});

test('both create and update APIs reject bad styles before database writes', async () => {
  for (const handler of [createTour, updateTour]) {
    for (const tourStyles of [['Luxury'], ['luxury', 'luxury'], 'Cultural, Historical']) {
      let status: number | undefined;
      await handler({ body: { tourStyles }, params: {} } as any, {
        status(code: number) { status = code; return this; }, json() {},
      } as any);
      assert.equal(status, 400);
    }
  }
});

test('legacy labels, prose and descriptions never assign or remove styles', () => {
  for (const tourStyle of [{ en: 'Luxury' }, { en: 'Cultural, Historical' }, 'classic']) {
    for (const tourStyles of [undefined, [], ['luxury', 'honeymoon']]) {
      const plan = planTourFilterMigration({ tourStyle, tourStyles, heading: { en: 'Luxury' }, Description: { text: { en: 'Luxury hotel' } } });
      assert.equal('tourStyles' in plan.set, false);
      assert.equal('tourStyle' in plan.unset, false);
      assert.equal(plan.review.includes('tourStyles'), !tourStyles?.length);
    }
  }
});
