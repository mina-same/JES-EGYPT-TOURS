import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node's built-in type stripping needs the explicit extension.
import { getLocaleCompleteness } from '../src/lib/localeCompleteness.ts';

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
