import assert from 'node:assert/strict';
import test from 'node:test';
// Declares `req.locale`, which these controllers read.
import '../src/middleware/i18n';
import type {} from '../src/types/express';
import sift from 'sift';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import EditorialAuthor from '../src/models/EditorialAuthor';
import User from '../src/models/User';
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getBlogsByCategory,
  getBlogsBySubCategory,
  getFeaturedBlogs,
  publishBlog,
  updateBlog,
} from '../src/controllers/blogController';
import { getBlogsByDestination } from '../src/controllers/destinationController';
import { getEditorialAuthorBySlug } from '../src/controllers/editorialAuthorController';
import { blogCardPopulate } from '../src/utils/blogCardPopulate';
import { localizeBlogArticles } from '../src/utils/localize';
import {
  BLOG_LOCALES,
  availableBlogLocales,
  getBlogLocaleAvailabilityFilter,
  hasVisibleText,
  isBlogArticleAvailableInLocale,
  isStrictBlogSlug,
  publicBlogArticleFilter,
} from '../src/utils/blogAvailability';

/*
 * When a Blog article is public in a language (utils/blogAvailability.ts):
 * published, a strict slug, a title and a body of its own in that language.
 *
 * The rule exists as a MongoDB filter and as a check on a document; this file
 * holds the two to the same answer on every fixture, then checks every surface
 * that lists articles uses it BEFORE it counts and pages. Nothing here touches
 * a database — except the opt-in check against a real server, which runs the
 * filter over inline documents and reads no collection.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
type Handler = (req: never, res: never) => Promise<void>;
const LANGS = ['en', 'de', 'it', 'es'] as const;

// ── The rule, on a fixture matrix ───────────────────────────────────────────

const html = (content: Doc, extra: Doc = {}) => ({ type: 'html', content, ...extra });
const base = (overrides: Doc = {}): Doc => ({
  status: 'published',
  slug: { en: 'pyramids-of-giza' },
  title: { en: 'Pyramids of Giza' },
  contentBlocks: [html({ en: '<p>The pyramids.</p>' })],
  ...overrides,
});

/** [name, article, the languages it is public in] */
const MATRIX: [string, Doc, string[]][] = [
  ['complete in English', base(), ['en']],
  ['complete in all four', base({
    slug: { en: 'pyramids', de: 'pyramiden', it: 'piramidi', es: 'piramides' },
    title: { en: 'Pyramids', de: 'Pyramiden', it: 'Piramidi', es: 'Pirámides' },
    contentBlocks: [html({ en: '<p>a</p>', de: '<p>b</p>', it: '<p>c</p>', es: '<p>d</p>' })],
  }), ['en', 'de', 'it', 'es']],
  ['a draft', base({ status: 'draft' }), []],
  ['scheduled', base({ status: 'scheduled' }), []],
  ['no slug', base({ slug: {} }), []],
  ['malformed slug (uppercase)', base({ slug: { en: 'Pyramids-Of-Giza' } }), []],
  ['malformed slug (accent)', base({ slug: { en: 'pirámides' } }), []],
  ['too short slug', base({ slug: { en: 'ab' } }), []],
  ['slug with a trailing newline', base({ slug: { en: 'pyramids\n' } }), []],
  ['slug as a bare string', base({ slug: 'pyramids-of-giza' }), []],
  ['no title', base({ title: {} }), []],
  ['whitespace title', base({ title: { en: '   ' } }), []],
  ['no body', base({ contentBlocks: [] }), []],
  ['no blocks at all', base({ contentBlocks: undefined }), []],
  ['empty string body', base({ contentBlocks: [html({ en: '' })] }), []],
  ['whitespace body', base({ contentBlocks: [html({ en: '   \n ' })] }), []],
  ['<p></p>', base({ contentBlocks: [html({ en: '<p></p>' })] }), []],
  ['<p><br></p>', base({ contentBlocks: [html({ en: '<p><br></p>' })] }), []],
  ['<p><br /></p>', base({ contentBlocks: [html({ en: '<p><br /></p>' })] }), []],
  ['<p>&nbsp;</p>', base({ contentBlocks: [html({ en: '<p>&nbsp;</p>' })] }), []],
  ['image markup only', base({ contentBlocks: [html({ en: '<img src="a.jpg" alt="Pyramids">' })] }), []],
  ['visible text inside HTML', base({ contentBlocks: [html({ en: '<div><p><strong>Hi</strong></p></div>' })] }), ['en']],
  ['an entity that is text', base({ contentBlocks: [html({ en: '<p>&amp;</p>' })] }), ['en']],
  ['a block title alone', base({ contentBlocks: [html({}, { title: { en: 'Opening hours' } })] }), ['en']],
  ['a blockquote', base({ contentBlocks: [{ type: 'blockquote', content: { en: 'A quote' } }] }), ['en']],
  ['an image block only', base({ contentBlocks: [{ type: 'image', url: 'a.jpg', alt: { en: 'Alt' } }] }), []],
  ['a block for another language only', base({ contentBlocks: [html({ en: '<p>Hi</p>' }, { languages: ['de'] })] }), []],
  ['an empty languages list (every language)', base({ contentBlocks: [html({ en: '<p>Hi</p>' }, { languages: [] })] }), ['en']],
  ['languages naming the language', base({ contentBlocks: [html({ en: '<p>Hi</p>' }, { languages: ['en', 'de'] })] }), ['en']],
  ['one valid block among empty ones', base({
    contentBlocks: [html({ en: '<p><br /></p>' }), { type: 'image', url: 'a.jpg' }, html({ en: '<p>Real text</p>' })],
  }), ['en']],
  ['German slug and title without a German body (the Khan el Khalili case)', base({
    slug: { en: 'khan-el-khalili', de: 'khan-el-khalili-basar', es: 'khan-el-khalili-es' },
    title: { en: 'Khan el Khalili', de: 'Khan-el-Khalili-Basar', es: 'Khan el Khalili' },
    contentBlocks: [html({ en: '<p>The bazaar.</p>', de: '<p>Der Basar.</p>', es: '' })],
  }), ['en', 'de']],
  ['an Italian body with a malformed Italian slug (the Giza case)', base({
    slug: { en: 'visiting-giza', it: 'visitare-Giza' },
    title: { en: 'Visiting Giza', it: 'Visitare Giza' },
    contentBlocks: [html({ en: '<p>Giza.</p>', it: '<p>Giza.</p>' })],
  }), ['en']],
  ['English and German only (the Kom Ombo case)', base({
    slug: { en: 'kom-ombo', de: 'kom-ombo-tempel' },
    title: { en: 'Kom Ombo', de: 'Kom Ombo' },
    contentBlocks: [html({ en: '<p>Temple.</p>', de: '<p>Tempel.</p>' })],
  }), ['en', 'de']],
];

