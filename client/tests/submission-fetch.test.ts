import assert from 'node:assert/strict';
import test from 'node:test';
import { submissionFetch } from '../src/lib/submissionFetch';

test('submission retry reuses its key after a lost response and clears it after success', async context => {
  const keys: string[] = [];
  const stored = new Map<string, string>();
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (key: string) => stored.get(key) || null, setItem: (key: string, value: string) => stored.set(key, value), removeItem: (key: string) => stored.delete(key) } });
  context.after(() => {
    if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  });
  let fail = true;
  context.mock.method(globalThis, 'fetch', async (_url: any, options: any) => {
    keys.push(options.headers.get('Idempotency-Key'));
    if (fail) { fail = false; throw new Error('Lost response'); }
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  });
  const options = { method: 'POST', body: JSON.stringify({ email: 'visitor@example.com', message: 'Question' }) };
  await assert.rejects(submissionFetch('/test-retry', options));
  assert.equal(stored.size, 1);
  assert.equal(JSON.stringify([...stored]).includes('visitor@example.com'), false);
  await submissionFetch('/test-retry', options);
  assert.equal(keys[0], keys[1]);
  assert.equal(stored.size, 0);
  await submissionFetch('/test-retry', options);
  assert.notEqual(keys[1], keys[2]);
});

test('simultaneous submissions send once and give each caller a readable response', async context => {
  let writes = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  context.mock.method(globalThis, 'fetch', async () => {
    writes++;
    await gate;
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  });
  const options = { method: 'POST', body: '{"message":"Simultaneous"}' };
  const first = submissionFetch('/test-concurrent', options);
  const second = submissionFetch('/test-concurrent', options);
  // Let both asynchronous digests settle before completing the request.
  await new Promise(resolve => setTimeout(resolve, 30));
  release();
  const results = await Promise.all([first, second]);
  assert.equal(writes, 1);
  assert.deepEqual(await results[0].json(), { success: true });
  assert.deepEqual(await results[1].json(), { success: true });
});
