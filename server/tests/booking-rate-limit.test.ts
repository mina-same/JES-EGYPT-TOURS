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
