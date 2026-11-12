import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
// @ts-expect-error Node's built-in type stripping needs the explicit extension.
import { tourQuestionOutcome } from '../src/components/sections/TourListingDetailsOne/components/tourQuestionOutcome.ts';

/*
 * The "Ask us about this tour" dialog.
 *
 * Before: its hidden spam-trap field was never part of the request, so a bot
 * that filled it was filed as a normal question with an Admin notification;
 * and any failure showed the API's English text — "Too many booking attempts.
 * Please wait before trying again." on a rate limit, on every language's page.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const modal = read('../src/components/sections/TourListingDetailsOne/components/TourQuestionModal.tsx');
const code = modal.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '').replace(/^[ \t]*\/\/.*$/gm, '');
const LOCALES = ['en', 'de', 'it', 'es'] as const;
const askModal = Object.fromEntries(
  LOCALES.map((locale) => [locale, (JSON.parse(read(`../src/i18n/locales/${locale}/tours.json`)) as { tourDetails: { askModal: Record<string, string> } }).tourDetails.askModal])
) as Record<(typeof LOCALES)[number], Record<string, string>>;
const translated = (key: string) => {
  const name = key.replace('tourDetails.askModal.', '');
  for (const locale of LOCALES) assert.ok(typeof askModal[locale][name] === 'string' && askModal[locale][name].trim(), `${locale}: ${key}`);
};
// Real answers carry more than the dialog reads (`error`, `code`, `message`).
const answer = (status: number, body: unknown) => tourQuestionOutcome(status, body as Parameters<typeof tourQuestionOutcome>[1]);

test('the spam trap is part of every question the dialog sends', () => {
  assert.match(code, /website: string;/);
  assert.match(code, /const EMPTY: Values = \{[^}]*website: ""[^}]*\};/);
  assert.match(code, /locale,\s*website: values\.website,\s*\}\),/);
  const trap = code.match(/<input\s+type="text"\s+name="website"([\s\S]*?)\/>/);
  assert.ok(trap, 'the hidden input');
  for (const attribute of ['value={values.website}', 'onChange={set("website")}', 'tabIndex={-1}', 'autoComplete="off"', 'data-lpignore="true"', 'data-1p-ignore="true"', 'aria-hidden="true"', 'className="tour-ask__honeypot"']) {
    assert.ok(trap[1].includes(attribute), attribute);
  }
});

test('a question goes through only on a 2xx answer that says so — the API\'s spam answer included', () => {
  // A filled trap gets the same 201 as a real question (the API files it as spam).
  assert.deepEqual(answer(201, { success: true, message: 'Your question has been sent. We usually reply within 24 hours.' }), { type: 'sent' });
  assert.equal(answer(201, { success: false }).type, 'error');
  assert.equal(answer(201, null).type, 'error');
});

test('a rate limit is a rate limit, about a question, in the visitor\'s language — JSON or plain text alike', () => {
  for (const body of [{ success: false, code: 'BOOKING_RATE_LIMITED', error: 'Too many booking attempts. Please wait before trying again.' }, null]) {
    assert.deepEqual(answer(429, body), { type: 'error', message: 'tourDetails.askModal.rateLimited', fields: {} });
  }
  translated('tourDetails.askModal.rateLimited');
  const question = { en: /question/, de: /Frage/, it: /domanda/, es: /pregunta/ };
  for (const locale of LOCALES) {
    const text = askModal[locale].rateLimited;
    assert.match(text, question[locale], locale);
    assert.equal(/book|buch|prenot|reserv/i.test(text), false, `${locale}: no booking words`);
  }
});

test('a field the API refuses gets the dialog\'s own message; anything else gets the general one', () => {
  assert.deepEqual(answer(400, { success: false, error: 'Please provide a valid email', errors: [{ path: 'email' }] }), {
    type: 'error', message: 'tourDetails.askModal.invalid', fields: { email: 'tourDetails.askModal.errorEmail' },
  });
  assert.deepEqual(answer(400, { errors: [{ path: 'name' }, { path: 'message' }] }), {
    type: 'error', message: 'tourDetails.askModal.invalid', fields: { name: 'tourDetails.askModal.errorName', message: 'tourDetails.askModal.errorMessage' },
  });
  // Fields the visitor typed but that have no message of their own: the summary.
  for (const path of ['phone', 'preferredDate']) {
    assert.deepEqual(answer(400, { errors: [{ path }] }), { type: 'error', message: 'tourDetails.askModal.invalid', fields: {} }, path);
  }
  // Not the visitor's to fix (the tour's slug or name, the source), or no readable body.
  for (const body of [{ error: 'Tour slug cannot exceed 250 characters', errors: [{ path: 'tourSlug' }] }, { errors: [{ path: 'source' }, {}] }, null]) {
    assert.deepEqual(answer(400, body), { type: 'error', message: 'tourDetails.askModal.failed', fields: {} });
  }
  for (const [status, body] of [[500, { success: false, error: 'Something went wrong. Please try again.' }], [409, { code: 'IDEMPOTENCY_KEY_REUSED' }], [404, null], [502, null]] as const) {
    assert.deepEqual(answer(status, body), { type: 'error', message: 'tourDetails.askModal.failed', fields: {} }, String(status));
  }
  for (const key of ['invalid', 'failed', 'errorName', 'errorEmail', 'errorMessage']) translated(`tourDetails.askModal.${key}`);
});

test('the dialog shows its own messages, never the API\'s text, and stops at the API\'s lengths', () => {
  assert.match(code, /const outcome = tourQuestionOutcome\(response\.status, body\);/);
  assert.equal(/body\??\.error/.test(code), false, 'the API\'s error text is not shown');
  // The same limits as the API's tourQuestionValidation, so its length errors cannot happen.
  for (const [name, max] of [['name', 100], ['email', 150], ['phone', 40], ['preferredDate', 60], ['message', 5000]] as const) {
    assert.match(code, new RegExp(`name="${name}"\\s+maxLength=\\{${max}\\}`), name);
  }
});
