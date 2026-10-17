import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * The tailor-made request form: its texts in four languages, the phone field
 * with calling codes, the full country list, and the values it sends.
 *
 * Before: the budget fields showed the raw keys "form.placeholders.minBudget"
 * and "form.placeholders.maxBudget" (no language file had them), the phone
 * was a bare text box, the country list had eight names and "Other", and the
 * occasions, interests and "No Limit" were English on every page.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const client = read('../src/app/(visitor)/[locale]/(home)/tailor-made/TailorMadeClient.tsx');
// Block comments first (a JSX-comment pattern would start at the `{` of an
// interface followed by a doc comment), then the empty `{}` JSX comments
// leave behind, then line comments.
const code = client.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '').replace(/^[ \t]*\/\/.*$/gm, '');
const LOCALES = ['en', 'de', 'it', 'es'] as const;
const messages = Object.fromEntries(
  LOCALES.map((locale) => [locale, JSON.parse(read(`../src/i18n/locales/${locale}/tailorMade.json`))])
) as Record<(typeof LOCALES)[number], Record<string, unknown>>;
const lookup = (tree: Record<string, unknown>, key: string): unknown =>
  key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), tree);

/** `{ value: 'Honeymoon', key: 'honeymoon' }` entries of a named option list. */
const optionList = (name: string) => {
  const block = code.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  assert.ok(block, name);
  return [...block[1].matchAll(/\{ value: '([^']+)', key: '([^']+)' \}/g)].map(([, value, key]) => ({ value, key }));
};

