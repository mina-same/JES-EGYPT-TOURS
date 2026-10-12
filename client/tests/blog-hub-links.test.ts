import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { BLOG_HUB_HREF_BY_LOCALE } from '../src/data/blogHub';

const locales = ['en', 'de', 'it', 'es'] as const;
const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('the blog hub has its own localized path in every language', () => {
  assert.deepEqual(Object.keys(BLOG_HUB_HREF_BY_LOCALE).sort(), [...locales].sort());
  for (const locale of locales) {
    // One locale-prefixed segment that passes the strict slug rule.
    assert.match(BLOG_HUB_HREF_BY_LOCALE[locale], new RegExp(`^/${locale}/[a-z0-9]+(?:-[a-z0-9]+)*$`), locale);
  }
  // Not the English slug repeated under every prefix: that answers a redirect.
  const slugs = locales.map((locale) => BLOG_HUB_HREF_BY_LOCALE[locale].split('/')[2]);
  assert.equal(new Set(slugs).size, locales.length);
});

test('the footer and the homepage blog button link the hub, never /blogs', () => {
  for (const file of ['data/footerOneData.ts', 'data/blogTwoTwoData.ts']) {
    const text = source(file);
    assert.match(text, /BLOG_HUB_HREF_BY_LOCALE/, file);
    assert.doesNotMatch(text, /["'`]\/blogs["'`]/, file);
  }
  assert.match(source('components/layout/FooterOne/FooterOne.tsx'), /item\.hrefByLocale\[locale\]/);
  assert.match(source('components/sections/BlogTwoTwo/BlogTwoTwo.tsx'), /linkByLocale\[normalizeLocale\(currentLocale\)\]/);
});

const origin = process.env.BLOG_HUB_TEST_ORIGIN;
test('HTTP: every hub URL answers 200 and the footer links it', { skip: !origin }, async () => {
  assert.match(origin!, /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/, 'Verification is local only');
  for (const locale of locales) {
    const hub = await fetch(`${origin}${BLOG_HUB_HREF_BY_LOCALE[locale]}`, { redirect: 'manual' });
    assert.equal(hub.status, 200, BLOG_HUB_HREF_BY_LOCALE[locale]);

    const home = await (await fetch(`${origin}/${locale}`)).text();
    const footer = home.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.ok(footer.includes(`href="${BLOG_HUB_HREF_BY_LOCALE[locale]}"`), `${locale}: footer links the hub`);
    assert.equal(footer.includes(`href="/${locale}/blogs"`), false, `${locale}: footer no longer links /blogs`);
  }
});
