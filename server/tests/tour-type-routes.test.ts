import type {} from '../src/types/express';
import '../src/middleware/i18n';
import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import mongoose from 'mongoose';
import Tour from '../src/models/Tour';

test('real Tour routes reject invalid scalar and localized type payloads without database access', async context => {
  // Exercise the real router/controllers; only authentication is stubbed.
  // No connection or credentials: unexpected persistence fails this test.
  const auth: any = await import('../src/middleware/auth');
  const next: express.RequestHandler = (_req, _res, proceed) => proceed();
  context.mock.method(auth, 'protect', next);
  context.mock.method(auth, 'optionalProtect', next);
  context.mock.method(auth, 'permit', () => next);
  const calls = ['findById', 'create', 'findByIdAndUpdate'].map(method =>
    context.mock.method(Tour as any, method, () => { throw new Error('Unexpected database access'); })
  );
  const app = express();
  app.use(express.json());
  app.use('/api/tours', (await import('../src/routes/tourRoutes')).default);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    for (const method of ['POST', 'PUT']) {
      for (const body of [
        ...[{ en: 'day-tour' }, { en: 'Private' }, 'Private', '', 'unknown'].map(tourType => ({ tourType })),
        { 'tourType.en': 'day-tour', _editVersion: 0 },
        { 'tourType.es': 'Privado', _editVersion: 0 },
        { 'tourType.anything': '...', _editVersion: 0 },
        { tourType: 'multi-day', 'tourType.en': 'day-tour', _editVersion: 0 },
      ]) {
        const suffix = method === 'PUT' ? '/000000000000000000000001' : '';
        const result = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/tours${suffix}`, {
          method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        assert.equal(result.status, 400, JSON.stringify({ method, body }));
        assert.equal((await result.json() as { path: string }).path, 'tourType');
      }
    }
    for (const call of calls) assert.equal(call.mock.callCount(), 0);
    assert.equal(mongoose.connection.readyState, 0);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
