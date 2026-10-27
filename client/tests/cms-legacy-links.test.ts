import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
// @ts-expect-error Node's built-in type stripping needs the explicit extension.
import { resolveSiteLink } from '../src/lib/url/links.ts';

/*
 * Links typed into the CMS before the site moved to www.jesegypttours.com.
 *
 * The section buttons of five tour categories / subcategories (Egypt Tour
 * Packages, Egypt Day Tours, Classic, Nile Cruises, Luxury) pointed at
 * "https://jes-egypt-tours.vercel.app/tailorMade" or ".../en/tailorMade" and
 * were rendered as typed. A visitor left the production domain, went through a
 * redirect, and — their language cookie belonging to the other domain — landed
 * on the English page, mostly in a new tab.
 */

const TAILOR_MADE = { en: '/en/tailor-made', de: '/de/individualreise-aegypten', it: '/it/viaggio-su-misura', es: '/es/viaje-a-medida' } as const;

test('the old Vercel address and the old tailorMade path lead to the tailor-made page in the visitor\'s language', () => {
  for (const [locale, page] of Object.entries(TAILOR_MADE)) {
    for (const typed of [
      'https://jes-egypt-tours.vercel.app/tailorMade',
      'https://jes-egypt-tours.vercel.app/en/tailorMade',
      'https://JES-EGYPT-TOURS.vercel.app/de/tailorMade',
      'https://www.jesegypttours.com/en/tailorMade',
      '/tailorMade',
      '/en/tailorMade',
      'tailorMade',
    ]) {
      assert.deepEqual(resolveSiteLink(typed, locale), { href: page, external: false }, `${typed} on ${locale}`);
    }
  }
  // Query and hash survive.
  assert.deepEqual(resolveSiteLink('https://jes-egypt-tours.vercel.app/tailorMade?ref=nile#form', 'de'), { href: '/de/individualreise-aegypten?ref=nile#form', external: false });
});

test('other links to the Vercel address stay on this domain, in the visitor\'s language', () => {
  assert.deepEqual(resolveSiteLink('https://jes-egypt-tours.vercel.app/en/special-offers', 'it'), { href: '/it/offerte-speciali', external: false });
  assert.deepEqual(resolveSiteLink('https://jes-egypt-tours.vercel.app/en/egypt-tour-packages', 'en'), { href: '/en/egypt-tour-packages', external: false });
  assert.deepEqual(resolveSiteLink('https://jes-egypt-tours.vercel.app/', 'es'), { href: '/es', external: false });
});

test('only the exact old page name is rewritten, and other Vercel sites stay external', () => {
  // A deeper path, or a segment that only starts the same, is not the old page.
  assert.deepEqual(resolveSiteLink('/de/egypt/tailorMade', 'de'), { href: '/de/egypt/tailorMade', external: false });
  assert.deepEqual(resolveSiteLink('/tailorMadeTrips', 'en'), { href: '/en/tailorMadeTrips', external: false });
  assert.deepEqual(resolveSiteLink('/xx/tailorMade', 'en'), { href: '/en/xx/tailorMade', external: false });
  // Another project on Vercel, or a look-alike host, is another site.
  for (const other of ['https://other-project.vercel.app/tailorMade', 'https://jes-egypt-tours.vercel.app.evil.example/tailorMade']) {
    assert.deepEqual(resolveSiteLink(other, 'de'), { href: other, external: true });
  }
});

test('the category section button goes through resolveSiteLink and opens a new tab only for another site', () => {
  const header = readFileSync(new URL('../src/components/sections/EnhancedSectionHeader/EnhancedSectionHeader.tsx', import.meta.url), 'utf8');
  assert.match(header, /const locale = normalizeLocale\(useParams\(\)\?\.locale\);/);
  assert.match(header, /const buttonLink = hasButton \? resolveSiteLink\(button!\.href, locale\) : null;/);
  assert.match(header, /const opensNewTab = !!buttonLink\?\.external && !!button\?\.newTab;/);
  assert.match(header, /href=\{buttonLink\.href\}\s*className="gotur-btn[^"]*"\s*target=\{opensNewTab \? '_blank' : undefined\}\s*rel=\{opensNewTab \? 'noreferrer noopener' : undefined\}/);
  // The raw CMS value is never the href any more.
  assert.equal(/href=\{button!\.href!?\}/.test(header), false);
});
