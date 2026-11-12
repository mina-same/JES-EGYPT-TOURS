import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as priceFormat from '../src/lib/currency/priceFormat';
import * as ratesModule from '../src/lib/currency/rates';
import * as startingPrice from '../src/lib/tours/startingPrice';
import * as currencyCookie from '../src/lib/currency/currencyCookie';
import { localeCurrency } from '../src/lib/currency/localeCurrency';
import { currencyForCountry } from '../src/lib/currency/countryCurrency';
import { generateTourJsonLd } from '../src/lib/seo/tourJsonLd';
import { readServerCurrencyRates, RATES_TTL_SECONDS } from '../src/lib/api/currencyRates.server';
import { parseRateInput, rateInputError, ratePreview } from '../src/lib/currency/rateForm';
// The API's side of the same rules (server/src). They must agree with the pages.
// (utils/tourQuery.ts is not imported here: it pulls in the server's model
// types. Its card price calls this same priceRounding module, and
// server/tests/currency-rates.test.ts checks that it does.)
import * as serverRounding from '../../server/src/utils/priceRounding';
import { resolveTourStartingQuote } from '../../server/src/utils/booking';

const { roundConvertedPrice, convertUsdPrice } = priceFormat;
const { FALLBACK_RATES } = ratesModule;
const { tierDisplayAmount, displayStartingPrice } = startingPrice;
const source = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

// CurrencyContext is .tsx: compile it with its imports wired, as in tests/currency-by-locale.test.ts.
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

/** Renders like the server does: a provider with the given rates, and a probe reading it. */
const serverRender = (props: Record<string, unknown>, probe: (ctx: any) => string) => {
  const Probe = () => React.createElement('p', null, probe(useCurrency()));
  return renderToStaticMarkup(React.createElement(CurrencyProvider, props, React.createElement(Probe)))
    .replace(/<\/?p>/g, '');
};

test('converted prices round to the nearest 5; manual prices stay as entered', () => {
  assert.equal(roundConvertedPrice(92), 90);
  assert.equal(roundConvertedPrice(79), 80);
  assert.equal(roundConvertedPrice(97.5), 100);
  assert.equal(roundConvertedPrice(100 * 0.925), 95); // 92.4999… in floating point
  assert.equal(roundConvertedPrice(92.4), 90);
  assert.equal(roundConvertedPrice(2), 5);
  assert.equal(roundConvertedPrice(0), 0);
  assert.equal(roundConvertedPrice(Number.NaN), 0);
  assert.equal(convertUsdPrice(100, 'EUR', 0.92), 90);
  assert.equal(convertUsdPrice(100, 'GBP', 0.79), 80);
  // USD amounts and manual amounts are never rounded.
  assert.equal(convertUsdPrice(99.5, 'USD', 1), 99.5);
  assert.equal(tierDisplayAmount({ USD: 100, EUR: 87 }, 'EUR', 0.92), 87);
  assert.equal(tierDisplayAmount({ USD: 100, EUR: 87.5 }, 'EUR', 0.92), 87.5);
  assert.equal(tierDisplayAmount({ USD: 100 }, 'EUR', 0.92), 90);
});

test('the API rounds exactly like the pages (cards, filter and sort use the same server function), and so does the booking quote', () => {
  for (const rate of [0.79, 0.8, 0.86, 0.92, 0.925, 0.95, 1.17]) {
    for (let usd = 1; usd <= 3000; usd += usd < 200 ? 1 : 7) {
      const page = tierDisplayAmount({ USD: usd }, 'EUR', rate);
      assert.equal(serverRounding.roundConvertedPrice(usd * rate), page, `${usd} × ${rate}`);
      assert.equal(resolveTourStartingQuote({ USD: usd }, 'EUR', { EUR: rate, GBP: rate }), page, `booking ${usd} × ${rate}`);
    }
  }
  // Manual amounts win and stay as entered.
  assert.equal(resolveTourStartingQuote({ USD: 100, EUR: 87 }, 'EUR', { EUR: 0.92 }), 87);
  assert.equal(resolveTourStartingQuote({ USD: 99 }, 'USD'), 99);
});

test('the booking quote is the price the booking card shows', () => {
  const rates = { USD: 1, EUR: 0.92, GBP: 0.79 };
  for (const price of [{ USD: 100 }, { USD: 65, EUR: 60, GBP: 50 }, { USD: 90, EUR: 85 }, { USD: 47 }]) {
    for (const [locale, savedCurrency] of [['de', undefined], ['en', 'GBP'], ['en', undefined]] as const) {
      const shown = serverRender({ locale, savedCurrency, initialRates: rates, ratesFromDatabase: true },
        ({ currency, getPriceValue }) => `${currency}:${getPriceValue(price)}`);
      const [currency, value] = shown.split(':');
      assert.equal(resolveTourStartingQuote(price, currency as any, rates), Number(value), `${JSON.stringify(price)} ${currency}`);
    }
  }
});