test('the object check answers every fixture as specified', () => {
  for (const [name, article, languages] of MATRIX) {
    assert.deepEqual(availableBlogLocales(article), languages, name);
    for (const locale of LANGS) {
      assert.equal(isBlogArticleAvailableInLocale(article, locale), languages.includes(locale), `${name} / ${locale}`);
    }
  }
});

test('the MongoDB filter selects exactly what the object check accepts (MongoDB query semantics)', () => {
  for (const [name, article] of MATRIX) {
    for (const locale of BLOG_LOCALES) {
      assert.equal(
        sift(getBlogLocaleAvailabilityFilter(locale))(article),
        isBlogArticleAvailableInLocale(article, locale),
        `${name} / ${locale}`
      );
    }
  }
});

const mongoUri = process.env.BLOG_AVAILABILITY_MONGO_URI;
test('…and so does a real MongoDB server (inline documents, no collection read or written)', { skip: !mongoUri }, async () => {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(mongoUri!, { serverSelectionTimeoutMS: 20000 });
  try {
    await client.connect();
    const docs = MATRIX.map(([, article], index) => ({ ...article, _fixture: index }));
    for (const locale of BLOG_LOCALES) {
      const matched = await client
        .db()
        .aggregate([{ $documents: docs }, { $match: getBlogLocaleAvailabilityFilter(locale) }, { $project: { _fixture: 1 } }])
        .toArray();
      const fromServer = matched.map((doc) => MATRIX[doc._fixture as number][0]).sort();
      const fromObject = MATRIX.filter(([, article]) => isBlogArticleAvailableInLocale(article, locale)).map(([name]) => name).sort();
      assert.deepEqual(fromServer, fromObject, locale);
    }
  } finally {
    await client.close();
  }
});

