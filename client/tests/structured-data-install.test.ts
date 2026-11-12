import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildSiteJsonLd, SITE_DESCRIPTION_KEY } from '../src/lib/seo/siteJsonLd';
import { buildFaqPageJsonLd, buildHomePageJsonLd, faqPlainText } from '../src/lib/seo/pageJsonLd';
import { homeFaqContent, listingFaqContent } from '../src/lib/faqContent';
import { generateTourJsonLd } from '../src/lib/seo/tourJsonLd';
import { serializeJsonLd } from '../src/lib/seo/serializeJsonLd';

const BASE = 'https://www.jesegypttours.com';

// The test runner does not load .tsx, so Breadcrumb is compiled here the same
// way tests/tour-breadcrumbs.test.ts does it.
const breadcrumbUrl = new URL('../src/components/common/Breadcrumb/Breadcrumb.tsx', import.meta.url);
const breadcrumbRequire = createRequire(breadcrumbUrl);
const breadcrumbModule = { exports: {} as { default: React.ComponentType<any> } };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(breadcrumbUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: fileURLToPath(breadcrumbUrl),
}).outputText)(
  (id: string) => ({
    'next/link': { __esModule: true, default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children) },
    '@/lib/url': { getSeoBaseUrl: () => BASE },
    '@/lib/seo/serializeJsonLd': { serializeJsonLd },
  } as Record<string, unknown>)[id] ?? breadcrumbRequire(id),
  breadcrumbModule, breadcrumbModule.exports,
);
const Breadcrumb = breadcrumbModule.exports.default;
const LOCALES = ['en', 'de', 'it', 'es'] as const;
const locale = (lang: string, ns: string) =>
  JSON.parse(readFileSync(new URL(`../src/i18n/locales/${lang}/${ns}.json`, import.meta.url), 'utf8'));
const get = (obj: any, path: string) => path.split('.').reduce((v, k) => v?.[k], obj);

