import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countActiveTourFilters,
  readTourListingState,
  validateTourPriceRange,
} from '../src/lib/tours/listingFilters';
import { deriveStartingPrice } from '../src/lib/tours/startingPrice';

test('listing state is read before the initial request', () => {
  const params = new URLSearchParams('page=3&sort=heading&search=Nile&minPrice=90&subcategory=abc');
  assert.deepEqual(readTourListingState(params, true), {
    page: 3,
    sort: 'heading',
    filters: {
      search: 'Nile',
      minPrice: '90',
      maxPrice: '',
      tourType: '',
      tourStyle: '',
      subcategoryId: 'abc',
    },
  });
});

test('price validation rejects malformed and reversed ranges', () => {
  assert.equal(validateTourPriceRange('.', ''), 'invalid');
  assert.equal(validateTourPriceRange('101', '100'), 'range');
  assert.equal(validateTourPriceRange('0', '100'), null);
});

test('active filter count ignores empty values', () => {
  assert.equal(countActiveTourFilters({ search: 'Nile', minPrice: '', maxPrice: '100', tourType: '', tourStyle: '' }), 2);
});

test('card preview ignores unmistakable currency placeholders', () => {
  assert.deepEqual(deriveStartingPrice([{ seasons: [{ prices: { solo: { USD: 100, EUR: 1 } } }] }]), { USD: 100 });
});