test('the strict slug and the visible-text pieces, on their own', () => {
  for (const slug of ['abc', 'pyramids-of-giza', 'a1-b2']) assert.equal(isStrictBlogSlug(slug), true, slug);
  for (const slug of ['ab', 'Abc', 'a--b', '-ab', 'ab-', 'pirámides', ' abc', 'abc\n', '', 3]) assert.equal(isStrictBlogSlug(slug), false, String(slug));
  for (const text of ['<p>Hi</p>', 'Hi', '<p>&nbsp;Hi</p>', '<li>x</li>']) assert.equal(hasVisibleText(text), true, text);
  for (const text of ['', ' ', '<p></p>', '<p><br></p>', '<p><br /></p>', '<p>&nbsp;</p>', '<p>&#160;</p>', '<p> </p>', '<!-- x -->', null]) {
    assert.equal(hasVisibleText(text), false, String(text));
  }
});

test('the Admin (bypass) reads published articles in every language', () => {
  assert.deepEqual(publicBlogArticleFilter('bypass'), { status: 'published' });
  assert.deepEqual(publicBlogArticleFilter('es'), getBlogLocaleAvailabilityFilter('es'));
});

// ── A store the listing handlers read, with MongoDB's own query semantics ───

const CATEGORY = 'cat-egypt-blog';
const TOPIC = 'topic-travel-tips';
const DESTINATION = 'dest-aswan';

const written = (id: string, day: number, langs: readonly string[], extra: Doc = {}): Doc => ({
  _id: id,
  status: 'published',
  category: CATEGORY,
  subCategory: TOPIC,
  destination: DESTINATION,
  publishedAt: new Date(Date.UTC(2026, 0, day)),
  title: Object.fromEntries(langs.map((l) => [l, `${id} (${l})`])),
  slug: Object.fromEntries(langs.map((l) => [l, `${id}-${l}`])),
  contentBlocks: [html(Object.fromEntries(langs.map((l) => [l, `<p>${id} in ${l}</p>`])))],
  cardDescription: { en: `${id} teaser` },
  ...extra,
});

// Newest first: an article in English and German only, then eight complete
// ones around one whose Spanish has a slug and title but no body, then one
// whose Italian and Spanish slugs are malformed.
const STORE: Doc[] = [
  written('kom', 30, ['en', 'de'], { isFeatured: true }),
  written('c1', 29, LANGS, { isFeatured: true }),
  written('c2', 28, LANGS),
  written('c3', 27, LANGS),
  written('c4', 26, LANGS),
  {
    ...written('khan', 25, LANGS),
    contentBlocks: [html({ en: '<p>Bazaar</p>', de: '<p>Basar</p>', it: '<p>Mercato</p>', es: '' })],
  },
  written('c5', 24, LANGS),
  written('c6', 23, LANGS),
  written('c7', 22, LANGS),
  written('c8', 21, LANGS),
  { ...written('giza', 20, ['en', 'de']), slug: { en: 'giza-en', de: 'giza-de', it: 'Giza-It', es: 'pirámides' } },
  { ...written('draft', 31, LANGS), status: 'draft' },
];
const ids = (body: Doc) => (body.data as Doc[]).map((article) => article._id);

