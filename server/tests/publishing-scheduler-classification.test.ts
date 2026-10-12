import assert from 'node:assert/strict';
import test from 'node:test';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import Tour from '../src/models/Tour';
import { runPublishingCycle } from '../src/services/publishingScheduler';

/*
 * The scheduler publishes a scheduled article later and unattended, so it asks
 * the publish rule again at that moment. These run the real scheduler against
 * in-memory collections: a due article goes out only if it is still filed
 * under an active category, an active topic of that category and a published
 * destination, and one that is not stays exactly as it was.
 *
 * Nothing touches a database.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const EGYPT_BLOG = 'aaaaaaaaaaaaaaaaaaaaaaa1';
const OTHER_CATEGORY = 'aaaaaaaaaaaaaaaaaaaaaaa2';
const TRAVEL_TIPS = 'bbbbbbbbbbbbbbbbbbbbbbb1';
const CAIRO = 'ccccccccccccccccccccccc1';
const NOW = new Date('2026-06-01T12:00:00.000Z');
const DUE = new Date('2026-06-01T11:00:00.000Z');
const LATER = new Date('2026-06-02T12:00:00.000Z');

/** Parents as they were when the articles were scheduled: all ready. */
const readyParents = (): Record<'category' | 'topic' | 'destination', Doc[]> => ({
  category: [{ _id: EGYPT_BLOG, isActive: true }, { _id: OTHER_CATEGORY, isActive: true }],
  topic: [{ _id: TRAVEL_TIPS, category: EGYPT_BLOG, isActive: true }],
  destination: [{ _id: CAIRO, status: 'published', isActive: true }],
});

const scheduled = (id: string, overrides: Doc = {}): Doc => ({
  _id: id,
  title: { en: `Article ${id}` },
  status: 'scheduled',
  scheduledAt: DUE,
  featuredImage: { url: 'https://example.test/cover.jpg' },
  editVersion: 2,
  category: EGYPT_BLOG,
  subCategory: TRAVEL_TIPS,
  destination: CAIRO,
  ...overrides,
});

/** What MongoDB answers for the scheduler's filter. */
const matches = (doc: Doc, filter: Doc): boolean =>
  Object.entries(filter).every(([key, expected]) => {
    const value = key.split('.').reduce<unknown>((at, part) => (at as Doc | undefined)?.[part], doc);
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      if ('$lte' in expected && !(value instanceof Date && value.getTime() <= (expected.$lte as Date).getTime())) return false;
      if ('$type' in expected && typeof value !== expected.$type) return false;
      if ('$ne' in expected && value === expected.$ne) return false;
      if ('$nin' in expected && (expected.$nin as unknown[]).map(String).includes(String(value))) return false;
      return true;
    }
    return value === expected;
  });

type Store = { articles: Doc[]; parents: ReturnType<typeof readyParents>; failLookups?: boolean };
type Seen = { finds: number; writes: Doc[]; errors: string[] };

