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
  articleLocales,
  getSitemapData,
  SITEMAP_VISIBILITY,
  type SitemapData,
} from '../src/controllers/sitemapController';

/*
 * GET /api/sitemap — the data behind client/src/app/sitemap.ts.
 *
 * Model statics are replaced for the duration of each test, so nothing reaches
 * a database; the real controller code, the real article block rule
 * (utils/blogBlocks.ts) and the real FAQ narrowing (utils/localize.ts) run.
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

test('article languages follow the article page rule, from text flags alone', () => {
  const flags = (on: string[]) => Object.fromEntries(['en', 'de', 'it', 'es'].map((l) => [l, on.includes(l)]));
  // Text in en/de; an image block (no language) must not make it/es count.
  assert.deepEqual(
    articleLocales([
      { type: 'html', content: flags(['en', 'de']), title: flags([]) },
      { type: 'image', content: flags([]), title: flags([]) },
    ]),
    ['en', 'de']
  );
  // A title alone is text; a block limited to Italian only counts for Italian.
  assert.deepEqual(
    articleLocales([
      { type: 'blockquote', content: flags([]), title: flags(['es']) },
      { type: 'html', languages: ['it'], content: flags(['en', 'it']), title: flags([]) },
    ]),
    ['it', 'es']
  );
  // An empty `languages` list means every language.
  assert.deepEqual(articleLocales([{ type: 'html', languages: [], content: flags(['en', 'es']), title: flags([]) }]), ['en', 'es']);
  assert.deepEqual(articleLocales(undefined), []);
  assert.deepEqual(articleLocales([{ type: 'image', content: flags(['en']), title: flags(['en']) }]), []);
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
    [MODELS.tourSubcategories, []],
    [MODELS.blogCategories, [{ _id: 4, slug: { en: 'egypt-blog', de: 'aegypten-blog' }, updatedAt: updated, noIndex: true }]],
    [MODELS.blogSubcategories, []],
    [MODELS.destinations, [{ _id: 5, slug: { en: 'cairo', de: 'kairo' }, updatedAt: updated, noIndex: false }]],
  ]);
  stub(t, Object.values(MODELS).filter((m) => m !== MODELS.blogs), 'find', (model) => (filter: unknown, projection: unknown) => {
    queries.push({ model, filter, projection });
    return { sort: () => ({ lean: async () => docsFor.get(model) ?? [] }) };
  });

  let pipeline: unknown;
  const flags = (on: string[]) => Object.fromEntries(['en', 'de', 'it', 'es'].map((l) => [l, on.includes(l)]));
  stub(t, [MODELS.blogs], 'aggregate', () => async (stages: unknown) => {
    pipeline = stages;
    return [
      {
        _id: 6,
        slug: { en: 'pyramids', de: 'pyramiden', it: 'piramidi', es: 'piramides' },
        updatedAt: updated,
        blocks: [{ type: 'html', content: flags(['en', 'de', 'it']), title: flags([]) }],
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
    assert.deepEqual(q.projection, { slug: 1, updatedAt: 1, noIndex: 1 });
  }
  assert.deepEqual((pipeline as unknown[])[0], { $match: SITEMAP_VISIBILITY.blogs });
  assert.ok(!JSON.stringify(pipeline).includes('"contentBlocks":1'), 'article bodies must not be projected');

  // Only string slugs of the four languages; a bare-string slug yields none.
  assert.deepEqual(data.tours, [
    { slug: { en: 'nile-cruise', de: 'nil-kreuzfahrt' }, updatedAt: updated.toISOString() },
    { slug: {} },
  ]);
  assert.deepEqual(data.tourCategories, [{ slug: { en: 'egypt-tours' }, updatedAt: updated.toISOString() }]);
  assert.deepEqual(data.blogCategories, [
    { slug: { en: 'egypt-blog', de: 'aegypten-blog' }, updatedAt: updated.toISOString(), noIndex: true },
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