type Reads = { filters: Doc[]; populates: unknown[] };

const withStore = async (store: Doc[], run: (reads: Reads) => Promise<void>) => {
  const originals = {
    find: Blog.find,
    count: Blog.countDocuments,
    findOne: Blog.findOne,
    categoryFindOne: BlogCategory.findOne,
    topicFindOne: BlogSubCategory.findOne,
  };
  const reads: Reads = { filters: [], populates: [] };
  const chainOver = (rows: Doc[]) => {
    let out = rows;
    const chain: Doc = {
      select: () => chain,
      populate: (option: unknown) => {
        reads.populates.push(option);
        return chain;
      },
      sort: () => {
        out = [...out].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        return chain;
      },
      skip: (n: number) => {
        out = out.slice(n);
        return chain;
      },
      limit: (n: number) => {
        out = out.slice(0, n);
        return chain;
      },
      lean: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(out.map((row) => ({ ...row }))).then(resolve, reject),
    };
    return chain;
  };
  Blog.find = ((filter: Doc) => {
    reads.filters.push(filter);
    return chainOver(store.filter(sift(filter)));
  }) as unknown as typeof Blog.find;
  Blog.countDocuments = ((filter: Doc) => Promise.resolve(store.filter(sift(filter)).length)) as unknown as typeof Blog.countDocuments;
  const parent = (id: string) => (() => ({ select: () => ({ lean: () => Promise.resolve({ _id: id }) }) }));
  BlogCategory.findOne = parent(CATEGORY) as unknown as typeof BlogCategory.findOne;
  BlogSubCategory.findOne = parent(TOPIC) as unknown as typeof BlogSubCategory.findOne;
  try {
    await run(reads);
  } finally {
    Blog.find = originals.find;
    Blog.countDocuments = originals.count;
    Blog.findOne = originals.findOne;
    BlogCategory.findOne = originals.categoryFindOne;
    BlogSubCategory.findOne = originals.topicFindOne;
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
      if (!status) status = 200;
      return res;
    },
  };
  await handler(req as never, res as never);
  return { status, body: JSON.parse(JSON.stringify(body)) as Doc };
};

// What each language can show, in the listing's own order.
const EXPECTED: Record<string, string[]> = {
  en: ['kom', 'c1', 'c2', 'c3', 'c4', 'khan', 'c5', 'c6', 'c7', 'c8', 'giza'],
  de: ['kom', 'c1', 'c2', 'c3', 'c4', 'khan', 'c5', 'c6', 'c7', 'c8', 'giza'],
  it: ['c1', 'c2', 'c3', 'c4', 'khan', 'c5', 'c6', 'c7', 'c8'],
  es: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'],
};

const LISTINGS: [string, Handler, Doc][] = [
  ['category', getBlogsByCategory as unknown as Handler, { params: { slug: 'egypt-blog' } }],
  ['topic', getBlogsBySubCategory as unknown as Handler, { params: { slug: 'egypt-travel-tips' } }],
  ['destination', getBlogsByDestination as unknown as Handler, { params: { id: DESTINATION } }],
];

for (const [name, handler, req] of LISTINGS) {
  test(`${name}: the language decides membership, the total and the pages — before the page is cut`, async () => {
    await withStore(STORE, async (reads) => {
      for (const locale of LANGS) {
        const first = await respond(handler, { ...req, query: { page: '1', limit: '9' }, locale });
        const second = await respond(handler, { ...req, query: { page: '2', limit: '9' }, locale });
        const expected = EXPECTED[locale];
        assert.equal(first.status, 200, `${name} ${locale}`);
        assert.equal(first.body.pagination.total, expected.length, `${name} ${locale} total`);
        assert.equal(first.body.pagination.pages, Math.ceil(expected.length / 9), `${name} ${locale} pages`);
        // A full first page whenever there are enough articles: an article the
        // language cannot show takes no slot, and none is left stranded later.
        assert.deepEqual(ids(first.body), expected.slice(0, 9), `${name} ${locale} page 1`);
        assert.deepEqual(ids(second.body), expected.slice(9), `${name} ${locale} page 2`);
        assert.ok(!ids(first.body).includes('draft'));
      }
      // The availability condition is part of the query itself.
      const filter = reads.filters.at(-1)!;
      for (const [key, value] of Object.entries(getBlogLocaleAvailabilityFilter('es'))) {
        assert.deepEqual(filter[key], value, `${name}: ${key} in the query`);
      }
    });
  });
}

