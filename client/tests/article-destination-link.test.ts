import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildBlogBreadcrumbs } from '../src/lib/blog/breadcrumbs';
import { getArticleDestinationLink } from '../src/lib/blog/destinationLink';

const locales = ['en', 'de', 'it', 'es'] as const;
const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

const slug = { en: 'cairo', de: 'kairo', it: 'il-cairo', es: 'el-cairo' };
const names = { en: 'Cairo', de: 'Kairo', it: 'Il Cairo', es: 'El Cairo' };

// The article endpoint sends the name already in the request's language and
// the slug whole (server/tests/destination-article-membership.test.ts).
const asSent = (locale: (typeof locales)[number]) => ({ _id: 'd1', name: names[locale], slug });

test('an article links its destination by that language\'s name and that language\'s slug', () => {
  assert.deepEqual(getArticleDestinationLink(asSent('en'), 'en'), { name: 'Cairo', href: '/en/cairo' });
  assert.deepEqual(getArticleDestinationLink(asSent('de'), 'de'), { name: 'Kairo', href: '/de/kairo' });
  assert.deepEqual(getArticleDestinationLink(asSent('it'), 'it'), { name: 'Il Cairo', href: '/it/il-cairo' });
  assert.deepEqual(getArticleDestinationLink(asSent('es'), 'es'), { name: 'El Cairo', href: '/es/el-cairo' });
});

test('the short name is what the link says when the destination has one', () => {
  // Stored data: the full English name of this destination is a page title.
  const giza = {
    name: 'Visit Giza: Complete Travel Guide',
    shortName: { en: 'Giza', de: 'Gizeh', it: 'Giza', es: 'Guiza' },
    slug: { en: 'giza', de: 'gizeh', it: 'giza', es: 'guiza' },
  };
  assert.deepEqual(getArticleDestinationLink(giza, 'en'), { name: 'Giza', href: '/en/giza' });
  assert.deepEqual(getArticleDestinationLink({ ...giza, name: 'Gizeh' }, 'de'), { name: 'Gizeh', href: '/de/gizeh' });
  // No short name in this language: the name is used.
  assert.deepEqual(
    getArticleDestinationLink({ ...giza, name: 'Guiza', shortName: { en: 'Giza' } }, 'es'),
    { name: 'Guiza', href: '/es/guiza' }
  );
});

test('nothing to link is no link: no destination, a bare id, no page in this language, no name', () => {
  assert.equal(getArticleDestinationLink(null, 'en'), null);
  assert.equal(getArticleDestinationLink(undefined, 'de'), null);
  // The responses that do not populate the destination send its id.
  assert.equal(getArticleDestinationLink('69ebf691cd694ad9019c7811', 'en'), null);
  // A link into another language's page would be worse than none.
  assert.equal(getArticleDestinationLink({ name: 'Kairo', slug: { en: 'cairo' } }, 'de'), null);
  assert.equal(getArticleDestinationLink({ name: 'Cairo', slug: { en: 'Cairo Guide' } }, 'en'), null);
  assert.equal(getArticleDestinationLink({ name: '  ', slug }, 'en'), null);
});

