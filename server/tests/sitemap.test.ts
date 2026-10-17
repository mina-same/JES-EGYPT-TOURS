import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
// Declares `req.locale`, which the resolver reads. The full build sees it
// through tsconfig's include; a single test file only when it loads it.
import '../src/middleware/i18n';
import Tour from '../src/models/Tour';
import TourCategory from '../src/models/TourCategory';
import TourSubcategory from '../src/models/TourSubcategory';
import Blog from '../src/models/Blog';
import BlogCategory from '../src/models/BlogCategory';
import BlogSubCategory from '../src/models/BlogSubCategory';
import Destination from '../src/models/Destination';
import EditorialAuthor from '../src/models/EditorialAuthor';
import Faq from '../src/models/Faq';
import { resolveSlug } from '../src/controllers/resolveController';
import {
  BLOG_LOCALES_PIPELINE,
  getSitemapData,
  SITEMAP_VISIBILITY,
  type SitemapData,
} from '../src/controllers/sitemapController';
import { getBlogLocaleReadinessFilter, isBlogArticleAvailableInLocale } from '../src/utils/blogAvailability';
import sift from 'sift';

/*
 * GET /api/sitemap — the data behind client/src/app/sitemap.ts.
 *
 * Model statics are replaced for the duration of each test, so nothing reaches
 * a database; the real controller code, the real article availability rule
 * (utils/blogAvailability.ts) and the real FAQ narrowing (utils/localize.ts) run.
 */

type AnyModel = Record<string, unknown>;
const MODELS: Record<keyof typeof SITEMAP_VISIBILITY, AnyModel> = {
  tours: Tour as unknown as AnyModel,
  tourCategories: TourCategory as unknown as AnyModel,
  tourSubcategories: TourSubcategory as unknown as AnyModel,
  blogCategories: BlogCategory as unknown as AnyModel,
  blogSubcategories: BlogSubCategory as unknown as AnyModel,
  blogs: Blog as unknown as AnyModel,
  destinations: Destination as unknown as AnyModel,
};

/** Replaces `name` on each model for one test, restoring the real statics after. */
function stub(t: { after: (fn: () => void) => void }, models: AnyModel[], name: string, make: (model: AnyModel) => unknown) {
  for (const model of models) {
    const had = Object.prototype.hasOwnProperty.call(model, name);
    const original = model[name];
    model[name] = make(model);
    t.after(() => {
      if (had) model[name] = original;
      else delete model[name];
    });
  }
}

function fakeResponse() {
  const out: { status?: number; body?: { success?: boolean; data?: unknown } } = {};
  const res = {
    status(code: number) {
      out.status = code;
      return res;
    },
    json(body: { success?: boolean; data?: unknown }) {
      out.body = body;
      return res;
    },
  };
  return { res: res as unknown as Response, out };
}

test('each family is read with the resolver\'s own visibility filter', async (t) => {
  // The resolver asks every model at once; record what it filters on.
  const seen = new Map<AnyModel, Record<string, unknown>>();
  stub(t, Object.values(MODELS), 'findOne', (model) => (filter: Record<string, unknown>) => {
    seen.set(model, filter);
    return { lean: async () => null };
  });

  const { res } = fakeResponse();
  await resolveSlug({ params: { slug: 'any-slug' }, locale: 'en' } as unknown as Request, res);

  for (const [family, model] of Object.entries(MODELS)) {
    const filter = seen.get(model);
    assert.ok(filter, `resolver did not query ${family}`);
    // Everything but the slug match itself.
    const visibility = { ...(filter as Record<string, unknown>) };
    delete visibility.$or;
    assert.deepEqual(visibility, SITEMAP_VISIBILITY[family as keyof typeof SITEMAP_VISIBILITY], family);
  }
});

