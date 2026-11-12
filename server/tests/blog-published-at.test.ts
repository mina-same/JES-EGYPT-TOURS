import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import '../src/middleware/i18n';
import type {} from '../src/types/express';
import mongoose from 'mongoose';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import Tour from '../src/models/Tour';
import {
  addComment,
  createBlog,
  publishBlog,
  toggleComments,
  unpublishBlog,
  updateBlog,
} from '../src/controllers/blogController';
import { runPublishingCycle } from '../src/services/publishingScheduler';
import { resolveBlogPublishedAt } from '../src/utils/publishing';

/*
 * `publishedAt` is the first moment an article was public. It belongs to the
 * system, is set once, and no request sets it:
 *
 *   first publication        → now (the scheduler: the time it was scheduled for)
 *   edit, draft, reschedule  → unchanged
 *   republication            → unchanged (the article does not become new)
 *   publish endpoint         → dated only if it never was
 *   a client's publishedAt   → dropped before anything reads it
 *
 * These run the real controllers, the real model hooks and the real scheduler
 * with its Mongoose middleware. Only the driver is replaced, by an in-memory
 * collection that answers reads and applies writes the way MongoDB does, so
 * every write is what the database would receive. Nothing reaches a database
 * or a front end.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type Handler = (req: never, res: never) => Promise<void>;

mongoose.set('bufferCommands', false); // anything not answered below fails at once
process.env.REVALIDATE_SECRET = '';
process.env.CLIENT_URL = '';

const { ObjectId } = mongoose.Types;
const isId = (value: unknown): boolean => value instanceof ObjectId;

const CATEGORY = new ObjectId('6a00000000000000000000c1');
const TOPIC = new ObjectId('6a00000000000000000000c2');
const DESTINATION = new ObjectId('6a00000000000000000000c3');
const AUTHOR = new ObjectId('6a00000000000000000000a1');
const CREATED = new Date('2025-01-02T08:00:00.000Z');
const ORIGINAL = new Date('2025-01-10T10:00:00.000Z');

// ── The in-memory collection ────────────────────────────────────────────────

/** A copy as the driver would store it: Mongoose documents and arrays serialized (toBSON). */
const clone = <T>(value: T): T => {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (isId(value)) return value;
  if (value && typeof (value as Doc).toBSON === 'function') return clone((value as Doc).toBSON());
  if (Array.isArray(value)) return value.map(clone) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, clone(v)])) as T;
  }
  return value;
};

const valueAt = (doc: Doc, at: string): unknown =>
  at.split('.').reduce<unknown>((value, part) => (value as Doc | undefined)?.[part], doc);

const same = (a: unknown, b: unknown): boolean => {
  if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  if (isId(a) || isId(b)) return String(a) === String(b);
  return a === b;
};

/** MongoDB's answer for the filters these handlers send; anything else is refused, not guessed. */
const matches = (doc: Doc, filter: Doc): boolean =>
  Object.entries(filter).every(([at, expected]) => {
    const value = valueAt(doc, at);
    if (expected && typeof expected === 'object' && !(expected instanceof Date) && !isId(expected)) {
      return Object.entries(expected).every(([operator, arg]) => {
        switch (operator) {
          case '$in': return (arg as unknown[]).some((item) => same(value, item));
          case '$nin': return !(arg as unknown[]).some((item) => same(value, item));
          case '$lte': return value instanceof Date && value.getTime() <= (arg as Date).getTime();
          case '$ne': return !same(value, arg);
          case '$type': return arg === 'date' ? value instanceof Date : typeof value === arg;
          default: throw new Error(`filter operator ${operator} is not modelled`);
        }
      });
    }
    return same(value, expected);
  });

const setAt = (doc: Doc, at: string, value: unknown) => {
  const parts = at.split('.');
  let node = doc;
  for (const part of parts.slice(0, -1)) node = node[part] ??= {};
  node[parts[parts.length - 1]] = clone(value);
};

const unsetAt = (doc: Doc, at: string) => {
  const parts = at.split('.');
  const node = valueAt(doc, parts.slice(0, -1).join('.')) as Doc | undefined;
  if (parts.length === 1) delete doc[at];
  else if (node) delete node[parts[parts.length - 1]];
};

