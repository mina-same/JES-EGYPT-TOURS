import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { catalog, catalogOptions } from '../src/lib/tours/catalog';
import { splitFilterValues } from '../src/lib/tours/filterValues';

function component(name: string) {
  const url = new URL(`../src/components/common/TourListingFilters/${name}.tsx`, import.meta.url);
  const require = createRequire(url);
  const compiledModule = { exports: {} as any };
  const code = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: fileURLToPath(url),
  }).outputText;
  const overrides: Record<string, unknown> = {
    '@/lib/tours/catalog': { catalog }, '@/lib/tours/filterValues': { splitFilterValues },
  };
  new Function('require', 'module', 'exports', code)((id: string) => overrides[id] ?? require(id), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { StructuredFilters } = component('StructuredFilters');
const { default: TourEmptyState } = component('TourEmptyState');
const { default: TourSort } = component('TourSort');
const base = { values: { tourType: 'day-tour,nile-cruise', tourStyles: '', destinations: '' }, update() {},
  destinations: [], types: catalogOptions('types'), styles: [], t: (key: string) => key };

test('visitor type renders multiple checked choices while empty style/place groups disappear', () => {
  const html = renderToStaticMarkup(React.createElement(StructuredFilters, base));
  assert.equal((html.match(/checked=""/g) || []).length, 2);
  assert.ok(!html.includes('filters.tourStyles'));
  assert.ok(!html.includes('filters.destinations'));
  assert.equal((html.match(/type="checkbox"/g) || []).length, 9); // four types, five duration ranges
  assert.ok(!html.includes('<select'));
});

test('short destination lists stay simple; long lists initially show eight and offer local search', () => {
  const destinations = Array.from({ length: 10 }, (_, i) => ({ id: String(i), label: `Place ${i}` }));
  const small = renderToStaticMarkup(React.createElement(StructuredFilters, { ...base, destinations: destinations.slice(0, 6), part: 'places-duration' }));
  assert.ok(small.includes('Place 5'));
  assert.ok(!small.includes('filters.searchPlaces'));
  const long = renderToStaticMarkup(React.createElement(StructuredFilters, { ...base, destinations, part: 'places-duration' }));
  assert.ok(long.includes('Place 7'));
  assert.ok(!long.includes('Place 8'));
  assert.ok(long.includes('filters.searchPlaces'));
  assert.ok(long.includes('filters.showMore'));
  assert.ok(!long.includes('max-height'));
});

test('empty results offer recovery only when filtered', () => {
  const props = { filtered: true, emptyText: 'No tours here', clear() {}, t: base.t };
  const filtered = renderToStaticMarkup(React.createElement(TourEmptyState, props));
  assert.ok(filtered.includes('listing.noMatchingTours'));
  assert.ok(filtered.includes('filters.clearFilters'));
  const empty = renderToStaticMarkup(React.createElement(TourEmptyState, { ...props, filtered: false }));
  assert.ok(empty.includes('No tours here'));
  assert.ok(!empty.includes('<button'));
});

test('sort offers exactly the catalog choices in the approved order', () => {
  const html = renderToStaticMarkup(React.createElement(TourSort, { value: 'recommended', onChange() {}, t: base.t }));
  assert.deepEqual([...html.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]), catalog.sorts);
});

test('new visitor labels exist in every language without replacement characters or currency in input labels', () => {
  for (const locale of ['en', 'de', 'it', 'es']) {
    const messages = JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}/tours.json`, import.meta.url), 'utf8'));
    for (const key of ['searchPlaces', 'showMore', 'showLess', 'noPlaces', 'clearFilters', 'priceFrom', 'priceUpTo', 'searchValue']) {
      assert.ok(messages.filters[key]);
      assert.ok(!/[?\uFFFD]/.test(messages.filters[key]), `${locale}: ${key}`);
    }
    const search = JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}/search.json`, import.meta.url), 'utf8'));
    assert.ok(!/[$?\uFFFD]/.test(search.minPrice + search.maxPrice));
  }
  assert.equal(catalogOptions('styles', 'es').find(option => option.id === 'family')?.label, 'Familiar');
});
