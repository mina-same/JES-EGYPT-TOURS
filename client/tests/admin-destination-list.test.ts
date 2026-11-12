import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  DESTINATION_PAGE_SIZE,
  fetchAllDestinations,
} from '../src/lib/admin/fetchAllDestinations';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const source = (path: string) => readFileSync(join(SRC, path), 'utf8');

type Row = { _id: string; name: { en: string }; status: 'draft' | 'published' };

// The 13 destinations in the database (November 2026). By English name,
// Sharm El Sheikh, Siwa Oasis and "Visit Giza…" are the 11th to 13th.
const REAL: Array<[string, Row['status']]> = [
  ['Cairo', 'published'], ['Visit Giza: Complete Travel Guide', 'published'], ['Luxor', 'published'],
  ['Aswan', 'published'], ['Alexandria', 'published'], ['Sharm El Sheikh', 'published'],
  ['Hurghada', 'published'], ['Siwa Oasis', 'published'], ['Marsa Alam', 'draft'], ['Fayoum', 'draft'],
  ['Abu Simbel', 'draft'], ['Edfu', 'draft'], ['Kom Ombo', 'draft'],
];
const rows = (names: Array<[string, Row['status']]>): Row[] =>
  names.map(([en, status], index) => ({ _id: `d${String(index).padStart(4, '0')}`, name: { en }, status }));

const read = (row: Row, path: string): string => path.split('.').reduce<any>((value, key) => value?.[key], row) ?? '';

/**
 * GET /api/destinations as server/src/controllers/destinationController.ts
 * answers an Admin: `limit` defaults to 10, `sort` to 'name.en' (space
 * separated fields, ascending), drafts are included.
 */
function destinationsApi(all: Row[]) {
  const requests: Array<Record<string, unknown>> = [];
  const getAll = async (params: Record<string, unknown> = {}) => {
    requests.push(params);
    const page = parseInt(String(params.page ?? '1'), 10);
    const limit = parseInt(String(params.limit ?? '10'), 10);
    const fields = String(params.sort || 'name.en').split(' ');
    const matching = [...all]
      .sort((a, b) => {
        for (const field of fields) {
          const [x, y] = [read(a, field), read(b, field)];
          if (x !== y) return x < y ? -1 : 1;
        }
        return 0;
      });
    const start = (page - 1) * limit;
    return { success: true, data: matching.slice(start, start + limit), total: matching.length, page, totalPages: Math.ceil(matching.length / limit) };
  };
  return { getAll, requests };
}

const PAST_THE_TENTH = ['Sharm El Sheikh', 'Siwa Oasis', 'Visit Giza: Complete Travel Guide'];

test('one request without a limit stops at the tenth destination (the bug)', async () => {
  const api = destinationsApi(rows(REAL));
  const once = await api.getAll({});
  assert.equal(once.data.length, 10);
  for (const name of PAST_THE_TENTH) assert.ok(!once.data.some((row) => row.name.en === name), name);
});

test('every destination comes back, including those past the tenth and the drafts', async () => {
  const api = destinationsApi(rows(REAL));
  const result = await fetchAllDestinations(api.getAll, {});

  assert.equal(result.success, true);
  assert.equal(result.data.length, 13);
  for (const name of PAST_THE_TENTH) assert.ok(result.data.some((row) => row.name.en === name), name);
  assert.deepEqual(result.data.filter((row) => row.status === 'draft').map((row) => row.name.en).sort(), ['Abu Simbel', 'Edfu', 'Fayoum', 'Kom Ombo', 'Marsa Alam']);
  // Still the pickers' alphabetical order.
  assert.deepEqual(result.data.map((row) => row.name.en), [...result.data.map((row) => row.name.en)].sort());
  // An explicit page and limit, and no other filter.
  assert.deepEqual(api.requests, [{ page: 1, limit: DESTINATION_PAGE_SIZE, sort: 'name.en _id' }]);
});

test("the caller's filters go out unchanged with every page", async () => {
  const api = destinationsApi(rows(Array.from({ length: 150 }, (_, index) => [`P ${String(index).padStart(3, '0')}`, 'published'])));
  await fetchAllDestinations(api.getAll, { search: 'p' });
  assert.deepEqual(api.requests, [1, 2].map((page) => ({ search: 'p', page, limit: DESTINATION_PAGE_SIZE, sort: 'name.en _id' })));
});

