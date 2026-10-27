import assert from 'node:assert/strict';
import test from 'node:test';
import { ObjectId } from 'mongodb';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import Tour from '../src/models/Tour';
import { runPublishingCycle } from '../src/services/publishingScheduler';
import { wroteDocuments } from '../src/services/revalidate';

/*
 * The publishing scheduler runs every 30 seconds. Each run is one
 * Tour.updateMany, and one Blog.updateMany per publication date among the
 * articles due (none when nothing is due); the models' post('updateMany')
 * hooks are what tell the front end to clear `blog` / `tours`. A run that
 * publishes nothing must therefore send nothing — otherwise every cached blog
 * and tour page is expired twice a minute.
 *
 * Real scheduler, real Mongoose middleware; only the driver is stubbed — its
 * reads answer with the due articles a case asks for (properly filed, with an
 * English page) and its updateMany with the counts the case asks for — and
 * fetch is captured, so nothing reaches a database or a front end.
 */

process.env.REVALIDATE_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://front.test';

const sent: string[][] = [];
let failWebhooks = false;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body)).tags);
  if (failWebhooks) throw new TypeError('fetch failed');
  return new Response('{}', { status: 200 });
}) as typeof fetch;
test.after(() => {
  globalThis.fetch = realFetch;
});

type Counts = { matchedCount: number; modifiedCount: number };
const due: { blogs: Counts; tours: Counts } = {
  blogs: { matchedCount: 0, modifiedCount: 0 },
  tours: { matchedCount: 0, modifiedCount: 0 },
};
// The parents a due article is filed under, all ready.
const CATEGORY = new ObjectId();
const TOPIC = new ObjectId();
const DESTINATION = new ObjectId();
const parents: [typeof Blog.collection, Record<string, unknown>][] = [
  [BlogCategory.collection, { _id: CATEGORY, isActive: true }],
  [BlogSubCategory.collection, { _id: TOPIC, category: CATEGORY, isActive: true }],
  [Destination.collection, { _id: DESTINATION, status: 'published', isActive: true }],
];
for (const [collection, parent] of parents) {
  (collection as unknown as Record<string, unknown>).findOne = async () => parent;
}

/** The due articles the scheduler finds on the next run: all scheduled for one time. */
let dueArticles: Record<string, unknown>[] = [];
const dueArticle = (scheduledAt: Date) => ({
  _id: new ObjectId(),
  title: { en: 'Kom Ombo Temple Guide' },
  slug: { en: 'kom-ombo-temple-guide' },
  contentBlocks: [{ type: 'html', content: { en: '<p>Kom Ombo stands on a bend of the Nile.</p>' } }],
  status: 'scheduled',
  scheduledAt,
  featuredImage: { url: 'https://example.test/cover.jpg' },
  category: CATEGORY,
  subCategory: TOPIC,
  destination: DESTINATION,
});

const driverCalls: string[] = [];
for (const [family, model] of [['blogs', Blog], ['tours', Tour]] as const) {
  const collection = model.collection as unknown as Record<string, unknown>;
  collection.updateMany = async () => {
    driverCalls.push(family);
    return { acknowledged: true, upsertedCount: 0, upsertedId: null, ...due[family] };
  };
  // The scheduler's read, and the duplicate-internal-links plugin's read of
  // the documents an update matches.
  collection.find = () => ({
    toArray: async () => (family === 'blogs' ? dueArticles.map((article) => ({ ...article })) : []),
    close: async () => {},
  });
}

/** One scheduler run; returns its result and the tags of every webhook it sent. */
async function tick(blogs: [number, number], tours: [number, number]) {
  due.blogs = { matchedCount: blogs[0], modifiedCount: blogs[1] };
  due.tours = { matchedCount: tours[0], modifiedCount: tours[1] };
  const scheduledAt = new Date(Date.now() - 60_000);
  dueArticles = Array.from({ length: blogs[0] }, () => dueArticle(scheduledAt));
  const from = sent.length;
  const result = await runPublishingCycle(new Date());
  await new Promise((resolve) => setImmediate(resolve));
  return { result, webhooks: sent.slice(from) };
}

const count = (webhooks: string[][], tag: string) => webhooks.filter((tags) => tags.includes(tag)).length;

// The scheduler logs a line when it publishes something; keep test output clean.
const originalLog = console.log;
console.log = () => {};
test.after(() => {
  console.log = originalLog;
});

test('wroteDocuments: only an explicit zero-write result means "nothing changed"', () => {
  assert.equal(wroteDocuments({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }), false);
  assert.equal(wroteDocuments({ acknowledged: true, matchedCount: 3, modifiedCount: 0, upsertedCount: 0 }), false);
  assert.equal(wroteDocuments({ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 }), true);
  assert.equal(wroteDocuments({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }), true);
  // An unexpected shape keeps invalidating rather than risk a stale page.
  assert.equal(wroteDocuments(undefined), true);
  assert.equal(wroteDocuments({ acknowledged: false }), true);
});

test('each scenario sends exactly the invalidations its changes call for', async () => {
  const cases: [string, [number, number], [number, number], number, number][] = [
    ['nothing due', [0, 0], [0, 0], 0, 0],
    ['one article published', [1, 1], [0, 0], 1, 0],
    ['one tour activated', [0, 0], [1, 1], 0, 1],
    ['both', [1, 1], [1, 1], 1, 1],
    ['three articles in one run', [3, 3], [0, 0], 1, 0],
    ['five tours in one run', [0, 0], [5, 5], 0, 1],
    ['matched but already in that state', [2, 0], [2, 0], 0, 0],
  ];
  for (const [name, blogs, tours, expectBlog, expectTours] of cases) {
    driverCalls.length = 0;
    const { result, webhooks } = await tick(blogs, tours);
    // Due articles scheduled for one time make one Blog write; none due, none.
    assert.deepEqual(driverCalls.sort(), blogs[0] > 0 ? ['blogs', 'tours'] : ['tours'], `${name}: writes`);
    assert.equal(count(webhooks, 'blog'), expectBlog, `${name}: blog`);
    assert.equal(count(webhooks, 'tours'), expectTours, `${name}: tours`);
    assert.equal(webhooks.length, expectBlog + expectTours, `${name}: no other webhooks`);
    assert.deepEqual(result, { blogsPublished: blogs[1], toursActivated: tours[1] }, `${name}: counts reported`);
  }
});

test('twenty idle runs (ten minutes) send nothing; one real change sends one per family, once', async () => {
  const from = sent.length;
  for (let i = 0; i < 20; i++) await tick([0, 0], [0, 0]);
  assert.equal(sent.length - from, 0, 'idle runs');

  const change = await tick([1, 1], [1, 1]);
  assert.equal(count(change.webhooks, 'blog'), 1);
  assert.equal(count(change.webhooks, 'tours'), 1);

  const after = sent.length;
  for (let i = 0; i < 5; i++) await tick([0, 0], [0, 0]);
  assert.equal(sent.length - after, 0, 'no repeat after the change');
});

test('a failed webhook after a real publish is logged; the run still reports its writes', async (t) => {
  const logged: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    logged.push(args.map(String).join(' '));
  };
  failWebhooks = true;
  t.after(() => {
    console.error = originalError;
    failWebhooks = false;
  });

  const { result, webhooks } = await tick([1, 1], [0, 0]);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(result, { blogsPublished: 1, toursActivated: 0 });
  assert.equal(count(webhooks, 'blog'), 1);
  assert.ok(logged.some((line) => line.includes('Revalidation request failed')), 'failure is logged');
});
