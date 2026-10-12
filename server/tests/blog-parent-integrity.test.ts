import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';
import '../src/middleware/i18n';
import type {} from '../src/types/express';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import { deleteCategory, toggleCategoryStatus, updateCategory } from '../src/controllers/blogCategoryController';
import { deleteSubcategory, toggleSubcategoryStatus, updateSubcategory } from '../src/controllers/blogSubCategoryController';
import { deleteDestination, toggleDestinationStatus, updateDestination } from '../src/controllers/destinationController';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type Handler = (req: never, res: never) => Promise<void>;

const PARENT = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const ELSEWHERE = 'bbbbbbbbbbbbbbbbbbbbbbbb';

// ── In-memory stand-ins. Nothing touches a database. ────────────────────────

type Writes = { updated: Doc[]; saved: Doc[]; deleted: number; counted: Doc[] };

/** The parent as stored, with the document methods the handlers call. */
const stored = (fields: Doc, writes: Writes): Doc => {
  const doc: Doc = {
    _id: PARENT,
    name: { en: 'Parent' },
    editVersion: 4,
    ...fields,
    save: async function save(this: Doc) {
      writes.saved.push({ isActive: this.isActive, status: this.status });
      return this;
    },
    deleteOne: async () => {
      writes.deleted += 1;
    },
    toObject() {
      return { ...fields, _id: PARENT };
    },
  };
  return doc;
};

/** What Mongo answers for the one filter the guard builds: a status list and one direct reference. */
const countMatching = (articles: Doc[], filter: Doc): number =>
  articles.filter((article) =>
    Object.entries(filter).every(([key, expected]) =>
      expected && typeof expected === 'object' && '$in' in expected
        ? (expected.$in as unknown[]).includes(article[key])
        : String(article[key]) === String(expected)
    )
  ).length;

type Model = { findById: unknown; findByIdAndUpdate?: unknown };

/**
 * Runs `run` with one parent of `model` in the store and `articles` filed
 * around it; `writes` records every write a handler attempted.
 */
const withParent = async (model: Model, fields: Doc, articles: Doc[], run: (writes: Writes) => Promise<void>) => {
  const originals = { findById: model.findById, findByIdAndUpdate: model.findByIdAndUpdate, count: Blog.countDocuments };
  const writes: Writes = { updated: [], saved: [], deleted: 0, counted: [] };
  const parent = stored(fields, writes);

  // Awaited directly (toggle, delete) or after .select() (update).
  const reading = {
    select: () => reading,
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(parent).then(resolve, reject),
  };
  model.findById = () => reading;
  model.findByIdAndUpdate = (_id: string, body: Doc) => {
    writes.updated.push(body);
    const updated = stored({ ...fields, ...body }, writes);
    const chain = {
      populate: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(updated).then(resolve, reject),
    };
    return chain;
  };
  Blog.countDocuments = ((filter: Doc) => {
    writes.counted.push(filter);
    return Promise.resolve(countMatching(articles, filter));
  }) as unknown as typeof Blog.countDocuments;

  try {
    await run(writes);
  } finally {
    model.findById = originals.findById;
    model.findByIdAndUpdate = originals.findByIdAndUpdate;
    Blog.countDocuments = originals.count;
  }
};

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
      return res;
    },
  };
  await handler({ params: { id: PARENT }, body: {}, ...req } as never, res as never);
  return { status, body: JSON.parse(JSON.stringify(body)) as Doc };
};

const wrote = (writes: Writes) => writes.updated.length + writes.saved.length + writes.deleted;

/** A 400 with exactly this message, and not one write. */
const assertRefused = (answer: { status: number; body: Doc }, writes: Writes, message: string) => {
  assert.equal(answer.status, 400, message);
  assert.deepEqual(answer.body, { success: false, error: message });
  assert.equal(wrote(writes), 0, 'nothing is written, and nothing is done to the articles');
};

// ── The same matrix for the category and for the topic ──────────────────────

const FAMILIES = [
  {
    label: 'category',
    field: 'category',
    model: BlogCategory as unknown as Model,
    update: updateCategory as Handler,
    toggle: toggleCategoryStatus as Handler,
    remove: deleteCategory as Handler,
  },
  {
    label: 'subcategory',
    field: 'subCategory',
    model: BlogSubCategory as unknown as Model,
    update: updateSubcategory as Handler,
    toggle: toggleSubcategoryStatus as Handler,
    remove: deleteSubcategory as Handler,
  },
] as const;

