import assert from 'node:assert/strict';
import test from 'node:test';
import axios, { AxiosError } from 'axios';
import { API_URL } from '../src/config/api';
import i18n from '../src/lib/i18n';
import { publicGet } from '../src/lib/api/publicGet';

/*
 * publicGet stands in for the shared axios instance on a visitor's reads. What
 * it sends and how it settles are held to axios itself wherever axios can
 * say: the URL against axios's own serializer, the failures against the codes
 * axios uses.
 */

type Call = { url: string; init: RequestInit };

/** Runs `body` with fetch answered by `reply`; `calls` records what was sent. */
async function withFetch(
  reply: (call: Call) => Response | Promise<Response>,
  body: (calls: Call[]) => Promise<void>
) {
  const realFetch = globalThis.fetch;
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
    const call = { url: String(url), init };
    calls.push(call);
    return reply(call);
  }) as typeof fetch;
  try {
    await body(calls);
  } finally {
    globalThis.fetch = realFetch;
  }
}

/** Runs `body` as a page at `pathname` would, with `token` in localStorage. */
async function inBrowser(pathname: string, token: string | null, body: () => Promise<void>) {
  const scope = globalThis as { window?: unknown };
  scope.window = {
    localStorage: { getItem: (key: string) => (key === 'authToken' ? token : null) },
    location: { pathname },
  };
  try {
    await body();
  } finally {
    delete scope.window;
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const QUERIES: Array<[label: string, params: object]> = [
  ['a listing page', { category: '69d997e58c49683e211c7f9c', page: 2, limit: 9, sort: 'recommended', destinationKeys: undefined, durationRange: undefined, currency: 'USD' }],
  ['ids joined with commas', { ids: 'a1,b2,c3' }],
  ['a locale-qualified sort', { isSpecialOffer: true, sort: 'heading.de', fields: 'slug,heading,name' }],
  ['a descending sort and a boolean', { limit: 12, isActive: true, sort: '-createdAt' }],
  ['a search with spaces and reserved characters', { search: 'nile cruise & luxor: 5 days, $900 + flights' }],
  ['non-ASCII text', { search: 'Ägypten für €5 – 100%' }],
  ['zero, false and the empty string', { minPrice: 0, isFeatured: false, search: '' }],
  ['null and undefined only', { limit: undefined, sort: null }],
  ['a date', { from: new Date(Date.UTC(2026, 9, 9, 12, 30)) }],
  ['an array of plain values', { tags: ['nile', 'red sea'] }],
  ['nested values', { filter: { price: { min: 1, max: 9 } }, list: [{ id: 1 }, { id: 2 }], pairs: [[1, 2]] }],
  ['a key with spaces around it', { ' limit ': 3 }],
];

for (const [label, params] of QUERIES) {
  test(`the query string is the one axios writes: ${label}`, async () => {
    await withFetch(() => json({ success: true }), async (calls) => {
      await publicGet('/tours', { params });
      assert.equal(calls[0].url, axios.getUri({ baseURL: API_URL, url: 'tours', params }));
    });
  });
}

test('a path that already carries a query keeps it, and params join it with "&"', async () => {
  await withFetch(() => json({ success: true }), async (calls) => {
    await publicGet('/blog/posts/featured?limit=3');
    await publicGet('/blog/posts/featured?limit=3', { params: { locale: 'de' } });
    assert.equal(calls[0].url, `${API_URL}/blog/posts/featured?limit=3`);
    assert.equal(calls[1].url, axios.getUri({ baseURL: API_URL, url: 'blog/posts/featured?limit=3', params: { locale: 'de' } }));
  });
});

test('on the server: axios\'s Accept, the call\'s own headers, cookies included, the signal passed on', async () => {
  const controller = new AbortController();
  await withFetch(() => json({ success: true }), async (calls) => {
    await publicGet('/tours/slug/nile-cruise', { headers: { 'X-Locale': 'de' }, signal: controller.signal });
    assert.deepEqual(calls[0].init.headers, { Accept: 'application/json, text/plain, */*', 'X-Locale': 'de' });
    assert.equal(calls[0].init.credentials, 'include');
    assert.equal(calls[0].init.signal, controller.signal);
    assert.equal(calls[0].init.method, undefined);
    assert.equal(calls[0].init.body, undefined);
  });
});

test('in a visitor\'s browser the page language wins over the call\'s X-Locale, and a stored token is sent', async () => {
  await i18n.changeLanguage('de');
  await withFetch(() => json({ success: true }), async (calls) => {
    await inBrowser('/de/kairo', 'stored-token', async () => {
      await publicGet('/tours', { headers: { 'X-Locale': 'it' } });
    });
    await inBrowser('/de/kairo', null, async () => {
      await publicGet('/tours');
    });
    assert.deepEqual(calls[0].init.headers, {
      Accept: 'application/json, text/plain, */*',
      'X-Locale': 'de',
      Authorization: 'Bearer stored-token',
    });
    assert.deepEqual(calls[1].init.headers, { Accept: 'application/json, text/plain, */*', 'X-Locale': 'de' });
  });
});

test('under /admin the locale is "bypass", as the axios interceptor sets it', async () => {
  await withFetch(() => json({ success: true }), async (calls) => {
    await inBrowser('/admin/tour/tour', 'stored-token', async () => {
      await publicGet('/tours');
    });
    assert.equal((calls[0].init.headers as Record<string, string>)['X-Locale'], 'bypass');
  });
});

test('a 2xx resolves to the parsed body: JSON as JSON, anything else as its text, nothing as ""', async () => {
  await withFetch(() => json({ success: true, data: [1, 2] }), async () => {
    assert.deepEqual(await publicGet('/tours'), { success: true, data: [1, 2] });
  });
  await withFetch(() => new Response('plain text', { status: 200 }), async () => {
    assert.equal(await publicGet('/tours'), 'plain text');
  });
  await withFetch(() => new Response(null, { status: 204 }), async () => {
    assert.equal(await publicGet('/tours'), '');
  });
});

const FAILURES: Array<[status: number, code: string | undefined, body: unknown]> = [
  [400, AxiosError.ERR_BAD_REQUEST, { success: false, error: 'Bad sort' }],
  [404, AxiosError.ERR_BAD_REQUEST, { success: false, error: 'Not found' }],
  [429, AxiosError.ERR_BAD_REQUEST, 'Too many requests'],
  [500, AxiosError.ERR_BAD_RESPONSE, { success: false, error: 'Boom' }],
  [503, AxiosError.ERR_BAD_RESPONSE, ''],
];

for (const [status, code, body] of FAILURES) {
  test(`a ${status} rejects as axios rejects it, with the status and the body on error.response`, async () => {
    const reply = () =>
      typeof body === 'string' ? new Response(body || null, { status }) : json(body, status);
    await withFetch(reply, async () => {
      await assert.rejects(publicGet('/tours'), (error: any) => {
        assert.equal(error.message, `Request failed with status code ${status}`);
        assert.equal(error.code, code);
        assert.deepEqual(error.response, { status, data: body });
        return true;
      });
    });
  });
}

test('a request that never gets an answer rejects as axios\'s network error, with no response', async () => {
  await withFetch(() => { throw new TypeError('Failed to fetch'); }, async () => {
    await assert.rejects(publicGet('/tours'), (error: any) => {
      assert.equal(error.message, 'Network Error');
      assert.equal(error.code, AxiosError.ERR_NETWORK);
      assert.equal(error.response, undefined);
      return true;
    });
  });
});

test('an aborted request rejects with axios\'s ERR_CANCELED, before the answer or while reading it', async () => {
  const abortError = () => Object.assign(new Error('This operation was aborted'), { name: 'AbortError' });

  const early = new AbortController();
  early.abort();
  await withFetch(() => { throw abortError(); }, async () => {
    await assert.rejects(publicGet('/tours', { signal: early.signal }), (error: any) => {
      assert.equal(error.code, AxiosError.ERR_CANCELED);
      assert.equal(error.message, 'canceled');
      return true;
    });
  });

  const late = new AbortController();
  const reply = () => ({
    status: 200,
    text: async () => { late.abort(); throw abortError(); },
  }) as unknown as Response;
  await withFetch(reply, async () => {
    await assert.rejects(publicGet('/tours', { signal: late.signal }), (error: any) => {
      assert.equal(error.code, AxiosError.ERR_CANCELED);
      return true;
    });
  });
});
