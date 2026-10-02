import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

function loadSource(relative: string) {
  const url = new URL(relative, import.meta.url);
  const require = createRequire(url);
  const compiledModule = { exports: {} as any };
  const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
    // ES2020: the default ES5 target turns `[...aSet]` into an empty array.
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: fileURLToPath(url),
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(require, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const { loadTourRelatedContent } = loadSource('../src/lib/tour/relatedContent.ts');

/**
 * The algorithm as it ran inside useTourData before the related content moved
 * out (fully sequential: curated lookups started first, then the "More Tours"
 * chain, then - only after that chain - the featured-articles fallback).
 * Kept verbatim so every fixture can assert the new loader returns exactly the
 * same content from exactly the same requests.
 */
async function baselineLoad(tour: any, currentLang: string, api: any, featuredLimit: number) {
  const safeArray = (value: any): any[] => (Array.isArray(value) ? value : []);
  const tourId = tour._id;
  const getTourId = (value: any): string => {
    if (typeof value === 'string') return value;
    const valueId = value?.id ?? value?._id;
    return valueId == null ? '' : String(valueId);
  };
  const curatedRelatedTourIds = new Set(safeArray(tour.relatedTours).map(getTourId).filter(Boolean));
  const excludedMoreTourIds = new Set([...(tourId ? [String(tourId)] : []), ...curatedRelatedTourIds]);
  const isEligibleMoreTour = (candidate: any) => {
    const candidateId = getTourId(candidate);
    return Boolean(candidateId) && !excludedMoreTourIds.has(candidateId);
  };
  const subId = typeof tour.subcategory === 'object' ? tour.subcategory?._id || tour.subcategory : tour.subcategory;
  const catId = typeof tour.subcategory === 'object' && tour.subcategory?.category
    ? (typeof tour.subcategory.category === 'object' ? tour.subcategory.category._id : tour.subcategory.category)
    : undefined;
  const commonDataPromises = [
    (async () => {
      const selectedIds = Array.from(curatedRelatedTourIds) as string[];
      if (selectedIds.length === 0) return [];
      try {
        const res = await api.getToursByIds(selectedIds);
        if (!res?.success || !res?.data) return [];
        const toursById = new Map(safeArray(res.data).filter((t) => t?.isActive !== false).map((t) => [getTourId(t), t]));
        return selectedIds.map((id) => toursById.get(id)).filter(Boolean);
      } catch { return []; }
    })(),
    (async () => {
      const selectedBlogIds = safeArray(tour.blogReferences).map((ref) => String(ref?.id || '')).filter(Boolean);
      try { return await api.getBlogsByIds(selectedBlogIds, currentLang); } catch { return []; }
    })(),
  ];
  const fetchedMoreToursRaw: any[] = [];
  try {
    const mergeUnique = (candidates: any[]) => {
      const existingIds = new Set(fetchedMoreToursRaw.map(getTourId).filter(Boolean));
      candidates.filter(isEligibleMoreTour).forEach((candidate) => {
        const candidateId = getTourId(candidate);
        if (candidateId && !existingIds.has(candidateId)) { fetchedMoreToursRaw.push(candidate); existingIds.add(candidateId); }
      });
    };
    const moreToursRes = subId ? await api.getToursBySubcategory(String(subId), { limit: 12, isActive: true }) : { success: false, data: [] };
    if (moreToursRes.success) mergeUnique(safeArray(moreToursRes.data));
    if (fetchedMoreToursRaw.length < 9 && catId) {
      const catMoreRes = await api.getTours({ category: String(catId), limit: 15, isActive: true });
      if (catMoreRes.success) mergeUnique(safeArray(catMoreRes.data));
    }
    if (fetchedMoreToursRaw.length < 9) {
      const allMoreRes = await api.getTours({ limit: 15, isActive: true });
      if (allMoreRes.success) mergeUnique(safeArray(allMoreRes.data));
    }
  } catch { /* "more tours" lookup failed */ }
  const [relatedToursData, blogDataRaw] = await Promise.all(commonDataPromises);
  let fetchedRelatedBlogs = safeArray(blogDataRaw).filter(Boolean);
  if (fetchedRelatedBlogs.length === 0) {
    try {
      const res = await api.getFeaturedBlogs(featuredLimit);
      if (res?.success) fetchedRelatedBlogs = safeArray(res.data);
    } catch { /* ignore */ }
  }
  return { relatedTours: safeArray(relatedToursData).filter(Boolean), moreTours: fetchedMoreToursRaw, relatedBlogs: fetchedRelatedBlogs };
}

// ---- fixture world -------------------------------------------------------
const tour = (id: string, extra: Record<string, unknown> = {}) => ({ _id: id, isActive: true, ...extra });
const ids = (list: any[]) => list.map((t) => t._id ?? t.id);
const range = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => tour(`${prefix}${i + 1}`));

interface World {
  bySub?: any; byCat?: any; any?: any; byIds?: any; blogsByIds?: any; featured?: any;
  throwOn?: string[];
}

/** A fake API: records every call (in start order) and answers after a delay. */
function makeApi(world: World, delays: Record<string, number> = {}) {
  const calls: string[] = [];
  const answer = async (name: string, value: any, args: unknown[]) => {
    calls.push(`${name} ${JSON.stringify(args)}`);
    await new Promise((r) => setTimeout(r, delays[name] ?? 1));
    if (world.throwOn?.includes(name)) throw new Error(`${name} failed`);
    return value;
  };
  return {
    calls,
    api: {
      getToursByIds: (idList: string[]) => answer('byIds', world.byIds ?? { success: true, data: [] }, [idList]),
      // The real getBlogsByIds makes no request for an empty list.
      getBlogsByIds: (idList: string[], locale: string) =>
        idList.length === 0 ? Promise.resolve([]) : answer('blogsByIds', world.blogsByIds ?? [], [idList, locale]),
      getToursBySubcategory: (sub: string, params: unknown) => answer('bySub', world.bySub ?? { success: true, data: [] }, [sub, params]),
      getTours: (params: any) =>
        params.category
          ? answer('byCat', world.byCat ?? { success: true, data: [] }, [params])
          : answer('any', world.any ?? { success: true, data: [] }, [params]),
      getFeaturedBlogs: (limit: number) => answer('featured', world.featured ?? { success: true, data: [] }, [limit]),
    },
  };
}

const SUB = { _id: 'sub1', category: { _id: 'cat1' } };
const current = (extra: Record<string, unknown> = {}) => tour('T0', { subcategory: SUB, ...extra });

async function compare(name: string, theTour: any, world: World, locale = 'en') {
  const a = makeApi(world), b = makeApi(world);
  const expected = await baselineLoad(theTour, locale, a.api, 3);
  const actual = await loadTourRelatedContent(theTour, locale, b.api, 3);
  assert.deepEqual(actual, expected, `${name}: same content`);
  assert.deepEqual([...b.calls].sort(), [...a.calls].sort(), `${name}: same requests`);
  return { actual, calls: b.calls };
}

test('enough subcategory results: no category or catch-all lookup', async () => {
  const { actual, calls } = await compare('enough', current(), { bySub: { success: true, data: range('S', 10) } });
  assert.equal(actual.moreTours.length, 10);
  assert.ok(!calls.some((c) => c.startsWith('byCat') || c.startsWith('any')));
});

test('insufficient subcategory results fall back to the category', async () => {
  const { actual, calls } = await compare('category', current(), {
    bySub: { success: true, data: range('S', 4) },
    byCat: { success: true, data: range('C', 6) },
  });
  assert.deepEqual(ids(actual.moreTours), ['S1', 'S2', 'S3', 'S4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
  assert.ok(!calls.some((c) => c.startsWith('any')));
});

test('broader fallback when subcategory and category are still short', async () => {
  const { actual, calls } = await compare('broad', current(), {
    bySub: { success: true, data: range('S', 2) },
    byCat: { success: true, data: range('C', 3) },
    any: { success: true, data: range('A', 6) },
  });
  assert.deepEqual(ids(actual.moreTours), ['S1', 'S2', 'C1', 'C2', 'C3', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
  assert.ok(calls.some((c) => c.startsWith('any')));
});

test('no results anywhere', async () => {
  const { actual } = await compare('empty', current(), {});
  assert.deepEqual(actual, { relatedTours: [], moreTours: [], relatedBlogs: [] });
});

test('duplicates across sources, the current tour and curated tours are excluded; first source wins', async () => {
  const { actual } = await compare('dupes', current({ relatedTours: ['R1', { _id: 'R2' }] }), {
    bySub: { success: true, data: [tour('T0'), tour('S1'), tour('R1'), tour('S2')] },
    byCat: { success: true, data: [tour('S2'), tour('C1'), tour('S1'), tour('R2'), tour('C2')] },
    any: { success: true, data: [tour('C1'), tour('A1'), tour('T0'), { id: 'A2' }, {}] },
    byIds: { success: true, data: [tour('R2'), tour('R1')] },
  });
  assert.deepEqual(ids(actual.moreTours), ['S1', 'S2', 'C1', 'C2', 'A1', 'A2']);
  assert.deepEqual(ids(actual.relatedTours), ['R1', 'R2'], 'curated order kept');
});

test('curated related tours keep the editor order and drop deactivated ones', async () => {
  const { actual } = await compare('curated', current({ relatedTours: ['R3', 'R1', 'R2'] }), {
    byIds: { success: true, data: [tour('R1'), { _id: 'R2', isActive: false }, tour('R3')] },
    bySub: { success: true, data: range('S', 9) },
  });
  assert.deepEqual(ids(actual.relatedTours), ['R3', 'R1']);
});

test('curated articles: localized request, no featured fallback', async () => {
  const blogs = [{ _id: 'B1' }, { _id: 'B2' }];
  const { actual, calls } = await compare('curated blogs', current({ blogReferences: [{ id: 'B1' }, { id: 'B2' }] }), {
    blogsByIds: blogs, bySub: { success: true, data: range('S', 9) },
  }, 'de');
  assert.deepEqual(actual.relatedBlogs, blogs);
  assert.ok(calls.includes('blogsByIds [["B1","B2"],"de"]'));
  assert.ok(!calls.some((c) => c.startsWith('featured')));
});

test('curated articles that resolve to nothing fall back to featured', async () => {
  const { actual } = await compare('unresolved blogs', current({ blogReferences: [{ id: 'gone' }] }), {
    blogsByIds: [], featured: { success: true, data: [{ _id: 'F1' }] }, bySub: { success: true, data: range('S', 9) },
  });
  assert.deepEqual(actual.relatedBlogs, [{ _id: 'F1' }]);
});

test('a subcategory given as a bare id skips the category step', async () => {
  const { calls } = await compare('bare sub', tour('T0', { subcategory: 'sub9' }), {
    bySub: { success: true, data: range('S', 1) }, any: { success: true, data: range('A', 3) },
  });
  assert.ok(!calls.some((c) => c.startsWith('byCat')));
  assert.ok(calls.some((c) => c.startsWith('any')));
});

test('partial failures behave exactly as before', async () => {
  // Subcategory lookup throws: the chain stops, the section stays empty.
  await compare('sub throws', current(), { throwOn: ['bySub'], byCat: { success: true, data: range('C', 3) } });
  // Category throws after the subcategory answered: its results are kept.
  const keep = await compare('cat throws', current(), { throwOn: ['byCat'], bySub: { success: true, data: range('S', 2) } });
  assert.deepEqual(ids(keep.actual.moreTours), ['S1', 'S2']);
  // A body with no `success` (null) ends the lookup as it always has.
  await compare('null body', current(), { bySub: null, byCat: { success: true, data: range('C', 3) } });
  // Unsuccessful answers are skipped, not fatal.
  await compare('unsuccessful', current(), { bySub: { success: false }, byCat: { success: false }, any: { success: true, data: range('A', 2) } });
  // Article failures are isolated from the tours and from each other.
  const blogs = await compare('blog failures', current({ blogReferences: [{ id: 'B1' }] }), {
    throwOn: ['blogsByIds', 'featured'], bySub: { success: true, data: range('S', 9) },
  });
  assert.deepEqual(blogs.actual.relatedBlogs, []);
  assert.equal(blogs.actual.moreTours.length, 9);
  // Curated tours failing leaves the other lists intact.
  const curated = await compare('byIds throws', current({ relatedTours: ['R1'] }), {
    throwOn: ['byIds'], featured: { success: true, data: [{ _id: 'F1' }] }, bySub: { success: true, data: range('S', 9) },
  });
  assert.deepEqual(curated.actual.relatedTours, []);
  assert.deepEqual(curated.actual.relatedBlogs, [{ _id: 'F1' }]);
});

test('the featured-articles fallback no longer waits for the "More Tours" chain', async () => {
  const world: World = {
    bySub: { success: true, data: range('S', 2) },
    byCat: { success: true, data: range('C', 2) },
    any: { success: true, data: range('A', 2) },
    featured: { success: true, data: [{ _id: 'F1' }] },
  };
  const delays = { bySub: 40, byCat: 40, any: 40, featured: 40 };
  const before = makeApi(world, delays), after = makeApi(world, delays);
  const t0 = Date.now();
  await baselineLoad(current(), 'en', before.api, 3);
  const baselineMs = Date.now() - t0;
  const t1 = Date.now();
  await loadTourRelatedContent(current(), 'en', after.api, 3);
  const newMs = Date.now() - t1;
  // Before: featured started only after the catch-all lookup. Now it starts
  // before the subcategory lookup has even answered.
  assert.ok(before.calls.findIndex((c) => c.startsWith('featured')) > before.calls.findIndex((c) => c.startsWith('any')));
  assert.ok(after.calls.findIndex((c) => c.startsWith('featured')) < after.calls.findIndex((c) => c.startsWith('byCat')));
  // Three chained lookups instead of four.
  assert.ok(newMs < baselineMs - 25, `expected one round trip less (${newMs} vs ${baselineMs} ms)`);
});