const applyUpdate = (doc: Doc, update: Doc) => {
  for (const [operator, fields] of Object.entries(update)) {
    for (const [at, value] of Object.entries(fields as Doc)) {
      if (operator === '$set') setAt(doc, at, value);
      else if (operator === '$unset') unsetAt(doc, at);
      else if (operator === '$inc') setAt(doc, at, ((valueAt(doc, at) as number) ?? 0) + (value as number));
      else if (operator === '$push') setAt(doc, at, [...((valueAt(doc, at) as unknown[]) ?? []), ...((value as Doc)?.$each ?? [value])]);
      else if (operator !== '$setOnInsert') throw new Error(`update operator ${operator} is not modelled`);
    }
  }
};

type Write = { op: string; filter: Doc; update: Doc };
const db: { articles: Doc[]; writes: Write[] } = { articles: [], writes: [] };

const blogCollection = Blog.collection as unknown as Record<string, unknown>;
const found = (filter: Doc) => db.articles.filter((doc) => matches(doc, filter));
const write = (op: string, filter: Doc, update: Doc, one: boolean) => {
  db.writes.push({ op, filter: clone(filter), update: clone(update) });
  const hit = one ? found(filter).slice(0, 1) : found(filter);
  for (const doc of hit) applyUpdate(doc, update);
  return hit;
};
blogCollection.findOne = async (filter: Doc) => clone(found(filter)[0] ?? null);
blogCollection.find = (filter: Doc) => ({ toArray: async () => found(filter).map(clone), close: async () => {} });
blogCollection.insertOne = async (doc: Doc) => {
  db.writes.push({ op: 'insertOne', filter: {}, update: clone(doc) });
  db.articles.push(clone(doc));
  return { acknowledged: true, insertedId: doc._id };
};
const counts = (n: number) => ({ acknowledged: true, matchedCount: n, modifiedCount: n, upsertedCount: 0, upsertedId: null });
blogCollection.updateOne = async (filter: Doc, update: Doc) => counts(write('updateOne', filter, update, true).length);
blogCollection.updateMany = async (filter: Doc, update: Doc) => counts(write('updateMany', filter, update, false).length);
blogCollection.findOneAndUpdate = async (filter: Doc, update: Doc) => clone(write('findOneAndUpdate', filter, update, true)[0] ?? null);

// The parents every fixture is filed under, all ready; populates find nothing.
const PARENTS = new Map<unknown, Doc>([
  [BlogCategory.collection, { _id: CATEGORY, isActive: true }],
  [BlogSubCategory.collection, { _id: TOPIC, category: CATEGORY, isActive: true }],
  [Destination.collection, { _id: DESTINATION, status: 'published' }],
]);
for (const model of Object.values(mongoose.models)) {
  if (model === Blog) continue;
  const collection = model.collection as unknown as Record<string, unknown>;
  const parent = PARENTS.get(model.collection);
  collection.find = () => ({ toArray: async () => [], close: async () => {} });
  if (parent) collection.findOne = async (filter: Doc) => (same(filter._id, parent._id) ? parent : null);
}
(Tour.collection as unknown as Record<string, unknown>).updateMany = async () => counts(0);

// Quiet: the controllers and the scheduler log what they do.
console.log = () => {};
console.error = () => {};

// ── Fixtures and requests ───────────────────────────────────────────────────

/** An article as stored: filed, with an English page, ready to publish. */
const article = (overrides: Doc = {}): Doc => ({
  _id: new ObjectId(),
  author: AUTHOR,
  title: { en: 'Abu Serga Church' },
  slug: { en: `abu-serga-church-${db.articles.length + 1}` },
  contentBlocks: [{ type: 'html', content: { en: '<p>The cavern church of Old Cairo.</p>' } }],
  featuredImage: { url: 'https://example.test/a.jpg', alt: { en: 'Abu Serga' }, fileName: 'a.jpg' },
  category: CATEGORY,
  subCategory: TOPIC,
  destination: DESTINATION,
  commentsEnabled: true,
  comments: [],
  editVersion: 3,
  createdAt: CREATED,
  updatedAt: CREATED,
  ...overrides,
});

/** Starts each test from an empty collection holding `docs`. */
const seed = (...docs: Doc[]): Doc[] => {
  db.articles = [];
  db.writes = [];
  for (const doc of docs) db.articles.push(doc);
  return docs;
};

const stored = (doc: Doc): Doc => db.articles.find((d) => same(d._id, doc._id)) as Doc;

