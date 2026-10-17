import assert from 'node:assert/strict';
import test from 'node:test';
import '../src/middleware/i18n';
import type {} from '../src/types/express';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination, { PUBLIC_DESTINATION_FILTER } from '../src/models/Destination';
import { createBlog, publishBlog, updateBlog } from '../src/controllers/blogController';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type Handler = (req: never, res: never) => Promise<void>;

const EGYPT_BLOG = 'aaaaaaaaaaaaaaaaaaaaaaa1';
const OTHER_CATEGORY = 'aaaaaaaaaaaaaaaaaaaaaaa2';
const SWITCHED_OFF_CATEGORY = 'aaaaaaaaaaaaaaaaaaaaaaa3';
// Stored before the field existed: no `isActive` at all, which counts as on.
const LEGACY_CATEGORY = 'aaaaaaaaaaaaaaaaaaaaaaa4';
const TRAVEL_TIPS = 'bbbbbbbbbbbbbbbbbbbbbbb1';
const OTHER_TOPIC = 'bbbbbbbbbbbbbbbbbbbbbbb2';
const SWITCHED_OFF_TOPIC = 'bbbbbbbbbbbbbbbbbbbbbbb3';
const TOPIC_OF_SWITCHED_OFF_CATEGORY = 'bbbbbbbbbbbbbbbbbbbbbbb4';
const TOPIC_OF_LEGACY_CATEGORY = 'bbbbbbbbbbbbbbbbbbbbbbb5';
const CAIRO = 'ccccccccccccccccccccccc1';
const DRAFT_DESTINATION = 'ccccccccccccccccccccccc2';
// Published, then switched off: no public page either.
const SWITCHED_OFF_DESTINATION = 'ccccccccccccccccccccccc3';
const DELETED = 'dddddddddddddddddddddddd';
const ARTICLE = 'eeeeeeeeeeeeeeeeeeeeeeee';

// The three collections a classification points into. Nothing touches a database.
const STORE: Record<'category' | 'topic' | 'destination', Doc[]> = {
  category: [
    { _id: EGYPT_BLOG, isActive: true },
    { _id: OTHER_CATEGORY, isActive: true },
    { _id: SWITCHED_OFF_CATEGORY, isActive: false },
    { _id: LEGACY_CATEGORY },
  ],
  topic: [
    { _id: TRAVEL_TIPS, category: EGYPT_BLOG, isActive: true },
    { _id: OTHER_TOPIC, category: OTHER_CATEGORY, isActive: true },
    { _id: SWITCHED_OFF_TOPIC, category: EGYPT_BLOG, isActive: false },
    { _id: TOPIC_OF_SWITCHED_OFF_CATEGORY, category: SWITCHED_OFF_CATEGORY, isActive: true },
    { _id: TOPIC_OF_LEGACY_CATEGORY, category: LEGACY_CATEGORY },
  ],
  destination: [
    { _id: CAIRO, status: 'published', isActive: true },
    { _id: DRAFT_DESTINATION, status: 'draft', isActive: true },
    { _id: SWITCHED_OFF_DESTINATION, status: 'published', isActive: false },
  ],
};

const byId = (docs: Doc[]) => (id: string) => {
  const found = docs.find((doc) => doc._id === String(id)) ?? null;
  const chain = { select: () => chain, lean: () => Promise.resolve(found) };
  return chain;
};

type Writes = { created: Doc[]; updates: Doc[]; saved: Doc[] };

/**
 * Swaps the model calls the three write handlers make for in-memory ones.
 * `stored` is the article an update or a publish starts from.
 */
