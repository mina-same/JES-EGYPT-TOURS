import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildTourBreadcrumbs } from '../src/lib/tour/breadcrumbs';
import { generateTourJsonLd } from '../src/lib/seo/tourJsonLd';
import { serializeJsonLd } from '../src/lib/seo/serializeJsonLd';

const breadcrumbUrl = new URL('../src/components/common/Breadcrumb/Breadcrumb.tsx', import.meta.url);
const breadcrumbRequire = createRequire(breadcrumbUrl);
const breadcrumbCompiled = ts.transpileModule(readFileSync(breadcrumbUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: fileURLToPath(breadcrumbUrl),
}).outputText;
const breadcrumbModule = { exports: {} as { default: React.ComponentType<any> } };
const overrides: Record<string, unknown> = {
  'next/link': {
    __esModule: true,
    default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
  },
  '@/lib/url': { getSeoBaseUrl: () => 'https://example.com' },
  '@/lib/seo/serializeJsonLd': { serializeJsonLd },
};
new Function('require', 'module', 'exports', breadcrumbCompiled)(
  (id: string) => overrides[id] ?? breadcrumbRequire(id),
  breadcrumbModule, breadcrumbModule.exports,
);
const Breadcrumb = breadcrumbModule.exports.default;

const category = {
  name: { en: 'Egypt Tour Packages – Custom Trips, Nile Cruises & Ancient Wonders', de: 'Ägypten Rundreise – Individuelle Reisen' },
  slug: { en: 'egypt-tour-packages', de: 'aegypten-rundreise' },
};
const subcategory = {
  name: { en: 'Egypt Classic Tours — Private Trips to Cairo, Luxor, Aswan & Nile Cruises', de: 'Klassische Ägypten Rundreise' },
  shortName: { en: 'Classic Tours' },
  slug: { en: 'egypt-classic-tours', de: 'aegypten-klassische-rundreisen' },
  category,
};

test('the tour trail is category, sub-category, then the tour, with short labels and locale links', () => {
  assert.deepEqual(buildTourBreadcrumbs({ subcategory }, 'en', '5-Day Cairo Tour'), [
    { label: 'Egypt Tour Packages', href: '/en/egypt-tour-packages' },
    { label: 'Classic Tours', href: '/en/egypt-classic-tours' },
    { label: '5-Day Cairo Tour' },
  ]);
  assert.deepEqual(buildTourBreadcrumbs({ subcategory }, 'de', 'Kairo-Reise'), [
    { label: 'Ägypten Rundreise', href: '/de/aegypten-rundreise' },
    { label: 'Klassische Ägypten Rundreise', href: '/de/aegypten-klassische-rundreisen' },
    { label: 'Kairo-Reise' },
  ]);
});

test('a parent with no slug in this language is left out instead of linking elsewhere', () => {
  assert.deepEqual(buildTourBreadcrumbs({ subcategory }, 'it', 'Tour'), [{ label: 'Tour' }]);
});

test('a switched-off parent is left out, each parent on its own', () => {
  const offCategory = { ...subcategory, category: { ...category, isActive: false } };
  assert.deepEqual(buildTourBreadcrumbs({ subcategory: offCategory }, 'en', 'Tour'), [
    { label: 'Classic Tours', href: '/en/egypt-classic-tours' },
    { label: 'Tour' },
  ]);
  const offSubcategory = { ...subcategory, isActive: false };
  assert.deepEqual(buildTourBreadcrumbs({ subcategory: offSubcategory }, 'en', 'Tour'), [
    { label: 'Egypt Tour Packages', href: '/en/egypt-tour-packages' },
    { label: 'Tour' },
  ]);
  // An explicit `true`, or no field at all (older cached responses), stays linked.
  const on = { ...subcategory, isActive: true, category: { ...category, isActive: true } };
  assert.equal(buildTourBreadcrumbs({ subcategory: on }, 'en', 'Tour').length, 3);
});