test('category and topic: the page count of every language rides along, for page-N alternates', async () => {
  await withStore(STORE, async () => {
    for (const [name, handler, req] of LISTINGS.slice(0, 2)) {
      const { body } = await respond(handler, { ...req, query: { page: '1', limit: '9' }, locale: 'it' });
      assert.deepEqual(body.pagination.pagesByLocale, { en: 2, de: 2, it: 1, es: 1 }, name);
      const admin = await respond(handler, { ...req, query: { page: '1', limit: '9' }, locale: 'bypass' });
      assert.equal('pagesByLocale' in admin.body.pagination, false, `${name}: not for the Admin`);
    }
  });
});

test('listings print a language\'s own text only: no English teaser under another language', async () => {
  await withStore(STORE, async () => {
    const { body } = await respond(getBlogsByCategory as unknown as Handler, { params: { slug: 'egypt-blog' }, query: { page: '1', limit: '9' }, locale: 'it' });
    const c1 = body.data.find((article: Doc) => article._id === 'c1');
    assert.equal(c1.title, 'c1 (it)');
    assert.equal('cardDescription' in c1, false, 'no Italian card description: none, not the English one');
    assert.deepEqual(c1.slug, { en: 'c1-en', de: 'c1-de', it: 'c1-it', es: 'c1-es' }, 'slugs stay whole');
  });
});

// ── Search ──────────────────────────────────────────────────────────────────

test('Search: only articles public in the language, counted and paged that way, the search itself unchanged', async () => {
  const originals = { user: User.find, author: EditorialAuthor.find };
  User.find = (() => ({ distinct: async () => [] })) as unknown as typeof User.find;
  EditorialAuthor.find = (() => ({ distinct: async () => [] })) as unknown as typeof EditorialAuthor.find;
  try {
    await withStore(STORE, async (reads) => {
      // "khan" matches one article — public in English, German and Italian, not Spanish.
      for (const [locale, expected] of [['en', ['khan']], ['it', ['khan']], ['es', []]] as const) {
        const { body } = await respond(getAllBlogs as unknown as Handler, { query: { search: 'khan', page: '1', limit: '6' }, locale });
        assert.deepEqual(ids(body), expected, locale);
        assert.equal(body.pagination.total, expected.length, `${locale} total`);
        assert.equal(body.pagination.pages, expected.length ? 1 : 0, `${locale} pages`);
        if (expected.length) assert.equal(body.data[0].title, `khan (${locale})`, `${locale}: the language's own title`);
      }
      // The text search keeps its $or; the availability filter sits beside it.
      const filter = reads.filters.at(-1)!;
      assert.ok(Array.isArray(filter.$or) && filter.$or.length > 0);
      assert.equal(filter.status, 'published');
      assert.ok(filter.contentBlocks?.$elemMatch);
      // No search: every article public in Spanish, newest first.
      const all = await respond(getAllBlogs as unknown as Handler, { query: { page: '1', limit: '6' }, locale: 'es' });
      assert.equal(all.body.pagination.total, EXPECTED.es.length);
      assert.deepEqual(ids(all.body), EXPECTED.es.slice(0, 6));
    });
  } finally {
    User.find = originals.user;
    EditorialAuthor.find = originals.author;
  }
});

// ── Featured, related and embedded article lists ────────────────────────────

