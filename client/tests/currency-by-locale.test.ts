import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { localeCurrency, pageCurrency, structuredDataCurrency } from '../src/lib/currency/localeCurrency';
import { currencyForCountry } from '../src/lib/currency/countryCurrency';
import * as currencyCookie from '../src/lib/currency/currencyCookie';
import * as priceFormat from '../src/lib/currency/priceFormat';
import * as ratesModule from '../src/lib/currency/rates';
import * as startingPrice from '../src/lib/tours/startingPrice';
import { generateTourJsonLd } from '../src/lib/seo/tourJsonLd';

const { deriveStartingPrice, displayStartingPrice, lowestDisplayAmount, tierDisplayAmount } = startingPrice;
const RATES = { USD: 1, EUR: 0.92, GBP: 0.79 };
const source = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8');

// CurrencyContext is .tsx, which the runner does not load: compile it the way
// tests/tour-breadcrumbs.test.ts compiles Breadcrumb, with its imports wired up.
const contextUrl = new URL('../src/contexts/CurrencyContext.tsx', import.meta.url);
const contextModule = { exports: {} as any };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(contextUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: fileURLToPath(contextUrl),
}).outputText)(
  (id: string) => ({
    '@/lib/api/currencyRates': { getCurrencyRates: async () => ({ success: false }) },
    '@/lib/currency/countryCurrency': { currencyForCountry },
    '@/lib/currency/currencyCookie': currencyCookie,
    '@/lib/currency/localeCurrency': { localeCurrency },
    '@/lib/currency/priceFormat': priceFormat,
    '@/lib/currency/rates': ratesModule,
    '@/lib/tours/startingPrice': startingPrice,
  } as Record<string, unknown>)[id] ?? createRequire(contextUrl)(id),
  contextModule, contextModule.exports,
);
const { CurrencyProvider, useCurrency } = contextModule.exports;

/** What a server render shows: the provider's currency and three formatted prices. */
const firstHtml = (props: { locale?: string; savedCurrency?: string }) => {
  const Probe = () => {
    const { currency, formatPrice, formatAmount } = useCurrency();
    return React.createElement('p', null,
      [currency, formatPrice({ USD: 100, EUR: 95 }), formatPrice(100), formatAmount(95)].join('|'));
  };
  return renderToStaticMarkup(React.createElement(CurrencyProvider, props, React.createElement(Probe)))
    .replace(/<\/?p>/g, '');
};

test('the page currency: saved choice, then EUR on /de /it /es, then USD on /en', () => {
  assert.deepEqual(['en', 'de', 'it', 'es'].map((l) => localeCurrency(l)), [null, 'EUR', 'EUR', 'EUR']);
  assert.deepEqual(['en', 'de', 'it', 'es'].map((l) => pageCurrency(null, l)), ['USD', 'EUR', 'EUR', 'EUR']);
  assert.deepEqual(['en', 'de', 'it', 'es'].map((l) => pageCurrency('GBP', l)), ['GBP', 'GBP', 'GBP', 'GBP']);
  // Structured data ignores the cookie: crawlers carry none.
  assert.deepEqual(['en', 'de', 'it', 'es'].map((l) => structuredDataCurrency(l)), ['USD', 'EUR', 'EUR', 'EUR']);
});

test('the /en country rule is unchanged', () => {
  assert.equal(currencyForCountry('GB'), 'GBP');
  assert.equal(currencyForCountry('JE'), 'GBP');
  for (const c of ['DE', 'IT', 'ES', 'FR', 'IE']) assert.equal(currencyForCountry(c), 'EUR', c);
  for (const c of ['US', 'EG', 'SE', 'CH', null, undefined, '']) assert.equal(currencyForCountry(c as any), 'USD', String(c));
});

test('the first HTML is in the page currency, and a saved choice beats it', () => {
  // A manual EUR 95 stays 95; a bare USD 100 is converted (92) and rounded to the nearest 5.
  assert.equal(firstHtml({ locale: 'de' }), 'EUR|€95|€90|€95');
  assert.equal(firstHtml({ locale: 'it' }).split('|')[0], 'EUR');
  assert.equal(firstHtml({ locale: 'es' }).split('|')[0], 'EUR');
  // /en renders USD; the browser may then apply the country rule.
  assert.equal(firstHtml({ locale: 'en' }), 'USD|$100|$100|$95');
  assert.equal(firstHtml({ locale: 'de', savedCurrency: 'GBP' }).split('|')[0], 'GBP');
  assert.equal(firstHtml({ locale: 'en', savedCurrency: 'EUR' }).split('|')[0], 'EUR');
});

test('the layout and the listing queries use the same rule', () => {
  const layout = source('app/(visitor)/[locale]/layout.tsx');
  assert.match(layout, /<CurrencyProvider\s+savedCurrency=\{currencyCookie \?\? undefined\}\s+locale=\{locale\}/);
  const route = source('app/(visitor)/[locale]/(home)/[slug]/page.tsx');
  assert.match(route, /const currency = pageCurrency\(\s*parseCurrencyCookie\(\(await cookies\(\)\)\.get\(CURRENCY_COOKIE\)\?\.value\),\s*locale\s*\);/);
  assert.match(route, /currency: structuredDataCurrency\(locale\),/);
});

