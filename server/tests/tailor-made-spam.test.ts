import type {} from '../src/types/express';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test, { type TestContext } from 'node:test';
import express from 'express';
import TailorMadeRequest from '../src/models/TailorMadeRequest';
import Notification from '../src/models/Notification';
import * as realtime from '../src/realtime/socket';
import tailorMadeRoutes from '../src/routes/tailorMadeRoutes';
import { getBookingToday } from '../src/utils/booking';

/*
 * Issue #18. The tailor-made request had no spam trap: a bot that filled the
 * hidden "website" field was stored, raised an Admin notification and pushed
 * socket events like any visitor, and the route's rate limit answered in the
 * booking form's words ("Too many booking attempts"). The route now runs the
 * tour booking form's trap, in its own words, before any other check.
 *
 * The real router (limiter → trap → retry key → validation → controller) on a
 * local port; only the database and socket calls are replaced.
 */

const year = Number(getBookingToday().slice(0, 4));

/** What the form sends in each language — the empty trap included. */
const FORM_PAYLOADS = {
  en: { fullName: 'Jane Doe', email: 'jane.doe@example.com', phone: '', country: 'United Kingdom', startMonth: 'December', startYear: String(year + 1), endMonth: 'January', endYear: String(year + 2), duration: '', accommodation: '', adults: 2, children: 0, infants: 0, minBudget: '', maxBudget: '', specialOccasion: '', interests: [], dietary: '', mobility: '', comments: 'We would love a relaxed two-week trip.', website: '', locale: 'en' },
  de: { fullName: 'Jörg Müller-Lüdenscheidt', email: 'joerg+reise@beispiel.de', phone: '+4915123456789', country: 'Germany', startMonth: 'March', startYear: String(year + 1), endMonth: 'April', endYear: String(year + 1), duration: '14 Tage', accommodation: 'Luxury Hotels (5 Star)', adults: 3, children: 2, infants: 1, minBudget: '$3,000', maxBudget: 'No Limit', specialOccasion: 'Honeymoon', interests: ['Ancient Sites & Temples', 'Nile River Cruise'], dietary: 'Vegetarisch', mobility: '', comments: 'Wir möchten Kairo, Luxor und Assuan sehen.', website: '', locale: 'de' },
  it: { fullName: "Maria D'Angelo", email: 'maria.dangelo@esempio.it', phone: '+393123456789', country: 'Italy', startMonth: 'June', startYear: String(year + 5), endMonth: 'July', endYear: String(year + 5), duration: '', accommodation: '', adults: 2, children: 0, infants: 0, minBudget: '$5,000+', maxBudget: '', specialOccasion: 'Anniversary', interests: ['Museums & Culture'], dietary: '', mobility: '', comments: 'Crociera sul Nilo e mar Rosso.', website: '', locale: 'it' },
  es: { fullName: 'José Ñúñez', email: 'jose@ejemplo.es', phone: '+34612345678', country: 'Spain', startMonth: 'September', startYear: String(year + 1), endMonth: 'September', endYear: String(year + 1), duration: '10 días', accommodation: 'Mix of Categories', adults: 2, children: 0, infants: 1, minBudget: '', maxBudget: '$10,000', specialOccasion: 'Other Celebration', interests: ['Ancient Sites & Temples'], dietary: '', mobility: '', comments: 'Viaje familiar con un bebé.', website: '', locale: 'es' },
};

const REFUSED = { success: false, code: 'INVALID_TAILOR_MADE_REQUEST', error: 'Unable to process tailor-made request.' };
const LIMITED = { success: false, code: 'TAILOR_MADE_RATE_LIMITED', error: 'Too many tailor-made requests. Please wait before trying again.' };

