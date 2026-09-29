import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node's built-in type stripping needs the explicit extension.
import { getLocaleCompleteness } from '../src/lib/localeCompleteness.ts';
// @ts-expect-error Node's built-in type stripping needs the explicit extension.
import { TOUR_REQUIRED_LOCALIZED_FIELDS } from '../src/lib/tours/requiredLocalizedFields.ts';

const allLanguages = {
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  es: 'Español',
};

const requiredCardDescription = {
  requiredLocalizedFields: [
    {
      path: 'cardDescription',
      label: 'Card Description (article listings)',
    },
  ],
} as const;

test('a required card description is missing when blank in every language', () => {
  const report = getLocaleCompleteness(
    {
      title: allLanguages,
      cardDescription: { en: '', de: '', it: '', es: '' },
    },
    requiredCardDescription
  );

  for (const info of Object.values(report)) {
    assert.equal(info.state, 'partial');
    assert.deepEqual(info.missing, ['Card Description (article listings)']);
  }
});

test('a required card description is missing when omitted from the API object', () => {
  const report = getLocaleCompleteness(
    { title: allLanguages },
    requiredCardDescription
  );

  for (const info of Object.values(report)) {
    assert.equal(info.state, 'partial');
    assert.deepEqual(info.missing, ['Card Description (article listings)']);
  }
});

test('only languages without a required card description are marked partial', () => {
  const report = getLocaleCompleteness(
    {
      title: allLanguages,
      cardDescription: { en: 'English card copy', de: '', it: '', es: '' },
    },
    requiredCardDescription
  );

  assert.equal(report.en.state, 'complete');
  assert.deepEqual(report.en.missing, []);

  for (const lang of ['de', 'it', 'es'] as const) {
    assert.equal(report[lang].state, 'partial');
    assert.deepEqual(report[lang].missing, ['Card Description (article listings)']);
  }
});

const englishOnly = (text: string) => ({ en: text, de: '', it: '', es: '' });

const tourWithEnglishImageText = {
  heading: allLanguages,
  images: [{ url: 'https://example.com/giza.webp', alt: englishOnly('Giza'), title: englishOnly('Giza') }],
};

test('image text decides the color by default', () => {
  const report = getLocaleCompleteness(tourWithEnglishImageText);

  assert.equal(report.de.state, 'partial');
  assert.deepEqual(report.de.missing, ['Images #1 alt', 'Images #1 title']);
});

test('imageTextAsSeo lists image text as SEO without affecting the color', () => {
  const report = getLocaleCompleteness(tourWithEnglishImageText, { imageTextAsSeo: true });

  assert.equal(report.de.state, 'complete');
  assert.deepEqual(report.de.missing, []);
  assert.deepEqual(report.de.missingSeo, ['Images #1 alt', 'Images #1 title']);
});

test('imageTextAsSeo leaves a title outside an image counting as content', () => {
  const report = getLocaleCompleteness(
    { heading: allLanguages, notes: [{ title: englishOnly('Dress code') }] },
    { imageTextAsSeo: true }
  );

  assert.equal(report.de.state, 'partial');
  assert.deepEqual(report.de.missing, ['Notes #1 title']);
});

test('a duration picked for all four languages does not make an untouched language look started', () => {
  const report = getLocaleCompleteness({
    heading: englishOnly('Abu Simbel Day Trip'),
    duration: { en: '12 Hours', de: '12 Stunden', it: '12 Ore', es: '12 Horas' },
  });

  assert.equal(report.en.state, 'complete');
  assert.equal(report.es.state, 'empty');
  assert.deepEqual(report.es.missing, ['Heading']);
});

test('a tour without a card description is partial in every language', () => {
  const report = getLocaleCompleteness(tourWithEnglishImageText, {
    requiredLocalizedFields: TOUR_REQUIRED_LOCALIZED_FIELDS,
    imageTextAsSeo: true,
  });

  for (const info of Object.values(report)) {
    assert.equal(info.state, 'partial');
    assert.deepEqual(info.missing, ['Card Description (tour listings)']);
  }
});
