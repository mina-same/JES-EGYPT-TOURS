import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBlogCardViewModel, buildBlogCardViewModels } from '../src/lib/blog/cardViewModel';
import { getLocalizedStringList } from '../src/lib/localize';

/**
 * A post as an endpoint that LOCALIZES its response sends it: every localized
 * field already flattened to the active language, `slug` deliberately left raw
 * so the card can build a per-locale URL. This is what /blog/posts,
 * /blog/posts/featured and the category listings return.
 */
const localizedPost = (overrides: Record<string, unknown> = {}) => ({
  _id: 'a1',
  title: 'Reisen nach Assuan',
  slug: { en: 'travel-to-aswan', de: 'reise-nach-assuan' },
  excerpt: 'Kurzfassung',
  cardDescription: 'Was du in Assuan siehst, wann du fahren solltest und was es kostet.',
  publishedAt: '2026-06-30T22:30:00.000Z',
  tags: ['Ägypten Reisetipps', 'Assuan'],
  readingTime: 9,
  ...overrides,
});

/**
 * The same post as an endpoint that does NOT localize sends it: every field
 * still carrying all four languages.
 */
const rawPost = (overrides: Record<string, unknown> = {}) => ({
  _id: 'a1',
  title: { en: 'Travel to Aswan', de: 'Reisen nach Assuan' },
  slug: { en: 'travel-to-aswan', de: 'reise-nach-assuan' },
  excerpt: { en: 'Short', de: 'Kurzfassung' },
  cardDescription: { en: 'What to see', de: 'Was du siehst' },
  publishedAt: '2026-06-30T22:30:00.000Z',
  tags: { en: ['Egypt Travel Tips', 'Aswan'], de: ['Ägypten Reisetipps', 'Assuan'] },
  readingTime: 9,
  ...overrides,
});

test('a list field reads the same whether the API flattened it or not', () => {
  assert.deepEqual(
    getLocalizedStringList(['Ägypten Reisetipps', 'Assuan'], 'de'),
    ['Ägypten Reisetipps', 'Assuan']
  );
  assert.deepEqual(
    getLocalizedStringList({ en: ['Egypt Travel Tips'], de: ['Ägypten Reisetipps'] }, 'de'),
    ['Ägypten Reisetipps']
  );
});

test('a language with no tags shows none rather than borrowing English', () => {
  assert.deepEqual(getLocalizedStringList({ en: ['Egypt Travel Tips'], de: [] }, 'de'), []);
  assert.deepEqual(getLocalizedStringList({ en: ['Egypt Travel Tips'] }, 'de'), []);
  assert.deepEqual(getLocalizedStringList(undefined, 'de'), []);
  assert.deepEqual(getLocalizedStringList(['  ', 'Assuan'], 'de'), ['Assuan']);
});

test('the tag fallback labels a card that has no sub-category — both API shapes', () => {
  // The regression: reading `tags` with getLocalizedValue returned the first
  // tag as a STRING for the flattened shape, the caller's Array.isArray guard
  // rejected it, and this label came out empty on every localized page.
  for (const post of [localizedPost(), rawPost()]) {
    const card = buildBlogCardViewModel(post, 'de');
    assert.ok(card);
    assert.equal(card.category, 'Ägypten Reisetipps');
    assert.equal(
      card.categoryLink,
      `/de/blogs/all?tag=${encodeURIComponent('Ägypten Reisetipps')}`
    );
  }
});

test('a sub-category outranks the tag, and links to its own page', () => {
  const card = buildBlogCardViewModel(
    localizedPost({
      subCategory: { name: 'Nilkreuzfahrten', slug: { en: 'nile-cruises', de: 'nilkreuzfahrten' } },
    }),
    'de'
  );

  assert.ok(card);
  assert.equal(card.category, 'Nilkreuzfahrten');
  assert.equal(card.categoryLink, '/de/nilkreuzfahrten');
});

