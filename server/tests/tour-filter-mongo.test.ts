import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { structuredTourFilters } from '../src/utils/tourFilterContract';
import { listingSortStages } from '../src/utils/tourListingSort';
import { applyStartingPriceFilter, effectiveStartingPrice } from '../src/utils/tourQuery';

// Opt-in read-only integration: $documents evaluates fixtures without inserting
// anything into the connected database or changing its collections/indexes.
test('Mongo evaluates membership, precise durations, prices, ranking and pagination',
  { skip: process.env.RUN_FILTER_DB_TESTS !== '1' }, async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    try {
      const documents = [
        { _id: 1, tourType: 'day-tour', durationHours: 8, tourStyles: ['luxury', 'honeymoon'], recommendedOrder: 2, priceStartingFrom: { USD: 88 } },
        { _id: 2, tourType: 'nile-cruise', durationHours: 4, tourStyles: ['family'], recommendedOrder: 1, priceStartingFrom: { USD: 110, EUR: 80 } },
        { _id: 3, tourType: 'multi-day', durationHours: 72, tourStyles: ['honeymoon'], priceStartingFrom: { USD: 0 } },
        { _id: 4, durationHours: 73, tourStyles: ['classic'] },
        { _id: 5, durationHours: 144, tourStyles: ['accessible'] },
        { _id: 6, durationHours: 145 }, { _id: 7, durationHours: 216 },
        { _id: 8, durationHours: 217 }, { _id: 9, durationHours: 288 },
        { _id: 10, durationHours: 289 }, { _id: 11 },
      ];
      const query = async (pipeline: object[]) => {
        const result = await mongoose.connection.db!.command({ aggregate: 1,
          pipeline: [{ $documents: documents }, ...pipeline], cursor: {} });
        return result.cursor.firstBatch.map((row: { _id: number }) => row._id);
      };
      assert.deepEqual(await query([{ $match: structuredTourFilters({ tourType: 'day-tour,nile-cruise' }) }]), [1, 2]);
      assert.deepEqual(await query([{ $match: structuredTourFilters({ tourType: 'day-tour,nile-cruise', tourStyles: 'luxury' }) }]), [1]);
      assert.deepEqual(await query([{ $match: structuredTourFilters({ tourType: 'day-tour' }) }]), [1]);
      assert.deepEqual(await query([{ $match: structuredTourFilters({ tourStyles: 'luxury,honeymoon' }) }]), [1, 3]);
      assert.deepEqual(await query([{ $match: structuredTourFilters({ tourStyles: 'luxury' }) }]), [1]);
      const combined = structuredTourFilters({ tourStyles: 'luxury,honeymoon', durationRange: '1-3' });
      applyStartingPriceFilter(combined, '80', '100', 'USD', 1);
      assert.deepEqual(await query([{ $match: combined }]), [1]);
      assert.deepEqual(await query([{ $match: structuredTourFilters({ tourStyles: 'luxury,honeymoon', durationRange: '4-6' }) }]), []);
      for (const [range, ids] of Object.entries({ '1-3': [1, 2, 3], '4-6': [4, 5], '7-9': [6, 7], '10-12': [8, 9], '13-plus': [10] })) {
        assert.deepEqual(await query([{ $match: structuredTourFilters({ durationRange: range }) }]), ids);
      }
      assert.deepEqual(await query(listingSortStages('durationHours', 'USD', 1)), [2, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      assert.deepEqual(await query(listingSortStages('-durationHours', 'USD', 1)), [10, 9, 8, 7, 6, 5, 4, 3, 1, 2, 11]);
      assert.deepEqual(await query([...listingSortStages('recommended', 'USD', 1), { $skip: 1 }, { $limit: 2 }]), [1, 3]);
      assert.deepEqual((await query(listingSortStages('priceStartingFrom.EUR', 'EUR', .92))).slice(0, 2), [2, 1]);
      assert.deepEqual((await query(listingSortStages('-priceStartingFrom.EUR', 'EUR', .92))).slice(0, 2), [1, 2]);
      const priceFilter = {};
      applyStartingPriceFilter(priceFilter, '0', '80', 'EUR', .92);
      assert.deepEqual(await query([{ $match: priceFilter }]), [2]);
      for (const [currency, rate] of [['USD', 1], ['EUR', .92], ['GBP', .79]] as const) {
        const displayed = effectiveStartingPrice({ USD: 88 }, currency, rate)!;
        const exactFilter = {};
        applyStartingPriceFilter(exactFilter, String(displayed), String(displayed), currency, rate);
        assert.deepEqual(await query([{ $match: exactFilter }]), [1]);
      }
      assert.equal(effectiveStartingPrice({ USD: 88 }, 'EUR', .92), 81);
    } finally { await mongoose.disconnect(); }
  });
