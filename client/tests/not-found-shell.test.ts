import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';

/*
 * Who asks for the header and footer.
 *
 * Every visitor page renders its own shell (top bar, header, sticky copy,
 * footer). Next also ships the segment's not-found page with every page, and
 * the browser fetches the code of each client component in it. So if a layout
 * or the not-found file names the shell components itself, each page fetches
 * them twice. These tests keep that second request from coming back.
 */

const visitor = new URL('../src/app/(visitor)/[locale]/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, visitor), 'utf8');
const withoutComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const imports = (source: string) =>
  [...withoutComments(source).matchAll(/^import\s+(?:type\s+)?[^'"]*['"]([^'"]+)['"]/gm)].map((match) => match[1]);

const SHELL = /components\/(common\/(TopbarOne|LanguageSelector|CurrencySwitcher)|layout\/(HeaderOne|HeaderOneCloned|SiteHeader|FooterOne|Layout)|sections\/(PageHeader|Error404))\//;

test('the not-found file of the visitor segment names one lazy component, and nothing of the shell', () => {
  const source = read('(home)/not-found.tsx');
  const own = imports(source).filter((specifier) => specifier !== 'next' && specifier !== '@/lib/seo/robots');
  assert.deepEqual(own, ['./NotFoundViewLazy']);
  assert.match(withoutComments(source), /return <NotFoundViewLazy \/>;/);
  // The 404's robots value is read from this file, the deepest not-found of the route.
  assert.match(source, /export const metadata: Metadata = \{\s*robots: getNotFoundRobotsMetadata\(\),\s*\};/);
});

test('the lazy component splits the page off on the client side, with SSR on and no loading option', () => {
  const source = read('(home)/NotFoundViewLazy.tsx');
  assert.match(source, /^"use client";/);
  const code = withoutComments(source);
  assert.match(code, /dynamic\(\(\) => import\("\.\/NotFoundView"\)\)/);
  assert.equal(/ssr\s*:|loading\s*:/.test(code), false);
  assert.deepEqual(imports(source), ['next/dynamic']);
});

test('the 404 page is one top bar, one header, one sticky copy, one page header, one message, one footer', () => {
  const code = withoutComments(read('(home)/NotFoundView.tsx'));
  assert.match(code, /^\s*"use client";/);
  for (const tag of ['Layout', 'TopbarOne', 'HeaderOne', 'HeaderOneCloned', 'PageHeader', 'Error404', 'FooterOne']) {
    assert.equal([...code.matchAll(new RegExp(`<${tag}[\\s/>]`, 'g'))].length, 1, `<${tag}>`);
  }
  assert.match(code, /<PageHeader title='Page Not Found' subTitle='404' breadcrumbLabelKey="pageNames\.notFound" \/>/);
});

test('the root not-found file renders the same boundary', () => {
  const source = read('not-found.tsx');
  assert.deepEqual(imports(source).filter((specifier) => !specifier.startsWith('next')), ['./(home)/not-found']);
  assert.equal(imports(source).some((specifier) => SHELL.test(specifier)), false);
});

test('no visitor layout, loading or error file names a shell component', () => {
  const found: string[] = [];
  const walk = (directory: URL) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) walk(url);
      else if (/^(layout|template|loading|error|global-error)\.tsx$/.test(entry.name)) {
        // Stylesheets are not components: the (home) layout carries the
        // switchers' CSS on purpose (see layout.tsx), and that adds no script.
        const named = imports(readFileSync(url, 'utf8')).filter((specifier) => SHELL.test(specifier) && !specifier.endsWith('.css'));
        if (named.length) found.push(`${url.pathname.split('/src/app/')[1]}: ${named.join(', ')}`);
      }
    }
  };
  walk(visitor);
  assert.deepEqual(found, []);
});
