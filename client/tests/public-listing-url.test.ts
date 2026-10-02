import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parsePublicListingQuery, publicListingUrl, shouldRedirectPublicQuery,
} from '../src/lib/tours/publicListingUrl';

test('public URL uses stable keys, one occurrence and the canonical order', () => {
  const url = publicListingUrl('/en/egypt-tour-packages', {
    q: ' Nile ', destinations: 'luxor,aswan,luxor', duration: '7-9,1-3',
    tourType: 'nile-cruise,day-tour', tourStyles: 'luxury,family,luxury',
    minPrice: '00100', maxPrice: '600.00', sort: 'price-asc', page: 2,
  });
  assert.equal(url, '/en/egypt-tour-packages?q=Nile&destinations=aswan,luxor&duration=1-3,7-9&tourType=nile-cruise,day-tour&tourStyles=luxury,family&minPrice=100&maxPrice=600&sort=price-asc&page=2');
  assert.ok(!/\b(?:search|durationRange|subcategory)=/.test(url));
});

test('default and equivalent direct requests normalize once while preserving attribution', () => {
  const query = new URLSearchParams('page=01&sort=recommended&tourStyles=luxury,luxury&minPrice=00100&utm_source=google&gclid=abc');
  const parsed = parsePublicListingQuery(query);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.redirectSearch, '?tourStyles=luxury&minPrice=100&utm_source=google&gclid=abc');
  assert.equal(shouldRedirectPublicQuery(query, parsed), true);
  assert.equal(shouldRedirectPublicQuery(new URLSearchParams(parsed.redirectSearch), parsed), false);
  assert.equal(parsePublicListingQuery(new URLSearchParams('page=1')).redirectSearch, '');
});

test('invalid public values reject before listing, valid empty inventory remains valid', () => {
  const bad = [
    'destinations=68aabbccddeeff0011223344', 'destinations=unknown',
    'tourType=unknown', 'tourStyles=beach', 'duration=unknown',
    'sort=priceStartingFrom', 'minPrice=-1', 'maxPrice=foo',
    'minPrice=200&maxPrice=100', 'page=0', 'page=2.5', 'page=-2',
    'search=nile', 'durationRange=1-3', 'subcategory=68aabbccddeeff0011223344',
    'tourStyles=luxury&tourStyles=family',
  ];
  for (const query of bad) {
    assert.ok(parsePublicListingQuery(new URLSearchParams(query), { destinationKeys: ['aswan', 'luxor'] }).error, query);
  }
  const valid = parsePublicListingQuery(new URLSearchParams('destinations=aswan&tourStyles=family&page=2'), { destinationKeys: ['aswan', 'luxor'] });
  assert.equal(valid.error, undefined);
  assert.equal(valid.isUtility, true);
});

test('page alone is an indexable base state; facets and sort are utility states', () => {
  assert.equal(parsePublicListingQuery(new URLSearchParams('page=2')).isUtility, false);
  assert.equal(parsePublicListingQuery(new URLSearchParams('sort=price-desc&page=2')).isUtility, true);
  assert.equal(parsePublicListingQuery(new URLSearchParams('q=luxor')).isUtility, true);
  assert.equal(parsePublicListingQuery(new URLSearchParams('utm_medium=email')).isUtility, false);
});