const respond = async (handler: Handler, req: Doc) => {
  let status = 0;
  let body: Doc = {};
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: Doc) {
      body = payload;
      if (!status) status = 200;
      return res;
    },
  };
  await handler({ params: {}, body: {}, ...req } as never, res as never);
  return { status, body };
};

/** A PUT from the Admin editor: the current edit version plus `changes`. */
const edit = (doc: Doc, changes: Doc) =>
  respond(updateBlog, { params: { id: String(doc._id) }, body: { _editVersion: stored(doc).editVersion, ...changes } });

const call = (handler: Handler, doc: Doc, body: Doc = {}) => respond(handler, { params: { id: String(doc._id) }, body });

/** Whether any write the handler sent named publishedAt — set or unset. */
const wrotePublishedAt = () =>
  db.writes.some(({ update }) => ['$set', '$unset'].some((op) => update[op] && 'publishedAt' in update[op]) || 'publishedAt' in update);

const assertNow = (value: unknown, before: number) => {
  assert.ok(value instanceof Date, `a date, not ${String(value)}`);
  assert.ok(value.getTime() >= before && value.getTime() <= Date.now(), `now, not ${value.toISOString()}`);
};

const future = (hours: number) => new Date(Date.now() + hours * 3600e3);

/** Everything a client could send in publishedAt. */
const CLIENT_VALUES: [string, unknown][] = [
  ['null', null],
  ['""', ''],
  ['0', 0],
  ['a past date', '2020-01-01T00:00:00.000Z'],
  ['a future date', '2099-01-01T00:00:00Z'],
  ['a malformed value', 'soon'],
  ['the stored value (the Admin form round-trip)', ORIGINAL.toISOString()],
  ['an object', { $date: '2020-01-01' }],
];

// ── The rule ────────────────────────────────────────────────────────────────

test('resolveBlogPublishedAt: an article that has a first-publication date keeps it', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  assert.equal(resolveBlogPublishedAt({ existingPublishedAt: ORIGINAL, now }), ORIGINAL);
  assert.equal(resolveBlogPublishedAt({ existingPublishedAt: ORIGINAL, scheduledAt: new Date('2026-11-01T09:00:00Z'), now }), ORIGINAL);
});

test('resolveBlogPublishedAt: only a real date counts as one — anything else is dated now', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  for (const none of [undefined, null, '', 0, Number.NaN, 'soon', '2020-01-01', new Date('soon'), {}]) {
    assert.equal(resolveBlogPublishedAt({ existingPublishedAt: none, now }), now, String(none));
  }
});

test('resolveBlogPublishedAt: a scheduled first publication takes the time it was scheduled for, never a time to come', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  const at = new Date('2026-11-01T09:00:00Z');
  assert.equal(resolveBlogPublishedAt({ existingPublishedAt: undefined, scheduledAt: at, now }), at);
  assert.equal(resolveBlogPublishedAt({ existingPublishedAt: undefined, scheduledAt: new Date('2026-11-02T09:00:00Z'), now }), now);
  assert.equal(resolveBlogPublishedAt({ existingPublishedAt: undefined, scheduledAt: 'soon', now }), now);
});

// ── createBlog ──────────────────────────────────────────────────────────────

/** What the Admin's "new article" form posts: the fields, not the stored metadata. */
const createBody = (overrides: Doc): Doc => {
  const body = article(overrides);
  for (const key of ['_id', 'createdAt', 'updatedAt', 'editVersion']) delete body[key];
  return body;
};

test('createBlog: a draft and a scheduled article have no publishedAt, whatever the client sends', async () => {
  for (const [what, value] of CLIENT_VALUES) {
    seed();
    const draft = await respond(createBlog, { body: createBody({ status: 'draft', publishedAt: value }) });
    assert.equal(draft.status, 201, `draft, ${what}`);
    const scheduledAt = future(24);
    const scheduled = await respond(createBlog, { body: createBody({ status: 'scheduled', scheduledAt: scheduledAt.toISOString(), publishedAt: value }) });
    assert.equal(scheduled.status, 201, `scheduled, ${what}`);
    const [d, s] = db.articles;
    assert.equal('publishedAt' in d, false, `draft, ${what}`);
    assert.equal('publishedAt' in s, false, `scheduled, ${what}`);
    assert.deepEqual(s.scheduledAt, scheduledAt);
  }
});

