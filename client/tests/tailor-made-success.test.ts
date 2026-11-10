import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * What a visitor gets once a tailor-made request went through.
 *
 * Before: a toast at the top of the screen for five seconds — while the
 * visitor was at the submit button at the end of a long form — and an emptied
 * form, with nothing said about what comes next and the focus left on the
 * submit button.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const client = read('../src/app/(visitor)/[locale]/(home)/tailor-made/TailorMadeClient.tsx');
const code = client.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '').replace(/^[ \t]*\/\/.*$/gm, '');
const LOCALES = ['en', 'de', 'it', 'es'] as const;
const messages = Object.fromEntries(LOCALES.map((locale) => [locale, JSON.parse(read(`../src/i18n/locales/${locale}/tailorMade.json`))]));
const lookup = (tree: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), tree);

test('a successful request is confirmed in place of the form, and the confirmation takes the focus', () => {
  const success = code.match(/if \(outcome\.type === 'success'\) \{([\s\S]*?)\} else if/);
  assert.ok(success, 'success branch');
  assert.match(success[1], /setToast\(null\);/);
  assert.match(success[1], /setFormData\(createInitialFormData\(\)\);/);
  assert.match(success[1], /flushSync\(\(\) => setSubmitted\(true\)\);/);
  assert.match(success[1], /successHeadingRef\.current\?\.focus\(\{ preventScroll: true \}\);/);
  // No five-second toast for it any more.
  assert.equal(/showFeedback\(t\('form\.success\.requestSubmitted'\)/.test(code), false);
  // The form stays in the page, hidden, so starting again is instant.
  assert.match(code, /<form onSubmit=\{handleSubmit\} className="tailor-made-form" noValidate hidden=\{submitted \|\| undefined\}>/);
  assert.match(code, /\{submitted && \(\s*<div className="tailor-made-success">/);
  assert.match(code, /<h3 className="tailor-made-success__title" tabIndex=\{-1\} ref=\{successHeadingRef\}>\s*\{t\('form\.success\.requestSubmitted'\)\}/);
});

test('what happens next is the page\'s own commitments, and starting again returns to an empty form', () => {
  // The two cards shown by the submit button, the same keys: no new promise.
  const panel = code.match(/<div className="tailor-made-success">([\s\S]*?)<\/button>\s*<\/div>/);
  assert.ok(panel, 'panel');
  assert.match(panel[1], /SUBMIT_INFO_CARDS\.map/);
  assert.match(panel[1], /t\(`submitInfo\.\$\{card\.key\}\.title`\)/);
  assert.match(code, /key: 'quickResponse'/);
  assert.match(code, /key: 'personalizedItinerary'/);
  assert.match(code, /const startAgain = \(\) => \{\s*flushSync\(\(\) => setSubmitted\(false\)\);\s*document\.getElementById\(fieldId\('fullName'\)\)\?\.focus\(\);/);
  for (const locale of LOCALES) {
    for (const key of ['form.success.requestSubmitted', 'form.success.nextTitle', 'form.success.newRequest', 'submitInfo.quickResponse.title', 'submitInfo.quickResponse.text', 'submitInfo.personalizedItinerary.title', 'submitInfo.personalizedItinerary.text']) {
      const text = lookup(messages[locale], key);
      assert.ok(typeof text === 'string' && text.trim(), `${locale}: ${key}`);
    }
  }
  assert.equal(lookup(messages.es, 'form.success.newRequest'), 'Enviar otra solicitud');
  assert.equal(lookup(messages.de, 'form.success.nextTitle'), 'So geht es weiter');
});