test('featured articles: only those public in the language, before the limit', async () => {
  await withStore(STORE, async () => {
    for (const [locale, expected] of [['en', ['kom', 'c1']], ['de', ['kom', 'c1']], ['it', ['c1']], ['es', ['c1']]] as const) {
      const { body } = await respond(getFeaturedBlogs as unknown as Handler, { query: { limit: '6' }, locale });
      assert.deepEqual(ids(body), expected, locale);
    }
  });
});

test('every populated article list (featured, related) is matched on the language', () => {
  for (const locale of LANGS) {
    const option = blogCardPopulate('relatedPosts', locale);
    assert.deepEqual(option.match, getBlogLocaleAvailabilityFilter(locale), locale);
    // Applied by MongoDB to the referenced articles: the Spanish list loses
    // only what Spanish cannot show, and nothing is put in its place.
    const kept = STORE.filter(sift(option.match as Doc)).map((article) => article._id);
    assert.deepEqual(kept.filter((id) => ['c1', 'khan', 'kom'].includes(id)), ['kom', 'c1', 'khan'].filter((id) => EXPECTED[locale].includes(id)), locale);
  }
  assert.deepEqual(blogCardPopulate('featuredBlogs', 'bypass').match, { status: 'published' });
});

test('articles embedded in another document are localized without English fallback', () => {
  const entity = {
    name: { en: 'Egypt Blog', it: 'Blog Egitto' },
    featuredBlogs: [{ _id: 'c1', title: { en: 'English', it: 'Italiano' }, cardDescription: { en: 'English teaser' }, slug: { en: 'c1-en', it: 'c1-it' }, subCategory: { name: { en: 'Tips' } } }],
  };
  const article = localizeBlogArticles(entity.featuredBlogs, 'it')[0];
  assert.equal(article.title, 'Italiano');
  assert.equal(article.cardDescription, undefined);
  assert.deepEqual(article.slug, { en: 'c1-en', it: 'c1-it' });
  // A reference to another kind of document keeps that document's usual label.
  assert.equal(article.subCategory.name, 'Tips');
});

// ── The article page ────────────────────────────────────────────────────────

const withArticle = async (stored: Doc, run: (populates: unknown[]) => Promise<void>) => {
  const original = Blog.findOne;
  const populates: unknown[] = [];
  Blog.findOne = (() => {
    const chain: Doc = {
      populate: (option: unknown) => {
        populates.push(option);
        return chain;
      },
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve({ ...stored, comments: [] }).then(resolve, reject),
    };
    return chain;
  }) as unknown as typeof Blog.findOne;
  try {
    await run(populates);
  } finally {
    Blog.findOne = original;
  }
};

test('the article page: 200 where the article is public, 404 elsewhere, and it says where it is public', async () => {
  const khan = STORE.find((article) => article._id === 'khan')!;
  await withArticle(khan, async (populates) => {
    for (const locale of LANGS) {
      const before = populates.length;
      const { status, body } = await respond(getBlogBySlug as unknown as Handler, { params: { slug: 'khan-en' }, locale });
      // Its related posts are matched on the language of the request.
      const related = populates.slice(before).find((option) => (option as Doc)?.path === 'relatedPosts') as Doc;
      assert.deepEqual(related.match, getBlogLocaleAvailabilityFilter(locale), `${locale}: related posts`);
      if (locale === 'es') {
        assert.equal(status, 404, 'no Spanish body: no Spanish page');
        continue;
      }
      assert.equal(status, 200, locale);
      assert.deepEqual(body.data.availableLocales, ['en', 'de', 'it'], locale);
      assert.equal(body.data.title, `khan (${locale})`);
    }
  });
  // The Admin's all-languages read is unaffected.
  await withArticle(khan, async () => {
    const { status } = await respond(getBlogBySlug as unknown as Handler, { params: { slug: 'khan-en' }, locale: 'bypass' });
    assert.equal(status, 200);
  });
});

// ── The author page ─────────────────────────────────────────────────────────