const withModels = async (stored: Doc | null, run: (writes: Writes) => Promise<void>) => {
  const originals = {
    create: Blog.create,
    findById: Blog.findById,
    findByIdAndUpdate: Blog.findByIdAndUpdate,
    category: BlogCategory.findById,
    topic: BlogSubCategory.findById,
    destination: Destination.findById,
  };
  const writes: Writes = { created: [], updates: [], saved: [] };

  BlogCategory.findById = byId(STORE.category) as unknown as typeof BlogCategory.findById;
  BlogSubCategory.findById = byId(STORE.topic) as unknown as typeof BlogSubCategory.findById;
  Destination.findById = byId(STORE.destination) as unknown as typeof Destination.findById;

  Blog.create = (async (body: Doc) => {
    writes.created.push(body);
    return { ...body, _id: ARTICLE, populate: async () => undefined };
  }) as unknown as typeof Blog.create;

  // updateBlog reads the stored article with .lean(); publishBlog awaits the document.
  Blog.findById = (() => {
    const document = stored && {
      ...stored,
      save: async function save(this: Doc) {
        writes.saved.push({ status: this.status });
      },
    };
    return {
      lean: () => Promise.resolve(stored),
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(document).then(resolve, reject),
    };
  }) as unknown as typeof Blog.findById;

  Blog.findByIdAndUpdate = ((_id: string, update: Doc) => {
    writes.updates.push(update);
    const chain = {
      populate: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve({ ...stored, ...update.$set }).then(resolve, reject),
    };
    return chain;
  }) as unknown as typeof Blog.findByIdAndUpdate;

  try {
    await run(writes);
  } finally {
    Blog.create = originals.create;
    Blog.findById = originals.findById;
    Blog.findByIdAndUpdate = originals.findByIdAndUpdate;
    BlogCategory.findById = originals.category;
    BlogSubCategory.findById = originals.topic;
    Destination.findById = originals.destination;
  }
};

const respond = async (handler: Handler, req: unknown) => {
  let status = 0;
  let body: Doc = {};
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: Doc) {
      body = payload;
      return res;
    },
  };
  await handler(req as never, res as never);
  return { status, body: JSON.parse(JSON.stringify(body)) as Doc };
};

const CLASSIFIED = { category: EGYPT_BLOG, subCategory: TRAVEL_TIPS, destination: CAIRO };

// A public article needs a complete English version (utils/blogAvailability.ts);
// these fixtures have one, so each test here is decided by its classification.
const ENGLISH_BODY = [{ type: 'html', content: { en: '<p>The citadel above Cairo.</p>' } }];

const newArticle = (overrides: Doc): Doc => ({
  title: { en: 'Saladin Citadel' },
  slug: { en: 'saladin-citadel' },
  contentBlocks: ENGLISH_BODY,
  featuredImage: { url: 'https://example.test/citadel.jpg', alt: { en: 'The citadel' } },
  status: 'published',
  ...CLASSIFIED,
  ...overrides,
});

const create = (overrides: Doc) => respond(createBlog, { body: newArticle(overrides) });

/** The article as stored before an update or a publish. */
const storedArticle = (overrides: Doc): Doc => ({
  _id: ARTICLE,
  editVersion: 3,
  status: 'draft',
  title: { en: 'Saladin Citadel' },
  slug: { en: 'saladin-citadel' },
  contentBlocks: ENGLISH_BODY,
  featuredImage: { url: 'https://example.test/citadel.jpg' },
  ...CLASSIFIED,
  ...overrides,
});

const update = (body: Doc) => respond(updateBlog, { params: { id: ARTICLE }, body: { _editVersion: 3, ...body } });

// What each parent that is not ready for a public article answers.
const INACTIVE_CATEGORY = 'The selected category is inactive. Choose an active category before publishing';
const INACTIVE_TOPIC = 'The selected subcategory is inactive. Choose an active subcategory before publishing';
const UNPUBLISHED_DESTINATION = 'The selected destination has no published page. Choose a published destination before publishing';
const MISMATCH = 'The selected subcategory does not belong to the selected category';

/** Every rejected write answers 400 with one message and reaches no model write. */
const assertRejected = (answer: { status: number; body: Doc }, message: string) => {
  assert.equal(answer.status, 400, message);
  assert.deepEqual(answer.body, { success: false, error: message });
};

