import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * Some homepage sentences link to tours and guides. The translation files hold
 * plain strings, so a link is written as `[anchor](/de/kontakt)` and rendered
 * by InlineLinks. In any other field the brackets would show up on the page as
 * typed, so links are only allowed in the fields that go through InlineLinks,
 * and each one must stay on this site, in the string's own language.
 */

const LOCALES = ['en', 'de', 'it', 'es'] as const;

const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const common = (locale: string) => JSON.parse(read(`i18n/locales/${locale}/common.json`));

/** Fields rendered through InlineLinks, and the component that renders each. */
const LINK_FIELDS: Record<string, string> = {
  'homeAbout.description': 'components/sections/AboutOne/AboutOne.tsx',
  'whyChooseUs.card1Desc': 'components/sections/whyChooseUs/WhyChooseUs.tsx',
  'whyChooseUs.card2Desc': 'components/sections/whyChooseUs/WhyChooseUs.tsx',
  'whyChooseUs.card3Desc': 'components/sections/whyChooseUs/WhyChooseUs.tsx',
  'whyChooseUs.card4Desc': 'components/sections/whyChooseUs/WhyChooseUs.tsx',
  'whyChooseUs.card5Desc': 'components/sections/whyChooseUs/WhyChooseUs.tsx',
  'whyChooseUs.card6Desc': 'components/sections/whyChooseUs/WhyChooseUs.tsx',
  'tailorOffer.desc': 'components/sections/OfferOne/OfferOne.tsx',
  faqSubtitle: 'components/sections/FaqSection/HomeFAQ.tsx',
};

/** Every string in a nested translation object, keyed by its dotted path. */
function flatten(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key)
  );
}

test('inline links only appear in fields rendered through InlineLinks', () => {
  for (const locale of LOCALES) {
    for (const [key, value] of flatten(common(locale))) {
      if (!/\[[^\]]+\]\(/.test(value)) continue;
      assert.ok(key in LINK_FIELDS, `${locale}.${key} holds a link but is rendered as plain text`);
    }
  }
});

test('every inline link is a page on this site in the same language', () => {
  for (const locale of LOCALES) {
    for (const [key, value] of flatten(common(locale))) {
      for (const match of value.matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)) {
        assert.match(match[2], new RegExp(`^/${locale}/[a-z0-9-]+$`), `${locale}.${key}: ${match[0]}`);
      }
    }
  }
});

test('the components of the link fields render them through InlineLinks', () => {
  for (const file of new Set(Object.values(LINK_FIELDS))) {
    assert.match(read(file), /<InlineLinks text=\{/, file);
  }
});
