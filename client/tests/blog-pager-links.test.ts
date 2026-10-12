import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/*
 * The Blog pager (DynamicBlogGrid), rendered for real. It serves the category,
 * topic, destination and author listings, and its links are the only route a
 * crawler has to page 2 and beyond, so what they point at is the contract:
 * page 1 is the listing's own URL, page N is ?page=N, and the pager never
 * leads past the last page.
 */

const url = new URL('../src/components/sections/DynamicBlogGrid/DynamicBlogGrid.tsx', import.meta.url);
const require = createRequire(url);
const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: fileURLToPath(url),
}).outputText;

// Only what the grid does not own is replaced: the translations, the card, the
// stylesheet, and next/link — which renders the same <a href> the browser gets.
const stubs: Record<string, unknown> = {
  'react-i18next': {
    useTranslation: () => ({
      t: (key: string, options?: { page?: number; defaultValue?: string }) =>
        (options?.defaultValue ?? key).replace('{{page}}', String(options?.page ?? '')),
      i18n: { language: 'en' },
    }),
  },
  'next/link': {
    __esModule: true,
    default: (props: Record<string, unknown>) => {
      const anchor = { ...props };
      delete anchor.prefetch;
      return React.createElement('a', anchor);
    },
  },
  '@/components/common/BlogCard/BlogCard': {
    __esModule: true,
    default: ({ post }: { post: { id: string } }) => React.createElement('article', { 'data-id': post.id }),
  },
  '@/lib/blog/cardViewModel': {
    buildBlogCardViewModels: (posts: { _id: string }[]) => posts.map((post) => ({ id: post._id })),
  },
  './DynamicBlogGrid.module.css': {
    __esModule: true,
    default: new Proxy({}, { get: (_target, name) => String(name) }),
  },
};
const compiledModule = { exports: {} as { default: React.ComponentType<Record<string, unknown>> } };
new Function('require', 'module', 'exports', compiled)(
  (id: string) => (id in stubs ? stubs[id] : require(id)),
  compiledModule, compiledModule.exports,
);
const DynamicBlogGrid = compiledModule.exports.default;

const BASE_PATH = '/en/egypt-travel-tips';
const posts = (count: number) => Array.from({ length: count }, (_, index) => ({ _id: `post-${index + 1}` }));
const render = (page: number, pages: number, basePath: string | undefined = BASE_PATH, cards = 9) =>
  renderToStaticMarkup(React.createElement(DynamicBlogGrid, {
    blogs: posts(cards),
    pagination: { page, pages, limit: 9, total: pages * 9 },
    basePath,
  }));

type PagerLink = { href: string | null; rel: string | null; text: string };
const attribute = (tag: string, name: string) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) ?? [null, null])[1];
/** Every link inside the pager's <nav>, in order. */
const pagerLinks = (html: string): PagerLink[] => {
  const nav = (html.match(/<nav[\s\S]*?<\/nav>/) ?? [''])[0];
  return [...nav.matchAll(/<a(\s[^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({
    href: attribute(match[1], 'href'),
    rel: attribute(match[1], 'rel'),
    text: match[2].replace(/<[^>]+>/g, '').trim(),
  }));
};
const hasPager = (html: string) => /<nav[\s>]/.test(html);

test('page 2: Previous and the numbered "1" go to the clean URL, page 3 to ?page=3', () => {
  const links = pagerLinks(render(2, 3));
  assert.deepEqual(links, [
    { href: BASE_PATH, rel: 'prev', text: 'Previous page' },
    { href: BASE_PATH, rel: null, text: '1' },
    { href: `${BASE_PATH}?page=3`, rel: null, text: '3' },
    { href: `${BASE_PATH}?page=3`, rel: 'next', text: 'Next page' },
  ]);
});

test('no page of any listing links to ?page=1', () => {
  for (const [page, pages] of [[1, 3], [2, 3], [3, 3], [2, 2], [5, 12], [12, 12], [2, 40]]) {
    const html = render(page, pages);
    assert.doesNotMatch(html, /[?&]page=1(?:"|&)/, `page ${page} of ${pages}`);
    if (page > 1) {
      assert.ok(pagerLinks(html).some((link) => link.href === BASE_PATH), `page ${page} of ${pages}: page 1 is linked, clean`);
    }
  }
});

test('the links are real anchors a crawler can follow, one per page shown', () => {
  const html = render(1, 3);
  assert.deepEqual(pagerLinks(html), [
    { href: `${BASE_PATH}?page=2`, rel: null, text: '2' },
    { href: `${BASE_PATH}?page=3`, rel: null, text: '3' },
    { href: `${BASE_PATH}?page=2`, rel: 'next', text: 'Next page' },
  ]);
  // The page being read is text, not a link to itself.
  assert.match(html, /<span[^>]*aria-current="page"[^>]*>1<\/span>/);
  assert.doesNotMatch((html.match(/<nav[\s\S]*?<\/nav>/) ?? [''])[0], /<button/);
});

test('the last page has no Next link', () => {
  const links = pagerLinks(render(3, 3));
  assert.equal(links.some((link) => link.rel === 'next'), false);
  assert.deepEqual(links.map((link) => link.href), [`${BASE_PATH}?page=2`, BASE_PATH, `${BASE_PATH}?page=2`]);
});

test('a page past the last never links one further: no endless Next chain', () => {
  // The state the topic page used to render for ?page=999999 — the route now
  // answers 404 before any of this is drawn; the pager holds the line anyway.
  for (const [page, pages] of [[4, 3], [5, 3], [21, 3], [999999, 3]]) {
    const links = pagerLinks(render(page, pages, BASE_PATH, 0));
    assert.equal(links.some((link) => link.rel === 'next'), false, `page ${page} of ${pages}: no Next`);
    assert.equal(links.some((link) => link.href?.endsWith(`page=${page + 1}`)), false, `page ${page} of ${pages}`);
  }
});

test('a listing of one page, or of none, has no pager at all', () => {
  assert.equal(hasPager(render(1, 1, BASE_PATH, 7)), false, 'seven articles: one page');
  assert.equal(hasPager(render(1, 0, BASE_PATH, 0)), false, 'no articles');
  assert.doesNotMatch(render(1, 1, BASE_PATH, 7), /\?page=/);
});

test('the page keeps a base path that already has a query', () => {
  const links = pagerLinks(render(2, 3, '/en/search?q=nile'));
  assert.equal(links[0].href, '/en/search?q=nile', 'page 1 is the base path as given');
  assert.equal(links.at(-1)?.href, '/en/search?q=nile&amp;page=3');
});
