import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTourDestinations, tourDestinationIds } from '../src/lib/tours/destinations';
import { mapApiTourToCard } from '../src/lib/tours/cardViewModel';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as destinationsModule from '../src/lib/tours/destinations';
import * as richText from '../src/lib/richTextSections';

function loadSource(relative: string, overrides: Record<string, unknown> = {}) {
  const url = new URL(relative, import.meta.url);
  const require = createRequire(url);
  const compiledModule = { exports: {} as any };
  const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
    fileName: url.pathname,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(
    (name: string) => overrides[name] ?? require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { generateTourJsonLd } = loadSource('../src/lib/seo/tourJsonLd.ts', {
  '../tours/catalog': loadSource('../src/lib/tours/catalog.ts'),
  '../tours/destinations': destinationsModule,
  '@/lib/richTextSections': richText,
});

function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

test('shared cards and TourInfoBar display full destination lists and hide empty location rows', () => {
  const translations = { useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }) };
  const Card = loadSource('../src/components/common/TourCard/TourCard.tsx', {
    'next/image': () => null, 'next/link': () => null, 'react-i18next': translations,
    '@/contexts/CurrencyContext': { useCurrency: () => ({ formatPrice: () => '$100', getPriceValue: () => 100 }) },
    '@/lib/seo/tourJsonLd': { stripHtml: (value: string) => value || '' },
    './OfferPriceFooter': () => null, './TourCard.module.css': {},
  }).default;
  const InfoBar = loadSource('../src/components/sections/TourListingDetailsOne/components/TourInfoBar.tsx', {
    'react-i18next': translations, './PickupIcon': { PickupIcon: () => null }, './GuideIcon': { GuideIcon: () => null },
  }).TourInfoBar;
  for (const destinations of [[cairo, luxor, aswan], []]) {
    const location = formatTourDestinations(destinations, 'de');
    const item = mapApiTourToCard({ slug: 'tour', destinations }, 'de', { duration: '', location: '' });
    for (const options of [{}, { linkMeta: true }, { variant: 'special-offer', offerLabels: {} }, { onRemove() {} }]) {
      const rendered = nodes(Card({ item, ...options }));
      assert.equal(rendered.filter(n => n.type === 'i' && n.props.className === 'icon-location').length, destinations.length ? 1 : 0);
      if (destinations.length) assert.ok(rendered.some(n => n.type === 'span' && n.props.children === location));
    }
    const bar = nodes(InfoBar({ location, pickupAndDropOff: 'Hotel pickup', activitiesType: '', activateDay: '', availability: '' }));
    assert.equal(bar.filter(n => n.type === 'i' && n.props.className === 'icon-location').length, destinations.length ? 1 : 0);
    assert.ok(bar.some(n => n.props?.title === 'Hotel pickup'));
    if (destinations.length) assert.ok(bar.some(n => n.props?.title === location));
  }
});

const cairo = { _id: '000000000000000000000001', name: { en: 'Cairo', de: 'Kairo', it: 'Il Cairo', es: 'El Cairo' } };
const luxor = { _id: '000000000000000000000002', name: { en: 'Luxor', de: 'Luxor', it: 'Luxor', es: 'Luxor' } };
const aswan = { _id: '000000000000000000000003', name: { en: 'Aswan', de: 'Assuan', it: 'Assuan', es: 'Asuán' } };