test('an image gets a title only where the editor wrote one', () => {
  const withoutTitle = buildBlogCardViewModel(
    localizedPost({ featuredImage: { url: '/aswan.jpg', alt: 'Blick auf Assuan' } }),
    'de'
  );
  assert.ok(withoutTitle);
  assert.equal(withoutTitle.imageAlt, 'Blick auf Assuan');
  // Not the alt text repeated — the card omits the attribute entirely.
  assert.equal(withoutTitle.imageTitle, '');

  const withTitle = buildBlogCardViewModel(
    localizedPost({
      featuredImage: { url: '/aswan.jpg', alt: 'Blick auf Assuan', title: 'Assuan bei Sonnenuntergang' },
    }),
    'de'
  );
  assert.ok(withTitle);
  assert.equal(withTitle.imageTitle, 'Assuan bei Sonnenuntergang');
});

test('a post with no slug in this language never becomes a card', () => {
  assert.equal(
    buildBlogCardViewModel(localizedPost({ slug: { en: 'travel-to-aswan' } }), 'de'),
    null
  );

  // And `limit` applies AFTER that filter, so a section asking for two cards
  // gets two translated ones rather than two minus whatever was skipped.
  const cards = buildBlogCardViewModels(
    [
      localizedPost({ _id: 'a1', slug: { en: 'one' } }),
      localizedPost({ _id: 'a2', slug: { en: 'two', de: 'zwei' } }),
      localizedPost({ _id: 'a3', slug: { en: 'three', de: 'drei' } }),
    ],
    'de',
    2
  );
  assert.deepEqual(cards.map((card) => card.link), ['/de/zwei', '/de/drei']);
});

test('the date badge is read in UTC, so SSR and the browser agree', () => {
  // 22:30 UTC is the next day in any timezone east of UTC. Read locally, the
  // badge and its own dateTime attribute disagreed depending on who rendered it.
  const card = buildBlogCardViewModel(localizedPost(), 'de');
  assert.ok(card);
  assert.equal(card.day, '30');
  assert.equal(card.month, 'Juni');
  assert.equal(card.iso, '2026-06-30');
  assert.equal(card.dateLabel, '30. Juni 2026');
});

test('the card description is its own field, and it never falls back', () => {
  // `excerpt` still exists and still does its other two jobs — the article
  // page's sub-title and the meta-description fallback — but a card must not
  // show it. A card that borrowed the excerpt was showing copy written to
  // introduce an article, or to rank in a search result, as a sales line.
  const withBoth = buildBlogCardViewModel(localizedPost(), 'de');
  assert.ok(withBoth);
  assert.equal(
    withBoth.cardDescription,
    'Was du in Assuan siehst, wann du fahren solltest und was es kostet.'
  );

  // The whole point: no card description means NO description on the card,
  // even though this post has a perfectly good excerpt sitting right there.
  const withoutIt = buildBlogCardViewModel(
    localizedPost({ cardDescription: undefined }),
    'de'
  );
  assert.ok(withoutIt);
  assert.equal(withoutIt.cardDescription, '');
  // The view model carries no `excerpt` at all — there is nothing to fall back TO.
  assert.equal((withoutIt as unknown as Record<string, unknown>).excerpt, undefined);

  // Blank and whitespace-only are the same state as absent.
  for (const blank of ['', '   ', { de: '  ', en: '' }]) {
    const card = buildBlogCardViewModel(localizedPost({ cardDescription: blank }), 'de');
    assert.ok(card);
    assert.equal(card.cardDescription, '');
  }
});

test('the raw API shape resolves the card description per language', () => {
  const de = buildBlogCardViewModel(rawPost(), 'de');
  const en = buildBlogCardViewModel(rawPost(), 'en');
  assert.equal(de?.cardDescription, 'Was du siehst');
  assert.equal(en?.cardDescription, 'What to see');
});
