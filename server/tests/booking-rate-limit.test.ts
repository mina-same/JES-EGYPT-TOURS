import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';
import {
  BOOKING_RATE_LIMIT_DEFAULTS,
  createBookingSubmissionLimiter,
} from '../src/middleware/bookingRateLimit';

test('booking limiter production defaults are 10 attempts per 15 minutes', () => {
  assert.deepEqual(BOOKING_RATE_LIMIT_DEFAULTS, {
    windowMs: 15 * 60 * 1000,
    limit: 10,
  });
});

test('booking limiter blocks only excess POST submissions with standard retry headers', async (context) => {
  const app = express();
  app.use(express.json());
  app.post(
    '/bookings',
    createBookingSubmissionLimiter({ windowMs: 60_000, limit: 2 }),
    (_req, res) => res.status(201).json({ success: true })
  );
  app.get('/bookings', (_req, res) => res.status(200).json({ success: true }));

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );

  const address = server.address() as AddressInfo;
  const endpoint = `http://127.0.0.1:${address.port}/bookings`;
  const first = await fetch(endpoint, { method: 'POST' });
  const second = await fetch(endpoint, { method: 'POST' });
  const blocked = await fetch(endpoint, { method: 'POST' });

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('ratelimit-limit'), '2');
  assert.equal(blocked.headers.get('ratelimit-remaining'), '0');
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.deepEqual(await blocked.json(), {
    success: false,
    code: 'BOOKING_RATE_LIMITED',
    error: 'Too many booking attempts. Please wait before trying again.',
  });

  // The limiter is mounted on POST only; browsing/admin reads keep working.
  const readRequest = await fetch(endpoint);
  assert.equal(readRequest.status, 200);
});

test('a route can answer its 429 in its own words; without them it is the booking answer', async (context) => {
  const app = express();
  app.post('/own', createBookingSubmissionLimiter({ limit: 1, rejection: { code: 'TAILOR_MADE_RATE_LIMITED', error: 'Too many tailor-made requests. Please wait before trying again.' } }), (_req, res) => res.status(201).end());
  app.post('/default', createBookingSubmissionLimiter({ limit: 1 }), (_req, res) => res.status(201).end());

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );

  const address = server.address() as AddressInfo;
  const blocked = async (route: string) => {
    await fetch(`http://127.0.0.1:${address.port}${route}`, { method: 'POST' });
    return fetch(`http://127.0.0.1:${address.port}${route}`, { method: 'POST' });
  };
  const own = await blocked('/own');
  assert.equal(own.status, 429);
  assert.ok(Number(own.headers.get('retry-after')) > 0);
  assert.deepEqual(await own.json(), {
    success: false,
    code: 'TAILOR_MADE_RATE_LIMITED',
    error: 'Too many tailor-made requests. Please wait before trying again.',
  });
  // Contact, Travel Trade and Tour Question still create theirs without options.
  assert.deepEqual(await (await blocked('/default')).json(), {
    success: false,
    code: 'BOOKING_RATE_LIMITED',
    error: 'Too many booking attempts. Please wait before trying again.',
  });
});
