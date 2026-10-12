import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const appRoot = new URL('../src/app/', import.meta.url);

function sourceFiles(dir: URL): URL[] {
  return readdirSync(dir).flatMap((name) => {
    const url = new URL(name, dir);
    if (statSync(url).isDirectory()) return sourceFiles(new URL(`${name}/`, dir));
    return /\.tsx$/.test(name) ? [url] : [];
  });
}

const pageHeaders = sourceFiles(appRoot).flatMap((file) =>
  (readFileSync(file, 'utf8').match(/<PageHeader\b[\s\S]*?\/>/g) ?? []).map((use) => ({ file: file.pathname, use })));

const locales = ['en', 'de', 'it', 'es'];
const pageNames = Object.fromEntries(locales.map((locale) =>
  [locale, JSON.parse(read(`../src/i18n/locales/${locale}/common.json`)).pageNames as Record<string, string>]));

test('no page header shows a trail of Home alone: each one names its page', () => {
  // 16 since the /blogs page went: the scan must keep finding them, or it proves nothing.
  assert.ok(pageHeaders.length >= 16, `found ${pageHeaders.length} headers`);
  for (const { file, use } of pageHeaders) {
    assert.match(use, /\b(breadcrumbs|breadcrumbLabelKey)=/, `${file}\n${use}`);
  }
});

test('every page-name key a header uses exists, translated, in all four languages', () => {
  const keys = new Set(pageHeaders.flatMap(({ use }) => [...use.matchAll(/breadcrumbLabelKey="([^"]+)"/g)].map((m) => m[1])));
  assert.deepEqual([...keys].sort(), [
    'pageNames.about', 'pageNames.faq', 'pageNames.notFound', 'pageNames.paymentPolicy',
    'pageNames.search', 'pageNames.signIn', 'pageNames.tailorMade', 'pageNames.wishlist',
  ]);
  for (const locale of locales) {
    assert.deepEqual(Object.keys(pageNames[locale]).sort(), Object.keys(pageNames.en).sort(), locale);
    for (const key of keys) {
      const value = pageNames[locale][key.replace('pageNames.', '')];
      assert.ok(typeof value === 'string' && value.trim(), `${locale} ${key}`);
    }
  }
  // Translated, not copied: the German names are not the English ones.
  assert.equal(pageNames.de.about, 'Über uns');
  assert.equal(pageNames.de.paymentPolicy, 'Zahlungs- und Stornierungsbedingungen');
  assert.equal(pageNames.es.notFound, 'Página no encontrada');
});

test('the header translates the key itself, so pages without a locale still get the reader\'s language', () => {
  const header = read('../src/components/sections/PageHeader/PageHeader.tsx');
  assert.match(header, /const trail = breadcrumbs \?\? \(breadcrumbLabelKey \? \[\{ label: t\(breadcrumbLabelKey\) \}\] : undefined\);/);
  assert.match(header, /items=\{trail\}/);
  // The 404 page receives no locale; it relies on exactly this.
  assert.match(read('../src/app/(visitor)/[locale]/(home)/NotFoundView.tsx'), /breadcrumbLabelKey="pageNames\.notFound"/);
});

test('the FAQ and payment-policy trails are published by the header, in the page language', () => {
  const faq = read('../src/app/(visitor)/[locale]/(home)/faq/page.tsx');
  assert.ok(!faq.includes('FaqBreadcrumbStructuredData') && !faq.includes('breadcrumbJsonLd={false}'));
  assert.ok(!read('../src/components/sections/FaqSection/FaqStructuredData.tsx').includes('BreadcrumbList'));

  const policy = read('../src/app/(visitor)/[locale]/(home)/payment-cancellation-policy/page.tsx');
  assert.ok(!policy.includes('BreadcrumbList'), 'no hand-written list with an English "Home"');
  assert.ok(!policy.includes('breadcrumbJsonLd={false}'));
  assert.match(policy, /breadcrumbLabelKey="pageNames\.paymentPolicy"/);
});

test('onLight changes only the colours of the capsule', () => {
  const items = [{ label: 'Step' }, { label: 'Travel Trade' }];
  const dark = renderToStaticMarkup(React.createElement(Breadcrumb, { locale: 'en', homeLabel: 'Home', items, jsonLd: false }));
  const light = renderToStaticMarkup(React.createElement(Breadcrumb, { locale: 'en', homeLabel: 'Home', items, jsonLd: false, onLight: true }));

  assert.match(dark, /bg-white\/10/);
  assert.ok(!/text-white|bg-white|border-white/.test(light), 'nothing white on a white hero');
  assert.match(light, /<nav[^>]*class="[^"]*bg-\[#0f2433\]\/\[0\.04\] border-\[#0f2433\]\/\[0\.12\]/);
  assert.match(light, /<span[^>]*class="[^"]*font-bold text-\[#7a5e24\][^"]*"[^>]*aria-current="page"/);
  assert.match(light, /<span[^>]*class="[^"]*text-\[#4f5b63\][^"]*"[^>]*>Step<\/span>/);

  // Same structure and layout classes, whatever the colours.
  const shape = (html: string) => html
    .replace(/(text|bg|border)-(white|\[#[0-9a-f]+\])(\/[^\s"]+)?/g, '')
    .replace(/hover:\S+/g, '')
    .replace(/\s+/g, ' ');
  assert.equal(shape(light), shape(dark));
});

test('the travel-trade hero draws the shared capsule, and its WebPage keeps its BreadcrumbList', () => {
  const content = read('../src/app/(visitor)/[locale]/(home)/travel-trade/_components/TravelTradeContent.tsx');
  const crumb = content.match(/<Breadcrumb[\s\S]*?\/>/)![0];
  assert.match(crumb, /\bonLight\b/);
  assert.match(crumb, /jsonLd=\{false\}/);
  assert.match(crumb, /items=\{\[\{ label: copy\.breadcrumb\.current \}\]\}/);
  assert.ok(!/<ol>/.test(content), 'no hand-written list');

  const page = read('../src/app/(visitor)/[locale]/(home)/travel-trade/page.tsx');
  assert.match(page, /"@type": "BreadcrumbList",\r?\n\s*"@id": `\$\{pageUrl\}#breadcrumb`/);
  assert.match(page, /breadcrumb: \{\r?\n\s*"@id": `\$\{pageUrl\}#breadcrumb`/);

  const css = read('../src/app/(visitor)/[locale]/(home)/travel-trade/TravelTradePage.module.css');
  assert.ok(!/\.breadcrumb (ol|li|a)\b/.test(css), 'old list rules would repaint the capsule');
});
