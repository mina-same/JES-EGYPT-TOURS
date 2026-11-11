import type {} from '../src/types/express';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import currencyRoutes from '../src/routes/currencyRoutes';
import { roundConvertedPrice } from '../src/utils/priceRounding';
import { resolveTourStartingQuote } from '../src/utils/booking';
import { effectiveStartingPrice } from '../src/utils/tourQuery';

type Layer = { route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: Function }> } };

/** The handlers of one route, in order: [protect, permit(...), controller]. */
const handlersOf = (method: string, path: string) => {
  const layer = (currencyRoutes as unknown as { stack: Layer[] }).stack
    .find((l) => l.route?.path === path && l.route.methods[method]);
  assert.ok(layer?.route, `${method.toUpperCase()} ${path} exists`);
  return layer.route.stack.map((s) => s.handle);
};

/** Runs one middleware with a fake signed-in user; returns 'next' or the status it sent. */
const run = (handler: Function, user: Record<string, unknown> | undefined) => {
  let outcome = 'none';
  const res = {
    status(code: number) { outcome = String(code); return this; },
    json() { return this; },
  } as unknown as Response;
  handler({ user } as unknown as Request, res, (() => { outcome = 'next'; }) as NextFunction);
  return outcome;
};

test('changing the rates needs tour:update; reading them stays public', () => {
  const put = handlersOf('put', '/rates');
  assert.equal(put.length, 3, 'protect, the permission check, the controller');
  const guard = put[1];
  assert.equal(run(guard, { role: 'admin', permissions: [] }), '403');
  assert.equal(run(guard, { role: 'admin', permissions: ['blog:update', 'booking:read'] }), '403');
  assert.equal(run(guard, { role: 'admin', permissions: ['tour:update'] }), 'next');
  assert.equal(run(guard, { role: 'superadmin', permissions: [] }), 'next');
  assert.equal(run(guard, undefined), '401');

  assert.equal(handlersOf('get', '/rates').length, 1, 'GET /rates has no guard');
});

test('converted prices round to the nearest 5; manual prices stay as entered', () => {
  assert.equal(roundConvertedPrice(92), 90);
  assert.equal(roundConvertedPrice(79), 80);
  assert.equal(roundConvertedPrice(97.5), 100);
  assert.equal(roundConvertedPrice(100 * 0.925), 95);
  assert.equal(roundConvertedPrice(2), 5);
  assert.equal(roundConvertedPrice(0), 0);

  // The listing card price (and so the filter and sort) …
  assert.equal(effectiveStartingPrice({ USD: 100 }, 'EUR', 0.92), 90);
  assert.equal(effectiveStartingPrice({ USD: 100 }, 'GBP', 0.79), 80);
  assert.equal(effectiveStartingPrice({ USD: 100, EUR: 87 }, 'EUR', 0.92), 87);
  assert.equal(effectiveStartingPrice({ USD: 99.5 }, 'USD', 1), 99.5);
  assert.equal(effectiveStartingPrice({ USD: 0 }, 'EUR', 0.92), undefined);
  // A card's converted price is the rule's own result (the one the pages use).
  for (const rate of [0.79, 0.92, 0.925, 0.95]) {
    for (let usd = 1; usd <= 2000; usd += 3) {
      assert.equal(effectiveStartingPrice({ USD: usd }, 'EUR', rate), roundConvertedPrice(usd * rate), `${usd} × ${rate}`);
    }
  }

  // … and the booking quote follow the same rule.
  assert.equal(resolveTourStartingQuote({ USD: 100 }, 'EUR', { EUR: 0.92, GBP: 0.79 }), 90);
  assert.equal(resolveTourStartingQuote({ USD: 100 }, 'GBP', { EUR: 0.92, GBP: 0.79 }), 80);
  assert.equal(resolveTourStartingQuote({ USD: 100, EUR: 87.5 }, 'EUR', { EUR: 0.92 }), 87.5);
  assert.equal(resolveTourStartingQuote({ USD: 99.5 }, 'USD'), 99.5);
});
