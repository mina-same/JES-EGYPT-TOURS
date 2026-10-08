import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildBlogBreadcrumbs } from '../src/lib/blog/breadcrumbs';
import { serializeJsonLd } from '../src/lib/seo/serializeJsonLd';

const breadcrumbUrl = new URL('../src/components/common/Breadcrumb/Breadcrumb.tsx', import.meta.url);
const breadcrumbRequire = createRequire(breadcrumbUrl);
const breadcrumbCompiled = ts.transpileModule(readFileSync(breadcrumbUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: fileURLToPath(breadcrumbUrl),
}).outputText;
const breadcrumbModule = { exports: {} as { default: React.ComponentType<any> } };
const overrides: Record<string, unknown> = {
  'next/link': {
    __esModule: true,
    default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
  },
  '@/lib/url': { getSeoBaseUrl: () => 'https://example.com' },
  '@/lib/seo/serializeJsonLd': { serializeJsonLd },
};
new Function('require', 'module', 'exports', breadcrumbCompiled)(
  (id: string) => overrides[id] ?? breadcrumbRequire(id),
  breadcrumbModule, breadcrumbModule.exports,
);
const Breadcrumb = breadcrumbModule.exports.default;

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8');

const egyptBlog = {
  name: { en: 'Egypt Blog', de: 'Ägypten Blog' },
  slug: { en: 'egypt-blog', de: 'aegypten-blog' },
};
const travelTips = {
  name: { en: 'Egypt Travel Tips', de: 'Ägypten Reisetipps' },
  slug: { en: 'egypt-travel-tips', de: 'aegypten-reisetipps' },
  category: egyptBlog,
};
const otherCategory = { name: { en: 'Stale Category' }, slug: { en: 'stale-category' } };

test('the article trail is the sub-category\'s own category, the sub-category, then the article', () => {
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: travelTips, category: otherCategory }, 'en', 'How to Plan'), [
    { label: 'Egypt Blog', href: '/en/egypt-blog' },
    { label: 'Egypt Travel Tips', href: '/en/egypt-travel-tips' },
    { label: 'How to Plan' },
  ]);
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: travelTips }, 'de', 'Planen'), [
    { label: 'Ägypten Blog', href: '/de/aegypten-blog' },
    { label: 'Ägypten Reisetipps', href: '/de/aegypten-reisetipps' },
    { label: 'Planen' },
  ]);
});

test('the article\'s own category is the fallback when the sub-category does not carry one', () => {
  // A response cached before the API populated the nested parent.
  const unpopulated = { ...travelTips, category: '69e3784152bb7b082e94c897' };
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: unpopulated, category: egyptBlog }, 'en', 'Post'), [
    { label: 'Egypt Blog', href: '/en/egypt-blog' },
    { label: 'Egypt Travel Tips', href: '/en/egypt-travel-tips' },
    { label: 'Post' },
  ]);
  // An article filed under a category only.
  assert.deepEqual(buildBlogBreadcrumbs({ category: egyptBlog }, 'en', 'Post'), [
    { label: 'Egypt Blog', href: '/en/egypt-blog' },
    { label: 'Post' },
  ]);
});

test('a switched-off parent is left out of the article trail, each parent on its own', () => {
  const offSub = { ...travelTips, isActive: false };
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: offSub }, 'en', 'Post'), [
    { label: 'Egypt Blog', href: '/en/egypt-blog' },
    { label: 'Post' },
  ]);
  const offCategory = { ...travelTips, category: { ...egyptBlog, isActive: false } };
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: offCategory }, 'en', 'Post'), [
    { label: 'Egypt Travel Tips', href: '/en/egypt-travel-tips' },
    { label: 'Post' },
  ]);
  const on = { ...travelTips, isActive: true, category: { ...egyptBlog, isActive: true } };
  assert.equal(buildBlogBreadcrumbs({ subCategory: on }, 'en', 'Post').length, 3);
});

test('a parent with no page in this language keeps its name and loses its link', () => {
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: travelTips }, 'it', 'Articolo'), [
    { label: 'Egypt Blog' },
    { label: 'Egypt Travel Tips' },
    { label: 'Articolo' },
  ]);
});

test('unpopulated, nameless or missing parents give a trail of just the article', () => {
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: 'abc', category: 'def' }, 'en', 'Post'), [{ label: 'Post' }]);
  assert.deepEqual(buildBlogBreadcrumbs({ subCategory: { slug: { en: 'x' } } }, 'en', 'Post'), [{ label: 'Post' }]);
  assert.deepEqual(buildBlogBreadcrumbs(null, 'en', 'Post'), [{ label: 'Post' }]);
});

const pillItems = [
  { label: 'Authors' },
  { label: 'Egypt Travel Tips', href: '/en/egypt-travel-tips' },
  { label: 'How to Plan a Trip to Egypt' },
];
const pill = (props: Record<string, unknown> = {}) => renderToStaticMarkup(React.createElement(Breadcrumb, {
  locale: 'en', homeLabel: 'Home', items: pillItems, variant: 'pill', jsonLd: false, ...props,
}));