test('the article page draws that link, as a real anchor beside the byline', () => {
  const view = source('components/sections/DynamicBlogDetails/DynamicBlogDetails.tsx');
  assert.match(view, /const destinationLink = getArticleDestinationLink\(blog\.destination, locale\);/);
  // next/link renders an <a href>; the label is translated, the name is the link text.
  assert.match(
    view,
    /\{destinationLink && \([\s\S]*?\{t\('destinationLabel'\)\}:[\s\S]*?<Link href=\{destinationLink\.href\}[^>]*>\s*<strong>\{destinationLink\.name\}<\/strong>\s*<\/Link>/
  );
  for (const locale of locales) {
    const messages = JSON.parse(source(`i18n/locales/${locale}/blogs.json`));
    assert.ok(typeof messages.destinationLabel === 'string' && messages.destinationLabel.trim(), locale);
  }
  assert.equal(JSON.parse(source('i18n/locales/de/blogs.json')).destinationLabel, 'Reiseziel');
});

test('the breadcrumb stays category > topic > article: a destination is not a step in it', () => {
  const blog = {
    category: { name: { en: 'Egypt Blog' }, slug: { en: 'egypt-blog' } },
    subCategory: {
      name: { en: 'Egypt Travel Tips' },
      slug: { en: 'egypt-travel-tips' },
      category: { name: { en: 'Egypt Blog' }, slug: { en: 'egypt-blog' } },
    },
    destination: asSent('en'),
  };
  assert.deepEqual(buildBlogBreadcrumbs(blog, 'en', 'Saladin Citadel'), [
    { label: 'Egypt Blog', href: '/en/egypt-blog' },
    { label: 'Egypt Travel Tips', href: '/en/egypt-travel-tips' },
    { label: 'Saladin Citadel' },
  ]);
  assert.ok(!source('lib/blog/breadcrumbs.ts').includes('destination'));
});

test('a destination page with no article of its own leaves the article section out entirely', () => {
  const view = source('app/(visitor)/[locale]/(home)/[slug]/_views/DestinationView.tsx');
  // One condition around the whole section: heading, grid and pager together.
  assert.match(
    view,
    /\{blogsData\.data\.length > 0 && \(\s*<section ref=\{articlesRef\}[\s\S]*?\{t\('exploreDestination', \{ name \}\)\}[\s\S]*?<DynamicBlogGrid[\s\S]*?pagination=\{blogsData\.pagination\}[\s\S]*?<\/section>\s*\)\}/
  );
  // No fallback copy, in English or otherwise.
  assert.ok(!/No articles found/i.test(view));
  // The handpicked section keeps its own, separate condition.
  assert.match(view, /\{destination\.featuredBlogs && destination\.featuredBlogs\.length > 0 && \(/);
});

// ── Against a running build: real pages, real data ──────────────────────────

const origin = process.env.DESTINATION_ARTICLE_TEST_ORIGIN;
const hrefs = (html: string) => [...html.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((match) => match[1].replace(/&amp;/g, '&'));
// What a reader gets: no scripts (the translation bundle rides in them) and no
// React comment nodes (they sit between adjacent text parts).
const visible = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
const read = async (path: string) => {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  return { status: response.status, html: await response.text() };
};

test('HTTP: an article links to its destination in every language', { skip: !origin }, async () => {
  assert.match(origin!, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/, 'Verification is local only');
  // "What to See at Saqqara" is filed under Giza.
  for (const [locale, article, destination, name, label] of [
    ['en', 'what-to-see-at-saqqara', 'giza', 'Giza', 'Destination'],
    ['de', 'was-gibt-es-in-sakkara-zu-sehen', 'gizeh', 'Gizeh', 'Reiseziel'],
    ['it', 'saqqara-cosa-vedere', 'giza', 'Giza', 'Destinazione'],
    ['es', 'que-ver-en-saqqara', 'guiza', 'Guiza', 'Destino'],
  ] as const) {
    const { status, html } = await read(`/${locale}/${article}`);
    assert.equal(status, 200, `${locale}/${article}`);
    const link = html.match(/<a[^>]*class="blog-meta-bar__destination-link"[^>]*>([\s\S]*?)<\/a>/);
    assert.ok(link, `${locale}: destination link in the server HTML`);
    assert.match(link![0], new RegExp(`href="/${locale}/${destination}"`), locale);
    assert.equal(link![1].replace(/<[^>]+>/g, '').trim(), name, locale);
    assert.ok(visible(html).includes(`${label}:`), `${locale}: translated label`);
  }
});

test('HTTP: a destination lists only its own articles; one with none shows no article section', { skip: !origin }, async () => {
  assert.match(origin!, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/, 'Verification is local only');

  const luxor = await read('/en/luxor');
  assert.equal(luxor.status, 200);
  const luxorLinks = hrefs(luxor.html);
  assert.ok(luxorLinks.includes('/en/karnak-temple-visitor-guide'), 'Luxor lists Karnak');
  // Filed under Cairo, Aswan and Alexandria: not Luxor's.
  for (const other of ['/en/what-to-see-at-saqqara', '/en/philae-temple-visitor-guide']) {
    assert.equal(luxorLinks.includes(other), false, `Luxor does not list ${other}`);
  }
  assert.match(luxor.html, /class="blog-page"/, 'Luxor keeps its article section');
  assert.equal(luxorLinks.some((href) => /^\/en\/luxor\?page=/.test(href)), false, 'five articles: no pager');

  for (const path of ['/en/hurghada', '/de/hurghada', '/it/hurghada', '/es/hurghada']) {
    const { status, html } = await read(path);
    assert.equal(status, 200, path);
    assert.doesNotMatch(html, /class="blog-page"/, `${path}: no article list`);
    assert.doesNotMatch(visible(html), /No articles found/i, `${path}: no empty message`);
    assert.equal(hrefs(html).some((href) => href.includes('?page=')), false, `${path}: no pager`);
    // The rest of the page is still there.
    assert.match(html, /<h1[^>]*>[\s\S]*?Hurghada[\s\S]*?<\/h1>/, `${path}: hero`);
    assert.match(html, /<footer/, `${path}: footer`);
  }
});
