import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALL_PLAN_NAMES, PACKAGE_PLAN_NAMES } from '../src/lib/tours/tourKind';
import { PLAN_LABEL_KEYS, planLabelKey } from '../src/lib/tours/planLabels';
import { planLabelEn } from '../src/lib/tours/planLabelsEn';

const LOCALES = ['en', 'de', 'it', 'es'] as const;
const tours = (lang: string) =>
  JSON.parse(readFileSync(new URL(`../src/i18n/locales/${lang}/tours.json`, import.meta.url), 'utf8'));
const read = (obj: any, key: string) => key.split('.').reduce((v, k) => v?.[k], obj);
const source = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8');

test('the stored key stays AFFORDABLE: the rename is display only', () => {
  assert.ok((PACKAGE_PLAN_NAMES as readonly string[]).includes('AFFORDABLE'));
  assert.ok(!(ALL_PLAN_NAMES as readonly string[]).includes('Comfort'));
});

test('every stored plan has a label in every language', () => {
  assert.deepEqual(Object.keys(PLAN_LABEL_KEYS).sort(), [...ALL_PLAN_NAMES].sort());
  for (const lang of LOCALES) {
    for (const plan of ALL_PLAN_NAMES) {
      const label = read(tours(lang), planLabelKey(plan));
      assert.ok(typeof label === 'string' && label.trim(), `${lang} ${plan}`);
    }
  }
});

test('AFFORDABLE reads Comfort / Komfort / Comfort / Confort; the other plans keep their labels', () => {
  assert.deepEqual(LOCALES.map((l) => read(tours(l), planLabelKey('AFFORDABLE'))), ['Comfort', 'Komfort', 'Comfort', 'Confort']);
  assert.deepEqual(LOCALES.map((l) => read(tours(l), planLabelKey('GOLD (5 STAR STANDARD)'))),
    ['Gold (5 Star Standard)', 'Gold (5 Sterne Standard)', 'Gold (Standard 5 Stelle)', 'Oro (Estándar 5 Estrellas)']);
  assert.deepEqual(LOCALES.map((l) => read(tours(l), planLabelKey('DIAMOND (5 STAR LUXURY)'))),
    ['Diamond (5 Star Luxury)', 'Diamant (5 Sterne Luxus)', 'Diamond (Lusso 5 Stelle)', 'Diamante (Lujo 5 Estrellas)']);
});

test('Admin shows the English label, and the stored name only when there is no label', () => {
  assert.equal(planLabelEn('AFFORDABLE'), 'Comfort');
  assert.equal(planLabelEn('GOLD (5 STAR STANDARD)'), 'Gold (5 Star Standard)');
  assert.equal(planLabelEn('DIAMOND (5 STAR LUXURY)'), 'Diamond (5 Star Luxury)');
  assert.equal(planLabelEn('TOUR PRICES'), 'Tour Prices');
  assert.equal(planLabelEn('SOMETHING OLD'), 'SOMETHING OLD');
  assert.equal(planLabelEn(''), '');
  assert.equal(planLabelEn(undefined), '');
});

test('visitor pages name plans through the shared map, never the stored key', () => {
  const pricing = source('components/sections/TourListingDetailsOne/components/PricingPlans.tsx');
  const form = source('components/sections/TourListingDetailsOne/components/BookingForm.tsx');
  const brochure = source('components/sections/TourListingDetailsOne/components/TourBrochure.tsx');
  assert.equal(pricing.match(/t\(planLabelKey\(plan\.planName\), plan\.planName\)/g)?.length, 2);
  assert.match(form, /t\(planLabelKey\(planName\), planName\)/);
  assert.match(brochure, /t\(planLabelKey\(plan\.planName\), plan\.planName\)/);
  for (const text of [pricing, form, brochure]) assert.doesNotMatch(text, /tourDetails\.pricing\.\$\{/);
  // Visitor code must not bundle the English tours.json that Admin reads.
  for (const text of [pricing, form, brochure]) assert.doesNotMatch(text, /planLabelsEn/);
  const route = source('app/(visitor)/[locale]/(home)/[slug]/page.tsx');
  assert.match(route, /plan: \(planName\) => \{[\s\S]*?planLabelKey\(planName\)/);
});

test('every Admin screen that shows a plan name shows its label', () => {
  const screens: Array<[string, RegExp]> = [
    ['components/admin/PricingPlansManager.tsx', /planLabelEn\(option\)/],
    ['components/admin/AccommodationsEditor.tsx', /planLabelEn\(p\.planName\)/],
    ['components/admin/tour/TourKindSelector.tsx', /planLabelEn\(name\)/],
    ['app/(admin)/admin/tour/tour/[id]/view/page.tsx', /planLabelEn\(p\.planName\)/],
    ['app/(admin)/admin/tour/booking/page.tsx', /planLabelEn\(selectedBooking\.selectedPackage\)/],
    ['lib/tours/priceCompleteness.ts', /planLabelEn\(plan\?\.planName\?\.trim\(\)\)/],
  ];
  for (const [file, pattern] of screens) assert.match(source(file), pattern, file);
  const manager = source('components/admin/PricingPlansManager.tsx');
  assert.match(manager, /planLabelEn\(plan\.planName\) \|\| 'Untitled plan'/);
  assert.match(manager, /planLabelEn\(plan\.planName \|\| PLAN_OPTIONS\[0\]\)/);
  // The selector still stores the key.
  assert.match(manager, /<SelectItem key=\{option\} value=\{option\}>/);
});