test('a published article is rejected without a category, a topic or a destination', async () => {
  await withModels(null, async (writes) => {
    for (const [overrides, message] of [
      [{ category: undefined }, 'Category is required before publishing'],
      [{ subCategory: undefined }, 'Subcategory is required before publishing'],
      [{ destination: undefined }, 'Destination is required before publishing'],
      // The Admin form posts an unchosen select as '' or as its "none" option.
      [{ destination: '' }, 'Destination is required before publishing'],
      [{ subCategory: 'none', destination: null }, 'Subcategory and destination are required before publishing'],
      [{ category: '', subCategory: '', destination: '' }, 'Category, subcategory and destination are required before publishing'],
    ] as const) {
      assertRejected(await create(overrides), message);
    }
    assert.equal(writes.created.length, 0, 'nothing reaches the database');
  });
});

test('a reference to a document that no longer exists is rejected', async () => {
  await withModels(null, async (writes) => {
    for (const [overrides, message] of [
      [{ category: DELETED }, 'The selected category no longer exists. Choose another before publishing'],
      [{ subCategory: DELETED }, 'The selected subcategory no longer exists. Choose another before publishing'],
      [{ destination: DELETED }, 'The selected destination no longer exists. Choose another before publishing'],
      [{ category: DELETED, destination: DELETED }, 'The selected category and destination no longer exist. Choose another before publishing'],
      // Not an id at all: answered the same way, never as a cast failure.
      [{ destination: 'cairo' }, 'The selected destination no longer exists. Choose another before publishing'],
    ] as const) {
      assertRejected(await create(overrides), message);
    }
    assert.equal(writes.created.length, 0);
  });
});

test('the category must be switched on', async () => {
  await withModels(null, async (writes) => {
    // Its own topic is on and belongs to it: the category alone is the reason.
    assertRejected(
      await create({ category: SWITCHED_OFF_CATEGORY, subCategory: TOPIC_OF_SWITCHED_OFF_CATEGORY }),
      INACTIVE_CATEGORY
    );
    assert.equal(writes.created.length, 0);

    assert.equal((await create({})).status, 201);
    // A category stored without the flag is on, as the slug resolver reads it.
    assert.equal((await create({ category: LEGACY_CATEGORY, subCategory: TOPIC_OF_LEGACY_CATEGORY })).status, 201);
  });
});

test('the topic must be switched on and belong to the category', async () => {
  await withModels(null, async (writes) => {
    assertRejected(await create({ subCategory: SWITCHED_OFF_TOPIC }), INACTIVE_TOPIC);
    assertRejected(await create({ subCategory: OTHER_TOPIC }), MISMATCH);
    assert.equal(writes.created.length, 0);

    assert.equal((await create({ subCategory: TRAVEL_TIPS })).status, 201);
    assert.equal(writes.created[0].subCategory, TRAVEL_TIPS);
  });
});

test('the destination must have a public page: published, and not switched off', async () => {
  await withModels(null, async (writes) => {
    assertRejected(await create({ destination: DRAFT_DESTINATION }), UNPUBLISHED_DESTINATION);
    assertRejected(await create({ destination: SWITCHED_OFF_DESTINATION }), UNPUBLISHED_DESTINATION);
    assert.equal(writes.created.length, 0);

    assert.equal((await create({ destination: CAIRO })).status, 201);
  });

  // The guard reads a document in hand; the public reads use this filter. The
  // two are one rule, so a change to the filter has to come back here.
  assert.deepEqual({ ...PUBLIC_DESTINATION_FILTER }, { status: 'published', isActive: { $ne: false } });
});

test('everything that is not ready is named in one answer', async () => {
  await withModels(null, async () => {
    assertRejected(
      await create({ subCategory: SWITCHED_OFF_TOPIC, destination: DRAFT_DESTINATION }),
      'The selected subcategory is inactive and destination has no published page. ' +
        'Choose an active subcategory and a published destination before publishing'
    );
    assertRejected(
      await create({ category: SWITCHED_OFF_CATEGORY, subCategory: SWITCHED_OFF_TOPIC, destination: SWITCHED_OFF_DESTINATION }),
      'The selected category is inactive, subcategory is inactive and destination has no published page. ' +
        'Choose an active category, an active subcategory and a published destination before publishing'
    );
  });
});

