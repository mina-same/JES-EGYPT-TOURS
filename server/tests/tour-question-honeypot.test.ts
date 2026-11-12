import type {} from '../src/types/express';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test, { type TestContext } from 'node:test';
import express from 'express';
import ContactSubmission from '../src/models/ContactSubmission';
import Notification from '../src/models/Notification';
import * as realtime from '../src/realtime/socket';
import contactRoutes from '../src/routes/contactRoutes';

/*
 * The tour question's spam trap, on the API side. The dialog now sends its
 * hidden "website" field (it used to leave it out, so a bot that filled it was
 * filed as a real question). What the API does with it is unchanged and is
 * pinned here: a filled trap is answered like a real question, filed as spam
 * (archived) and never reaches the Admin's notifications.
 *
 * The real router (shared limiter → retry key → validation → controller) on a
 * local port; only the database and socket calls are replaced.
 */

const QUESTION = {
  source: 'tour-question',
  name: 'Ana Test',
  email: 'ana.test@example.com',
  phone: '+49 151 23456789',
  message: 'Is lunch included?',
  preferredDate: 'March 2027',
  tourName: 'Private Fayoum Day Trip from Cairo',
  tourSlug: 'private-fayoum-day-trip-from-cairo',
  locale: 'de',
  website: '',
};
const SENT = { success: true, message: 'Your question has been sent. We usually reply within 24 hours.' };

async function startApi(context: TestContext) {
  const effects: string[] = [];
  const stored: Record<string, unknown>[] = [];
  context.mock.method(ContactSubmission, 'init', async () => ContactSubmission);
  context.mock.method(ContactSubmission, 'findOne', () => ({ select: async () => null }));
  context.mock.method(ContactSubmission, 'create', async (data: Record<string, unknown>) => {
    effects.push(data.isSpam ? 'stored as spam' : 'stored');
    stored.push(data);
    return { ...data, _id: 'question', createdAt: new Date() };
  });
  context.mock.method(ContactSubmission, 'updateOne', async () => ({}));
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
  app.use('/api/contact', contactRoutes);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/contact/tour-question`;

  // Each test sends from its own addresses: the route's limiter is one per process.
  const post = async (body: unknown, ip: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': randomUUID(), 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  };
  return { post, effects, stored };
}

test('a question with an empty, blank, null or missing trap is a real question: filed and notified', async (context) => {
  const api = await startApi(context);
  const withoutTrap: Record<string, unknown> = { ...QUESTION };
  delete withoutTrap.website;
  for (const [label, body] of Object.entries({
    'empty (what the dialog sends)': QUESTION,
    blank: { ...QUESTION, website: '   ' },
    null: { ...QUESTION, website: null },
    'missing (older pages)': withoutTrap,
  })) {
    const before = api.effects.length;
    const result = await api.post(body, '198.51.100.10');
    assert.deepEqual([result.status, result.body], [201, SENT], label);
    assert.deepEqual(api.effects.slice(before), ['stored', 'notification', 'socket', 'socket'], label);
    const record = api.stored[api.stored.length - 1];
    assert.equal(record.isSpam, undefined, label);
    assert.equal(record.source, 'tour-question', label);
    assert.equal('website' in record, false, `${label}: the trap is not stored`);
  }
});

test('a filled trap gets the same answer, is filed as archived spam, and never reaches the Admin\'s notifications', async (context) => {
  const api = await startApi(context);
  for (const website of ['https://spam.example', 'x', '  hi  ']) {
    const before = api.effects.length;
    const result = await api.post({ ...QUESTION, website }, '198.51.100.20');
    assert.deepEqual([result.status, result.body], [201, SENT], website);
    assert.deepEqual(api.effects.slice(before), ['stored as spam'], website);
    const record = api.stored[api.stored.length - 1];
    assert.equal(record.isSpam, true);
    assert.equal(record.status, 'archived');
    assert.equal(record.source, 'tour-question');
  }
});

test('repeated trapped questions each stay out of the inbox, and count toward the shared limit', async (context) => {
  const api = await startApi(context);
  const statuses: number[] = [];
  for (let i = 0; i < 10; i++) statuses.push((await api.post({ ...QUESTION, website: 'x' }, '203.0.113.30')).status);
  assert.deepEqual(statuses, Array(10).fill(201));
  assert.deepEqual(api.effects, Array(10).fill('stored as spam'));
  // The contact forms' limiter, and its answer, are unchanged; the dialog
  // shows its own translated text for any 429.
  const limited = await api.post(QUESTION, '203.0.113.30');
  assert.equal(limited.status, 429);
  assert.deepEqual(limited.body, { success: false, code: 'BOOKING_RATE_LIMITED', error: 'Too many booking attempts. Please wait before trying again.' });
  assert.equal(api.effects.length, 10);
});