test('server rendering reads the stored rates; the fallback is the last resort', async () => {
  const realFetch = globalThis.fetch;
  const calls: Array<{ url: string; init: any }> = [];
  const answer = (body: unknown, ok = true) => async (url: string, init: any) => {
    calls.push({ url: String(url), init });
    return { ok, json: async () => body } as any;
  };
  try {
    globalThis.fetch = answer({ success: true, data: { rates: { USD: 1, EUR: 0.9, GBP: 0.8 }, updatedAt: '2026-11-01T10:00:00.000Z' } }) as any;
    assert.deepEqual(await readServerCurrencyRates(), {
      rates: { USD: 1, EUR: 0.9, GBP: 0.8 }, updatedAt: '2026-11-01T10:00:00.000Z', source: 'database',
    });
    assert.match(calls[0].url, /\/currency\/rates$/);
    // Cached under the tours tag, which PUT /api/currency/rates revalidates.
    assert.deepEqual(calls[0].init.next, { revalidate: RATES_TTL_SECONDS, tags: ['tours'] });

    globalThis.fetch = (async () => { throw new Error('API down'); }) as any;
    assert.deepEqual(await readServerCurrencyRates(), { rates: FALLBACK_RATES, updatedAt: null, source: 'fallback' });
    globalThis.fetch = answer({ success: true, data: { rates: { EUR: 'x', GBP: 0.8 } } }) as any;
    assert.equal((await readServerCurrencyRates()).source, 'fallback');
    globalThis.fetch = answer({}, false) as any;
    assert.equal((await readServerCurrencyRates()).source, 'fallback');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('the first HTML uses the server rates, and the browser does not fetch others', () => {
  const at = (EUR: number) => serverRender(
    { locale: 'de', initialRates: { USD: 1, EUR, GBP: 0.79 }, ratesFromDatabase: true },
    ({ formatPrice }) => formatPrice({ USD: 100 }));
  assert.equal(at(0.92), '€90');
  assert.equal(at(0.95), '€95');
  const context = source('src/contexts/CurrencyContext.tsx');
  assert.match(context, /if \(ratesFromDatabase\) return;/);
  assert.doesNotMatch(context, /sessionStorage/);
  const layout = source('src/app/(visitor)/[locale]/layout.tsx');
  assert.match(layout, /initialRates=\{currencyRates\.rates\}/);
  assert.match(layout, /ratesFromDatabase=\{currencyRates\.source === "database"\}/);
  assert.match(source('src/app/(visitor)/[locale]/(home)/[slug]/page.tsx'), /currency: structuredDataCurrency\(locale\),\s*rates,/);
});

test('a rate change moves the page price and the JSON-LD price together (test double)', () => {
  const plans = [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'S1', prices: {
    solo: { USD: 100 }, pax_2_4: { USD: 120 }, pax_5_8: { USD: 140, EUR: 128 }, pax_9_16: { USD: 47 },
  } }] }];
  const results: string[][] = [];
  for (const EUR of [0.92, 0.95]) {
    const rates = { USD: 1, EUR, GBP: 0.79 };
    const graph = (generateTourJsonLd({
      tour: { heading: { de: 'T' }, pricingPlans: plans }, locale: 'de', currency: 'EUR', rates,
      canonicalUrl: 'https://example.com/de/t', siteUrl: 'https://example.com', breadcrumbs: [],
    }) as any)['@graph'] as any[];
    const aggregate = graph.find((n) => n['@type'] === 'AggregateOffer');
    // What the page shows: each row through the pricing table's function, and
    // the "from" through the booking card's path (formatPrice of the derived object).
    const page = serverRender({ locale: 'de', initialRates: rates, ratesFromDatabase: true }, ({ formatAmount, formatPrice }) => [
      ...Object.values(plans[0].seasons[0].prices).map((amounts) => formatAmount(tierDisplayAmount(amounts, 'EUR', EUR))),
      formatPrice(displayStartingPrice(plans, rates)),
    ].join('|')).split('|');
    const schema = aggregate.offers.map((o: any) => priceFormat.formatPriceAmount(o.price, o.priceCurrency));
    assert.deepEqual(schema, page.slice(0, 4), `rows at ${EUR}`);
    assert.equal(priceFormat.formatPriceAmount(aggregate.lowPrice, 'EUR'), page[4], `from at ${EUR}`);
    results.push(schema);
  }
  // 100 × 0.92 = 92 → 90 and 100 × 0.95 = 95; the manual 128 never moves.
  assert.deepEqual(results, [['€90', '€110', '€128', '€45'], ['€95', '€115', '€128', '€45']]);
});

test('the Admin rates form checks input and previews the rounded prices', () => {
  assert.equal(parseRateInput('0,92'), 0.92);
  assert.equal(parseRateInput(' 0.79 '), 0.79);
  assert.equal(parseRateInput('abc'), null);
  assert.equal(rateInputError('0.95'), null);
  assert.match(rateInputError('') ?? '', /Enter a rate/);
  assert.match(rateInputError('92') ?? '', /decimal point/);
  assert.match(rateInputError('0') ?? '', /greater than 0/);
  assert.deepEqual(ratePreview('0.92', '0.79').find((row) => row.usd === 100), { usd: 100, eur: 90, gbp: 80 });
  assert.deepEqual(ratePreview('x', '0.79').find((row) => row.usd === 100), { usd: 100, eur: null, gbp: 80 });
});

test('the Admin screen saves through PUT /api/currency/rates, for tour editors only', () => {
  const page = source('src/app/(admin)/admin/tour/exchange-rates/page.tsx');
  assert.match(page, /currencyAPI\.updateRates\(/);
  assert.match(page, /hasPermission\(PERMISSIONS\.TOUR_UPDATE\)/);
  assert.match(page, /Last updated: \{formatUpdatedAt\(updatedAt\)\}/);
  assert.match(source('src/components/admin/app-sidebar.tsx'), /url: '\/admin\/tour\/exchange-rates'/);
  assert.match(source('../server/src/routes/currencyRoutes.ts'), /router\.put\('\/rates', protect, permit\(PERMISSIONS\.TOUR_UPDATE\), updateRates\);/);
});