test('pill: an unlinked step is drawn like a link, only the current page is gold', () => {
  const html = pill();
  const authors = html.match(/<span[^>]*>Authors<\/span>/)![0];
  assert.ok(!authors.includes('#b79c5c') && !authors.includes('font-bold'), authors);
  assert.ok(!authors.includes('aria-current'));
  const current = html.match(/<span[^>]*>How to Plan a Trip to Egypt<\/span>/)![0];
  assert.match(current, /text-\[#b79c5c\]/);
  assert.match(current, /aria-current="page"/);
});

test('pill: the "/" separators are hidden from screen readers', () => {
  const separators = pill().match(/<span[^>]*>\/<\/span>/g)!;
  assert.equal(separators.length, pillItems.length);
  for (const separator of separators) assert.match(separator, /aria-hidden="true"/);
});

test('pill: every crumb can shrink to an ellipsis and none carries a fixed width cap', () => {
  const html = pill();
  const nav = html.match(/<nav[^>]*>/)![0];
  assert.match(nav, /inline-grid/);
  assert.match(nav, /auto-cols-\[minmax\(0,max-content\)_max-content\]/);
  assert.ok(!/max-w-\[\d+px\]/.test(html), 'no fixed pixel cap on any crumb');
  assert.ok(!html.includes('flex-shrink-0'), 'no crumb refuses to shrink');
  const crumbs = [...html.matchAll(/<(?:a|span) (?:[^>]*? )?class="([^"]*)"[^>]*>[^<\/][^<]*</g)].map((m) => m[1]);
  assert.equal(crumbs.length, pillItems.length + 1);
  for (const className of crumbs) assert.match(className, /min-w-0 truncate/);
});

test('pill: no class name that Bootstrap overrides with !important', () => {
  const classes = pill().match(/<nav[^>]*class="([^"]*)"/)![1].split(/\s+/);
  // Bootstrap's `.border` forces its own grey border colour, `.px-4` forces 1.5rem.
  assert.ok(!classes.includes('border'), classes.join(' '));
  assert.ok(!classes.includes('px-4'), classes.join(' '));
  assert.ok(classes.includes('border-[1px]') && classes.includes('border-white/20'));
  assert.ok(classes.includes('px-[1rem]'));
});

test('pill: the schema comes from the drawn items, with the page URL on the last entry', () => {
  const html = pill({ jsonLd: true, homeLabel: 'Startseite', locale: 'de', currentUrl: 'https://example.com/de/artikel' });
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
  assert.deepEqual(schema.itemListElement.map((entry: any) => [entry.position, entry.name, entry.item]), [
    [1, 'Startseite', 'https://example.com/de'],
    // "Authors" has no URL, so it stays out of the schema; Google needs one on every entry but the last.
    [2, 'Egypt Travel Tips', 'https://example.com/en/egypt-travel-tips'],
    [3, 'How to Plan a Trip to Egypt', 'https://example.com/de/artikel'],
  ]);
});

test('the blog hero publishes the trail\'s BreadcrumbList; the article route does not write a second one', () => {
  const hero = source('../src/components/sections/BlogHero/BlogHero.tsx');
  const heroCrumb = hero.match(/<Breadcrumb[\s\S]*?\/>/)![0];
  assert.ok(!heroCrumb.includes('jsonLd={false}'), heroCrumb);
  assert.match(heroCrumb, /currentUrl=\{currentUrl\}/);

  const view = source('../src/app/(visitor)/[locale]/(home)/[slug]/_views/BlogDetailView.tsx');
  assert.match(view, /buildBlogBreadcrumbs\(blog, locale, title\)/);
  assert.match(view, /currentUrl=\{`\$\{getSeoBaseUrl\(\)\}\/\$\{locale\}\/\$\{slug\}`\}/);

  const route = source('../src/app/(visitor)/[locale]/(home)/[slug]/page.tsx');
  const blogBlock = route.slice(route.indexOf('// ── 5. Blog Post'), route.indexOf('// ── 5.5. Destination'));
  assert.ok(blogBlock.includes('"BlogPosting"'));
  assert.ok(!blogBlock.includes('BreadcrumbList"'), 'no hand-written BreadcrumbList in the article route');
});

test('classic: an unlinked step is not gold, and the chevron has an empty text alternative', () => {
  const css = source('../src/assets/css/custom.css');
  assert.match(css, /\.gotur-breadcrumb li span:not\(\[aria-current="page"\]\)\s*\{\s*color: inherit;/);
  assert.match(css, /\.gotur-breadcrumb li:not\(:last-of-type\)::after\s*\{\s*content: "\\e917" \/ "";/);
});

test('the API gives the article trail its parents with isActive, and articles store no breadcrumbs', () => {
  const controller = source('../../server/src/controllers/blogController.ts');
  const bySlug = controller.slice(controller.indexOf('export const getBlogBySlug'));
  assert.match(bySlug, /select: 'name slug category isActive',\s*populate: \{ path: 'category', select: 'name slug isActive' \}/);

  const model = source('../../server/src/models/Blog.ts');
  assert.ok(!/^\s*breadcrumbs\??:/m.test(model), 'Blog model has no breadcrumbs path');
  for (const file of [
    '../src/types/blog.ts',
    '../src/lib/api/blogAdmin.ts',
    '../src/app/(admin)/admin/blogs/articles/new/page.tsx',
    '../src/app/(admin)/admin/blogs/articles/[id]/edit/page.tsx',
  ]) {
    assert.ok(!source(file).includes('breadcrumbs'), file);
  }
});