test('it keeps working as destinations are added: 250 come back in three requests, each once', async () => {
  const many = rows(Array.from({ length: 250 }, (_, index) => [`Place ${String(index).padStart(3, '0')}`, index % 3 ? 'published' : 'draft']));
  const api = destinationsApi(many);
  const result = await fetchAllDestinations(api.getAll, {});

  assert.equal(result.data.length, 250);
  assert.equal(new Set(result.data.map((row) => row._id)).size, 250);
  assert.deepEqual(api.requests.map((request) => request.page), [1, 2, 3]);
});

test('two destinations with the same name are both kept, in a stable order across pages', async () => {
  const twins = rows([...Array.from({ length: 99 }, (_, index): [string, Row['status']] => [`A ${String(index).padStart(2, '0')}`, 'published']), ['Same', 'published'], ['Same', 'draft']]);
  const result = await fetchAllDestinations(destinationsApi(twins).getAll, {});
  assert.equal(result.data.length, 101);
  assert.deepEqual(result.data.filter((row) => row.name.en === 'Same').map((row) => row._id), ['d0099', 'd0100']);
});

test('a failed page fails the whole list instead of returning a short one', async () => {
  const api = destinationsApi(rows(Array.from({ length: 150 }, (_, index) => [`P ${String(index).padStart(3, '0')}`, 'published'])));
  const failing = async (params: Record<string, unknown>) => (params.page === 2 ? { success: false } : api.getAll(params));
  assert.deepEqual(await fetchAllDestinations(failing, {}), { success: false, data: [] });
});

test('an empty page ends the walk even when the answer claims more pages', async () => {
  let calls = 0;
  const result = await fetchAllDestinations(async () => { calls += 1; return { success: true, data: [], totalPages: 99 }; }, {});
  assert.deepEqual(result, { success: true, data: [] });
  assert.equal(calls, 1);
});

const ARTICLE_PAGES = [
  'app/(admin)/admin/blogs/articles/new/page.tsx',
  'app/(admin)/admin/blogs/articles/[id]/edit/page.tsx',
  'app/(admin)/admin/blogs/articles/page.tsx',
];

test('the article editor (new and edit) and the articles list load every destination', () => {
  for (const page of ARTICLE_PAGES) {
    const text = source(page);
    assert.ok(text.includes('fetchAllDestinations((params) => destinationAPI.getAll(params), {})'), page);
    assert.ok(!text.includes('destinationAPI.getAll({ isActive: true })'), page);
  }
});

/** The argument text of every `destinationAPI.getAll(` call in a file. */
function getAllArguments(text: string): string[] {
  const found: string[] = [];
  const marker = 'destinationAPI.getAll(';
  for (let at = text.indexOf(marker); at !== -1; at = text.indexOf(marker, at + 1)) {
    let depth = 1;
    let end = at + marker.length;
    while (end < text.length && depth > 0) {
      if (text[end] === '(') depth += 1;
      if (text[end] === ')') depth -= 1;
      end += 1;
    }
    found.push(text.slice(at + marker.length, end - 1).trim());
  }
  return found;
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('no Admin request for destinations relies on the API default of 10 rows', () => {
  const files = ['app/(admin)', 'components/admin', 'hooks', 'lib/admin'].flatMap((dir) => filesUnder(join(SRC, dir)));
  const calls = files.flatMap((file) => getAllArguments(readFileSync(file, 'utf8')).map((args) => ({ file, args })));
  assert.ok(calls.length >= 9, `found ${calls.length} calls`);
  for (const { file, args } of calls) {
    // `params` is a request built with a page and limit: the paged walk above
    // or the destinations table's own pagination.
    assert.ok(args === 'params' || /\blimit\b/.test(args), `${file}: destinationAPI.getAll(${args})`);
    // Destinations have one switch, `status`; `isActive` is not one of their filters.
    assert.ok(!/isActive/.test(args), `${file}: destinationAPI.getAll(${args})`);
  }
});
