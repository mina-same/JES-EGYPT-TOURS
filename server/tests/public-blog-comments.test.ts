import assert from 'node:assert/strict';
import test from 'node:test';
// Declares `req.locale`, which the blog handlers read. The full build sees it
// through tsconfig's include; a single test file only when it loads it.
import '../src/middleware/i18n';
import Blog from '../src/models/Blog';
import { getBlogById, getBlogBySlug } from '../src/controllers/blogController';
import { toPublicBlogComments } from '../src/utils/publicBlogComments';

const PUBLIC_KEYS = new Set(['_id', 'name', 'text', 'avatar', 'isApproved', 'createdAt']);

// The four submissions every case starts from: approved with an avatar,
// pending, rejected (the schema has no separate state: rejected stays
// `isApproved: false`), and approved with no optional fields.
const submissions = () => [
  {
    name: 'Approved Reader',
    email: 'approved@example.test',
    text: 'Approved, with an avatar',
    avatar: 'https://res.cloudinary.com/demo/image/upload/reader.jpg',
    isApproved: true,
    createdAt: new Date('2026-09-20T09:30:00Z'),
  },
  {
    name: 'Pending Reader',
    email: 'pending@example.test',
    text: 'Waiting for moderation',
    isApproved: false,
    createdAt: new Date('2026-09-21T10:00:00Z'),
  },
  {
    name: 'Rejected Reader',
    email: 'rejected@example.test',
    text: 'Turned down by a moderator',
    isApproved: false,
    createdAt: new Date('2026-09-22T11:00:00Z'),
  },
  {
    name: 'Minimal Reader',
    email: 'minimal@example.test',
    text: 'Approved, nothing optional',
    isApproved: true,
    createdAt: new Date('2026-09-23T12:00:00Z'),
  },
];

const withIds = () => submissions().map((comment, index) => ({ _id: `c${index + 1}`, ...comment }));

// An unsaved article carrying those comments. Nothing here touches a database.
const article = () =>
  new Blog({
    title: { en: 'Fixture article', de: 'Fixture-Artikel' },
    slug: { en: 'fixture-article', de: 'fixture-artikel' },
    status: 'published',
    contentBlocks: [],
    comments: submissions(),
  });

// Stands in for a Mongoose query: every populate returns the chain, and
// awaiting it yields the document.
const queryResolving = (doc: unknown) => {
  const chain = {
    populate: () => chain,
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(doc).then(resolve, reject),
  };
  return chain;
};

// Runs a handler and returns what Express would put on the wire.
const respond = async (handler: typeof getBlogBySlug, req: unknown) => {
  let status = 0;
  let body: unknown;
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  };
  await handler(req as never, res as never);
  return { status, json: JSON.stringify(body) };
};

test('an approved comment is published without the commenter email', () => {
  const [published] = toPublicBlogComments([withIds()[0]]);

  assert.deepEqual(published, {
    _id: 'c1',
    name: 'Approved Reader',
    text: 'Approved, with an avatar',
    avatar: 'https://res.cloudinary.com/demo/image/upload/reader.jpg',
    isApproved: true,
    createdAt: new Date('2026-09-20T09:30:00Z'),
  });
  assert.equal('email' in published, false);
});

test('pending and rejected comments never reach a public response', () => {
  const published = toPublicBlogComments(withIds());

  assert.deepEqual(published.map((comment) => comment.name), ['Approved Reader', 'Minimal Reader']);
});

test('an approved comment without optional fields is published cleanly', () => {
  const [published] = toPublicBlogComments([withIds()[3]]);

  assert.deepEqual(Object.keys(published), ['_id', 'name', 'text', 'isApproved', 'createdAt']);
  assert.equal(published.text, 'Approved, nothing optional');
});

test('only named fields pass, and only an explicit approval counts', () => {
  const published = toPublicBlogComments([
    {
      _id: 'a',
      name: 'A',
      email: 'a@example.test',
      text: 'approved, with fields that must stay private',
      isApproved: true,
      ip: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
      moderationNote: 'checked',
    },
    { _id: 'b', name: 'B', email: 'b@example.test', text: 'an old record without the flag' },
    { _id: 'c', name: 'C', email: 'c@example.test', text: 'truthy but not true', isApproved: 'true' },
    null,
    'not a comment',
  ]);

  assert.deepEqual(published, [
    { _id: 'a', name: 'A', text: 'approved, with fields that must stay private', isApproved: true },
  ]);
  assert.deepEqual(toPublicBlogComments(undefined), []);
  assert.deepEqual(toPublicBlogComments({}), []);
});

test('the public article endpoint sends approved comments only, with no email anywhere in the payload', async () => {
  const originalFindOne = Blog.findOne;
  Blog.findOne = (() => queryResolving(article())) as unknown as typeof Blog.findOne;

  // The rest of the article is untouched: localized for a language, raw for
  // `bypass`, which returns the document itself and which any caller can send,
  // so it must be sanitized as well.
  const titles: Record<string, unknown> = {
    en: 'Fixture article',
    de: 'Fixture-Artikel',
    bypass: { en: 'Fixture article', de: 'Fixture-Artikel' },
  };

  try {
    for (const locale of ['en', 'de', 'bypass']) {
      const { status, json } = await respond(getBlogBySlug, { params: { slug: 'fixture-article' }, locale });
      const data = JSON.parse(json).data;

      assert.equal(status, 200, locale);
      assert.deepEqual(
        data.comments.map((comment: { name: string }) => comment.name),
        ['Approved Reader', 'Minimal Reader'],
        locale,
      );
      for (const comment of data.comments) {
        assert.ok(Object.keys(comment).every((key) => PUBLIC_KEYS.has(key)), `${locale}: ${Object.keys(comment)}`);
      }
      assert.doesNotMatch(json, /@example\.test|"email"/, locale);
      assert.doesNotMatch(json, /Pending Reader|Rejected Reader|"isApproved":false/, locale);
      assert.deepEqual(data.title, titles[locale], locale);
    }
  } finally {
    Blog.findOne = originalFindOne;
  }
});

test('the admin article endpoint still returns every comment with its email and approval state', async () => {
  const originalFindById = Blog.findById;
  Blog.findById = (() => queryResolving(article())) as unknown as typeof Blog.findById;

  try {
    const { status, json } = await respond(getBlogById, { params: { id: '0123456789abcdef01234567' }, locale: 'bypass' });
    const comments = JSON.parse(json).data.comments;

    assert.equal(status, 200);
    assert.deepEqual(
      comments.map((comment: { email: string }) => comment.email),
      ['approved@example.test', 'pending@example.test', 'rejected@example.test', 'minimal@example.test'],
    );
    assert.deepEqual(
      comments.map((comment: { isApproved: boolean }) => comment.isApproved),
      [true, false, false, true],
    );
  } finally {
    Blog.findById = originalFindById;
  }
});
