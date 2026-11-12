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
  // The library's check, and the API's own E.164 range (7 to 15 digits): the
  // library alone lets 6- to 19-digit numbers through, which the API refuses.
  assert.match(code, /if \(formData\.phone && \(!isValidPhoneNumber\(formData\.phone\) \|\| !E164_PHONE\.test\(formData\.phone\)\)\) \{\s*newErrors\.phone = t\('form\.errors\.invalidPhone'\);/);
  assert.match(code, /const E164_PHONE = \/\^\\\+\[1-9\]\\d\{6,14\}\$\/;/);
  assert.match(code, /import 'react-phone-number-input\/style\.css';/);
  // One copy of the "+" input, shared with the tour booking form.
  const booking = read('../src/components/sections/TourListingDetailsOne/components/BookingForm.tsx');
  assert.match(booking, /import InternationalPhoneTextInput from "@\/components\/common\/PhoneField\/InternationalPhoneTextInput";/);
  assert.equal(/const InternationalPhoneTextInput =/.test(booking), false);
});

test('the budget error sits under the budget fields, and every preference label has its icon', () => {
  // Marked invalid and described by its message (read out when the focus moves
  // there after a failed submit — messages are not alerts, which would all
  // speak at once).
  assert.match(code, /\{\.\.\.invalidProps\('maxBudget', fieldId\('budget-error'\)\)\}/);
  assert.match(code, /<span className="form-error" id=\{fieldId\('budget-error'\)\}>/);
  assert.equal(/form-submit-wrapper">\s*\{errors\.maxBudget/.test(code), false);
  assert.match(code, /<Wallet size=\{18\} \/>\s*\{t\('form\.fields\.budgetRange'\)\}/);
  assert.match(code, /<Heart size=\{18\} \/>\s*\{t\('form\.fields\.specialOccasions'\)\}/);
  assert.match(code, /<Compass size=\{18\} \/>\s*\{t\('form\.fields\.interestsActivities'\)\}/);
});

/** The English values of a server enum, from its express-validator chain. */
const serverEnum = (field: string) => {
  const server = read('../../server/src/middleware/validation.ts');
  const list = server.match(new RegExp(`body\\('${field}'\\)[\\s\\S]*?\\.isIn\\(\\[([\\s\\S]*?)\\]\\)`));
  assert.ok(list, field);
  return [...list[1].matchAll(/'([^']*)'/g)].map((match) => match[1]).filter(Boolean);
};

test('the month and accommodation lists read in the page language, and send the values the API accepts', () => {
  // Months were the English names on every page: the label is now translated, the value stays English.
  const months = [...(code.match(/const MONTHS = \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.equal(months.length, 12);
  assert.deepEqual(months, serverEnum('startMonth'));
  assert.deepEqual(months, serverEnum('endMonth'));
  const monthOption = /\{MONTHS\.map\(month => <option key=\{month\} value=\{month\}>\{t\(`form\.options\.months\.\$\{month\.toLowerCase\(\)\}`, \{ defaultValue: month \}\)\}<\/option>\)\}/g;
  assert.equal(code.match(monthOption)?.length, 2, 'start and end month lists');
  assert.equal(/<option key=\{month\} value=\{month\}>\{month\}<\/option>/.test(code), false);

  const accommodation = optionList('ACCOMMODATION_OPTIONS');
  assert.deepEqual(accommodation.map((o) => o.value), serverEnum('accommodation'));
  assert.match(code, /\{t\(`form\.options\.accommodation\.\$\{o\.key\}`, \{ defaultValue: o\.value \}\)\}/);

  for (const locale of LOCALES) {
    for (const month of months) {
      const label = lookup(messages[locale], `form.options.months.${month.toLowerCase()}`);
      assert.ok(typeof label === 'string' && label.trim(), `${locale} ${month}`);
    }
    for (const { key, value } of accommodation) {
      const label = lookup(messages[locale], `form.options.accommodation.${key}`);
      assert.ok(typeof label === 'string' && label.trim(), `${locale} ${key}`);
      // English shows exactly what it always showed; the other languages show their own words.
      if (locale === 'en') assert.equal(label, value);
      else assert.notEqual(label, value, `${locale} ${key} is still English`);
    }
  }
  // Months that are not spelled like English anywhere prove the lists are not the English ones.
  assert.equal(lookup(messages.de, 'form.options.months.march'), 'März');
  assert.equal(lookup(messages.it, 'form.options.months.january'), 'Gennaio');
  assert.equal(lookup(messages.es, 'form.options.months.december'), 'Diciembre');
});

test('the date and budget messages read correctly, and Spanish addresses the visitor as usted throughout', () => {
  const errors = (locale: (typeof LOCALES)[number]) => lookup(messages[locale], 'form.errors') as Record<string, string>;
  assert.equal(errors('de').travelRange, 'Wählen Sie aktuelle oder zukünftige Daten. Das Ende darf nicht vor dem Beginn liegen.');
  assert.equal(errors('it').travelRange, "Scegli date attuali o future, con la fine non precedente all'inizio.");
  assert.equal(errors('es').budgetRange, 'El presupuesto máximo debe ser igual o mayor que el mínimo.');
  // "Elige" was the one informal (tú) form on a page that says "Cree", "Planifique", "Seleccione".
  assert.equal(errors('es').travelRange, 'Elija fechas actuales o futuras, con el final igual o posterior al inicio.');
  assert.equal(/\bElige\b/.test(JSON.stringify(messages.es)), false);
});

test('the tour booking form\'s spam trap is on the form, hidden from people, and sent with every request', () => {
  // The same markup and class as the booking form's trap (the class lives in custom.css).
  const trap = code.match(/<div className="booking-honeypot" aria-hidden="true">([\s\S]*?)<\/div>/);
  assert.ok(trap, 'hidden wrapper');
  for (const attribute of ['name="website"', 'value={formData.website}', 'onChange={handleInputChange}', 'tabIndex={-1}', 'autoComplete="off"', 'data-lpignore="true"', 'data-1p-ignore="true"']) {
    assert.ok(trap[1].includes(attribute), attribute);
  }
  assert.equal(/\brequired\b/.test(trap[1]), false, 'never required');
  // Controlled, empty for a person, and part of the body (`...formData`).
  assert.match(code, /website: string;/);
  assert.match(code, /comments: '',\s*website: '',/);
  assert.match(code, /body: JSON\.stringify\(\{\s*\.\.\.formData,/);
  // Inside the last step, not between it and the submit box: the step's
  // `:has(+ .form-submit-wrapper)` rule must keep matching.
  assert.match(code, /<div className="booking-honeypot"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div className="form-submit-wrapper">/);
  const customCss = read('../src/assets/css/custom.css');
  assert.match(customCss, /\.booking-honeypot \{[^}]*position: absolute !important;[^}]*clip: rect\(0, 0, 0, 0\) !important;/);
  assert.match(read('../src/app/(visitor)/[locale]/(home)/layout.tsx'), /import "@\/assets\/css\/custom\.css";/);
});

test('the phone hint stays on one line inside the field, and the budget lists\' placeholders fit them, in every language', () => {
  // The hint wrapped to two lines past the field's padding on narrow phones
  // (German at 360px): it now has a right edge and ends in an ellipsis instead.
  const css = read('../src/app/(visitor)/[locale]/(home)/tailor-made/tailorMade.css');
  const hint = css.match(/\.tm-phone-empty-label \{([^}]*)\}/);
  assert.ok(hint, '.tm-phone-empty-label');
  for (const declaration of ['right: 8px;', 'overflow: hidden;', 'white-space: nowrap;', 'text-overflow: ellipsis;', 'line-height: 1.4;']) assert.ok(hint[1].includes(declaration), declaration);
  assert.equal(lookup(messages.de, 'form.placeholders.phone'), 'Vorwahl + Nummer');
  // "Presupuesto mínimo / máximo" wrapped (desktop) or was cut to "Presupuesto r"
  // (tablet) where the two lists share a row; the group's label already says
  // "Presupuesto". Short, like the other three languages' placeholders.
  assert.equal(lookup(messages.es, 'form.fields.minBudget'), 'Mínimo');
  assert.equal(lookup(messages.es, 'form.fields.maxBudget'), 'Máximo');
  for (const locale of LOCALES) {
    for (const key of ['form.fields.minBudget', 'form.fields.maxBudget']) assert.ok(String(lookup(messages[locale], key)).length <= 11, `${locale} ${key}`);
  }
});

test('a long choice or placeholder never breaks a field: one line with "…" (native lists, inputs); the desktop list wraps its few longest countries', () => {
  const css = read('../src/app/(visitor)/[locale]/(home)/tailor-made/tailorMade.css');
  assert.match(css, /\.tailor-made-section \.form-input,\s*\.tailor-made-section \.form-select \{\s*text-overflow: ellipsis;\s*\}/);
  assert.match(css, /\.tailor-made-section \.form-select \{\s*overflow: hidden;\s*white-space: nowrap;/);
  // The customizable list cannot shorten its closed text: it wraps instead of
  // running under its arrow.
  const desktop = css.match(/@supports \(appearance: base-select\) \{[\s\S]*?\.tailor-made-form \.form-select \{([^}]*)\}/);
  assert.ok(desktop && /white-space: normal;/.test(desktop[1]), 'base-select field wraps');
  // N-1: "Nessun limite" took two lines where the two budget lists share a row (769–991px).
  assert.equal(lookup(messages.it, 'form.options.noLimit'), 'Senza limite');
  for (const locale of LOCALES) assert.ok(String(lookup(messages[locale], 'form.options.noLimit')).length <= 12, locale);
  // N-3: the four placeholders that were cut at 320px, shortened with their meaning kept.
  assert.equal(lookup(messages.en, 'form.placeholders.dietary'), 'e.g., Vegetarian, Halal');
  assert.equal(lookup(messages.it, 'form.placeholders.fullName'), 'Inserisci nome e cognome');
  assert.equal(lookup(messages.it, 'form.placeholders.mobility'), 'Esigenze di accessibilità');
  assert.equal(lookup(messages.es, 'form.placeholders.mobility'), 'Accesibilidad que necesita');
  // Spanish keeps "usted" (necesita), as on the rest of the page.
  assert.equal(/\bnecesitas\b/.test(String(lookup(messages.es, 'form.placeholders.mobility'))), false);
});

test('on phones the form is closer: compact feature rows and a link to it under the introduction', () => {
  const css = read('../src/app/(visitor)/[locale]/(home)/tailor-made/tailorMade.css');
  // Hidden by default; shown only in the 768px block.
  assert.match(css, /\.tailor-made-jump \{\s*display: none;\s*\}/);
  const phone = css.match(/@media \(max-width: 768px\) \{([\s\S]*?)\n\}/);
  assert.ok(phone, '768px block');
  assert.match(phone[1], /\.tailor-made-jump \{\s*display: inline-flex;/);
  assert.match(phone[1], /\.tailor-made-section \.feature-card \{\s*display: grid;\s*grid-template-columns: 48px minmax\(0, 1fr\);/);
  assert.match(css, /\.tailor-made-form-wrapper \{[^}]*scroll-margin-top: 100px;/);
  // A link to the form section, its heading taking the focus.
  assert.match(code, /<a href=\{`#\$\{FORM_ANCHOR\}`\} className="tailor-made-jump" onClick=\{jumpToForm\}>\s*\{t\('form\.header\.title'\)\}/);
  assert.match(code, /<div className="tailor-made-form-wrapper" id=\{FORM_ANCHOR\}>/);
  assert.match(code, /<h2 className="form-header-title" tabIndex=\{-1\} ref=\{formHeadingRef\}>/);
  assert.match(code, /prefers-reduced-motion: reduce/);
});

test('on the narrowest phones the month gets the room the year does not need', () => {
  const css = read('../src/app/(visitor)/[locale]/(home)/tailor-made/tailorMade.css');
  const narrow = css.match(/@media \(max-width: 374\.98px\) \{([\s\S]*?)\n\}/);
  assert.ok(narrow, '374.98px block');
  assert.match(narrow[1], /\.date-select-group \.form-select:first-child \{\s*flex: 1 1 0;\s*min-width: 0;/);
  assert.match(narrow[1], /\.date-select-group \.form-select:last-child \{\s*flex: 0 0 auto;\s*width: auto;/);
  // The lists still send the English month and the year.
  assert.match(code, /MONTHS\.map\(month => <option key=\{month\} value=\{month\}>/);
});