test('createBlog: an article created as published is dated now; the client value is ignored', async () => {
  for (const [what, value] of [['none', undefined] as [string, unknown], ...CLIENT_VALUES]) {
    seed();
    const before = Date.now();
    const created = await respond(createBlog, { body: createBody({ status: 'published', ...(value === undefined ? {} : { publishedAt: value }) }) });
    assert.equal(created.status, 201, what);
    assertNow(db.articles[0].publishedAt, before);
  }
});

// ── updateBlog ──────────────────────────────────────────────────────────────

test('updateBlog: an edit of a published article keeps its date, and the client value never reaches the write', async () => {
  for (const [what, value] of CLIENT_VALUES) {
    const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
    const saved = await edit(doc, { metaTitle: { en: 'Abu Serga Church, Old Cairo' }, publishedAt: value });
    // "soon" used to fail the date cast and answer 400 "Invalid identifier".
    assert.equal(saved.status, 200, `${what}: ${JSON.stringify(saved.body)}`);
    assert.equal(wrotePublishedAt(), false, what);
    assert.deepEqual(stored(doc).publishedAt, ORIGINAL, what);
    assert.equal(stored(doc).status, 'published');
    assert.deepEqual(stored(doc).metaTitle, { en: 'Abu Serga Church, Old Cairo' }, 'the edit itself went through');
  }
});

test('updateBlog: no field of an ordinary edit moves the date — content in another language, SEO, classification, comments', async () => {
  const edits: [string, Doc][] = [
    ['German content', { title: { en: 'Abu Serga Church', de: 'Abu-Serga-Kirche' }, contentBlocks: [{ type: 'html', content: { en: '<p>The cavern church.</p>', de: '<p>Die Höhlenkirche.</p>' } }] }],
    ['SEO fields', { metaTitle: { en: 'Abu Serga' }, metaDescription: { en: 'The cavern church' }, focusKeyword: { en: 'abu serga' } }],
    ['the same classification', { category: String(CATEGORY), subCategory: String(TOPIC), destination: String(DESTINATION) }],
    ['comments switched off', { commentsEnabled: false }],
    ['the status sent again', { status: 'published' }],
  ];
  for (const [what, changes] of edits) {
    const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
    const saved = await edit(doc, { ...changes, publishedAt: '2099-01-01T00:00:00Z' });
    assert.equal(saved.status, 200, `${what}: ${JSON.stringify(saved.body)}`);
    assert.deepEqual(stored(doc).publishedAt, ORIGINAL, what);
  }
});

test('updateBlog: published → draft keeps the date; the client cannot clear it', async () => {
  for (const value of [undefined, null, '']) {
    const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
    const saved = await edit(doc, { status: 'draft', ...(value === undefined ? {} : { publishedAt: value }) });
    assert.equal(saved.status, 200);
    assert.equal(stored(doc).status, 'draft');
    assert.deepEqual(stored(doc).publishedAt, ORIGINAL, String(value));
  }
});

test('updateBlog: the first publication of a draft is dated now, never by the client', async () => {
  for (const [what, value] of [['none', undefined] as [string, unknown], ...CLIENT_VALUES]) {
    const [doc] = seed(article({ status: 'draft' }));
    const before = Date.now();
    const saved = await edit(doc, { status: 'published', ...(value === undefined ? {} : { publishedAt: value }) });
    assert.equal(saved.status, 200, what);
    assert.equal(stored(doc).status, 'published');
    assertNow(stored(doc).publishedAt, before);
  }
});

test('updateBlog: a scheduled article published by hand from the editor is dated now, not with its scheduled time', async () => {
  const [doc] = seed(article({ status: 'scheduled', scheduledAt: future(48) }));
  const before = Date.now();
  assert.equal((await edit(doc, { status: 'published' })).status, 200);
  assertNow(stored(doc).publishedAt, before);
  assert.equal('scheduledAt' in stored(doc), false);
});

test('updateBlog: republishing keeps the original date — published → draft → published', async () => {
  const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
  assert.equal((await edit(doc, { status: 'draft', publishedAt: null })).status, 200);
  assert.equal((await edit(doc, { title: { en: 'Abu Serga Church (revised)' } })).status, 200);
  assert.equal((await edit(doc, { status: 'published', publishedAt: '2099-01-01T00:00:00Z' })).status, 200);
  assert.equal(stored(doc).status, 'published');
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL, 'not resurfaced');
});

