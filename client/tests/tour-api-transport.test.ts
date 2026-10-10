import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/*
 * lib/api/tour.ts serves the visitor pages and the admin from one file. A
 * visitor's reads go out by fetch (publicGet), so those pages no longer load
 * axios; everything the admin does, every write, and server rendering stay on
 * the shared axios instance and its interceptors. This holds each method to
 * its side of that line.
 */

type Call = [via: string, url: string, config?: unknown];
type ClientName = 'tourCategoryAPI' | 'tourSubcategoryAPI' | 'tourAPI';

// Compile the real module, as the app does, with its two transports stubbed.
function loadTourApi(calls: Call[]) {
  const url = new URL('../src/lib/api/tour.ts', import.meta.url);
  const require = createRequire(url);
  const compiledModule = { exports: {} as any };
  const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    fileName: fileURLToPath(url),
  }).outputText;
  const axiosCall = (method: string) => async (path: string, payload?: unknown) => {
    calls.push([`axios.${method}`, path, payload]);
    return { data: { success: true, via: 'axios' } };
  };
  const overrides: Record<string, unknown> = {
    './publicGet': {
      publicGet: async (path: string, config?: unknown) => {
        calls.push(['fetch', path, config]);
        return { success: true, via: 'fetch' };
      },
    },
    './axios': {
      __esModule: true,
      default: {
        get: axiosCall('get'),
        post: axiosCall('post'),
        put: axiosCall('put'),
        patch: axiosCall('patch'),
        delete: axiosCall('delete'),
      },
    },
  };
  new Function('require', 'module', 'exports', compiled)(
    (id: string) => overrides[id] ?? require(id), compiledModule, compiledModule.exports);
  return compiledModule.exports as Record<ClientName, Record<string, (...args: any[]) => Promise<any>>>;
}

/** Runs `body` as a page at `pathname` would; no pathname is a server render. */
async function at(pathname: string | null, body: () => Promise<void>) {
  const scope = globalThis as { window?: unknown };
  if (pathname) scope.window = { location: { pathname } };
  try {
    await body();
  } finally {
    delete scope.window;
  }
}

const signal = new AbortController().signal;

/** Every read: [api, method, arguments, path, what reaches the transport]. */
const READS: Array<[ClientName, string, unknown[], string, unknown]> = [
  ['tourCategoryAPI', 'getAll', [{ limit: 5 }], 'tours/categories', { params: { limit: 5 } }],
  ['tourCategoryAPI', 'getById', ['c1'], 'tours/categories/c1', undefined],
  ['tourCategoryAPI', 'getBySlug', ['day-tours', 'de'], 'tours/categories/slug/day-tours', { headers: { 'X-Locale': 'de' } }],
  ['tourSubcategoryAPI', 'getAll', [{ isActive: true }], 'tours/subcategories', { params: { isActive: true } }],
  ['tourSubcategoryAPI', 'getByCategory', ['c1', { limit: 3 }, 'it'], 'tours/categories/c1/subcategories', { params: { limit: 3 }, headers: { 'X-Locale': 'it' } }],
  ['tourSubcategoryAPI', 'getById', ['s1'], 'tours/subcategories/s1', undefined],
  ['tourSubcategoryAPI', 'getBySlug', ['cairo-day-tours', 'c1', 'es'], 'tours/subcategories/slug/cairo-day-tours', { params: { category: 'c1' }, headers: { 'X-Locale': 'es' } }],
  ['tourAPI', 'getAll', [{ page: 2, limit: 9 }, 'de', signal], 'tours', { params: { page: 2, limit: 9 }, headers: { 'X-Locale': 'de' }, signal }],
  ['tourAPI', 'getFilterOptions', [{ category: 'c1', currency: 'EUR' }, 'de', signal], 'tours/filter-options', { params: { category: 'c1', currency: 'EUR' }, headers: { 'X-Locale': 'de' }, signal }],
  ['tourAPI', 'getFeatured', [24], 'tours/featured', { params: { limit: 24 } }],
  ['tourAPI', 'getBySubcategory', ['s1', { limit: 12 }], 'tours/subcategories/s1/tours', { params: { limit: 12 } }],
  ['tourAPI', 'getById', ['t1'], 'tours/t1', undefined],
  ['tourAPI', 'getByIds', [['t1', 't2']], 'tours/by-ids', { params: { ids: 't1,t2' } }],
  ['tourAPI', 'getBySlug', ['nile-cruise', 'de'], 'tours/slug/nile-cruise', { headers: { 'X-Locale': 'de' } }],
  ['tourAPI', 'getByExternalId', ['x1'], 'tours/external/x1', undefined],
  ['tourAPI', 'getRelated', ['t1', 4], 'tours/t1/related', { params: { limit: 4 } }],
];