for (const family of FAMILIES) {
  const article = (status: string, parent = PARENT): Doc => ({ status, [family.field]: parent });
  const switchOff = () => respond(family.update, { body: { _editVersion: 4, isActive: false } });
  const inUse = (count: number, change: string) =>
    `Cannot ${change} this ${family.label} because ${count} published or scheduled ${count === 1 ? 'article uses' : 'articles use'} it`;

  test(`${family.label}: switching it off is refused while a published or a scheduled article is filed under it`, async () => {
    for (const [articles, count] of [
      [[article('published')], 1],
      [[article('scheduled')], 1],
      [[article('published'), article('scheduled'), article('draft'), article('published', ELSEWHERE)], 2],
    ] as const) {
      await withParent(family.model, { isActive: true }, [...articles], async (writes) => {
        assertRefused(await switchOff(), writes, inUse(count, 'deactivate'));
      });
      await withParent(family.model, { isActive: true }, [...articles], async (writes) => {
        assertRefused(await respond(family.toggle, {}), writes, inUse(count, 'deactivate'));
      });
    }
  });

  test(`${family.label}: with drafts only, or with no articles, it can be switched off`, async () => {
    for (const articles of [[article('draft'), article('draft')], [], [article('published', ELSEWHERE)]]) {
      await withParent(family.model, { isActive: true }, articles, async (writes) => {
        assert.equal((await switchOff()).status, 200);
        assert.equal(writes.updated[0].isActive, false);
      });
      await withParent(family.model, { isActive: true }, articles, async (writes) => {
        assert.equal((await respond(family.toggle, {})).status, 200);
        assert.deepEqual(writes.saved, [{ isActive: false, status: undefined }]);
      });
    }
  });

  test(`${family.label}: an edit that leaves it on is never held up, whatever is filed under it`, async () => {
    await withParent(family.model, { isActive: true }, [article('published'), article('scheduled')], async (writes) => {
      for (const body of [
        { name: { en: 'Renamed' } },
        { metaTitle: { en: 'A new SEO title' } },
        { image: { url: 'https://example.test/new.jpg' } },
        { name: { en: 'Renamed' }, isActive: true },
      ]) {
        assert.equal((await respond(family.update, { body: { _editVersion: 4, ...body } })).status, 200, JSON.stringify(body));
      }
      assert.equal(writes.updated.length, 4);
      // Not even asked: the dependency count runs only for a real switch-off.
      assert.equal(writes.counted.length, 0);
    });
  });

  test(`${family.label}: one that is already off stays editable, and can be switched back on`, async () => {
    await withParent(family.model, { isActive: false }, [article('published')], async (writes) => {
      assert.equal((await respond(family.update, { body: { _editVersion: 4, isActive: false, name: { en: 'Renamed' } } })).status, 200);
      assert.equal((await respond(family.toggle, {})).status, 200);
      assert.deepEqual(writes.saved, [{ isActive: true, status: undefined }]);
      assert.equal(writes.counted.length, 0);
    });
  });

  test(`${family.label}: deleting it is refused while a published or a scheduled article is filed under it`, async () => {
    for (const status of ['published', 'scheduled']) {
      // Off or on makes no difference: a deleted parent leaves the article pointing at nothing.
      for (const isActive of [true, false]) {
        await withParent(family.model, { isActive }, [article(status)], async (writes) => {
          assertRefused(await respond(family.remove, {}), writes, inUse(1, 'delete'));
        });
      }
    }
    for (const articles of [[article('draft')], []]) {
      await withParent(family.model, { isActive: true }, articles, async (writes) => {
        assert.equal((await respond(family.remove, {})).status, 200);
        assert.equal(writes.deleted, 1);
      });
    }
  });

  test(`${family.label}: the count is taken on the article's own reference, and on nothing else`, async () => {
    await withParent(family.model, { isActive: true, featuredDestinations: [PARENT] }, [article('published')], async (writes) => {
      await switchOff();
      assert.deepEqual(writes.counted, [{ status: { $in: ['published', 'scheduled'] }, [family.field]: PARENT }]);
    });
  });
}

// ── The destination: its page is public when published and switched on ──────

const filedUnder = (status: string, destination = PARENT): Doc => ({ status, destination });
const destinationModel = Destination as unknown as Model;
const PUBLIC = { status: 'published', isActive: true };
const destinationInUse = (count: number, change: string) =>
  `Cannot ${change} this destination because ${count} published or scheduled ${count === 1 ? 'article uses' : 'articles use'} it`;

