import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { buildSitemapEntries } from '../src/lib/seo/sitemapEntries';
import type { SitemapData } from '../src/lib/api/sitemap';

const sourceRoot = new URL('../src/', import.meta.url);
const locales = ['en', 'de', 'it', 'es'];
const removedPath = /^\/(?:en|de|it|es)\/tours(?:\/all)?\/?$/;

test('removed directory and alias have no files, navigation writers or locale exceptions', () => {
  assert.equal(existsSync(new URL('app/(visitor)/[locale]/(home)/tours', sourceRoot)), false);
  const references: string[] = [];
  function inspect(directory: URL) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) inspect(file);
      else if (/\.[jt]sx?$/.test(entry.name)) {
        const content = readFileSync(file, 'utf8');
        // Exact visitor route literals/builders only; API paths and lib/tours are unrelated.
        if (/["'`](?:\/(?:en|de|it|es|\$\{[^}]+\}))?\/tours(?:\/all)?["'`?#]/.test(content)
          || /\b(?:link|href|url|path):\s*["'`]tours(?:\/all)?["'`]/.test(content)) references.push(file.pathname);
      }
    }
  }
  inspect(sourceRoot);
  assert.deepEqual(references, []);
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(new URL(`i18n/locales/${locale}/tours.json`, sourceRoot), 'utf8'));
    for (const key of ['pageMetaTitle', 'pageMetaDescription', 'categoriesTitle', 'categoriesSubtitle', 'categoriesTagline', 'categoriesHeading']) assert.equal(key in messages, false);
    assert.ok(messages.filters, 'Real Tour filter translations remain');
  }
});

test('sitemap retains real Tour hierarchy while excluding removed visitor routes', () => {
  const localized = (slug: string) => Object.fromEntries(locales.map(locale => [locale, slug]));
  const data: SitemapData = {
    tours: [{ slug: localized('sample-tour') }],
    tourCategories: [{ slug: localized('egypt-tour-packages') }],
    tourSubcategories: [{ slug: localized('aswan-tours') }],
    blogCategories: [], blogSubcategories: [], blogs: [], destinations: [], authors: [], faqLocales: [],
  };
  const paths = buildSitemapEntries(data, 'https://www.example.test').map(entry => new URL(entry.url).pathname);
  assert.ok(paths.every(path => !removedPath.test(path)));
  for (const locale of locales) {
    for (const slug of ['egypt-tour-packages', 'aswan-tours', 'sample-tour']) assert.ok(paths.includes(`/${locale}/${slug}`));
  }
});

const origin = process.env.HUB_REMOVAL_TEST_ORIGIN;
test('HTTP: removed routes return 404 and active localized listings keep clean navigation', { skip: !origin }, async () => {
  assert.match(origin!, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/, 'Verification is local only');
  for (const locale of locales) {
    for (const suffix of ['tours', 'tours/all']) {
      const response = await fetch(`${origin}/${locale}/${suffix}`, { redirect: 'manual' });
      assert.equal(response.status, 404, `${locale}/${suffix}`);
    }
  }
  const paths = ['/en', '/en/egypt-day-tours', '/en/egypt-tour-packages', '/de/aegypten-rundreise', '/it/viaggi-egitto', '/es/viajes-a-egipto', '/en/aswan-tours', '/en/cairo-day-tours', '/en/egypt-classic-tours', '/en/egypt-nile-cruises', '/en/luxury-egypt-tours', '/en/abu-simbel-day-trip-from-aswan', '/en/search', '/en/egypt-tour-packages?destinations=aswan', '/en/egypt-tour-packages?tourStyles=luxury', '/en/egypt-tour-packages?duration=7-9', '/en/egypt-tour-packages?sort=price-asc', '/en/egypt-tour-packages?minPrice=50&maxPrice=200'];
  for (const path of paths) {
    const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    const html = await response.text();
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      assert.equal(removedPath.test(new URL(match[1], origin).pathname), false, `${path}: ${match[1]}`);
    }
    assert.match(html, /noindex, nofollow/, 'Pre-launch protection remains');
  }
  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) assert.equal(removedPath.test(new URL(match[1]).pathname), false);
  for (const slug of ['egypt-tour-packages', 'aswan-tours', 'abu-simbel-day-trip-from-aswan']) assert.ok(sitemap.includes(`/en/${slug}</loc>`));
});