test('the languages of an article are the shared availability rule, evaluated inside MongoDB', () => {
  // Published articles only, oldest first; no article text is projected.
  assert.deepEqual(BLOG_LOCALES_PIPELINE[0], { $match: SITEMAP_VISIBILITY.blogs });
  assert.deepEqual(BLOG_LOCALES_PIPELINE[1], { $sort: { _id: 1 } });
  const facets = (BLOG_LOCALES_PIPELINE[2] as unknown as { $facet: Record<string, Record<string, unknown>[]> }).$facet;
  assert.deepEqual(facets.articles, [{ $project: { slug: 1, updatedAt: 1 } }]);
  for (const locale of ['en', 'de', 'it', 'es'] as const) {
    // Each language is decided by the very filter the listings use.
    assert.deepEqual(facets[locale], [{ $match: getBlogLocaleReadinessFilter(locale) }, { $project: { _id: 1 } }], locale);
  }
  assert.ok(!JSON.stringify(BLOG_LOCALES_PIPELINE).includes('"contentBlocks":1'), 'article bodies must not be projected');

  // What those branches select, on stored-shape documents (sift: MongoDB's query
  // semantics), is what the article page itself answers 200 for.
  const body = (en: string) => [{ type: 'html', content: { en } }];
  const docs = [
    { _id: 'complete', status: 'published', slug: { en: 'pyramids', de: 'pyramiden' }, title: { en: 'Pyramids', de: 'Pyramiden' }, contentBlocks: [{ type: 'html', content: { en: '<p>Hi</p>', de: '<p>Hallo</p>' } }] },
    { _id: 'image-only', status: 'published', slug: { en: 'images' }, title: { en: 'Images' }, contentBlocks: [{ type: 'image', url: 'a.jpg' }] },
    { _id: 'empty-paragraph', status: 'published', slug: { en: 'empty' }, title: { en: 'Empty' }, contentBlocks: body('<p><br /></p>') },
    { _id: 'malformed-slug', status: 'published', slug: { en: 'Pyramids-Of-Giza' }, title: { en: 'Giza' }, contentBlocks: body('<p>Text</p>') },
    { _id: 'no-title', status: 'published', slug: { en: 'untitled' }, title: { en: ' ' }, contentBlocks: body('<p>Text</p>') },
    { _id: 'italian-block', status: 'published', slug: { en: 'scoped', it: 'limitato' }, title: { en: 'Scoped', it: 'Limitato' }, contentBlocks: [{ type: 'blockquote', languages: ['it'], content: { en: 'Only for Italian', it: 'Solo italiano' } }] },
  ];
  for (const locale of ['en', 'de', 'it', 'es'] as const) {
    const selected = docs.filter(sift(getBlogLocaleReadinessFilter(locale))).map((doc) => doc._id);
    const expected = docs.filter((doc) => isBlogArticleAvailableInLocale(doc, locale)).map((doc) => doc._id);
    assert.deepEqual(selected, expected, locale);
  }
  assert.deepEqual(docs.filter(sift(getBlogLocaleReadinessFilter('en'))).map((doc) => doc._id), ['complete']);
  assert.deepEqual(docs.filter(sift(getBlogLocaleReadinessFilter('it'))).map((doc) => doc._id), ['italian-block']);
});

