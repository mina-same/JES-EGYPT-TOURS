import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolveSiteLink } from '../src/lib/url/links';

/*
 * The homepage's promo bar under the hero and the About photos below it, on
 * phones. Measured at 360px before these rules: the About section's "small"
 * photo filled the column, covered 72% of the main photo, rose 62px into the
 * promo bar and hid its button completely; the listing pages' promo (same
 * classes) did the same. The promo link was an absolute URL to the site's own
 * domain, in English for every language, opening a new tab.
 */

const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const css = (path: string) => read(path).replace(/\/\*[\s\S]*?\*\//g, '');
const code = (path: string) => read(path).replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('a link to the site\'s own domain becomes a path in the visitor\'s language', () => {
  assert.deepEqual(resolveSiteLink('https://www.jesegypttours.com/en/egypt-tour-packages', 'de'), { href: '/de/egypt-tour-packages', external: false });
  // The bare host and a protocol-relative URL are the site too; query and hash survive.
  assert.deepEqual(resolveSiteLink('https://jesegypttours.com/en/special-offers', 'de'), { href: '/de/sonderangebote', external: false });
  assert.deepEqual(resolveSiteLink('//www.jesegypttours.com/en/faq?x=1#a', 'it'), { href: '/it/faq?x=1#a', external: false });
  assert.deepEqual(resolveSiteLink('https://www.jesegypttours.com/', 'de'), { href: '/de', external: false });
});

test('an internal link takes the visitor\'s language; static slugs are translated', () => {
  assert.deepEqual(resolveSiteLink('/en/egypt-tour-packages', 'en'), { href: '/en/egypt-tour-packages', external: false });
  assert.deepEqual(resolveSiteLink('/egypt-tour-packages', 'es'), { href: '/es/egypt-tour-packages', external: false });
  assert.deepEqual(resolveSiteLink('special-offers', 'it'), { href: '/it/offerte-speciali', external: false });
});

test('another site stays as typed and is the only external link', () => {
  assert.deepEqual(resolveSiteLink('https://www.tripadvisor.com/Attraction', 'de'), { href: 'https://www.tripadvisor.com/Attraction', external: true });
  // A host that merely starts with the site's name is another site.
  assert.deepEqual(resolveSiteLink('http://jesegypttours.com.evil.example/en', 'de'), { href: 'http://jesegypttours.com.evil.example/en', external: true });
  assert.deepEqual(resolveSiteLink('https://', 'de'), { href: 'https://', external: true });
});

test('mail, phone, anchors and empty links are left alone', () => {
  for (const url of ['mailto:info@jesegypttours.com', 'tel:+201007437271', '#offers']) {
    assert.deepEqual(resolveSiteLink(url, 'de'), { href: url, external: false });
  }
  assert.deepEqual(resolveSiteLink('', 'de'), { href: '#', external: false });
  assert.deepEqual(resolveSiteLink(undefined, 'de'), { href: '#', external: false });
});

test('the promo opens a new tab only for another site, and its message carries the icon inline', () => {
  const hero = code('components/sections/MainSliderFour/MainSliderFour.tsx');
  assert.match(hero, /const promoLink = resolveSiteLink\(promoHref, lang\);/);
  assert.match(hero, /const opensNewTab = promoLink\.external && promo\?\.linkDirection === "_blank";/);
  assert.match(hero, /href=\{promoLink\.href\}\s*target=\{opensNewTab \? "_blank" : undefined\}\s*rel=\{opensNewTab \? "noopener noreferrer" : undefined\}/);
  assert.match(hero, /<span className="main-slider-four__promo-message">\s*\{leadsWithEmoji \? null : \(\s*<Sparkles/);
  assert.equal(/href=\{promoHref\}/.test(hero), false);
});

test('the promo bar is lifted above the next section', () => {
  assert.match(css('assets/css/custom.css'), /\.main-slider-four__promo-wrapper \{\s*position: relative;\s*z-index: 2;/);
});

test('on phones the About photos keep their composition inside the section', () => {
  const sheet = css('assets/css/gotur.css');
  const block = sheet.match(/\.about-one__thumb__item-popup \{[^}]*\}\s*@media \(max-width: 767px\) \{([\s\S]*?\n)\}/);
  assert.ok(block, 'phone block right after the About One rules');
  const rules = block[1];
  assert.match(rules, /\.about-one__thumb \{\s*padding: 0 20px 36px 0;\s*\}/);
  assert.match(rules, /\.about-one__thumb__item-small \{\s*bottom: 0;\s*right: 0;\s*width: 46%;\s*\}/);
  // Outranks AboutOne.css's fixed 272/336px photo widths whatever the load order.
  assert.match(rules, /\.about-one__thumb__item-small img \{\s*width: 100%;\s*height: auto;\s*\}/);
  assert.match(rules, /\.about-one__thumb__item-popup \{\s*top: -16px;\s*right: 0;\s*\}/);
  assert.match(rules, /\.about-one__thumb__item-popup img \{\s*width: 72px;\s*height: auto;\s*\}/);
  // The listing pages' promo uses the same classes, so it gets the same layout.
  assert.match(read('components/common/ListingSections/ListingPromo.tsx'), /className='about-one__thumb__item-small'/);
});
