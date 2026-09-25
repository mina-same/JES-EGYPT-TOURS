import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import EditorialAuthor from '../src/models/EditorialAuthor';

/*
 * The producer side of the front end's Blog cache policy
 * (client/src/lib/api/blogCachePolicy.ts): every path that writes an article,
 * a category, a subcategory or an author must tell the front end to clear
 * `blog` — and, for an author, the author page's own tag.
 *
 * These are real Mongoose operations running their real middleware. Only the
 * driver calls are stubbed, so nothing reaches a database, and fetch is
 * replaced, so the revalidation request is captured instead of sent.
 */

const { ObjectId } = mongoose.Types;
type Sent = { url: string; secret: string; tags: string[] };
const sent: Sent[] = [];

process.env.REVALIDATE_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://front.test';
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  const headers = (init?.headers ?? {}) as Record<string, string>;
  sent.push({ url: String(url), secret: headers['x-revalidate-secret'], tags: JSON.parse(String(init?.body)).tags });
  return new Response('{}', { status: 200 });
}) as typeof fetch;
test.after(() => {
  globalThis.fetch = realFetch;
});

/** Canned driver results for every call a write here can make. */
function stubDriver(model: { collection: unknown }) {
  const collection = model.collection as Record<string, unknown>;
  collection.insertOne = async () => ({ acknowledged: true, insertedId: new ObjectId() });
  collection.updateOne = async () => ({ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 });
  collection.updateMany = async () => ({ acknowledged: true, matchedCount: 2, modifiedCount: 2, upsertedCount: 0 });
  collection.deleteOne = async () => ({ acknowledged: true, deletedCount: 1 });
  collection.findOneAndUpdate = async (filter: object) => ({ _id: new ObjectId(), slug: 'jane-doe', ...filter });
  collection.findOneAndDelete = async () => ({ _id: new ObjectId() });
  // The duplicate-internal-links plugin reads the documents an update matches.
  collection.find = () => ({ toArray: async () => [], close: async () => {} });
}

/** The tags of every revalidation request one write sends. */
async function tagsSentBy(write: () => Promise<unknown>): Promise<string[][]> {
  sent.length = 0;
  await write();
  await new Promise((resolve) => setImmediate(resolve));
  for (const request of sent) {
    assert.equal(request.url, 'http://front.test/api/revalidate');
    assert.equal(request.secret, 'test-secret');
  }
  return sent.map((request) => request.tags);
}

/** A write must clear `blog`, whatever else it sends. */
async function assertClearsBlog(label: string, write: () => Promise<unknown>) {
  const requests = await tagsSentBy(write);
  assert.ok(requests.length > 0, `${label}: no revalidation request`);
  for (const tags of requests) assert.deepEqual(tags, ['blog'], label);
}

/** An existing document, as the admin's publish/toggle/delete handlers hold it. */
function existing<T extends mongoose.Document>(doc: T): T {
  doc.isNew = false;
  doc.markModified('updatedAt');
  return doc;
}

const article = () => new Blog({
  title: { en: 'Test article' },
  slug: { en: 'test-article' },
  status: 'draft',
  author: new ObjectId(),
  contentBlocks: [],
});
const category = () => new BlogCategory({ name: { en: 'Test category' }, slug: { en: 'test-category' } });
const subcategory = () => new BlogSubCategory({
  name: { en: 'Test topic' },
  slug: { en: 'test-topic' },
  category: new ObjectId(),
});
const author = () => new EditorialAuthor({
  name: 'Jane Doe',
  slug: 'jane-doe',
  role: { en: 'Editor' },
  bio: { en: 'Writes about Egypt.' },
  image: { url: 'jane.jpg', alt: { en: 'Jane Doe' } },
});

test('every article write clears `blog`', async () => {
  stubDriver(Blog);
  await assertClearsBlog('create', () => article().save());
  await assertClearsBlog('admin edit (findByIdAndUpdate)', () => Blog.findByIdAndUpdate(new ObjectId(), { $set: { status: 'published' } }));
  await assertClearsBlog('publish / unpublish / comments toggle (save)', () => existing(article()).save());
  await assertClearsBlog('scheduled publish (updateMany)', () => Blog.updateMany({ status: 'scheduled' }, { $set: { status: 'published' } }));
  await assertClearsBlog('admin delete (document deleteOne)', () => existing(article()).deleteOne());
  await assertClearsBlog('scripted delete (Blog.deleteOne)', () => Blog.deleteOne({ _id: new ObjectId() }));
  await assertClearsBlog('findOneAndDelete', () => Blog.findOneAndDelete({ _id: new ObjectId() }));
});

test('every category and subcategory write clears `blog`', async () => {
  const families = [
    { model: BlogCategory, make: category, edit: () => BlogCategory.findByIdAndUpdate(new ObjectId(), { $set: { isActive: false } }) },
    { model: BlogSubCategory, make: subcategory, edit: () => BlogSubCategory.findByIdAndUpdate(new ObjectId(), { $set: { isActive: false } }) },
  ];
  for (const { model, make, edit } of families) {
    stubDriver(model);
    await assertClearsBlog(`${model.modelName} create`, () => make().save());
    await assertClearsBlog(`${model.modelName} edit (findByIdAndUpdate)`, edit);
    await assertClearsBlog(`${model.modelName} toggle (save)`, () => existing(make()).save());
    await assertClearsBlog(`${model.modelName} delete (document deleteOne)`, () => existing(make()).deleteOne());
  }
});

test('author writes clear the author page and `blog`', async () => {
  stubDriver(EditorialAuthor);
  assert.deepEqual(await tagsSentBy(() => author().save()), [['author:jane-doe', 'blog']]);
  // ensureDefaultEditorialAuthor's upsert; a profile edit through findOneAndUpdate.
  assert.deepEqual(
    await tagsSentBy(() => EditorialAuthor.findOneAndUpdate({ slug: 'jane-doe' }, { $setOnInsert: { name: 'Jane Doe' } }, { upsert: true, new: true })),
    [['author:jane-doe', 'blog']]
  );
  // The default author's backfill and scripts/syncAuthorProfile.ts: `blog`
  // alone, which the author page's fetch carries as well.
  assert.deepEqual(await tagsSentBy(() => EditorialAuthor.updateOne({ slug: 'jane-doe' }, { $set: { isActive: true } })), [['blog']]);
});