/** Runs `run` with the scheduler's model calls pointed at `store`. */
const withStore = async (store: Store, run: (seen: Seen) => Promise<void>) => {
  const originals = {
    find: Blog.find,
    updateMany: Blog.updateMany,
    tours: Tour.updateMany,
    category: BlogCategory.findById,
    topic: BlogSubCategory.findById,
    destination: Destination.findById,
    error: console.error,
    log: console.log,
  };
  const seen: Seen = { finds: 0, writes: [], errors: [] };

  Blog.find = ((filter: Doc) => {
    seen.finds += 1;
    const chain = {
      select: () => chain,
      lean: () => Promise.resolve(store.articles.filter((doc) => matches(doc, filter)).map((doc) => ({ ...doc }))),
    };
    return chain;
  }) as unknown as typeof Blog.find;

  Blog.updateMany = (async (filter: Doc, update: Doc) => {
    seen.writes.push(filter);
    const hit = store.articles.filter((doc) => matches(doc, filter));
    for (const doc of hit) {
      Object.assign(doc, update.$set);
      for (const key of Object.keys(update.$unset ?? {})) delete doc[key];
      for (const [key, by] of Object.entries(update.$inc ?? {})) doc[key] = (doc[key] ?? 0) + (by as number);
    }
    return { acknowledged: true, matchedCount: hit.length, modifiedCount: hit.length, upsertedCount: 0, upsertedId: null };
  }) as unknown as typeof Blog.updateMany;

  Tour.updateMany = (async () => ({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null })) as unknown as typeof Tour.updateMany;

  const byId = (docs: () => Doc[]) => (id: string) => ({
    select: () => ({
      lean: () => (store.failLookups ? Promise.reject(new Error('connection lost')) : Promise.resolve(docs().find((doc) => doc._id === String(id)) ?? null)),
    }),
  });
  BlogCategory.findById = byId(() => store.parents.category) as unknown as typeof BlogCategory.findById;
  BlogSubCategory.findById = byId(() => store.parents.topic) as unknown as typeof BlogSubCategory.findById;
  Destination.findById = byId(() => store.parents.destination) as unknown as typeof Destination.findById;

  console.error = (...args: unknown[]) => {
    seen.errors.push(args.map(String).join(' '));
  };
  console.log = () => {};

  try {
    await run(seen);
  } finally {
    Blog.find = originals.find;
    Blog.updateMany = originals.updateMany;
    Tour.updateMany = originals.tours;
    BlogCategory.findById = originals.category;
    BlogSubCategory.findById = originals.topic;
    Destination.findById = originals.destination;
    console.error = originals.error;
    console.log = originals.log;
  }
};

const byId = (store: Store, id: string) => store.articles.find((doc) => doc._id === id) as Doc;

/** Still exactly the scheduled article it was: status, date and version untouched. */
const assertStillScheduled = (doc: Doc) => {
  assert.equal(doc.status, 'scheduled');
  assert.equal(doc.scheduledAt, DUE);
  assert.equal(doc.editVersion, 2);
  assert.equal('publishedAt' in doc, false);
};

const assertPublished = (doc: Doc) => {
  assert.equal(doc.status, 'published');
  assert.equal(doc.publishedAt, NOW);
  assert.equal('scheduledAt' in doc, false);
  assert.equal(doc.editVersion, 3);
};

test('a due article that is still properly filed is published', async () => {
  const store: Store = { articles: [scheduled('valid-1'), scheduled('not-due', { scheduledAt: LATER })], parents: readyParents() };
  await withStore(store, async (seen) => {
    const result = await runPublishingCycle(NOW);
    assert.deepEqual(result, { blogsPublished: 1, toursActivated: 0 });
    assertPublished(byId(store, 'valid-1'));
    // Not yet due: left for its own day.
    assert.equal(byId(store, 'not-due').status, 'scheduled');
    assert.equal(byId(store, 'not-due').scheduledAt, LATER);
    assert.deepEqual(seen.errors, []);
    // With nothing held back the write is the one it always was.
    assert.equal('_id' in seen.writes[0], false);
  });
});

const BROKEN_BEFORE_DUE: [string, (store: Store) => void, RegExp][] = [
  ['its category was switched off', (s) => { s.parents.category[0].isActive = false; }, /The selected category is inactive/],
  ['its topic was switched off', (s) => { s.parents.topic[0].isActive = false; }, /The selected subcategory is inactive/],
  ['its destination went back to a draft', (s) => { s.parents.destination[0].status = 'draft'; }, /The selected destination has no published page/],
  ['its destination was switched off', (s) => { s.parents.destination[0].isActive = false; }, /The selected destination has no published page/],
  ['its topic was moved to another category', (s) => { s.parents.topic[0].category = OTHER_CATEGORY; }, /does not belong to the selected category/],
  ['its category was deleted', (s) => { s.parents.category.shift(); }, /The selected category no longer exists/],
  ['its topic was deleted', (s) => { s.parents.topic.length = 0; }, /The selected subcategory no longer exists/],
  ['its destination was deleted', (s) => { s.parents.destination.length = 0; }, /The selected destination no longer exists/],
];