test('destination: its page cannot be taken down while a published or a scheduled article is filed under it', async () => {
  for (const status of ['published', 'scheduled']) {
    const articles = [filedUnder(status)];
    // Back to a draft.
    await withParent(destinationModel, PUBLIC, articles, async (writes) => {
      assertRefused(await respond(updateDestination as Handler, { body: { status: 'draft' } }), writes, destinationInUse(1, 'unpublish'));
    });
    // Switched off, through the editor or through the toggle.
    await withParent(destinationModel, PUBLIC, articles, async (writes) => {
      assertRefused(await respond(updateDestination as Handler, { body: { isActive: false } }), writes, destinationInUse(1, 'deactivate'));
    });
    await withParent(destinationModel, PUBLIC, articles, async (writes) => {
      assertRefused(await respond(toggleDestinationStatus as Handler, {}), writes, destinationInUse(1, 'deactivate'));
    });
    // Both at once is still an unpublish.
    await withParent(destinationModel, PUBLIC, articles, async (writes) => {
      assertRefused(
        await respond(updateDestination as Handler, { body: { status: 'draft', isActive: false } }),
        writes,
        destinationInUse(1, 'unpublish')
      );
    });
  }

  await withParent(destinationModel, PUBLIC, [filedUnder('published'), filedUnder('published'), filedUnder('scheduled'), filedUnder('draft')], async (writes) => {
    assertRefused(await respond(updateDestination as Handler, { body: { status: 'draft' } }), writes, destinationInUse(3, 'unpublish'));
  });
});

test('destination: with drafts only, or with no articles, its page can be taken down', async () => {
  for (const articles of [[filedUnder('draft')], [], [filedUnder('published', ELSEWHERE)]]) {
    await withParent(destinationModel, PUBLIC, articles, async (writes) => {
      assert.equal((await respond(updateDestination as Handler, { body: { status: 'draft' } })).status, 200);
      assert.deepEqual(writes.saved, [{ isActive: true, status: 'draft' }]);
    });
    await withParent(destinationModel, PUBLIC, articles, async (writes) => {
      assert.equal((await respond(toggleDestinationStatus as Handler, {})).status, 200);
      assert.deepEqual(writes.saved, [{ isActive: false, status: 'published' }]);
    });
  }
});

test('destination: an edit that leaves its page public is never held up', async () => {
  await withParent(destinationModel, PUBLIC, [filedUnder('published'), filedUnder('scheduled')], async (writes) => {
    for (const body of [
      { heroTitle: { en: 'A new hero' } },
      { description: { en: 'New copy' }, status: 'published' },
      { region: { en: 'Upper Egypt' }, isActive: true },
    ]) {
      assert.equal((await respond(updateDestination as Handler, { body })).status, 200, JSON.stringify(body));
    }
    assert.equal(writes.saved.length, 3);
    assert.equal(writes.counted.length, 0, 'no dependency count without a real transition');
  });
});

test('destination: one with no public page is free to change, and publishing one is never blocked', async () => {
  // A draft, or a published one already switched off, has no page to lose.
  for (const fields of [{ status: 'draft', isActive: true }, { status: 'published', isActive: false }]) {
    await withParent(destinationModel, fields, [filedUnder('published')], async (writes) => {
      assert.equal((await respond(updateDestination as Handler, { body: { isActive: false } })).status, 200);
      assert.equal((await respond(toggleDestinationStatus as Handler, {})).status, 200);
      assert.equal(writes.counted.length, 0);
    });
  }
  await withParent(destinationModel, { status: 'draft', isActive: true }, [filedUnder('draft')], async (writes) => {
    assert.equal((await respond(updateDestination as Handler, { body: { status: 'published' } })).status, 200);
    assert.deepEqual(writes.saved, [{ isActive: true, status: 'published' }]);
  });
});

test('destination: deleting it is refused while a published or a scheduled article is filed under it', async () => {
  for (const status of ['published', 'scheduled']) {
    for (const fields of [PUBLIC, { status: 'draft', isActive: true }]) {
      await withParent(destinationModel, fields, [filedUnder(status)], async (writes) => {
        assertRefused(await respond(deleteDestination as Handler, {}), writes, destinationInUse(1, 'delete'));
      });
    }
  }
  for (const articles of [[filedUnder('draft')], []]) {
    await withParent(destinationModel, PUBLIC, articles, async (writes) => {
      assert.equal((await respond(deleteDestination as Handler, {})).status, 200);
      assert.equal(writes.deleted, 1);
    });
  }
});

test('destination: only an article\'s own destination counts — being featured by a category or topic does not', async () => {
  // Every category and topic may feature this destination; no article is filed under it.
  await withParent(destinationModel, PUBLIC, [{ status: 'published', destination: ELSEWHERE, category: 'c1', subCategory: 's1' }], async (writes) => {
    assert.equal((await respond(updateDestination as Handler, { body: { status: 'draft' } })).status, 200);
    assert.deepEqual(writes.counted, [{ status: { $in: ['published', 'scheduled'] }, destination: PARENT }]);
  });
});