test('every fixed translation key the form uses exists, as text, in all four languages', () => {
  const keys = [...new Set([...code.matchAll(/\bt\(\s*'([^'$]+)'/g)].map((match) => match[1]))];
  assert.ok(keys.length > 40, `found ${keys.length} keys`);
  for (const locale of LOCALES) {
    const missing = keys.filter((key) => typeof lookup(messages[locale], key) !== 'string' || !(lookup(messages[locale], key) as string).trim());
    assert.deepEqual(missing, [], locale);
  }
  // The two keys that showed raw are not used any more.
  assert.equal(/form\.placeholders\.(minBudget|maxBudget)/.test(code), false);
});

test('occasions and interests are translated, and send the values the API accepts', () => {
  const occasions = optionList('SPECIAL_OCCASION_OPTIONS');
  const interests = optionList('INTEREST_OPTIONS');
  assert.equal(occasions.length, 6);
  assert.equal(interests.length, 8);
  for (const locale of LOCALES) {
    for (const { key } of occasions) assert.equal(typeof lookup(messages[locale], `form.options.specialOccasions.${key}`), 'string', `${locale} ${key}`);
    for (const { key } of interests) assert.equal(typeof lookup(messages[locale], `form.options.interests.${key}`), 'string', `${locale} ${key}`);
    assert.equal(typeof lookup(messages[locale], 'form.options.noLimit'), 'string', `${locale} noLimit`);
  }
  // The server validates the occasion against an English list; the form must send exactly those.
  const server = read('../../server/src/middleware/validation.ts');
  const serverList = server.match(/body\('specialOccasion'\)[\s\S]*?\.isIn\(\[([\s\S]*?)\]\)/);
  assert.ok(serverList);
  const accepted = [...serverList[1].matchAll(/'([^']*)'/g)].map((match) => match[1]).filter(Boolean);
  assert.deepEqual(occasions.map((o) => o.value), accepted);
  assert.match(code, /<option key=\{o\.value\} value=\{o\.value\}>/);
  assert.match(code, /\{b === 'No Limit' \? t\('form\.options\.noLimit'\) : b\}/);
});

test('the country list is every country with a phone plan, popular ones first, each once; the English name is sent', () => {
  assert.match(code, /const RESIDENCE_COUNTRIES = getCountries\(\);/);
  assert.match(code, /const POPULAR_COUNTRIES: Country\[\] = \['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES'\];/);
  assert.equal(/'Other'/.test(code), false, 'no catch-all "Other"');
  // One flat list, no group headings, the main markets left out of the alphabetical part.
  assert.equal(/<optgroup/.test(code), false);
  assert.match(code, /const rest = RESIDENCE_COUNTRIES\.filter\(\(code\) => !popular\.has\(code\)\)/);
  assert.match(code, /return \[\.\.\.POPULAR_COUNTRIES\.map\(\(code\) => \(\{ code, name: countryName\(code\) \}\)\), \.\.\.rest\];/);
  assert.match(code, /country: ENGLISH_COUNTRY_NAMES\[formData\.country\] \|\| formData\.country,/);
  // Sorted without Intl collation, so the server's and the browser's order match;
  // the accent range is written as escapes, not as invisible combining characters.
  assert.equal(/localeCompare|Intl\./.test(code), false);
  assert.ok(client.includes(String.raw`.replace(/[\u0300-\u036f]/g, '')`));
  for (const locale of LOCALES) {
    assert.equal(lookup(messages[locale], 'form.labels.popularCountries'), undefined, locale);
    assert.equal(lookup(messages[locale], 'form.labels.allCountries'), undefined, locale);
  }
});

test('the lists take the brand where the browser can style them, and keep the native picker on touch', () => {
  const css = read('../src/app/(visitor)/[locale]/(home)/tailor-made/tailorMade.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const block = css.match(/@supports \(appearance: base-select\) \{\s*@media \(hover: hover\) and \(pointer: fine\) \{([\s\S]*)\}\s*\}/);
  assert.ok(block, 'feature- and pointer-gated block');
  const rules = block[1];
  assert.match(rules, /\.tailor-made-form \.form-select,\s*\.tailor-made-form \.form-select::picker\(select\),\s*\.tm-phone-input \.PhoneInputCountrySelect,\s*\.tm-phone-input \.PhoneInputCountrySelect::picker\(select\) \{\s*appearance: base-select;/);
  assert.match(rules, /option:checked \{\s*background: rgba\(212, 175, 55, 0\.2\);\s*color: #7a5f12;/);
  // The phone select hides its text, not itself: opacity would hide its list too.
  assert.match(rules, /\.tm-phone-input \.PhoneInputCountrySelect \{\s*padding: 0;\s*border: 0;\s*background: transparent;\s*color: transparent;\s*opacity: 1;\s*\}/);
  // Nothing outside the gate switches a select to base-select.
  assert.equal(css.replace(block[0], '').includes('base-select'), false);
});

test('country names in the page language come from the server, for the three non-English pages', () => {
  const page = read('../src/app/(visitor)/[locale]/(home)/tailor-made/page.tsx');
  for (const locale of ['de', 'it', 'es']) {
    assert.ok(page.includes(`${locale}: () => import("react-phone-number-input/locale/${locale}.json")`), locale);
  }
  assert.match(page, /const countryNames = locale === "en" \? undefined : \(await COUNTRY_NAMES\[locale\]\(\)\)\.default;/);
  assert.match(page, /<TailorMadeClient countryNames=\{countryNames\} \/>/);
});

test('the phone field takes a calling code, follows the country of residence, and is checked when filled', () => {
  assert.match(code, /<PhoneInput\s+international/);
  assert.match(code, /defaultCountry=\{\(formData\.country \|\| undefined\) as Country \| undefined\}/);
  // No '|': the library draws it as a disabled option filled with the text colour — a black bar.
  assert.match(code, /countryOptionsOrder=\{\['🌐', \.\.\.POPULAR_COUNTRIES, '\.\.\.'\]\}/);
  assert.match(code, /inputComponent=\{InternationalPhoneTextInput\}/);
  assert.match(code, /if \(formData\.phone && !isValidPhoneNumber\(formData\.phone\)\) \{\s*newErrors\.phone = t\('form\.errors\.invalidPhone'\);/);
  assert.match(code, /import 'react-phone-number-input\/style\.css';/);
  // One copy of the "+" input, shared with the tour booking form.
  const booking = read('../src/components/sections/TourListingDetailsOne/components/BookingForm.tsx');
  assert.match(booking, /import InternationalPhoneTextInput from "@\/components\/common\/PhoneField\/InternationalPhoneTextInput";/);
  assert.equal(/const InternationalPhoneTextInput =/.test(booking), false);
});

test('the budget error sits under the budget fields, and every preference label has its icon', () => {
  assert.match(code, /aria-invalid=\{!!errors\.maxBudget\}/);
  assert.match(code, /<span className="form-error" id=\{fieldId\('budget-error'\)\} role="alert">/);
  assert.equal(/form-submit-wrapper">\s*\{errors\.maxBudget/.test(code), false);
  assert.match(code, /<Wallet size=\{18\} \/>\s*\{t\('form\.fields\.budgetRange'\)\}/);
  assert.match(code, /<Heart size=\{18\} \/>\s*\{t\('form\.fields\.specialOccasions'\)\}/);
  assert.match(code, /<Compass size=\{18\} \/>\s*\{t\('form\.fields\.interestsActivities'\)\}/);
});