test('updateBlog: a published article rescheduled keeps its date; the scheduler publishes it again without changing it', async () => {
  const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
  const scheduledAt = future(2);
  assert.equal((await edit(doc, { status: 'scheduled', scheduledAt: scheduledAt.toISOString(), publishedAt: null })).status, 200);
  assert.equal(stored(doc).status, 'scheduled');
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL, 'kept while scheduled');
  assert.deepEqual(stored(doc).scheduledAt, scheduledAt);

  const result = await runPublishingCycle(new Date(scheduledAt.getTime() + 18_000));
  assert.equal(result.blogsPublished, 1);
  assert.equal(stored(doc).status, 'published');
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL, 'neither scheduledAt nor the run time');
  assert.equal('scheduledAt' in stored(doc), false);
});

test('updateBlog: draft → scheduled stores the schedule only; a draft that was public before keeps its date', async () => {
  const scheduledAt = future(3);
  const [never, before] = seed(article({ status: 'draft' }), article({ status: 'draft', publishedAt: ORIGINAL }));
  for (const doc of [never, before]) {
    assert.equal((await edit(doc, { status: 'scheduled', scheduledAt: scheduledAt.toISOString(), publishedAt: '2020-01-01' })).status, 200);
    assert.equal(stored(doc).status, 'scheduled');
    assert.deepEqual(stored(doc).scheduledAt, scheduledAt);
  }
  assert.equal('publishedAt' in stored(never), false, 'never published: no date yet');
  assert.deepEqual(stored(before).publishedAt, ORIGINAL, 'history kept');
});

test('updateBlog: a legacy published article without a date is not dated by an edit', async () => {
  const [doc] = seed(article({ status: 'published' }));
  assert.equal((await edit(doc, { metaTitle: { en: 'Abu Serga' } })).status, 200);
  assert.equal((await edit(doc, { status: 'published', publishedAt: '2026-01-01' })).status, 200);
  assert.equal(wrotePublishedAt(), false);
  assert.equal('publishedAt' in stored(doc), false);
});

test('updateBlog: operator keys smuggled into the body cannot reach publishedAt', async () => {
  for (const smuggled of [{ $set: { publishedAt: '2099-01-01' } }, { $unset: { publishedAt: 1 } }, { 'publishedAt': null, $rename: { createdAt: 'publishedAt' } }]) {
    const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
    await edit(doc, { metaTitle: { en: 'Abu Serga' }, ...smuggled });
    assert.deepEqual(stored(doc).publishedAt, ORIGINAL, JSON.stringify(smuggled));
  }
});

// ── publishBlog / unpublishBlog ─────────────────────────────────────────────

test('publishBlog: dates an article that never had a date, now', async () => {
  for (const status of ['draft', 'scheduled']) {
    const [doc] = seed(article(status === 'scheduled' ? { status, scheduledAt: future(5) } : { status }));
    const before = Date.now();
    assert.equal((await call(publishBlog, doc, { publishedAt: '2020-01-01' })).status, 200);
    assert.equal(stored(doc).status, 'published');
    assertNow(stored(doc).publishedAt, before);
    assert.equal('scheduledAt' in stored(doc), false);
  }
});

test('publishBlog: never resets a date — not on a published article, not on a republication', async () => {
  const docs = seed(
    article({ status: 'published', publishedAt: ORIGINAL }),
    article({ status: 'draft', publishedAt: ORIGINAL }),
    article({ status: 'scheduled', publishedAt: ORIGINAL, scheduledAt: future(5) })
  );
  for (const doc of docs) {
    assert.equal((await call(publishBlog, doc)).status, 200);
    assert.equal(stored(doc).status, 'published');
    assert.deepEqual(stored(doc).publishedAt, ORIGINAL);
  }
  // Called again and again: still the same date.
  for (let i = 0; i < 3; i += 1) await call(publishBlog, docs[0]);
  assert.deepEqual(stored(docs[0]).publishedAt, ORIGINAL);
});

test('publishBlog: an explicit publish of a legacy published article without a date gives it one', async () => {
  const [doc] = seed(article({ status: 'published' }));
  const before = Date.now();
  assert.equal((await call(publishBlog, doc)).status, 200);
  assertNow(stored(doc).publishedAt, before);
});

test('unpublishBlog: the draft keeps its date, and publishing it again keeps it too', async () => {
  const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
  assert.equal((await call(unpublishBlog, doc)).status, 200);
  assert.equal(stored(doc).status, 'draft');
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL);
  assert.equal((await call(publishBlog, doc)).status, 200);
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL);
});

