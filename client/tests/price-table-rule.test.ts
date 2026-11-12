import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as priceCompleteness from '../src/lib/tours/priceCompleteness';
import * as catalogModule from '../src/lib/tours/catalog';
import * as utils from '../src/lib/utils';

const { getMissingPriceCells, getPriceCompleteness } = priceCompleteness;

/** Compiles a .ts/.tsx source the way tests/tour-classification.test.ts does. */
function loadSource(relative: string, overrides: Record<string, unknown> = {}) {
  const url = new URL(relative, import.meta.url);
  const require = createRequire(url);
  const compiledModule = { exports: {} as any };
  const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: fileURLToPath(url),
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(
    (name: string) => overrides[name] ?? require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const { validateTourForm } = loadSource('../src/lib/validations/tourValidation.ts', {
  '@/lib/tours/catalog': catalogModule,
  '@/lib/tours/priceCompleteness': priceCompleteness,
});

const LOW = '1 May 2026 – 31 August 2026';
const REGULAR = '1 September 2026 – 19 December 2026 / 6 January 2027 – 24 March 2027';
const PEAK = '20 December 2026 – 5 January 2027 / 25 March 2027 – 15 April 2027';
const TIERS = ['solo', 'pax_2_4', 'pax_5_8', 'pax_9_16'] as const;

/** Every tier of a season priced with the given currencies (USD 100, EUR 90, GBP 80). */
const priced = (seasonName: string, currencies: Array<'USD' | 'EUR' | 'GBP'>) => ({
  seasonName,
  prices: Object.fromEntries(TIERS.map((tier) => [tier, Object.fromEntries(
    currencies.map((c) => [c, { USD: 100, EUR: 90, GBP: 80 }[c]]))])),
});
const plan = (planName: string, seasons: any[]) => ({ planName, seasons });
const messages = (plans: any[]) => getMissingPriceCells(plans).map((cell) => cell.message);

test('complete tables pass: all three currencies, or USD alone, or USD with one full currency', () => {
  assert.deepEqual(getMissingPriceCells([plan('AFFORDABLE', [priced(LOW, ['USD', 'EUR', 'GBP']), priced(REGULAR, ['USD', 'EUR', 'GBP'])])]), []);
  assert.deepEqual(getMissingPriceCells([plan('AFFORDABLE', [priced(LOW, ['USD']), priced(PEAK, ['USD'])])]), []);
  assert.deepEqual(getMissingPriceCells([plan('AFFORDABLE', [priced(LOW, ['USD', 'GBP']), priced(PEAK, ['USD', 'GBP'])])]), []);
});

test('a plan with no prices at all is allowed (0 and empty both count as empty)', () => {
  assert.deepEqual(getMissingPriceCells([
    plan('AFFORDABLE', [priced(LOW, ['USD'])]),
    plan('GOLD (5 STAR STANDARD)', [{ seasonName: LOW }, { seasonName: REGULAR, prices: {} }]),
    plan('DIAMOND (5 STAR LUXURY)', [{ seasonName: LOW, prices: { solo: { USD: 0, EUR: 0 }, pax_2_4: { USD: undefined } } }]),
  ]), []);
  assert.deepEqual(getMissingPriceCells([]), []);
  assert.deepEqual(getMissingPriceCells(undefined), []);
});

test('one missing EUR cell blocks, named the way the editor shows it', () => {
  const table = priced(LOW, ['USD', 'EUR', 'GBP']);
  delete (table.prices as any).pax_2_4.EUR;
  const cells = getMissingPriceCells([plan('AFFORDABLE', [table, priced(REGULAR, ['USD', 'EUR', 'GBP'])])]);
  assert.deepEqual(cells, [{
    scope: 'cell', planIndex: 0, seasonIndex: 0, tier: 'pax_2_4', currency: 'EUR',
    path: 'pricingPlans.0.seasons.0.prices.pax_2_4.EUR',
    message: 'Comfort / Low Season / 2-4 Pax: EUR price missing',
  }]);
});

test('a zero counts as missing, and each currency is checked on its own', () => {
  const table = priced(PEAK, ['USD', 'EUR', 'GBP']);
  (table.prices as any).solo.GBP = 0;
  (table.prices as any).pax_9_16.EUR = 0;
  assert.deepEqual(messages([plan('GOLD (5 STAR STANDARD)', [table])]), [
    'Gold (5 Star Standard) / Peak Season / Solo: GBP price missing',
    'Gold (5 Star Standard) / Peak Season / 9-16 Pax: EUR price missing',
  ]);
});

test('a currency started in one season must cover every season of the plan', () => {
  assert.deepEqual(messages([plan('AFFORDABLE', [priced(LOW, ['USD', 'EUR']), priced(REGULAR, ['USD'])])]), [
    'Comfort / Regular Season / Solo: EUR price missing',
    'Comfort / Regular Season / 2-4 Pax: EUR price missing',
    'Comfort / Regular Season / 5-8 Pax: EUR price missing',
    'Comfort / Regular Season / 9-16 Pax: EUR price missing',
  ]);
});

test('USD is required in every cell of a priced plan, even when only EUR was entered', () => {
  const table = priced(LOW, ['USD']);
  delete (table.prices as any).solo.USD;
  assert.deepEqual(messages([plan('TOUR PRICES', [table])]), ['Tour Prices / Low Season / Solo: USD price missing']);
  assert.deepEqual(messages([plan('AFFORDABLE', [priced(LOW, ['EUR'])])]), TIERS.map((tier) =>
    `Comfort / Low Season / ${{ solo: 'Solo', pax_2_4: '2-4 Pax', pax_5_8: '5-8 Pax', pax_9_16: '9-16 Pax' }[tier]}: USD price missing`));
});

test('per tour: Gold with EUR and Comfort without EUR is blocked, with one line for Comfort', () => {
  const plans = [
    plan('AFFORDABLE', [priced(LOW, ['USD']), priced(PEAK, ['USD'])]),
    plan('GOLD (5 STAR STANDARD)', [priced(LOW, ['USD', 'EUR']), priced(PEAK, ['USD', 'EUR'])]),
  ];
  assert.deepEqual(getMissingPriceCells(plans), [{
    scope: 'plan', planIndex: 0, currency: 'EUR',
    path: 'pricingPlans.0.currencies.EUR',
    message: 'Comfort: EUR prices missing (Gold (5 Star Standard) has EUR prices, so every priced plan needs them)',
    requiredBy: ['Gold (5 Star Standard)'],
  }]);
  // Two plans with the currency are both named.
  assert.deepEqual(messages([...plans, plan('DIAMOND (5 STAR LUXURY)', [priced(LOW, ['USD', 'EUR'])])]), [
    'Comfort: EUR prices missing (Gold (5 Star Standard) and Diamond (5 Star Luxury) have EUR prices, so every priced plan needs them)',
  ]);
});

test('per tour: every priced plan with EUR is accepted; no plan with EUR is accepted', () => {
  assert.deepEqual(getMissingPriceCells([
    plan('AFFORDABLE', [priced(LOW, ['USD', 'EUR'])]),
    plan('GOLD (5 STAR STANDARD)', [priced(LOW, ['USD', 'EUR']), priced(PEAK, ['USD', 'EUR'])]),
    plan('DIAMOND (5 STAR LUXURY)', [priced(LOW, ['USD', 'EUR'])]),
  ]), []);
  assert.deepEqual(getMissingPriceCells([
    plan('AFFORDABLE', [priced(LOW, ['USD'])]),
    plan('GOLD (5 STAR STANDARD)', [priced(LOW, ['USD']), priced(PEAK, ['USD'])]),
  ]), []);
});

test('per tour: a plan with no prices at all is ignored', () => {
  assert.deepEqual(getMissingPriceCells([
    plan('AFFORDABLE', [priced(LOW, ['USD', 'EUR', 'GBP'])]),
    plan('GOLD (5 STAR STANDARD)', [{ seasonName: LOW, prices: {} }, { seasonName: PEAK }]),
    plan('DIAMOND (5 STAR LUXURY)', [{ seasonName: LOW, prices: { solo: { USD: 0, EUR: 0, GBP: 0 } } }]),
  ]), []);
});

test('the per-tour and per-plan rules apply together, currency by currency', () => {
  // Gold: GBP started in one season only (per-plan rule, cell lines).
  // Comfort: no GBP at all while Gold has some (per-tour rule, one line).
  const cells = getMissingPriceCells([
    plan('AFFORDABLE', [priced(LOW, ['USD'])]),
    plan('GOLD (5 STAR STANDARD)', [priced(LOW, ['USD', 'GBP']), priced(PEAK, ['USD'])]),
  ]);
  assert.equal(cells[0].message, 'Comfort: GBP prices missing (Gold (5 Star Standard) has GBP prices, so every priced plan needs them)');
  assert.deepEqual(cells.slice(1).map((c) => c.message), [
    'Gold (5 Star Standard) / Peak Season / Solo: GBP price missing',
    'Gold (5 Star Standard) / Peak Season / 2-4 Pax: GBP price missing',
    'Gold (5 Star Standard) / Peak Season / 5-8 Pax: GBP price missing',
    'Gold (5 Star Standard) / Peak Season / 9-16 Pax: GBP price missing',
  ]);
  // USD stays required cell by cell in every priced plan.
  assert.deepEqual(messages([
    plan('AFFORDABLE', [priced(LOW, ['EUR'])]),
    plan('GOLD (5 STAR STANDARD)', [priced(LOW, ['USD', 'EUR'])]),
  ]).filter((m) => m.includes('USD')).length, 4);
});

/** The Saqqara tour's price plan as stored on 2026-11-12 (one plan, three seasons, USD + EUR + GBP). */
const SAQQARA_AS_STORED = [{ planName: 'TOUR PRICES', seasons: [
  { seasonName: LOW, prices: { solo: { USD: 125, EUR: 115, GBP: 90 }, pax_2_4: { USD: 90, EUR: 85, GBP: 70 }, pax_5_8: { USD: 75, EUR: 70, GBP: 60 }, pax_9_16: { USD: 65, EUR: 60, GBP: 50 } } },
  { seasonName: REGULAR, prices: { solo: { USD: 125, EUR: 115, GBP: 90 }, pax_2_4: { USD: 90, EUR: 85, GBP: 70 }, pax_5_8: { USD: 75, EUR: 70, GBP: 60 }, pax_9_16: { USD: 65, EUR: 60, GBP: 50 } } },
  { seasonName: PEAK, prices: { solo: { USD: 140, EUR: 125, GBP: 95 }, pax_2_4: { USD: 100, EUR: 95, GBP: 75 }, pax_5_8: { USD: 85, EUR: 80, GBP: 65 }, pax_9_16: { USD: 70, EUR: 70, GBP: 50 } } },
] }];


test('an unrecognised season is named by its position', () => {
  const cells = getMissingPriceCells([plan('AFFORDABLE', [priced(LOW, ['USD', 'EUR']), priced('Ramadan', ['USD'])])]);
  assert.equal(cells[0].message, 'Comfort / Season 2 / Solo: EUR price missing');
});

test('the completeness badge keeps its own output', () => {
  const report = getPriceCompleteness({
    priceStartingFrom: { USD: 100 },
    pricingPlans: [plan('AFFORDABLE', [priced(LOW, ['USD'])])],
  });
  assert.deepEqual(report.missing, ['Starting price: EUR, GBP', 'Comfort · Low Season: Solo (EUR, GBP), 2-4 Pax (EUR, GBP), 5-8 Pax (EUR, GBP), 9-16 Pax (EUR, GBP)']);
});

/** A tour form that passes every other rule, so only the price table is tested. */
const validForm = (pricingPlans: any[]) => ({
  tourType: Object.keys(catalogModule.catalog.types)[0],
  name: 'Test tour',
  slug: { en: 'test-tour' },
  subcategory: '64b000000000000000000001',
  images: [{ url: 'https://example.com/a.jpg' }],
  itinerary: { days: [] },
  pricingPlans,
});

test('saving is blocked with one error per missing cell; a whole table saves', () => {
  assert.deepEqual(validateTourForm(validForm([plan('AFFORDABLE', [priced(LOW, ['USD', 'EUR', 'GBP'])])])), []);
  assert.deepEqual(validateTourForm(validForm([plan('AFFORDABLE', [priced(LOW, ['USD'])])])), []);

  const table = priced(LOW, ['USD', 'EUR', 'GBP']);
  delete (table.prices as any).pax_2_4.EUR;
  assert.deepEqual(validateTourForm(validForm([plan('AFFORDABLE', [table])])), [{
    field: 'Comfort / Low Season / 2-4 Pax: EUR price missing',
    message: '',
    path: 'pricingPlans.0.seasons.0.prices.pax_2_4.EUR',
  }]);
});

test('the Pricing tab marks the plan, the cell and the currency, and the error scrolls to the cell', () => {
  const manager = readFileSync(new URL('../src/components/admin/PricingPlansManager.tsx', import.meta.url), 'utf8');
  for (const tier of TIERS) {
    assert.ok(manager.includes(`<PriceCell path={\`\${seasonPath}.prices.${tier}\`}>`), `scroll target for ${tier}`);
    assert.ok(manager.includes(`errorCurrencies={missingInCell(\`\${seasonPath}.prices.${tier}\`)}`), `currency marks for ${tier}`);
  }
  assert.match(manager, /<AdminCurrencyTabs activeCurrency=\{activeCurrency\} onCurrencyChange=\{setActiveCurrency\} errorCurrencies=\{missingCurrencies\} \/>/);
  assert.match(manager, /const isCollapsed = collapsedPlans\[planId\] \?\? !planHasError;/);
  assert.match(manager, /data-field=\{`\$\{path\}\.\$\{currency\}`\}/);
});

test('a currency tab with missing prices is marked red and says so', () => {
  const tabsModule = loadSource('../src/components/admin/AdminCurrencyTabs.tsx', {
    '@/lib/utils': utils,
    'country-flag-icons/react/3x2': { US: () => null, EU: () => null, GB: () => null },
  });
  const html = renderToStaticMarkup(React.createElement(tabsModule.default, {
    activeCurrency: 'USD', onCurrencyChange: () => {}, errorCurrencies: ['EUR'],
  }));
  const euro = html.match(/<button[^>]*title="Euro: prices missing"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
  assert.ok(euro, 'the EUR tab is marked');
  assert.match(euro, /aria-label="Euro, prices missing"/);
  assert.match(euro, /ring-red-500/);
  assert.match(euro, /⚠/);
  assert.match(html, /<button[^>]*title="US Dollar"/);
  assert.equal((html.match(/prices missing"/g) || []).length, 2, 'only EUR (title + aria-label)');
});

test('the Saqqara tour as stored still saves', () => {
  assert.deepEqual(getMissingPriceCells(SAQQARA_AS_STORED), []);
  assert.deepEqual(validateTourForm(validForm(SAQQARA_AS_STORED)), []);
});

test('saving is blocked with the per-tour line, at a path the Pricing tab can mark', () => {
  const errors = validateTourForm(validForm([
    plan('AFFORDABLE', [priced(LOW, ['USD'])]),
    plan('GOLD (5 STAR STANDARD)', [priced(LOW, ['USD', 'EUR'])]),
  ]));
  assert.deepEqual(errors, [{
    field: 'Comfort: EUR prices missing (Gold (5 Star Standard) has EUR prices, so every priced plan needs them)',
    message: '',
    path: 'pricingPlans.0.currencies.EUR',
  }]);
});

test('a currency missing from a whole plan marks that plan, its cells and the currency tab', () => {
  const manager = readFileSync(new URL('../src/components/admin/PricingPlansManager.tsx', import.meta.url), 'utf8');
  // Cells of the plan show the currency as missing …
  assert.ok(manager.includes('e.path === `${cellPath}.${currency}` || e.path === `${planPath}.currencies.${currency}`'));
  // … so does the main currency tab, and the plan header shows "⚠ Error".
  assert.ok(manager.includes(String.raw`(seasons\.\d+\.prices\.[a-z0-9_]+|currencies)\.(USD|EUR|GBP)$`));
  assert.ok(manager.includes('hasError(`pricingPlans.${planIndex}.currencies`)'));
  // The error panel can scroll to the plan.
  assert.ok(manager.includes('data-field={`pricingPlans.${planIndex}.currencies.${currency}`}'));
});