for (const locale of ['en', 'de', 'it', 'es'] as const) {
  test(`destination display and structured data use ${locale} labels`, () => {
    const records = [cairo, luxor, aswan];
    const names = records.map(d => d.name[locale]);
    assert.equal(formatTourDestinations([cairo], locale), cairo.name[locale]);
    const expected = new Intl.ListFormat(locale, { type: 'conjunction', style: 'short' }).format(names);
    assert.equal(formatTourDestinations(records, locale), expected);
    const tour = { _id: 'tour', heading: { en: 'A tour' }, slug: 'a-tour', destinations: records };
    const card = mapApiTourToCard(tour, locale, { duration: '', location: 'must not appear' });
    assert.equal(card?.meta.find(m => m.icon === 'icon-location')?.title, expected);
    const graph = generateTourJsonLd({ tour, locale, canonicalUrl: 'https://example.com/tour', siteUrl: 'https://example.com', organization: { name: 'Test', url: 'https://example.com' }, breadcrumbs: [] });
    const trip = graph['@graph'].find((node: any) => node['@type'] === 'TouristTrip');
    assert.deepEqual(trip.touristDestination, names.map(name => ({ '@type': 'TouristDestination', name })));
  });
}

test('short labels use the requested language, then localized full names with the existing fallback', () => {
  const giza = { name: { en: 'Explore Giza', de: 'Gizeh entdecken' }, shortName: { en: 'Giza', de: '' } };
  assert.equal(formatTourDestinations([giza], 'en'), 'Giza');
  assert.equal(formatTourDestinations([giza], 'de'), 'Gizeh entdecken');
  assert.equal(formatTourDestinations([giza], 'es'), 'Explore Giza');
  assert.equal(formatTourDestinations([{ name: 'Gizeh entdecken', shortName: { de: 'Gizeh' } }], 'de'), 'Gizeh');
});

test('empty, missing and unresolved destinations never expose IDs or invented locations', () => {
  for (const destinations of [[], undefined, null, [cairo._id], [null, {}, { _id: cairo._id }]]) {
    assert.equal(formatTourDestinations(destinations), '');
    const tour = { slug: 'tour', heading: { en: 'Tour' }, destinations };
    assert.equal(mapApiTourToCard(tour, 'en', { duration: '', location: 'Egypt' })?.meta[0].title, '');
    const graph = generateTourJsonLd({ tour, locale: 'en', canonicalUrl: 'https://example.com/tour', siteUrl: 'https://example.com', organization: { name: 'Test', url: 'https://example.com' }, breadcrumbs: [] });
    assert.ok(graph['@graph'].every((node: any) => !('touristDestination' in node)));
  }
});

test('Admin reloads populated records and preserves ID-only save data, including clearing all choices', () => {
  assert.deepEqual(tourDestinationIds([cairo, luxor, cairo._id]), [cairo._id, luxor._id]);
  assert.deepEqual(tourDestinationIds([aswan._id]), [aswan._id]);
  assert.deepEqual(tourDestinationIds([]), []);
  assert.deepEqual(tourDestinationIds(undefined), []);
  assert.deepEqual(tourDestinationIds([{ id: cairo._id }]), [cairo._id]);
});

test('new forms and restored drafts omit removed fields while retaining editable content', () => {
  const { createInitialTourFormData } = loadSource('../src/hooks/useTourForm.ts', {
    '@/lib/api/tour': {}, '@/lib/api/upload': {}, '@/hooks/use-toast': {},
    '@/lib/tours/catalog': loadSource('../src/lib/tours/catalog.ts'),
  });
  const draft = {
    tourLocation: { en: 'Old free text' }, destinations: [cairo._id, luxor._id],
    durationHours: 8, recommendedOrder: 7, tourType: 'day-tour', tourKind: 'DAY_TOUR',
    pricingPlans: [{ accommodations: [{ location: { en: 'Hotel location' } }] }],
  };
  const restored = createInitialTourFormData(draft);
  assert.ok(!('tourLocation' in restored));
  assert.deepEqual(restored.destinations, draft.destinations);
  assert.deepEqual(restored.pricingPlans, draft.pricingPlans);
  assert.equal(restored.durationHours, 8);
  assert.equal(restored.recommendedOrder, 7);
  assert.equal(restored.tourKind, 'DAY_TOUR');
  assert.ok(!('tourLocation' in createInitialTourFormData()));
  assert.deepEqual(createInitialTourFormData().destinations, []);
});