test('the author page lists the articles public in the language, decided in the query', async () => {
  const original = EditorialAuthor.findOne;
  const author = { _id: 'author-1', slug: 'jane-writer', isActive: true, name: 'Jane', bio: { en: 'Bio' } };
  EditorialAuthor.findOne = (async () => ({ ...author, toObject: () => ({ ...author }) })) as unknown as typeof EditorialAuthor.findOne;
  const store = STORE.map((article) => ({ ...article, editorialAuthor: 'author-1', isFeatured: false }));
  try {
    await withStore(store, async (reads) => {
      for (const locale of LANGS) {
        const { status, body } = await respond(getEditorialAuthorBySlug as unknown as Handler, { params: { slug: 'jane-writer' }, query: { page: '1', limit: '48', featuredLimit: '0' }, locale });
        assert.equal(status, 200, locale);
        assert.deepEqual(body.data.articles.map((article: Doc) => article._id), EXPECTED[locale], locale);
        assert.equal(body.data.pagination.total, EXPECTED[locale].length, locale);
      }
      const filter = reads.filters.at(-1)!;
      assert.deepEqual(filter.contentBlocks, getBlogLocaleAvailabilityFilter('es').contentBlocks);
    });
  } finally {
    EditorialAuthor.findOne = original;
  }
});

// ── Publishing needs a public-ready English version, and nothing more ───────

const CLASSIFIED = { category: 'aaaaaaaaaaaaaaaaaaaaaaa1', subCategory: 'bbbbbbbbbbbbbbbbbbbbbbb1', destination: 'ccccccccccccccccccccccc1' };
const PARENTS: Record<string, Doc> = {
  [CLASSIFIED.category]: { _id: CLASSIFIED.category, isActive: true },
  [CLASSIFIED.subCategory]: { _id: CLASSIFIED.subCategory, category: CLASSIFIED.category, isActive: true },
  [CLASSIFIED.destination]: { _id: CLASSIFIED.destination, status: 'published', isActive: true },
};
const ENGLISH = {
  title: { en: 'Saladin Citadel' },
  slug: { en: 'saladin-citadel' },
  contentBlocks: [html({ en: '<p>The citadel.</p>' })],
};
const NOT_READY = 'English article text is required before publishing';

