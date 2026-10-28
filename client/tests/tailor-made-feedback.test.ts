import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
// @ts-expect-error Node's built-in type stripping needs the explicit extension.
import { DATE_FIELDS, submissionOutcome } from '../src/app/(visitor)/[locale]/(home)/tailor-made/submissionOutcome.ts';

/*
 * What the tailor-made form tells visitors after the API answers, and how it
 * points them at what to fix.
 *
 * Before: the API's English text was shown on every page ("Too many booking
 * attempts…" on a tailor-made request), and the site-wide limiter's plain-text
 * 429 made `response.json()` throw, so it was reported as a network error.
 */

const LOCALES = ['en', 'de', 'it', 'es'] as const;
const messages = Object.fromEntries(LOCALES.map((locale) => [locale, JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}/tailorMade.json`, import.meta.url), 'utf8'))]));
const lookup = (tree: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), tree);
const translated = (key: string) => {
  for (const locale of LOCALES) {
    const text = lookup(messages[locale], key);
    assert.ok(typeof text === 'string' && text.trim(), `${locale}: ${key}`);
  }
};

test('a request goes through only on a 2xx answer that says so', () => {
  assert.deepEqual(submissionOutcome(201, { success: true }), { type: 'success' });
  assert.deepEqual(submissionOutcome(200, { success: true }), { type: 'success' });
  // A 2xx without the success flag, or without a readable body, is not a confirmation.
  assert.equal(submissionOutcome(201, { success: false }).type, 'error');
  assert.equal(submissionOutcome(201, null).type, 'error');
});

test('a rate limit is a rate limit, in the visitor\'s language — JSON or plain text alike', () => {
  for (const body of [{ success: false, errors: [{ path: 'email' }] }, null]) {
    assert.deepEqual(submissionOutcome(429, body), { type: 'error', message: 'form.errors.tooManyRequests', fields: {} });
  }
  translated('form.errors.tooManyRequests');
  // The visitor's text never mentions bookings.
  for (const locale of LOCALES) assert.equal(/book|buch|prenot|reserv/i.test(String(lookup(messages[locale], 'form.errors.tooManyRequests'))), false, locale);
});

test('a rejected field gets the form\'s own message; the dates are marked together', () => {
  assert.deepEqual(submissionOutcome(400, { errors: [{ path: 'endYear' }] }), {
    type: 'error',
    message: 'form.errors.invalidSubmission',
    fields: Object.fromEntries(DATE_FIELDS.map((name: string) => [name, 'form.errors.travelRange'])),
  });
  assert.deepEqual(submissionOutcome(400, { errors: [{ path: 'email' }, { path: 'minBudget' }] }), {
    type: 'error',
    message: 'form.errors.invalidSubmission',
    // The budget's message sits on the maximum, like the form's own check.
    fields: { email: 'form.errors.invalidEmail', maxBudget: 'form.errors.budgetRange' },
  });
  // The API now checks the phone too: its message is the phone field's own.
  assert.deepEqual(submissionOutcome(400, { errors: [{ path: 'phone' }] }), {
    type: 'error',
    message: 'form.errors.invalidSubmission',
    fields: { phone: 'form.errors.invalidPhone' },
  });
  // A field the form cannot point at, or no readable body: the summary alone.
  for (const body of [{ errors: [{ path: 'locale' }, { path: 'interests[3]' }, {}] }, null, { error: 'Invalid request data' }]) {
    assert.deepEqual(submissionOutcome(400, body), { type: 'error', message: 'form.errors.invalidSubmission', fields: {} });
  }
  for (const key of ['form.errors.invalidSubmission', 'form.errors.invalidPhone', 'form.errors.travelRange', 'form.errors.invalidEmail', 'form.errors.budgetRange', 'form.errors.nameMinLength', 'form.errors.countryRequired', 'form.errors.commentsRequired']) translated(key);
});

test("a request the API refuses without a reason (its spam trap) is not blamed on the visitor's details", () => {
  // Only reachable by a person if something filled the hidden field for them:
  // the way out is the WhatsApp line, not "check your details".
  const refused = { success: false, code: 'INVALID_TAILOR_MADE_REQUEST', error: 'Unable to process tailor-made request.' };
  assert.deepEqual(submissionOutcome(400, refused), { type: 'error', message: 'form.errors.tooManyRequests', fields: {} });
  for (const locale of LOCALES) assert.match(String(lookup(messages[locale], 'form.errors.tooManyRequests')), /WhatsApp/, locale);
  // Another route's code, or field errors, keep the usual 400 handling.
  assert.deepEqual(submissionOutcome(400, { code: 'INVALID_BOOKING_REQUEST' }), { type: 'error', message: 'form.errors.invalidSubmission', fields: {} });
  assert.deepEqual(submissionOutcome(400, { errors: [{ path: 'email' }] }), { type: 'error', message: 'form.errors.invalidSubmission', fields: { email: 'form.errors.invalidEmail' } });
});

test('any other answer is a failed attempt, not a network error', () => {
  // Real answers carry more than the form reads (`error`, `code`).
  const answer = (status: number, body: unknown) => submissionOutcome(status, body as Parameters<typeof submissionOutcome>[1]);
  for (const [status, body] of [[500, { success: false, error: 'Failed to submit your travel request.' }], [502, null], [503, null], [409, { code: 'IDEMPOTENCY_KEY_REUSED' }], [404, null]] as const) {
    assert.deepEqual(answer(status, body), { type: 'error', message: 'form.success.failFallback', fields: {} }, String(status));
  }
  translated('form.success.failFallback');
  translated('form.errors.networkError');
});

test('the form reads its messages from the outcome, never the API\'s text', () => {
  const client = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/tailor-made/TailorMadeClient.tsx', import.meta.url), 'utf8');
  assert.match(client, /const data = \(await response\.json\(\)\.catch\(\(\) => null\)\) as SubmitResponse \| null;/);
  assert.match(client, /const outcome = submissionOutcome\(response\.status, data\);/);
  assert.equal(/data\.error|data\?\.error/.test(client), false, 'the API\'s error text is not shown');
  // The browser's own validation bubble no longer stands in for the form's messages.
  assert.match(client, /<form onSubmit=\{handleSubmit\} className="tailor-made-form" noValidate>/);
  // The submit button keeps the focus while sending.
  assert.match(client, /aria-disabled=\{isSubmitting \|\| undefined\}/);
  assert.equal(/disabled=\{isSubmitting\}/.test(client), false);
  // Every literal key the new feedback uses exists in the four languages.
  for (const key of ['form.labels.startMonth', 'form.labels.startYear', 'form.labels.endMonth', 'form.labels.endYear', 'form.labels.decreaseCount', 'form.labels.increaseCount', 'form.labels.closeNotification', 'form.privacy.note', 'form.privacy.linkLabel', 'form.privacy.newTab', 'sidebar.needHelp.whatsappNewTab']) translated(key);
  for (const locale of LOCALES) {
    for (const key of ['form.labels.decreaseCount', 'form.labels.increaseCount']) assert.match(String(lookup(messages[locale], key)), /\{\{label\}\}/, `${locale} ${key}`);
  }
});