test('an unpopulated or missing sub-category gives a trail of just the tour', () => {
  assert.deepEqual(buildTourBreadcrumbs({ subcategory: '64b000000000000000000001' }, 'en', 'Tour'), [{ label: 'Tour' }]);
  assert.deepEqual(buildTourBreadcrumbs({ subcategory: null }, 'en', 'Tour'), [{ label: 'Tour' }]);
  assert.deepEqual(buildTourBreadcrumbs({}, 'en', 'Tour'), [{ label: 'Tour' }]);
});

function tourGraph(homeLabel?: string) {
  const tour = { slug: { de: 'kairo-reise' }, heading: { de: 'Kairo-Reise' }, subcategory };
  return generateTourJsonLd({
    tour,
    locale: 'de',
    canonicalUrl: 'https://example.com/de/kairo-reise',
    siteUrl: 'https://example.com',
    organization: { name: 'Test', url: 'https://example.com' },
    breadcrumbs: buildTourBreadcrumbs(tour, 'de', 'Kairo-Reise'),
    ...(homeLabel ? { homeLabel } : {}),
  }) as { '@graph': any[] };
}

test('the tour schema names Home in the page language and holds exactly one BreadcrumbList', () => {
  const lists = tourGraph('Startseite')['@graph'].filter((node) => node['@type'] === 'BreadcrumbList');
  assert.equal(lists.length, 1);
  assert.deepEqual(lists[0].itemListElement.map((entry: any) => [entry.name, entry.item]), [
    ['Startseite', 'https://example.com/de'],
    ['Ägypten Rundreise', 'https://example.com/de/aegypten-rundreise'],
    ['Klassische Ägypten Rundreise', 'https://example.com/de/aegypten-klassische-rundreisen'],
    ['Kairo-Reise', undefined],
  ]);
  assert.equal(tourGraph()['@graph'].find((node) => node['@type'] === 'BreadcrumbList').itemListElement[0].name, 'Home');
});

test('the tour route publishes the trail once, from the @graph, with the localized Home', () => {
  const source = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/[slug]/page.tsx', import.meta.url), 'utf8');
  const tourBlock = source.slice(source.indexOf('// ── 6. Tour'));
  assert.match(tourBlock, /buildTourBreadcrumbs\(tour, locale, name as string\)/);
  assert.match(tourBlock, /homeLabel: tCommon\("home"\)/);
  assert.match(tourBlock, /<PageHeader[\s\S]*?breadcrumbJsonLd=\{false\}[\s\S]*?\/>/);
});

test('only the last unlinked crumb is marked as the current page, in both skins', () => {
  const items = [
    { label: 'Authors' },
    { label: 'Category', href: '/en/category' },
    { label: 'Current page' },
  ];
  for (const variant of ['classic', 'pill']) {
    const html = renderToStaticMarkup(React.createElement(Breadcrumb, {
      locale: 'en', homeLabel: 'Home', items, variant, jsonLd: false,
    }));
    assert.equal(html.match(/aria-current="page"/g)?.length, 1, variant);
    assert.match(html, /<span[^>]*aria-current="page"[^>]*>Current page<\/span>/, variant);
    assert.doesNotMatch(html, /aria-current="page"[^>]*>Authors</, variant);
    assert.ok(!html.includes('application/ld+json'), `${variant}: jsonLd={false} emits no schema`);
  }
  // A trail whose last item is a link has no current-page crumb to mark.
  const linked = renderToStaticMarkup(React.createElement(Breadcrumb, {
    locale: 'en', homeLabel: 'Home', items: [{ label: 'Category', href: '/en/category' }], jsonLd: false,
  }));
  assert.ok(!linked.includes('aria-current'));
});

test('the header trail still publishes its own BreadcrumbList by default', () => {
  const html = renderToStaticMarkup(React.createElement(Breadcrumb, {
    locale: 'de', homeLabel: 'Startseite', items: [{ label: 'Kontakt' }],
  }));
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.equal(schema.itemListElement[0].name, 'Startseite');
});
