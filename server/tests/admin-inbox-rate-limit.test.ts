import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import { createAdminInboxLimiter, isAdminInboxOperation } from '../src/middleware/adminRateLimit';
test('employees sharing an office IP have separate authenticated inbox budgets', async context => {
  const before = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-rate-test-secret';
  context.after(() => { if (before === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = before; });
  const app = express(); app.use(createAdminInboxLimiter(2)); app.get('/', (_req, res) => res.json({ success: true }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  context.after(() => new Promise<void>(resolve => { server.close(() => resolve()); }));
  const url = `http://127.0.0.1:${(server.address() as any).port}`;
  const first = jwt.sign({ id: 'employee-A' }, process.env.JWT_SECRET), second = jwt.sign({ id: 'employee-B' }, process.env.JWT_SECRET);
  const get = (token: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await get(first)).status, 200); assert.equal((await get(first)).status, 200); assert.equal((await get(first)).status, 429);
  assert.equal((await get(second)).status, 200);
});
test('protected reads/acknowledgments do not weaken public submission limits', () => {
  const req = (method: string, path: string) => ({ method, path, headers: { authorization: 'Bearer test' } }) as any;
  assert.equal(isAdminInboxOperation(req('GET', '/bookings')), true);
  assert.equal(isAdminInboxOperation(req('POST', '/notifications/ack')), true);
  assert.equal(isAdminInboxOperation(req('POST', '/bookings')), false);
  assert.equal(isAdminInboxOperation(req('POST', '/contact')), false);
  assert.equal(isAdminInboxOperation(req('POST', '/tailor-made')), false);
});
