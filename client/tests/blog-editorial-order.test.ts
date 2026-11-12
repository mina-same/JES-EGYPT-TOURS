import assert from 'node:assert/strict';
import test from 'node:test';
import { getBlogsByIds } from '../src/lib/api/blog';

/*
 * A tour's article references are an editor's list, in the order the editor
 * put them. The API reads them in its own chronological order (newest first,
 * like every article list it serves), so the order the tour page shows has to
 * come from the stored ids, not from the response.
 */

const ID = (n: number) => `64b00000000000000000000${n}`;

/** Runs `read` with the API answering `data`, in that order. */
async function answering<T>(data: { _id: string }[], read: () => Promise<T>): Promise<T> {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ success: true, data }), { status: 200 })) as typeof fetch;
  try {
    return await read();
  } finally {
    globalThis.fetch = realFetch;
  }
}

test("a tour's article references come back in the editor's order, not the API's", async () => {
  const stored = [ID(3), ID(1), ID(2)];
  // Newest first, as the API sorts them.
  const result = await answering([{ _id: ID(1) }, { _id: ID(2) }, { _id: ID(3) }], () => getBlogsByIds(stored, 'en'));
  assert.deepEqual(result.map((post) => post._id), stored);
});

test('a reference the language cannot show is left out, and the rest keep their order', async () => {
  const stored = [ID(4), ID(1), ID(3), ID(2)];
  // The API returns only the articles public in the language — not ID(3).
  const result = await answering([{ _id: ID(1) }, { _id: ID(2) }, { _id: ID(4) }], () => getBlogsByIds(stored, 'es'));
  assert.deepEqual(result.map((post) => post._id), [ID(4), ID(1), ID(2)]);
});

test('a reference listed twice appears once, where the editor first put it', async () => {
  const result = await answering([{ _id: ID(2) }, { _id: ID(1) }], () => getBlogsByIds([ID(1), ID(2), ID(1)], 'en'));
  assert.deepEqual(result.map((post) => post._id), [ID(1), ID(2)]);
});
