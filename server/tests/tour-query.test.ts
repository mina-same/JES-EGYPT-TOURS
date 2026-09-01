import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyStartingPriceFilter,
  exactLocalizedValueFilter,
  parseTourFields,
  parseTourPagination,
  parseTourSort,
  TourQueryValidationError,
} from '../src/utils/tourQuery';

test('localized type filters target the selected locale and escape regex syntax', () => {
  assert.deepEqual(exactLocalizedValueFilter('tourType', 'de', 'Privat (VIP)+'), {
    'tourType.de': { $regex: '^Privat \\(VIP\\)\\+$', $options: 'i' },
  });
});

test('pagination normalizes invalid values and caps large pages', () => {
  assert.deepEqual(parseTourPagination('-2', '0'), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(parseTourPagination('3', '500'), { page: 3, limit: 100, skip: 200 });
});

test('sort uses the request locale and selected currency', () => {
  assert.equal(parseTourSort('heading', 'it', 'EUR'), 'heading.it');
  assert.equal(parseTourSort('-priceStartingFrom', 'de', 'GBP'), '-priceStartingFrom.GBP');
  assert.equal(parseTourSort('unknown', 'en', 'USD'), '-createdAt');
});

test('USD price filters use the displayed starting price and validate input', () => {
  const filter: Record<string, unknown> = {};
  applyStartingPriceFilter(filter, '90', '120', 'USD');
  assert.deepEqual(filter, { 'priceStartingFrom.USD': { $gte: 90, $lte: 120 } });

  assert.throws(
    () => applyStartingPriceFilter({}, '.', undefined, 'USD'),
    TourQueryValidationError
  );
  assert.throws(
    () => applyStartingPriceFilter({}, '200', '100', 'USD'),
    /minPrice cannot be greater/
  );
});

test('non-USD filters fall back to converted USD when no exact price exists', () => {
  const filter: Record<string, unknown> = {};
  applyStartingPriceFilter(filter, '80', undefined, 'EUR', 0.92);
  assert.deepEqual(filter, {
    $expr: {
      $gte: [
        { $ifNull: ['$priceStartingFrom.EUR', { $multiply: ['$priceStartingFrom.USD', 0.92] }] },
        80,
      ],
    },
  });
});

test('public field selection drops private or oversized fields', () => {
  assert.equal(
    parseTourFields('heading,pricingPlans,itinerary,slug', false),
    'heading slug'
  );
  assert.equal(
    parseTourFields('heading,pricingPlans,itinerary', true),
    'heading pricingPlans itinerary'
  );
});