// ── Saves that publish nothing ──────────────────────────────────────────────

const COMMENT = { name: 'Ana', email: 'ana@example.test', text: 'Beautiful church.' };

test('a public comment and a comments toggle never date a legacy published article that has no date', async () => {
  const [doc] = seed(article({ status: 'published' }));
  assert.equal((await call(addComment, doc, COMMENT)).status, 201);
  assert.equal(stored(doc).comments.length, 1, 'the comment was saved');
  assert.equal((await call(toggleComments, doc)).status, 200);
  assert.equal(stored(doc).commentsEnabled, false, 'the toggle was saved');
  assert.equal(wrotePublishedAt(), false);
  assert.equal('publishedAt' in stored(doc), false);

  // Nor a plain save of the document.
  const document = await Blog.findById(doc._id);
  assert.ok(document);
  document.set('metaTitle', { en: 'Abu Serga' });
  await document.save();
  assert.equal('publishedAt' in stored(doc), false);
});

test('a public comment and a comments toggle leave a dated article’s date alone', async () => {
  const [doc] = seed(article({ status: 'published', publishedAt: ORIGINAL }));
  assert.equal((await call(addComment, doc, { ...COMMENT, publishedAt: '2099-01-01' })).status, 201);
  assert.equal((await call(toggleComments, doc, { publishedAt: null })).status, 200);
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL);
});

// ── The model's save backstop ───────────────────────────────────────────────

test('model: a new article saved straight as published without a date is dated; one with a date keeps it', async () => {
  seed();
  const before = Date.now();
  const undated = await Blog.create(createBody({ status: 'published' }));
  assertNow(stored(undated).publishedAt, before);
  const dated = await Blog.create(createBody({ status: 'published', publishedAt: ORIGINAL }));
  assert.deepEqual(stored(dated).publishedAt, ORIGINAL);
  const draft = await Blog.create(createBody({ status: 'draft' }));
  assert.equal('publishedAt' in stored(draft), false);
});

test('model: a save that switches an article to published dates it only if it never was', async () => {
  const [never, before] = seed(article({ status: 'draft' }), article({ status: 'draft', publishedAt: ORIGINAL }));
  const start = Date.now();
  for (const doc of [never, before]) {
    const document = await Blog.findById(doc._id);
    assert.ok(document);
    document.status = 'published';
    await document.save();
  }
  assertNow(stored(never).publishedAt, start);
  assert.deepEqual(stored(before).publishedAt, ORIGINAL);
});

test('model: a scheduled article that was public before keeps its date through a save', async () => {
  const [doc] = seed(article({ status: 'scheduled', publishedAt: ORIGINAL, scheduledAt: future(6) }));
  assert.equal((await call(toggleComments, doc)).status, 200);
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL);
  assert.equal(stored(doc).status, 'scheduled');
});

// ── The scheduler ───────────────────────────────────────────────────────────

const at = (time: string) => new Date(`2026-11-01T${time}:00.000Z`);
const scheduledFor = (time: string, overrides: Doc = {}) => article({ status: 'scheduled', scheduledAt: at(time), ...overrides });

test('scheduler: a first scheduled publication is dated with the time it was scheduled for, not the run time', async () => {
  // Scheduled through the editor, as an editor would.
  const [doc] = seed(article({ status: 'draft' }));
  const scheduledAt = future(1);
  assert.equal((await edit(doc, { status: 'scheduled', scheduledAt: scheduledAt.toISOString() })).status, 200);
  const editVersion = stored(doc).editVersion;

  const result = await runPublishingCycle(new Date(scheduledAt.getTime() + 18_000));
  assert.equal(result.blogsPublished, 1);
  assert.equal(stored(doc).status, 'published');
  assert.deepEqual(stored(doc).publishedAt, scheduledAt, 'T, not T + 18 s');
  assert.equal('scheduledAt' in stored(doc), false);
  assert.equal(stored(doc).editVersion, editVersion + 1);
});

test('scheduler: a run three hours late still dates the article 09:00', async () => {
  const [doc] = seed(scheduledFor('09:00'));
  assert.equal((await runPublishingCycle(at('12:00'))).blogsPublished, 1);
  assert.deepEqual(stored(doc).publishedAt, at('09:00'));
});