for (const [what, breakIt, reason] of BROKEN_BEFORE_DUE) {
  test(`a due article is not published when ${what} after it was scheduled`, async () => {
    const id = `held-${what.replace(/\W+/g, '-')}`;
    const store: Store = { articles: [scheduled(id)], parents: readyParents() };
    breakIt(store);

    await withStore(store, async (seen) => {
      const result = await runPublishingCycle(NOW);
      assert.deepEqual(result, { blogsPublished: 0, toursActivated: 0 });
      assertStillScheduled(byId(store, id));
      assert.equal(seen.errors.length, 1);
      assert.match(seen.errors[0], reason);
      assert.match(seen.errors[0], new RegExp(`Scheduled article ${id} `));
    });
  });
}

test('a missing classification holds a due article back as well', async () => {
  const store: Store = { articles: [scheduled('held-unfiled', { destination: null })], parents: readyParents() };
  await withStore(store, async (seen) => {
    const result = await runPublishingCycle(NOW);
    assert.equal(result.blogsPublished, 0);
    assertStillScheduled(byId(store, 'held-unfiled'));
    assert.match(seen.errors[0], /Destination is required before publishing/);
  });
});

test('one article held back does not hold back the others due in the same run', async () => {
  const store: Store = {
    articles: [scheduled('mixed-valid-a'), scheduled('mixed-held', { subCategory: 'bbbbbbbbbbbbbbbbbbbbbbb9' }), scheduled('mixed-valid-b')],
    parents: readyParents(),
  };
  await withStore(store, async (seen) => {
    const result = await runPublishingCycle(NOW);
    assert.equal(result.blogsPublished, 2);
    assertPublished(byId(store, 'mixed-valid-a'));
    assertPublished(byId(store, 'mixed-valid-b'));
    assertStillScheduled(byId(store, 'mixed-held'));
    // The write is the usual one, minus the article that failed the rule.
    assert.deepEqual(seen.writes[0]._id, { $nin: ['mixed-held'] });
    assert.equal(seen.errors.length, 1);
  });
});

test('run after run, a held article neither publishes nor changes, and its reason is logged once', async () => {
  const store: Store = { articles: [scheduled('retry-1')], parents: readyParents() };
  store.parents.topic[0].isActive = false;

  await withStore(store, async (seen) => {
    for (let run = 0; run < 5; run += 1) {
      const result = await runPublishingCycle(NOW);
      assert.deepEqual(result, { blogsPublished: 0, toursActivated: 0 });
      assertStillScheduled(byId(store, 'retry-1'));
    }
    assert.equal(seen.errors.length, 1, 'said once, not every thirty seconds');
    assert.match(seen.errors[0], /\[publishing\] Scheduled article retry-1 "Article retry-1" was not published: The selected subcategory is inactive/);

    // A different reason is news, and is said once too.
    store.parents.topic[0].isActive = true;
    store.parents.destination[0].status = 'draft';
    await runPublishingCycle(NOW);
    await runPublishingCycle(NOW);
    assert.equal(seen.errors.length, 2);
    assert.match(seen.errors[1], /has no published page/);
    assertStillScheduled(byId(store, 'retry-1'));

    // Put right, it goes out on the next run with no one touching the article.
    store.parents.destination[0].status = 'published';
    const result = await runPublishingCycle(NOW);
    assert.equal(result.blogsPublished, 1);
    assertPublished(byId(store, 'retry-1'));
    assert.equal(seen.errors.length, 2);
  });
});

test('a check that cannot be made fails the run; nothing is published on it', async () => {
  const store: Store = { articles: [scheduled('lookup-1')], parents: readyParents(), failLookups: true };
  await withStore(store, async (seen) => {
    await assert.rejects(runPublishingCycle(NOW), /connection lost/);
    assertStillScheduled(byId(store, 'lookup-1'));
    assert.equal(seen.writes.length, 0);

    // The scheduler is not left stuck: the next run works.
    store.failLookups = false;
    const result = await runPublishingCycle(NOW);
    assert.equal(result.blogsPublished, 1);
    assertPublished(byId(store, 'lookup-1'));
  });
});