test('a fully classified article is published', async () => {
  await withModels(null, async (writes) => {
    const { status, body } = await create({});
    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.deepEqual(
      { category: writes.created[0].category, subCategory: writes.created[0].subCategory, destination: writes.created[0].destination },
      CLASSIFIED
    );
    assert.equal(writes.created[0].status, 'published');
  });
});

test('a scheduled article is held to the same rules, since it goes public unattended', async () => {
  await withModels(null, async (writes) => {
    const scheduledAt = new Date(Date.now() + 86_400_000).toISOString();
    const schedule = (overrides: Doc) => create({ status: 'scheduled', scheduledAt, ...overrides });

    assertRejected(await schedule({ destination: '' }), 'Destination is required before publishing');
    assertRejected(await schedule({ category: SWITCHED_OFF_CATEGORY, subCategory: TOPIC_OF_SWITCHED_OFF_CATEGORY }), INACTIVE_CATEGORY);
    assertRejected(await schedule({ subCategory: SWITCHED_OFF_TOPIC }), INACTIVE_TOPIC);
    assertRejected(await schedule({ destination: DRAFT_DESTINATION }), UNPUBLISHED_DESTINATION);
    assertRejected(await schedule({ subCategory: OTHER_TOPIC }), MISMATCH);
    assert.equal(writes.created.length, 0);

    assert.equal((await schedule({})).status, 201);
    assert.equal(writes.created[0].status, 'scheduled');
  });

  // Scheduling a stored draft through an update.
  await withModels(storedArticle({ destination: DRAFT_DESTINATION }), async (writes) => {
    const scheduledAt = new Date(Date.now() + 86_400_000).toISOString();
    assertRejected(await update({ status: 'scheduled', scheduledAt }), UNPUBLISHED_DESTINATION);
    assert.equal(writes.updates.length, 0);
    assert.equal((await update({ status: 'scheduled', scheduledAt, destination: CAIRO })).status, 200);
  });
});

test('a draft is saved however little of it is classified, and with parents still in preparation', async () => {
  await withModels(null, async (writes) => {
    for (const overrides of [
      { status: 'draft', category: undefined, subCategory: undefined, destination: undefined },
      { status: 'draft', category: '', subCategory: '', destination: '' },
      { status: 'draft', subCategory: OTHER_TOPIC },
      { status: 'draft', destination: DELETED },
      { status: 'draft', subCategory: SWITCHED_OFF_TOPIC },
      { status: 'draft', destination: DRAFT_DESTINATION },
      { status: 'draft', category: SWITCHED_OFF_CATEGORY, subCategory: TOPIC_OF_SWITCHED_OFF_CATEGORY },
    ]) {
      assert.equal((await create(overrides)).status, 201, JSON.stringify(overrides));
    }
    // An unchosen select is stored as null, not handed to the ObjectId cast as ''.
    assert.deepEqual(
      [writes.created[1].category, writes.created[1].subCategory, writes.created[1].destination],
      [null, null, null]
    );
    // A draft keeps the work-in-progress parent it was given.
    assert.equal(writes.created[5].destination, DRAFT_DESTINATION);
  });

  await withModels(storedArticle({ category: null, subCategory: null, destination: null }), async (writes) => {
    assert.equal((await update({ title: { en: 'Renamed' } })).status, 200);
    assert.equal((await update({ destination: DRAFT_DESTINATION, subCategory: '' })).status, 200);
    assert.equal(writes.updates[1].$set.destination, DRAFT_DESTINATION);
    assert.equal(writes.updates[1].$set.subCategory, null);
  });
});

test('publishing a draft through an update needs the classification the article will end up with', async () => {
  await withModels(storedArticle({ destination: null }), async (writes) => {
    assertRejected(await update({ status: 'published' }), 'Destination is required before publishing');
    assertRejected(await update({ status: 'published', destination: DRAFT_DESTINATION }), UNPUBLISHED_DESTINATION);
    assert.equal(writes.updates.length, 0);

    // The same save may supply what was missing.
    const published = await update({ status: 'published', destination: CAIRO });
    assert.equal(published.status, 200);
    assert.equal(writes.updates[0].$set.destination, CAIRO);
  });

  // A draft filed under a draft destination and a switched-off topic: fine as
  // a draft, not publishable until both are ready.
  await withModels(storedArticle({ subCategory: SWITCHED_OFF_TOPIC, destination: DRAFT_DESTINATION }), async (writes) => {
    assertRejected(
      await update({ status: 'published' }),
      'The selected subcategory is inactive and destination has no published page. ' +
        'Choose an active subcategory and a published destination before publishing'
    );
    assert.equal(writes.updates.length, 0);
  });
});

