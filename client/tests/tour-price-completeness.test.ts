import assert from 'node:assert/strict';
import test from 'node:test';

import { getPriceCompleteness } from '../src/lib/tours/priceCompleteness';

const LOW = '1 May 2026 – 31 August 2026';
const REGULAR = '1 September 2026 – 19 December 2026 / 6 January 2027 – 24 March 2027';

const allCurrencies = { USD: 100, EUR: 90, GBP: 80 };
const pricedSeason = (seasonName: string) => ({
  seasonName,
  prices: { solo: allCurrencies, pax_2_4: allCurrencies, pax_5_8: allCurrencies, pax_9_16: allCurrencies },
});

test('a tour priced everywhere in all three currencies is complete, whatever else it lacks', () => {
  const report = getPriceCompleteness({
    priceStartingFrom: allCurrencies,
    pricingPlans: [{ planName: 'TOUR PRICES', seasons: [pricedSeason(LOW), pricedSeason(REGULAR)] }],
  });

  assert.deepEqual(report, { complete: true, missing: [] });
});

test('a tour without plans misses its starting price and its plans', () => {
  const report = getPriceCompleteness({});

  assert.equal(report.complete, false);
  assert.deepEqual(report.missing, ['Starting price: USD, EUR, GBP', 'No pricing plans']);
});

test('zero and absent amounts are unpriced, named per group size and currency', () => {
  const report = getPriceCompleteness({
    priceStartingFrom: { USD: 100 },
    pricingPlans: [{
      planName: 'TOUR PRICES',
      seasons: [{
        seasonName: LOW,
        prices: { solo: { USD: 100, EUR: 0 }, pax_2_4: allCurrencies, pax_5_8: allCurrencies },
      }],
    }],
  });

  assert.equal(report.complete, false);
  assert.deepEqual(report.missing, [
    'Starting price: EUR, GBP',
    'TOUR PRICES · Low Season: Solo (EUR, GBP), 9-16 Pax',
  ]);
});

test('an untouched season is reported whole, and an unrecognised one by position', () => {
  const report = getPriceCompleteness({
    priceStartingFrom: allCurrencies,
    pricingPlans: [{
      planName: 'GOLD (5 STAR STANDARD)',
      seasons: [pricedSeason(LOW), { seasonName: REGULAR, prices: {} }, { seasonName: 'Ramadan', prices: {} }],
    }],
  });

  assert.deepEqual(report.missing, [
    'GOLD (5 STAR STANDARD) · Regular Season: no prices',
    'GOLD (5 STAR STANDARD) · Season 3: no prices',
  ]);
});
