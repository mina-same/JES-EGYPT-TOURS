import assert from 'node:assert/strict';
import test from 'node:test';
import testimonialsTwoData, { getTestimonialsForLocale } from '../src/data/testimonialsTwoData';

const LOCALES = ['en', 'de', 'it', 'es'] as const;
const source = testimonialsTwoData.testimonials;

test('the homepage gets every testimonial, in the data file order, in the page language', () => {
  for (const locale of LOCALES) {
    const quotes = getTestimonialsForLocale(locale);

    assert.deepEqual(quotes.map((quote) => quote.id), source.map((item) => item.id));
    assert.deepEqual(quotes.map((quote) => quote.name), source.map((item) => item.name[locale]));
    assert.deepEqual(quotes.map((quote) => quote.text), source.map((item) => item.text[locale]));
  }
});

test('only the requested language leaves the data file', () => {
  // The point of picking on the server: the carousel's props, and so the
  // page's payload, hold one language instead of four.
  for (const quote of getTestimonialsForLocale('de')) {
    assert.deepEqual(Object.keys(quote).sort(), ['id', 'name', 'text']);
    assert.equal(typeof quote.name, 'string');
    assert.equal(typeof quote.text, 'string');
  }

  const german = JSON.stringify(getTestimonialsForLocale('de'));
  assert.ok(!german.includes(source[0].text.en));
  assert.ok(!german.includes(source[0].text.it));
});

test('a regional tag uses its language, and an unknown one falls back to English', () => {
  assert.deepEqual(getTestimonialsForLocale('de-AT'), getTestimonialsForLocale('de'));
  assert.deepEqual(getTestimonialsForLocale('fr'), getTestimonialsForLocale('en'));
});