test('the site block is one @graph: the company once, then the website', () => {
  const doc = buildSiteJsonLd({ baseUrl: BASE, locale: 'de', description: 'Beschreibung' }) as any;
  assert.equal(doc['@context'], 'https://schema.org');
  assert.deepEqual(doc['@graph'].map((n: any) => [n['@type'], n['@id']]), [
    ['TravelAgency', `${BASE}/#travelagency`],
    ['WebSite', `${BASE}/#website`],
  ]);
  const agency = doc['@graph'][0];
  assert.equal(agency.description, 'Beschreibung');
  assert.equal(agency.telephone, '+201007437271');
  assert.equal(agency.contactPoint.telephone, '+201007437271');
  assert.equal(agency.email, 'info@jesegypttours.com');
  assert.equal(agency.contactPoint.email, 'info@jesegypttours.com');
  assert.deepEqual(agency.knowsLanguage, ['en', 'de', 'it', 'es']);
  assert.deepEqual(agency.contactPoint.availableLanguage, ['en', 'de', 'it', 'es']);
  assert.deepEqual(agency.areaServed, { '@type': 'Country', name: 'Egypt' });
  assert.deepEqual(agency.openingHoursSpecification.dayOfWeek,
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  assert.equal(agency.openingHoursSpecification.opens, '00:00');
  assert.equal(agency.openingHoursSpecification.closes, '23:59');
  assert.equal(agency.address.streetAddress, '8 Alshams Building, Dr. Hanem Mohammed Hussein, Kafr Nassar');
  assert.ok(agency.sameAs.length > 0 && agency.sameAs.every((u: string) => u.startsWith('https://')));
  for (const key of ['aggregateRating', 'review', 'priceRange', 'geo', 'currenciesAccepted', 'foundingDate', 'slogan']) {
    assert.ok(!(key in agency), `${key} must not be published`);
  }
  assert.equal(doc['@graph'][1].inLanguage, 'de');
  assert.equal(doc['@graph'][1].potentialAction.target.urlTemplate, `${BASE}/de/search?q={search_term_string}`);
  // No description is better than a key name or an empty string.
  assert.ok(!('description' in (buildSiteJsonLd({ baseUrl: BASE, locale: 'en' }) as any)['@graph'][0]));
});

test('SITE-1 exists in every language and is not the English sentence on DE/IT/ES', () => {
  const en = get(locale('en', 'common'), SITE_DESCRIPTION_KEY);
  assert.ok(typeof en === 'string' && en.length > 40);
  assert.ok(!/premium/i.test(en));
  for (const lang of ['de', 'it', 'es']) {
    const text = get(locale(lang, 'common'), SITE_DESCRIPTION_KEY);
    assert.ok(typeof text === 'string' && text.length > 40, lang);
    assert.notEqual(text, en, lang);
  }
});

test('the tour graph words exist in every language', () => {
  for (const lang of LOCALES) {
    const tours = locale(lang, 'tours');
    for (const key of ['tourDetails.schemaItineraryName', 'tourDetails.day', 'tourDetails.pricing.soloTraveler',
      'tourDetails.pricing.pax2_4', 'tourDetails.pricing.pax5_8', 'tourDetails.pricing.pax9_16']) {
      assert.ok(typeof get(tours, key) === 'string' && get(tours, key), `${lang} ${key}`);
    }
  }
  assert.deepEqual(LOCALES.map((l) => get(locale(l, 'tours'), 'tourDetails.schemaItineraryName')),
    ['Tour Itinerary', 'Reiseverlauf', 'Itinerario', 'Itinerario']);
});

test('FAQ text in the schema reads like the page: links keep their words, punctuation stays attached', () => {
  assert.equal(faqPlainText('<p>Our guide to <a href="/en/x">planning a trip</a>.</p>'), 'Our guide to planning a trip.');
  assert.equal(faqPlainText('See [the guide](/en/planning-a-trip-to-egypt) first.'), 'See the guide first.');
  assert.equal(faqPlainText('<p>One.</p><p>Two &amp; three&nbsp;&#8211; four</p>'), 'One. Two & three – four');
  assert.equal(faqPlainText('<ul><li>A</li><li>B</li></ul>'), 'A B');
  assert.equal(faqPlainText(''), '');
});

test('the home page graph: WebPage points at the site nodes and at its FAQPage', () => {
  const faqs = [
    homeFaqContent({ question: { en: 'Q1?' }, answer: { en: '<p>A1 <a href="/en/x">link</a>.</p>' } }, 'en'),
    homeFaqContent({ question: { en: 'Q2?' }, answer: { en: '' } }, 'en'),
  ];
  const doc = buildHomePageJsonLd({
    baseUrl: BASE, pageUrl: `${BASE}/en`, locale: 'en', name: 'Title', description: 'Desc', faqs,
  }) as any;
  const [page, faq] = doc['@graph'];
  assert.equal(page['@type'], 'WebPage');
  assert.equal(page['@id'], `${BASE}/en#webpage`);
  assert.equal(page.url, `${BASE}/en`);
  assert.deepEqual([page.name, page.description, page.inLanguage], ['Title', 'Desc', 'en']);
  assert.deepEqual(page.isPartOf, { '@id': `${BASE}/#website` });
  assert.deepEqual(page.about, { '@id': `${BASE}/#travelagency` });
  assert.deepEqual(page.mainEntity, { '@id': `${BASE}/en#faq` });
  assert.equal(faq['@type'], 'FAQPage');
  assert.equal(faq.inLanguage, 'en');
  // The row without an answer is left out rather than published half empty.
  assert.deepEqual(faq.mainEntity, [
    { '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer', text: 'A1 link.' } },
  ]);
  // No FAQ rows: no FAQPage, and no pointer to one.
  const bare = buildHomePageJsonLd({ baseUrl: BASE, pageUrl: `${BASE}/en`, locale: 'en', name: 'T', description: 'D', faqs: [] }) as any;
  assert.equal(bare['@graph'].length, 1);
  assert.ok(!('mainEntity' in bare['@graph'][0]));
  // The company is never defined by a page block.
  assert.ok(!JSON.stringify(doc).includes('"TravelAgency"'));
});

test('listing FAQs are read strictly in the page language, and the FAQPage uses those rows', () => {
  const rows = [
    { question: { en: 'Q en', de: 'Q de' }, answer: { en: 'A en', de: 'A de' } },
    { question: { en: 'Only English' }, answer: { en: 'English answer' } },
  ];
  assert.deepEqual(listingFaqContent(rows, 'de'), [{ question: 'Q de', answer: 'A de' }]);
  const doc = buildFaqPageJsonLd({ id: `${BASE}/de/x#faq`, locale: 'de', faqs: listingFaqContent(rows, 'de') }) as any;
  assert.equal(doc['@context'], 'https://schema.org');
  assert.equal(doc['@id'], `${BASE}/de/x#faq`);
  assert.equal(doc.mainEntity.length, 1);
  assert.equal(buildFaqPageJsonLd({ id: 'x', locale: 'it', faqs: listingFaqContent(rows, 'it') }), null);
});