/** The real router behind one proxy, as in app.ts; every side effect recorded. */
async function startApi(context: TestContext) {
  const effects: string[] = [];
  const stored: Record<string, unknown>[] = [];
  context.mock.method(TailorMadeRequest, 'init', async () => TailorMadeRequest);
  context.mock.method(TailorMadeRequest, 'findOne', () => ({ select: async () => null }));
  context.mock.method(TailorMadeRequest, 'create', async (data: Record<string, unknown>) => {
    effects.push('stored');
    stored.push(data);
    return { ...data, _id: 'request', createdAt: new Date() };
  });
  context.mock.method(TailorMadeRequest, 'updateOne', async () => ({}));
  context.mock.method(Notification, 'init', async () => Notification);
  context.mock.method(Notification, 'findOneAndUpdate', async () => {
    effects.push('notification');
    return { _id: 'notification', createdAt: new Date() };
  });
  context.mock.method(realtime, 'emitAdminNotification', async () => { effects.push('socket'); });
  context.mock.method(realtime, 'emitDashboardStatsUpdate', async () => { effects.push('socket'); });

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use('/api/tailor-made', tailorMadeRoutes);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/tailor-made`;

  // Each test sends from its own addresses: the route's limiter is one per process.
  const post = async (body: unknown, ip: string, headers: Record<string, string> = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': randomUUID(), 'x-forwarded-for': ip, ...headers },
      body: JSON.stringify(body),
    });
    return { status: response.status, headers: response.headers, body: (await response.json()) as Record<string, unknown> };
  };
  return { post, effects, stored };
}

test('what the form sends — the empty trap included — is accepted in all four languages, stored without it, and notified once', async (context) => {
  const api = await startApi(context);
  for (const [index, [locale, payload]] of Object.entries(FORM_PAYLOADS).entries()) {
    const before = api.effects.length;
    const result = await api.post(payload, `198.51.100.${10 + index}`);
    assert.equal(result.status, 201, locale);
    assert.equal(result.body.success, true, locale);
    assert.deepEqual(api.effects.slice(before), ['stored', 'notification', 'socket', 'socket'], locale);
    const record = api.stored[api.stored.length - 1];
    assert.equal('website' in record, false, `${locale}: the trap is not stored`);
    assert.equal(record.email, payload.email, locale);
    assert.equal(record.locale, locale);
  }
});

test('a missing, null or blank trap is a visitor (older pages, cached scripts)', async (context) => {
  const api = await startApi(context);
  const withoutTrap: Record<string, unknown> = { ...FORM_PAYLOADS.en };
  delete withoutTrap.website;
  for (const [label, body] of Object.entries({
    missing: withoutTrap,
    null: { ...withoutTrap, website: null },
    empty: { ...withoutTrap, website: '' },
    spaces: { ...withoutTrap, website: '   ' },
    'tab and newline': { ...withoutTrap, website: '\t\n' },
  })) {
    const before = api.effects.length;
    const result = await api.post(body, '198.51.100.20');
    assert.equal(result.status, 201, label);
    assert.equal(api.effects.length - before, 4, label);
  }
});

test('a filled trap is refused before anything else, with nothing stored, notified or emitted', async (context) => {
  const api = await startApi(context);
  const filled: Array<[string, unknown]> = [
    ['a URL', 'https://spam.example'],
    ['one letter', 'x'],
    ['text around spaces', '  hi  '],
    ['a number', 7],
    ['zero', 0],
    ['true', true],
    ['false', false],
    ['an object', { url: 'https://spam.example' }],
    ['an empty array', []],
    ['an array', ['x']],
  ];
  let ip = 0;
  for (const [label, website] of filled) {
    const result = await api.post({ ...FORM_PAYLOADS.de, website }, `198.51.100.${100 + ip++}`);
    assert.equal(result.status, 400, label);
    assert.deepEqual(result.body, REFUSED, label);
  }
  // Ahead of the retry key and the field checks: no field errors to learn from.
  const early = [
    await api.post({ ...FORM_PAYLOADS.it, email: 'not-an-email', adults: 0, website: 'x' }, '198.51.100.120'),
    await api.post({ ...FORM_PAYLOADS.it, website: 'x' }, '198.51.100.121', { 'idempotency-key': 'not-a-uuid' }),
  ];
  for (const result of early) assert.deepEqual([result.status, result.body], [400, REFUSED]);
  assert.deepEqual(api.effects, [], 'no write, no notification, no socket event');
  assert.equal(/honeypot|website|trap|spam|booking/i.test(JSON.stringify(REFUSED)), false, 'the answer says nothing about why');
});

test('repeated requests: each trapped one stays refused and counts toward the limit, whose answer is the form\'s own', async (context) => {
  const api = await startApi(context);
  const statuses: number[] = [];
  for (let i = 0; i < 10; i++) statuses.push((await api.post({ ...FORM_PAYLOADS.es, website: 'x' }, '203.0.113.5')).status);
  assert.deepEqual(statuses, Array(10).fill(400));
  const limited = await api.post(FORM_PAYLOADS.es, '203.0.113.5');
  assert.equal(limited.status, 429);
  assert.deepEqual(limited.body, LIMITED);
  assert.equal(limited.headers.get('ratelimit-limit'), '10');
  assert.equal(limited.headers.get('ratelimit-remaining'), '0');
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.deepEqual(api.effects, []);

  // Identical valid requests are each accepted (there is no duplicate check),
  // up to the same 10 in 15 minutes per address.
  const repeated: number[] = [];
  for (let i = 0; i < 11; i++) repeated.push((await api.post(FORM_PAYLOADS.en, '203.0.113.6')).status);
  assert.deepEqual(repeated, [...Array(10).fill(201), 429]);
  assert.equal(api.stored.length, 10);
  // Another address is unaffected.
  assert.equal((await api.post(FORM_PAYLOADS.en, '203.0.113.7')).status, 201);
});
