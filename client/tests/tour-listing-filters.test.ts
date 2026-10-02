import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countActiveTourFilters,
  readTourListingState,
  validateTourPriceRange,
} from '../src/lib/tours/listingFilters';
import { deriveStartingPrice } from '../src/lib/tours/startingPrice';
import { isCanonicalListing, tourServerAPI } from '../src/lib/api/tour.server';

test('only the canonical styles query parameter controls the listing', () => {
  assert.equal(readTourListingState(new URLSearchParams('tourStyle=luxury')).filters.tourStyles, '');
  assert.equal(readTourListingState(new URLSearchParams('tourStyles=family,classic')).filters.tourStyles, 'classic,family');
});

test('listing state is read before the initial request', () => {
  const params = new URLSearchParams('page=3&sort=price-asc&q=Nile&minPrice=90');
  assert.deepEqual(readTourListingState(params), {
    page: 3,
    sort: 'price-asc',
    filters: {
      search: 'Nile',
      minPrice: '90',
      maxPrice: '',
      tourType: '',
      tourStyles: '', destinations: '', durationRange: '',
    },
  });
});

test('price validation rejects malformed and reversed ranges', () => {
  assert.equal(validateTourPriceRange('.', ''), 'invalid');
  assert.equal(validateTourPriceRange('101', '100'), 'range');
  assert.equal(validateTourPriceRange('0', '100'), null);
});

test('active filter count ignores empty values', () => {
  assert.equal(countActiveTourFilters({ search: 'Nile', minPrice: '', maxPrice: '100', tourType: '', tourStyles: '', destinations: '', durationRange: '' }), 2);
});

test('card preview ignores unmistakable currency placeholders', () => {
  assert.deepEqual(deriveStartingPrice([{ seasons: [{ prices: { solo: { USD: 100, EUR: 1 } } }] }]), { USD: 100 });
});

test('multiple selections survive URL reads and reset defaults to recommended', () => {
  const state = readTourListingState(new URLSearchParams('tourStyles=luxury,honeymoon&destinations=aswan,luxor&duration=1-3,7-9'));
  assert.equal(state.filters.tourStyles, 'luxury,honeymoon');
  assert.equal(state.filters.destinations, 'aswan,luxor');
  assert.equal(state.filters.durationRange, '1-3,7-9');
  assert.equal(readTourListingState(new URLSearchParams()).sort, 'recommended');
  assert.equal(readTourListingState(new URLSearchParams()).page, 1);
});

test('new filters cannot accidentally use the unfiltered listing cache', () => {
  assert.equal(isCanonicalListing({ sort: 'recommended', page: 1 }), true);
  assert.equal(isCanonicalListing({ sort: 'durationHours', page: 2 }), true);
  assert.equal(isCanonicalListing({ tourStyles: 'luxury,honeymoon' }), false);
  assert.equal(isCanonicalListing({ destinations: 'a' }), false);
  assert.equal(isCanonicalListing({ destinationKeys: 'aswan' }), false);
  assert.equal(isCanonicalListing({ durationRange: '1-3' }), false);
});

test('listing fetch identity includes scope, locale, currency, sorting, page and active filters', async () => {
  const original = globalThis.fetch;
  const requests: { url: string; options?: RequestInit }[] = [];
  globalThis.fetch = async (input, options) => {
    requests.push({ url: String(input), options });
    return new Response(JSON.stringify({ success: true, data: [] }));
  };
  try {
    await tourServerAPI.getListing({ category: 'scope', currency: 'EUR', sort: 'durationHours', page: 2, tourStyles: 'luxury,honeymoon' }, 'de', false);
    const url = new URL(requests[0].url);
    for (const [key, expected] of Object.entries({ category: 'scope', currency: 'EUR', sort: 'durationHours', page: '2', tourStyles: 'honeymoon,luxury', locale: 'de' })) {
      assert.equal(url.searchParams.get(key), expected);
    }
    assert.equal(requests[0].options?.cache, 'no-store');
  } finally { globalThis.fetch = original; }
});