const tour = {
  heading: { de: 'Kairo und Nilkreuzfahrt: Rundreise durch Luxor' },
  seo: { metaTitle: { de: 'Kairo und Nilkreuzfahrt: Rundreise Luxor' } },
  tourAvailability: { de: '' },
  itinerary: { days: [{ day: 1, title: { de: 'Ankunft in Kairo' }, activities: [] }] },
  pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'S1', prices: { solo: { USD: 100 }, pax_2_4: { USD: 90 } } }] }],
};
const graph = (extra: Record<string, unknown> = {}) => (generateTourJsonLd({
  tour: { ...tour, ...extra },
  locale: 'de',
  canonicalUrl: `${BASE}/de/kairo`,
  siteUrl: BASE,
  name: 'Kairo und Nilkreuzfahrt: Rundreise durch Luxor',
  breadcrumbs: [{ label: 'Kairo und Nilkreuzfahrt: Rundreise durch Luxor' }],
  labels: {
    itineraryName: 'Reiseverlauf', day: 'Tag', tiers: { solo: '1 Pers.', pax_2_4: '2-4 Pers.' },
    plan: (name: string) => (name === 'AFFORDABLE' ? 'Komfort' : name),
  },
}) as any)['@graph'] as any[];

test('the tour graph no longer defines the company; it only points at it', () => {
  const nodes = graph();
  assert.ok(nodes.every((n) => n['@type'] !== 'TravelAgency'));
  const trip = nodes.find((n) => n['@type'] === 'TouristTrip');
  const product = nodes.find((n) => n['@type'] === 'Product');
  assert.deepEqual(trip.provider, { '@id': `${BASE}/#travelagency` });
  assert.deepEqual(product.brand, { '@id': `${BASE}/#travelagency` });
});

test('the tour graph uses the <h1> name, the page language and no invented availability', () => {
  const nodes = graph();
  const byType = (t: string) => nodes.find((n) => n['@type'] === t);
  const h1 = 'Kairo und Nilkreuzfahrt: Rundreise durch Luxor';
  assert.equal(byType('WebPage').name, h1);
  assert.equal(byType('Product').name, h1);
  assert.equal(byType('TouristTrip').name, h1);
  assert.equal(byType('BreadcrumbList').itemListElement.at(-1).name, h1);
  const itinerary = byType('ItemList');
  assert.equal(itinerary.name, 'Reiseverlauf');
  assert.equal(itinerary.itemListElement[0].name, 'Tag 1: Ankunft in Kairo');
  const offers = byType('AggregateOffer');
  // Plans are named by their display label, never the stored key.
  assert.deepEqual(offers.offers.map((o: any) => [o.name, o.category, o.price]), [
    ['Komfort — S1 — 1 Pers.', 'Komfort', 100],
    ['Komfort — S1 — 2-4 Pers.', 'Komfort', 90],
  ]);
  // Empty tourAvailability: no availability at all, not a default InStock.
  assert.ok(!('availability' in offers));
  assert.ok(offers.offers.every((o: any) => !('availability' in o)));
  // A stated availability is still published.
  const limited = graph({ tourAvailability: { de: 'Limited places' } }).find((n) => n['@type'] === 'AggregateOffer');
  assert.equal(limited.availability, 'https://schema.org/LimitedAvailability');
});

test('the tour route comments the offers and passes the h1 and the labels', () => {
  const lib = readFileSync(new URL('../src/lib/seo/tourJsonLd.ts', import.meta.url), 'utf8');
  assert.ok(lib.includes('// Prices come from tour.pricingPlans. Check they are real before the site is indexed.'));
  const route = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/[slug]/page.tsx', import.meta.url), 'utf8');
  const call = route.slice(route.indexOf('// ── 6. Tour')).match(/generateTourJsonLd\(\{[\s\S]*?\}\);/)![0];
  assert.match(call, /name: name as string,/);
  assert.match(call, /tTours\("tourDetails\.schemaItineraryName"\)/);
  assert.ok(!call.includes('organization'));
});

test('a BreadcrumbList takes an @id when the page gives one', () => {
  const html = renderToStaticMarkup(React.createElement(Breadcrumb, {
    locale: 'en', homeLabel: 'Home', items: [{ label: 'Egypt Tour Packages' }],
    jsonLdId: `${BASE}/en/egypt-tour-packages#breadcrumb`,
  }));
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
  assert.equal(schema['@id'], `${BASE}/en/egypt-tour-packages#breadcrumb`);
  const plain = renderToStaticMarkup(React.createElement(Breadcrumb, { locale: 'en', homeLabel: 'Home', items: [{ label: 'X' }] }));
  assert.ok(!plain.includes('"@id"'));
});