test('the endpoint returns slugs, dates and flags only, for every family', async (t) => {
  const updated = new Date('2026-09-01T10:00:00.000Z');
  const queries: { model: AnyModel; filter: unknown; projection: unknown }[] = [];
  const docsFor = new Map<AnyModel, unknown[]>([
    [MODELS.tours, [
      { _id: 1, slug: { en: 'nile-cruise', de: 'nil-kreuzfahrt', it: '', es: 42 }, updatedAt: updated },
      { _id: 2, slug: 'legacy-string-slug', updatedAt: 'not a date' },
    ]],
    [MODELS.tourCategories, [{ _id: 3, slug: { en: 'egypt-tours' }, updatedAt: updated }]],
    [MODELS.tourSubcategories, [{ _id: 7, category: 3, slug: { en: 'classic-tours' }, updatedAt: updated }]],
    [MODELS.blogCategories, [{ _id: 4, slug: { en: 'egypt-blog', de: 'aegypten-blog' }, updatedAt: updated }]],
    [MODELS.blogSubcategories, []],
    [MODELS.destinations, [{ _id: 5, slug: { en: 'cairo', de: 'kairo' }, updatedAt: updated }]],
  ]);
  stub(t, Object.values(MODELS).filter((m) => m !== MODELS.blogs), 'find', (model) => (filter: unknown, projection: unknown) => {
    queries.push({ model, filter, projection });
    return { sort: () => ({ lean: async () => docsFor.get(model) ?? [] }) };
  });
  stub(t, [MODELS.tours], 'aggregate', () => async (stages: any[]) => {
    const match = stages[0].$match;
    return match['slug.en'] ? [{ _id: 7, count: 19 }] : match['slug.de'] ? [{ _id: 7, count: 9 }] : [];
  });

  let pipeline: unknown;
  // The $facet answer: the published articles, and per language the ids public in it.
  stub(t, [MODELS.blogs], 'aggregate', () => async (stages: unknown) => {
    pipeline = stages;
    return [
      {
        articles: [{ _id: 6, slug: { en: 'pyramids', de: 'pyramiden', it: 'piramidi', es: 'piramides' }, updatedAt: updated }],
        en: [{ _id: 6 }],
        de: [{ _id: 6 }],
        it: [{ _id: 6 }],
        es: [],
      },
    ];
  });

  const authorQueries: unknown[] = [];
  stub(t, [EditorialAuthor as unknown as AnyModel], 'find', () => (filter: unknown) => {
    authorQueries.push(filter);
    return {
      sort: () => ({
        lean: async () => [
          { slug: 'madonna-roshdey', bio: { en: 'Guide.', de: '  ', it: 'Guida.' } },
          { slug: '', bio: { en: 'No slug.' } },
        ],
      }),
    };
  });

  let faqQuery: unknown;
  stub(t, [Faq as unknown as AnyModel], 'find', () => (filter: unknown) => {
    faqQuery = filter;
    return {
      sort: () => ({
        limit: (n: number) => ({
          lean: async () => {
            assert.equal(n, 200);
            return [
              { isActive: true, question: { en: 'Visa?', de: 'Visum?' }, answer: { en: 'Yes.', de: ' ' } },
              { isActive: true, question: { es: '¿Visado?' }, answer: { es: 'Sí.' } },
            ];
          },
        }),
      }),
    };
  });

  const { res, out } = fakeResponse();
  await getSitemapData({} as Request, res);

  assert.equal(out.status, 200);
  assert.equal(out.body?.success, true);
  const data = out.body?.data as SitemapData;

  // Filters are the resolver's; the projection never includes content.
  for (const q of queries) {
    assert.deepEqual(q.projection, { slug: 1, updatedAt: 1, category: 1 });
  }
  assert.deepEqual(pipeline, BLOG_LOCALES_PIPELINE);

  // Only string slugs of the four languages; a bare-string slug yields none.
  assert.deepEqual(data.tours, [
    { slug: { en: 'nile-cruise', de: 'nil-kreuzfahrt' }, updatedAt: updated.toISOString() },
    { slug: {} },
  ]);
  assert.deepEqual(data.tourCategories, [{ slug: { en: 'egypt-tours' }, updatedAt: updated.toISOString(), pageCounts: { en: 3, de: 1, it: 1, es: 1 } }]);
  assert.deepEqual(data.tourSubcategories, [{ slug: { en: 'classic-tours' }, updatedAt: updated.toISOString(), pageCounts: { en: 3, de: 1, it: 1, es: 1 } }]);
  assert.deepEqual(data.blogCategories, [
    { slug: { en: 'egypt-blog', de: 'aegypten-blog' }, updatedAt: updated.toISOString() },
  ]);
  assert.deepEqual(data.destinations, [{ slug: { en: 'cairo', de: 'kairo' }, updatedAt: updated.toISOString() }]);
  assert.deepEqual(data.blogs, [
    {
      slug: { en: 'pyramids', de: 'pyramiden', it: 'piramidi', es: 'piramides' },
      updatedAt: updated.toISOString(),
      locales: ['en', 'de', 'it'],
    },
  ]);

  // Authors: active only, served where a biography exists; FAQs: the /faq query.
  assert.deepEqual(authorQueries, [{ isActive: true }]);
  assert.deepEqual(data.authors, [{ slug: 'madonna-roshdey', locales: ['en', 'it'] }]);
  assert.deepEqual(faqQuery, { isActive: true, displayOnHome: false });
  assert.deepEqual(data.faqLocales, ['en', 'es']);
});

test('a failed read is a 500, never an empty sitemap', async (t) => {
  stub(t, Object.values(MODELS).filter((m) => m !== MODELS.blogs), 'find', () => () => ({
    sort: () => ({ lean: async () => [] }),
  }));
  stub(t, [MODELS.blogs], 'aggregate', () => async () => {
    throw new Error('connection lost');
  });
  stub(t, [EditorialAuthor as unknown as AnyModel], 'find', () => () => ({ sort: () => ({ lean: async () => [] }) }));
  stub(t, [Faq as unknown as AnyModel], 'find', () => () => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) }));

  const originalError = console.error;
  console.error = () => {};
  t.after(() => {
    console.error = originalError;
  });

  const { res, out } = fakeResponse();
  await getSitemapData({} as Request, res);
  assert.equal(out.status, 500);
  assert.equal(out.body?.success, false);
  assert.equal(out.body?.data, undefined);
});