test('an edit may not leave an already published article with a parent that is not ready', async () => {
  await withModels(storedArticle({ status: 'published', publishedAt: new Date('2026-01-01') }), async (writes) => {
    for (const [body, message] of [
      [{ destination: '' }, 'Destination is required before publishing'],
      [{ category: null }, 'Category is required before publishing'],
      [{ destination: DELETED }, 'The selected destination no longer exists. Choose another before publishing'],
      [{ destination: DRAFT_DESTINATION }, UNPUBLISHED_DESTINATION],
      [{ destination: SWITCHED_OFF_DESTINATION }, UNPUBLISHED_DESTINATION],
      [{ subCategory: SWITCHED_OFF_TOPIC }, INACTIVE_TOPIC],
      [{ category: SWITCHED_OFF_CATEGORY, subCategory: TOPIC_OF_SWITCHED_OFF_CATEGORY }, INACTIVE_CATEGORY],
      [{ subCategory: OTHER_TOPIC }, MISMATCH],
      [{ category: OTHER_CATEGORY }, MISMATCH],
    ] as const) {
      assertRejected(await update(body), message);
    }
    // Rejected, not quietly taken back to a draft: nothing was written at all.
    assert.equal(writes.updates.length, 0);

    // An edit that leaves the classification alone, and one that moves the
    // article to another category and a topic of that category, both save.
    assert.equal((await update({ title: { en: 'Renamed' } })).status, 200);
    assert.equal((await update({ category: OTHER_CATEGORY, subCategory: OTHER_TOPIC })).status, 200);
    assert.equal(writes.updates.length, 2);
    assert.equal('status' in writes.updates[0].$set, false, 'the article stays published');

    // Taking it back to a draft lifts the rule.
    assert.equal((await update({ status: 'draft', destination: DRAFT_DESTINATION })).status, 200);
    assert.equal(writes.updates[2].$set.destination, DRAFT_DESTINATION);
  });
});

test('a parent switched off after publication blocks the next save until the article is refiled', async () => {
  // Published under a topic that has since been switched off.
  await withModels(storedArticle({ status: 'published', subCategory: SWITCHED_OFF_TOPIC }), async (writes) => {
    assertRejected(await update({ title: { en: 'Renamed' } }), INACTIVE_TOPIC);
    assert.equal(writes.updates.length, 0);

    assert.equal((await update({ title: { en: 'Renamed' }, subCategory: TRAVEL_TIPS })).status, 200);
    assert.equal((await update({ status: 'draft' })).status, 200);
  });
});

test('the publish action applies the same rules', async () => {
  for (const [stored, message] of [
    [{ subCategory: null }, 'Subcategory is required before publishing'],
    [{ subCategory: SWITCHED_OFF_TOPIC }, INACTIVE_TOPIC],
    [{ destination: DRAFT_DESTINATION }, UNPUBLISHED_DESTINATION],
    [{ category: SWITCHED_OFF_CATEGORY, subCategory: TOPIC_OF_SWITCHED_OFF_CATEGORY }, INACTIVE_CATEGORY],
    [{ subCategory: OTHER_TOPIC }, MISMATCH],
  ] as const) {
    await withModels(storedArticle(stored), async (writes) => {
      assertRejected(await respond(publishBlog, { params: { id: ARTICLE } }), message);
      assert.equal(writes.saved.length, 0);
    });
  }

  await withModels(storedArticle({}), async (writes) => {
    const { status, body } = await respond(publishBlog, { params: { id: ARTICLE } });
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(writes.saved, [{ status: 'published' }]);
  });
});
