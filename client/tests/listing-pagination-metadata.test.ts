import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { getStrictSlugLocaleAlternates } from '../src/lib/seo/localeAlternates';
import { parsePublicListingQuery } from '../src/lib/tours/publicListingUrl';

// Exercise the actual route helper with controlled inventory; no DB fixtures.
const source = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/[slug]/page.tsx', import.meta.url), 'utf8');
const helper = source.slice(source.indexOf('async function getTourListingAlternates('), source.indexOf('export async function generateMetadata'));
const compiled = ts.transpileModule(helper, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const baseUrl = 'https://www.jesegypttours.com';
const data = { _id: 'fixture', slug: { en: 'egypt-tour-packages', de: 'reisen', it: 'viaggi', es: 'viajes' } };
const counts: Record<string, number> = { en: 3, de: 2, it: 1, es: 3 };
const alternates = new Function('getStrictSlugLocaleAlternates', 'baseUrl', 'tourServerAPI', 'notFound', `${compiled}; return getTourListingAlternates;`)(
  getStrictSlugLocaleAlternates, baseUrl,
  { getListing: async (_query: unknown, locale: string) => ({ success: true, totalPages: counts[locale] }) },
  () => { throw new Error('NOT_FOUND'); },
);

test('real listing metadata keeps page 2/3 self canonical and omits nonexistent locale pages', async () => {
  for (const type of ['category', 'subcategory']) {
    const page2 = await alternates('en', 'egypt-tour-packages', data, type, parsePublicListingQuery({ page: '2' }));
    assert.equal(page2.canonical, `${baseUrl}/en/egypt-tour-packages?page=2`);
    assert.deepEqual(Object.keys(page2.languages).sort(), ['de', 'en', 'es', 'x-default']);
    assert.equal(page2.languages.de, `${baseUrl}/de/reisen?page=2`);
    const page3 = await alternates('en', 'egypt-tour-packages', data, type, parsePublicListingQuery({ page: '3' }));
    assert.equal(page3.canonical, `${baseUrl}/en/egypt-tour-packages?page=3`);
    assert.deepEqual(Object.keys(page3.languages).sort(), ['en', 'es', 'x-default']);
    await assert.rejects(alternates('it', 'viaggi', data, type, parsePublicListingQuery({ page: '2' })), /NOT_FOUND/);
  }
});

test('filtered page 2 has parent canonical and no facet hreflang cluster', async () => {
  const result = await alternates('en', 'egypt-tour-packages', data, 'category', parsePublicListingQuery({ destinations: 'aswan', page: '2' }, { destinationKeys: ['aswan'] }));
  assert.deepEqual(result, { canonical: `${baseUrl}/en/egypt-tour-packages` });
});

test('tracking parameters never reach a canonical or an alternate: metadata is the untracked URL\'s', async () => {
  const parse = (query: Record<string, string>) => parsePublicListingQuery(query, { destinationKeys: ['aswan', 'cairo'] });
  const trackings: Record<string, string>[] = [
    { srsltid: 'abc' }, { ref: 'partner' }, { utm_source: 'google', srsltid: 'abc' }, { gclid: 'g', fbclid: 'f', msclkid: 'm' },
    { ref: 'a~b' }, { utm_source: 'a(b)' }, { ref: "it's", utm_campaign: "a(b)~wow!'x" }, { ref: 'مصر' },
  ];
  const states: Record<string, string>[] = [{}, { page: '2' }, { page: '3' }, { destinations: 'cairo' }, { destinations: 'cairo', page: '2', sort: 'price-asc' }];
  for (const type of ['category', 'subcategory'] as const) {
    for (const state of states) {
      const untracked = await alternates('en', 'egypt-tour-packages', data, type, parse(state));
      for (const tracking of trackings) {
        const tracked = await alternates('en', 'egypt-tour-packages', data, type, parse({ ...state, ...tracking }));
        const label = `${type} ${JSON.stringify({ ...state, ...tracking })}`;
        assert.deepEqual(tracked, untracked, label);
        for (const url of [tracked.canonical, ...Object.values(tracked.languages ?? {})]) {
          assert.doesNotMatch(String(url), /utm_|srsltid|ref=|gclid|fbclid|msclkid/, label);
        }
      }
    }
  }
  // The shapes asserted above, spelled out once.
  assert.equal((await alternates('en', 'egypt-tour-packages', data, 'category', parse({ page: '2', srsltid: 'abc' }))).canonical, `${baseUrl}/en/egypt-tour-packages?page=2`);
  assert.deepEqual(
    await alternates('en', 'egypt-tour-packages', data, 'category', parse({ destinations: 'cairo', utm_source: 'google', srsltid: 'abc' })),
    { canonical: `${baseUrl}/en/egypt-tour-packages` },
  );
});
