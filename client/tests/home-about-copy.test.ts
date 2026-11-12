import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * The About section is on the homepage (where it holds the page H1) and on
 * /about. Both read their texts from one block, so rewriting the homepage copy
 * for search rewrote /about too. The homepage now has its own block,
 * `homeAbout`, and /about keeps `about`.
 */

const LOCALES = ['en', 'de', 'it', 'es'] as const;

const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const common = (locale: string) => JSON.parse(read(`i18n/locales/${locale}/common.json`));

// Button targets only the homepage block names (in its own language).
const HOME_ONLY_KEYS = ['customTripHref', 'exploreHref'];

test('every language has a complete homeAbout block, with the same keys as about', () => {
  for (const locale of LOCALES) {
    const { about, homeAbout } = common(locale);
    assert.ok(homeAbout, `${locale}: homeAbout block`);
    assert.deepEqual(
      Object.keys(homeAbout).filter((key) => !HOME_ONLY_KEYS.includes(key)).sort(),
      Object.keys(about).sort(),
      locale
    );
    for (const key of HOME_ONLY_KEYS) {
      assert.match(homeAbout[key], new RegExp(`^/${locale}/[a-z0-9-]+$`), `${locale}.homeAbout.${key}`);
    }
    for (const [key, value] of Object.entries(homeAbout)) {
      assert.equal(typeof value, 'string', `${locale}.homeAbout.${key}`);
      assert.ok((value as string).trim(), `${locale}.homeAbout.${key} is empty`);
    }
  }
});

test('the homepage reads homeAbout and /about reads about', () => {
  assert.match(read('app/(visitor)/[locale]/(home)/page.tsx'), /<AboutOne headingLevel="h1" copyKey="homeAbout" \/>/);
  assert.match(read('app/(visitor)/[locale]/(home)/about/page.tsx'), /<AboutOne \/>/);
});

test('AboutOne has no text key that bypasses the selected block', () => {
  const source = read('components/sections/AboutOne/AboutOne.tsx');
  assert.doesNotMatch(source, /t\(["'`](about|homeAbout)\./);
  // Every key it asks for exists in both blocks.
  const keys = [...source.matchAll(/copy\("([a-zA-Z0-9]+)"\)/g)].map((match) => match[1]);
  assert.ok(keys.length >= 14);
  for (const locale of LOCALES) {
    const { about, homeAbout } = common(locale);
    for (const key of keys) {
      assert.ok(key in about, `${locale}.about.${key}`);
      assert.ok(key in homeAbout, `${locale}.homeAbout.${key}`);
    }
  }
});
