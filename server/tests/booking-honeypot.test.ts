import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test, { type TestContext } from 'node:test';
import express from 'express';
import { bookingHoneypotGuard } from '../src/middleware/bookingHoneypot';

const startTestServer = async (context: TestContext) => {
  const app = express();
  app.use(express.json());
  app.post('/bookings', bookingHoneypotGuard, (_req, res) => {
    res.status(201).json({ success: true });
  });

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );

  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/bookings`;
};

const post = (endpoint: string, body: unknown) =>
  fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

test('booking honeypot accepts older clients and blank values', async (context) => {
  const endpoint = await startTestServer(context);

  const missing = await post(endpoint, { name: 'Real Visitor' });
  const empty = await post(endpoint, { name: 'Real Visitor', website: '' });
  const whitespace = await post(endpoint, {
    name: 'Real Visitor',
    website: '   ',
  });

  assert.equal(missing.status, 201);
  assert.equal(empty.status, 201);
  assert.equal(whitespace.status, 201);
});

test('booking honeypot rejects filled or malformed trap values generically', async (context) => {
  const endpoint = await startTestServer(context);

  const filled = await post(endpoint, {
    name: 'Cheap SEO Service',
    website: 'https://spam.example',
  });
  const malformed = await post(endpoint, {
    name: 'Automated Sender',
    website: { url: 'https://spam.example' },
  });

  assert.equal(filled.status, 400);
  assert.equal(malformed.status, 400);
  const responseBody = await filled.json();
  assert.deepEqual(responseBody, {
    success: false,
    code: 'INVALID_BOOKING_REQUEST',
    error: 'Unable to process booking request.',
  });
  assert.equal(JSON.stringify(responseBody).toLowerCase().includes('honeypot'), false);
});