test('scheduler: articles published in one run each keep their own date; one published before keeps its original', async () => {
  const [a, b, c, d, held, notDue] = seed(
    scheduledFor('09:00'),
    scheduledFor('09:03'),
    scheduledFor('09:08'),
    scheduledFor('09:05', { publishedAt: ORIGINAL }),
    scheduledFor('09:01', { destination: null }),
    scheduledFor('11:00')
  );
  const result = await runPublishingCycle(at('09:10'));
  assert.equal(result.blogsPublished, 4);
  assert.deepEqual(stored(a).publishedAt, at('09:00'));
  assert.deepEqual(stored(b).publishedAt, at('09:03'));
  assert.deepEqual(stored(c).publishedAt, at('09:08'));
  assert.deepEqual(stored(d).publishedAt, ORIGINAL, 'history preserved, not its scheduledAt');
  for (const doc of [a, b, c, d]) {
    assert.equal(stored(doc).status, 'published');
    assert.equal('scheduledAt' in stored(doc), false);
    assert.equal(stored(doc).editVersion, 4);
  }
  // Readiness is unchanged: an unfiled article stays scheduled, untouched.
  assert.equal(stored(held).status, 'scheduled');
  assert.deepEqual(stored(held).scheduledAt, at('09:01'));
  assert.equal('publishedAt' in stored(held), false);
  assert.equal(stored(held).editVersion, 3);
  assert.equal(stored(notDue).status, 'scheduled');

  // One plain write per date, each limited to articles that passed the checks.
  const publishing = db.writes.filter((w) => w.op === 'updateMany');
  assert.equal(publishing.length, 4);
  for (const { filter, update } of publishing) {
    assert.equal(filter.status, 'scheduled');
    assert.ok(Array.isArray(filter._id.$in));
    assert.equal(filter._id.$in.some((id: unknown) => same(id, held._id) || same(id, notDue._id)), false);
    // Only the operators the content-update guard accepts: no pipeline, no $rename.
    for (const key of Object.keys(update)) assert.ok(['$set', '$unset', '$inc', '$setOnInsert'].includes(key), key);
    assert.ok(update.$set.publishedAt instanceof Date);
  }
});

test('scheduler: an article published before, scheduled again, keeps 2025-01-10 — not its 2026-11-01 schedule', async () => {
  const [doc] = seed(article({ status: 'scheduled', publishedAt: ORIGINAL, scheduledAt: new Date('2026-11-01T00:00:00Z') }));
  assert.equal((await runPublishingCycle(new Date('2026-11-01T00:00:30Z'))).blogsPublished, 1);
  assert.deepEqual(stored(doc).publishedAt, ORIGINAL);
});

test('scheduler: a run with nothing due writes nothing', async () => {
  seed(scheduledFor('11:00'));
  assert.equal((await runPublishingCycle(at('09:10'))).blogsPublished, 0);
  assert.equal(db.writes.length, 0);
});

// ── Source guard ────────────────────────────────────────────────────────────

test('source: publishedAt is written only through resolveBlogPublishedAt, never from the request', () => {
  const read = (file: string) => readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
  for (const file of ['controllers/blogController.ts', 'services/publishingScheduler.ts', 'models/Blog.ts']) {
    // The scheduler's tour activation has its own publishedAt, and is not an article's.
    const whole = read(file);
    const source = file.includes('Scheduler') ? whole.slice(0, whole.indexOf('const activateDueTours')) : whole;
    assert.doesNotMatch(source, /req\.body\.publishedAt|body\[['"]publishedAt['"]\]/, `${file} reads the client's publishedAt`);
    assert.doesNotMatch(source, /publishedAt\s*[:=]\s*(new Date\(|now\b|Date\.now)/, `${file} dates an article itself`);
    for (const [, value] of source.matchAll(/\.publishedAt\s*=(?!=)\s*([^;]+);/g)) {
      assert.match(value, /^resolveBlogPublishedAt\(/, `${file}: publishedAt = ${value}`);
    }
  }
  // Both write handlers drop the client's value from the body they write.
  const controller = read('controllers/blogController.ts');
  for (const handler of ['createBlog', 'updateBlog']) {
    const body = controller.slice(controller.indexOf(`export const ${handler} =`));
    const end = body.indexOf('\nexport const ', 1);
    assert.match(body.slice(0, end), /const body = \{ \.\.\.req\.body \};\s*\r?\n(\s*\/\/.*\r?\n)*\s*delete body\.publishedAt;/, handler);
  }
});