const withWrites = async (stored: Doc | null, run: (writes: Doc[]) => Promise<void>) => {
  const originals = {
    create: Blog.create,
    findById: Blog.findById,
    update: Blog.findByIdAndUpdate,
    category: BlogCategory.findById,
    topic: BlogSubCategory.findById,
    destination: Destination.findById,
  };
  const writes: Doc[] = [];
  const byId = (id: string) => ({ select: () => ({ lean: () => Promise.resolve(PARENTS[String(id)] ?? null) }) });
  BlogCategory.findById = byId as unknown as typeof BlogCategory.findById;
  BlogSubCategory.findById = byId as unknown as typeof BlogSubCategory.findById;
  Destination.findById = byId as unknown as typeof Destination.findById;
  Blog.create = (async (body: Doc) => {
    writes.push(body);
    return { ...body, _id: 'new', populate: async () => undefined };
  }) as unknown as typeof Blog.create;
  Blog.findById = (() => ({
    lean: () => Promise.resolve(stored),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(stored && { ...stored, save: async () => writes.push({ saved: true }) }).then(resolve, reject),
  })) as unknown as typeof Blog.findById;
  Blog.findByIdAndUpdate = ((_id: string, update: Doc) => {
    writes.push(update);
    const chain: Doc = {
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
    Blog.findByIdAndUpdate = originals.update;
    BlogCategory.findById = originals.category;
    BlogSubCategory.findById = originals.topic;
    Destination.findById = originals.destination;
  }
};

const article = (overrides: Doc) => ({
  ...ENGLISH,
  featuredImage: { url: 'https://example.test/citadel.jpg', alt: { en: 'The citadel' } },
  status: 'published',
  ...CLASSIFIED,
  ...overrides,
});

test('A: a published article with an English title and slug but no English text is refused', async () => {
  await withWrites(null, async (writes) => {
    for (const contentBlocks of [[], [html({ en: '<p><br></p>' })], [html({ de: '<p>Nur Deutsch</p>' })]]) {
      const { status, body } = await respond(createBlog as unknown as Handler, { body: article({ contentBlocks }) });
      assert.equal(status, 400);
      assert.deepEqual(body, { success: false, error: NOT_READY });
    }
    const badSlug = await respond(createBlog as unknown as Handler, { body: article({ slug: { en: 'Saladin-Citadel' } }) });
    assert.equal(badSlug.status, 400);
    assert.equal(writes.length, 0, 'nothing was written');
  });
});

test('B: a scheduled article is held to the same English rule', async () => {
  await withWrites(null, async () => {
    const scheduledAt = new Date(Date.now() + 86_400_000).toISOString();
    const { status, body } = await respond(createBlog as unknown as Handler, { body: article({ status: 'scheduled', scheduledAt, contentBlocks: [] }) });
    assert.equal(status, 400);
    assert.deepEqual(body, { success: false, error: NOT_READY });
    const ok = await respond(createBlog as unknown as Handler, { body: article({ status: 'scheduled', scheduledAt }) });
    assert.equal(ok.status, 201);
  });
});

test('C and D: a complete English version publishes — with no German, Italian or Spanish at all', async () => {
  await withWrites(null, async (writes) => {
    const { status } = await respond(createBlog as unknown as Handler, { body: article({}) });
    assert.equal(status, 201);
    assert.equal(writes.length, 1);
  });
});

test('E: a draft may have no content in any language', async () => {
  await withWrites(null, async () => {
    const { status } = await respond(createBlog as unknown as Handler, {
      body: { title: { en: 'Working title' }, slug: { en: 'working-title' }, status: 'draft', contentBlocks: [] },
    });
    assert.equal(status, 201);
  });
});

test('F: a published article cannot be saved into a state with no English version, unless it goes back to draft', async () => {
  const stored = { _id: 'eeeeeeeeeeeeeeeeeeeeeeee', editVersion: 3, ...article({}) };
  await withWrites(stored, async (writes) => {
    const emptied = await respond(updateBlog as unknown as Handler, { params: { id: stored._id }, body: { _editVersion: 3, contentBlocks: [html({ en: '<p></p>' })] } });
    assert.equal(emptied.status, 400);
    assert.deepEqual(emptied.body, { success: false, error: NOT_READY });
    const noTitle = await respond(updateBlog as unknown as Handler, { params: { id: stored._id }, body: { _editVersion: 3, title: { en: ' ' } } });
    assert.equal(noTitle.status, 400);
    assert.equal(writes.length, 0, 'neither edit reached the database');

    const backToDraft = await respond(updateBlog as unknown as Handler, { params: { id: stored._id }, body: { _editVersion: 3, status: 'draft', contentBlocks: [] } });
    assert.equal(backToDraft.status, 200);
    const fineEdit = await respond(updateBlog as unknown as Handler, { params: { id: stored._id }, body: { _editVersion: 3, excerpt: { en: 'New excerpt' } } });
    assert.equal(fineEdit.status, 200, 'an edit that keeps the English version is saved');
  });
});

test('the publish action applies the English rule too', async () => {
  const draft = { _id: 'eeeeeeeeeeeeeeeeeeeeeeee', status: 'draft', featuredImage: { url: 'https://example.test/a.jpg' }, ...CLASSIFIED, ...ENGLISH };
  await withWrites({ ...draft, contentBlocks: [] }, async () => {
    const { status, body } = await respond(publishBlog as unknown as Handler, { params: { id: draft._id } });
    assert.equal(status, 400);
    assert.deepEqual(body, { success: false, error: NOT_READY });
  });
  await withWrites(draft, async () => {
    const { status } = await respond(publishBlog as unknown as Handler, { params: { id: draft._id } });
    assert.equal(status, 200);
  });
});