// ── A topic changing category ───────────────────────────────────────────────
// A published article names both its category and its topic, and the two have
// to agree. The article's own save keeps them agreeing; this is the other
// side: the topic may not be moved out from under the articles.

const HOME_CATEGORY = 'cccccccccccccccccccccccc';
const OTHER_CATEGORY = 'dddddddddddddddddddddddd';
const topicModel = BlogSubCategory as unknown as Model;
const TOPIC = { isActive: true, category: HOME_CATEGORY };
const underTopic = (status: string, topic = PARENT): Doc => ({ status, subCategory: topic, category: HOME_CATEGORY });
const moveTo = (category: unknown, extra: Doc = {}) =>
  respond(updateSubcategory as Handler, { body: { _editVersion: 4, category, ...extra } });
const cannotMove = (count: number) =>
  `Cannot move this subcategory to another category because ${count} published or scheduled ${count === 1 ? 'article uses' : 'articles use'} it. Reclassify those articles first`;

test('topic move: refused while a published or a scheduled article is filed under the topic', async () => {
  for (const [articles, count] of [
    [[underTopic('published')], 1],
    [[underTopic('scheduled')], 1],
    [[underTopic('published'), underTopic('published'), underTopic('scheduled'), underTopic('draft'), underTopic('published', ELSEWHERE)], 3],
  ] as const) {
    await withParent(topicModel, TOPIC, [...articles], async (writes) => {
      assertRefused(await moveTo(OTHER_CATEGORY), writes, cannotMove(count));
      // The topic's own articles, by their own reference, and nothing else.
      assert.deepEqual(writes.counted, [{ status: { $in: ['published', 'scheduled'] }, subCategory: PARENT }]);
    });
  }
});

test('topic move: a refused move writes nothing, whatever else the same save carried', async () => {
  await withParent(topicModel, TOPIC, [underTopic('published')], async (writes) => {
    assertRefused(await moveTo(OTHER_CATEGORY, { name: { en: 'Renamed' }, metaTitle: { en: 'New title' } }), writes, cannotMove(1));
    // Taking the category away altogether is no way round it either.
    assertRefused(await moveTo(null), writes, cannotMove(1));
    assertRefused(await moveTo(''), writes, cannotMove(1));
  });
});

test('topic move: with drafts only, or with no articles, the topic moves', async () => {
  for (const articles of [[underTopic('draft'), underTopic('draft')], [], [underTopic('published', ELSEWHERE)]]) {
    await withParent(topicModel, TOPIC, articles, async (writes) => {
      assert.equal((await moveTo(OTHER_CATEGORY)).status, 200);
      assert.equal(writes.updated.length, 1);
      assert.equal(writes.updated[0].category, OTHER_CATEGORY);
    });
  }
});

test('topic move: sending the category the topic already has is not a move', async () => {
  // The editor posts the category with every save. However it is written —
  // the id, the id in another case, a populated parent — the same category
  // is the same category, and the articles are not even counted.
  for (const storedCategory of [HOME_CATEGORY, new Types.ObjectId(HOME_CATEGORY)]) {
    await withParent(topicModel, { isActive: true, category: storedCategory }, [underTopic('published'), underTopic('scheduled')], async (writes) => {
      for (const sent of [HOME_CATEGORY, HOME_CATEGORY.toUpperCase(), { _id: HOME_CATEGORY, name: { en: 'Egypt Blog' } }, new Types.ObjectId(HOME_CATEGORY)]) {
        assert.equal((await moveTo(sent, { name: { en: 'Renamed' } })).status, 200, String(sent));
      }
      assert.equal(writes.updated.length, 4);
      assert.equal(writes.counted.length, 0);
    });
  }
});

test('topic move: the guards on switching a topic off and deleting it are as they were', async () => {
  await withParent(topicModel, TOPIC, [underTopic('published')], async (writes) => {
    const inUse = (change: string) => `Cannot ${change} this subcategory because 1 published or scheduled article uses it`;
    assertRefused(await moveTo(HOME_CATEGORY, { isActive: false }), writes, inUse('deactivate'));
    assertRefused(await respond(toggleSubcategoryStatus as Handler, {}), writes, inUse('deactivate'));
    assertRefused(await respond(deleteSubcategory as Handler, {}), writes, inUse('delete'));
    // Off and away at once: still refused, and still nothing written.
    assert.equal((await moveTo(OTHER_CATEGORY, { isActive: false })).status, 400);
    assert.equal(wrote(writes), 0);
  });
});
