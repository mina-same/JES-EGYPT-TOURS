import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeTourFilters, tourFilterChips } from '../src/lib/tours/filterValues';
import { countActiveTourFilters } from '../src/lib/tours/listingFilters';
const places = [{ id: '000000000000000000000001', label: 'Luxor' }, { id: '000000000000000000000002', label: 'Aswan' }];
const t = (key: string, options?: Record<string, unknown>) => `${key}:${options?.amount || options?.value || ''}`;
test('unknown URL choices are removed without losing valid selections', () => {
  const result = sanitizeTourFilters({ tourType: 'bad,day-tour,nile-cruise', tourStyles: 'family,bad', durationRange: '1-3,bad', destinations: places[0].id + ',000000000000000000000099,bad' }, places);
  assert.equal(result.tourType, 'day-tour,nile-cruise');
  assert.equal(result.tourStyles, 'family');
  assert.equal(result.durationRange, '1-3');
  assert.equal(result.destinations, places[0].id);
});
test('chips resolve by group, hide unknown IDs and remove just one choice', () => {
  const chips = tourFilterChips({ destinations: places.map(p => p.id).join(',') + ',000000000000000000000099', tourType: 'day-tour,bad', tourStyles: 'family', durationRange: 'bad', subcategoryId: 'private-id' }, places, 'es', '€', t);
  assert.deepEqual(chips.map(c => c.label), ['Luxor', 'Aswan', 'Excursión de un día', 'Familiar']);
  assert.ok(chips[0].remaining.includes(places[1].id));
  assert.ok(!chips[0].remaining.includes(places[0].id));
});
test('price chips have translated context and use the selected currency', () => {
  for (const symbol of ['$', '€', '£']) {
    const chips = tourFilterChips({ minPrice: '90', maxPrice: '500', search: 'family' }, [], 'en', symbol, t);
    assert.equal(chips[0].label, `filters.priceFrom:${symbol}90`);
    assert.equal(chips[1].label, `filters.priceUpTo:${symbol}500`);
    assert.equal(chips[2].label, 'filters.searchValue:family');
  }
  assert.equal(countActiveTourFilters({ destinations: places.map(p => p.id).join(',') }), 1);
  assert.equal(countActiveTourFilters({}), 0);
});