/** Everything else: [api, method, arguments, axios method, path]. */
const AXIOS_ONLY: Array<[ClientName, string, unknown[], string, string]> = [
  ['tourCategoryAPI', 'create', [{ a: 1 }], 'post', 'tours/categories'],
  ['tourCategoryAPI', 'update', ['c1', { a: 1 }], 'put', 'tours/categories/c1'],
  ['tourCategoryAPI', 'toggleStatus', ['c1'], 'patch', 'tours/categories/c1/toggle-active'],
  ['tourCategoryAPI', 'delete', ['c1'], 'delete', 'tours/categories/c1'],
  ['tourSubcategoryAPI', 'create', [{ a: 1 }], 'post', 'tours/subcategories'],
  ['tourSubcategoryAPI', 'update', ['s1', { a: 1 }], 'put', 'tours/subcategories/s1'],
  ['tourSubcategoryAPI', 'toggleStatus', ['s1'], 'patch', 'tours/subcategories/s1/toggle-active'],
  ['tourSubcategoryAPI', 'delete', ['s1'], 'delete', 'tours/subcategories/s1'],
  ['tourAPI', 'create', [{ a: 1 }], 'post', 'tours'],
  ['tourAPI', 'update', ['t1', { a: 1 }], 'put', 'tours/t1'],
  ['tourAPI', 'toggleStatus', ['t1'], 'patch', 'tours/t1/toggle-active'],
  ['tourAPI', 'toggleFeatured', ['t1'], 'patch', 'tours/t1/toggle-featured'],
  ['tourAPI', 'delete', ['t1'], 'delete', 'tours/t1'],
  // The one read behind `protect`: a 401 from it must reach the interceptor.
  ['tourAPI', 'getStats', [], 'get', 'tours/stats'],
];

/** A config as the transports receive it, without the keys left undefined. */
const defined = (config: unknown) =>
  config === undefined ? undefined : Object.fromEntries(Object.entries(config as object).filter(([, value]) => value !== undefined));

test('every method of the three clients is on one of the two lists', () => {
  const api = loadTourApi([]);
  for (const name of ['tourCategoryAPI', 'tourSubcategoryAPI', 'tourAPI'] as const) {
    const listed = [...READS, ...AXIOS_ONLY].filter(([owner]) => owner === name).map(([, method]) => method).sort();
    assert.deepEqual(Object.keys(api[name]).sort(), listed, name);
  }
});

test('in a visitor\'s browser every read is a fetch of the same path, with the same query, headers and signal', async () => {
  for (const pathname of ['/en/egypt-tour-packages', '/de/search', '/en/wishlist', '/it']) {
    for (const [owner, method, args, path, config] of READS) {
      const calls: Call[] = [];
      const api = loadTourApi(calls);
      let body: unknown;
      await at(pathname, async () => { body = await api[owner][method](...args); });
      assert.deepEqual(calls.map(([via, url]) => [via, url]), [['fetch', `/${path}`]], `${owner}.${method} on ${pathname}`);
      assert.deepEqual(defined(calls[0][2]), config, `${owner}.${method} config`);
      assert.deepEqual(body, { success: true, via: 'fetch' });
    }
  }
});

test('under /admin and during server rendering the same reads go through the axios instance, unchanged', async () => {
  for (const pathname of ['/admin/tour/tour', '/admin', null]) {
    for (const [owner, method, args, path, config] of READS) {
      const calls: Call[] = [];
      const api = loadTourApi(calls);
      let body: unknown;
      await at(pathname, async () => { body = await api[owner][method](...args); });
      assert.deepEqual(calls.map(([via, url]) => [via, url]), [['axios.get', path]], `${owner}.${method} on ${pathname ?? 'the server'}`);
      assert.deepEqual(defined(calls[0][2]), config, `${owner}.${method} config`);
      assert.deepEqual(body, { success: true, via: 'axios' }, 'the response body, as before');
    }
  }
});

test('every write, and the authenticated stats read, use the axios instance wherever they are called from', async () => {
  for (const pathname of ['/en/egypt-tour-packages', '/admin/tour/tour', null]) {
    for (const [owner, method, args, verb, path] of AXIOS_ONLY) {
      const calls: Call[] = [];
      const api = loadTourApi(calls);
      let body: unknown;
      await at(pathname, async () => { body = await api[owner][method](...args); });
      assert.deepEqual(calls.map(([via, url]) => [via, url]), [[`axios.${verb}`, path]], `${owner}.${method} on ${pathname ?? 'the server'}`);
      assert.deepEqual(body, { success: true, via: 'axios' });
    }
  }
});