test('a typed amount is shown as typed; a missing one is converted from USD', () => {
  assert.equal(tierDisplayAmount({ USD: 100, EUR: 95 }, 'EUR', 0.92), 95);
  assert.equal(tierDisplayAmount({ USD: 100 }, 'EUR', 0.92), 90);
  assert.equal(tierDisplayAmount({ USD: 100, EUR: 0 }, 'EUR', 0.92), 90);
  assert.equal(tierDisplayAmount({ USD: 100 }, 'GBP', 0.79), 80);
  assert.equal(tierDisplayAmount({ USD: 100, EUR: 95 }, 'USD', 1), 100);
  assert.equal(tierDisplayAmount(undefined, 'EUR', 0.92), 0);
});

const mixedPlans = [{
  seasons: [{
    prices: {
      solo: { USD: 100, EUR: 95, GBP: 80 },   // typed in all three
      pax_2_4: { USD: 80 },                     // USD only: shown converted
    },
  }],
}];

test('the "from" price is the cheapest row the table shows', () => {
  // Rows in EUR: 95 (typed) and 75 (80 × 0.92 = 73.6, to the nearest 5). The
  // stored minimum of TYPED amounts says 95, which is the disagreement fixed.
  assert.equal(deriveStartingPrice(mixedPlans)?.EUR, 95);
  assert.equal(lowestDisplayAmount(mixedPlans, 'EUR', 0.92), 75);
  assert.deepEqual(displayStartingPrice(mixedPlans, RATES), { USD: 80, EUR: 75, GBP: 65 });
  assert.equal(displayStartingPrice([{ seasons: [{ prices: {} }] }], RATES), undefined);
});

test('the pricing table formats resolved amounts without converting them again', () => {
  const pricing = source('components/sections/TourListingDetailsOne/components/PricingPlans.tsx');
  assert.doesNotMatch(pricing, /formatPrice\(|getPriceValue/);
  assert.match(pricing, /formatAmount\(from\)/);
  assert.match(pricing, /price: formatAmount\(seasonFrom\)/);
  assert.match(pricing, /tierDisplayAmount\(amounts, currency, rates\[currency\]\)/);
  const details = source('components/sections/TourListingDetailsOne/TourListingDetailsOne.tsx');
  assert.match(details, /displayStartingPrice\(pricingPlans, rates\) \?\? price/);
  assert.match(details, /price=\{startingPrice\}[\s\S]*price=\{startingPrice\}/);
});

test('formatting never rounds: whole numbers plain, anything else with two decimals', () => {
  assert.equal(priceFormat.formatPriceAmount(75, 'EUR'), '€75');
  assert.equal(priceFormat.formatPriceAmount(87.5, 'EUR'), '€87.50');
  assert.equal(priceFormat.formatPriceAmount(9.2, 'GBP'), '£9.20');
});

const offersOf = (tour: any, currency: 'USD' | 'EUR') => {
  const graph = (generateTourJsonLd({
    tour, locale: currency === 'EUR' ? 'de' : 'en', currency,
    canonicalUrl: 'https://example.com/t', siteUrl: 'https://example.com', breadcrumbs: [],
  }) as any)['@graph'] as any[];
  return { aggregate: graph.find((n) => n['@type'] === 'AggregateOffer'), product: graph.find((n) => n['@type'] === 'Product') };
};

test('JSON-LD has an Offer for every priced tier, at the price the page shows', () => {
  const tour = { heading: { en: 'T', de: 'T' }, pricingPlans: [{ planName: 'AFFORDABLE', ...mixedPlans[0] }] };
  const eur = offersOf(tour, 'EUR').aggregate;
  // solo: manual EUR 95 as entered; pax_2_4: USD 80 converted and rounded (75).
  assert.deepEqual(eur.offers.map((o: any) => [o.price, o.priceCurrency]), [[95, 'EUR'], [75, 'EUR']]);
  assert.deepEqual(
    eur.offers.map((o: any) => o.price),
    [tierDisplayAmount(mixedPlans[0].seasons[0].prices.solo, 'EUR', RATES.EUR), tierDisplayAmount(mixedPlans[0].seasons[0].prices.pax_2_4, 'EUR', RATES.EUR)]
  );
  assert.deepEqual([eur.priceCurrency, eur.lowPrice, eur.highPrice, eur.offerCount], ['EUR', 75, 95, 2]);
  const usd = offersOf(tour, 'USD').aggregate;
  assert.deepEqual(usd.offers.map((o: any) => o.price), [100, 80]);
  assert.deepEqual([usd.priceCurrency, usd.lowPrice, usd.highPrice, usd.offerCount], ['USD', 80, 100, 2]);
});

test('a USD-only tour gets converted EUR offers; an unpriced tour gets no Product at all', () => {
  const usdOnly = { heading: { de: 'T' }, pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ prices: { solo: { USD: 100 } } }] }] };
  const priced = offersOf(usdOnly, 'EUR');
  assert.deepEqual(priced.aggregate.offers.map((o: any) => [o.price, o.priceCurrency]), [[90, 'EUR']]);
  assert.deepEqual(priced.product.offers, { '@id': priced.aggregate['@id'] });

  const unpriced = { heading: { de: 'T' }, pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ prices: {} }] }] };
  const graph = (generateTourJsonLd({
    tour: unpriced, locale: 'de', currency: 'EUR',
    canonicalUrl: 'https://example.com/t', siteUrl: 'https://example.com', breadcrumbs: [],
  }) as any)['@graph'] as any[];
  assert.ok(graph.every((n) => n['@type'] !== 'Product' && n['@type'] !== 'AggregateOffer'));
  // The page's main entity is then the trip, never a node that is not there.
  const trip = graph.find((n) => n['@type'] === 'TouristTrip');
  assert.deepEqual(graph.find((n) => n['@type'] === 'WebPage').mainEntity, { '@id': trip['@id'] });
});
