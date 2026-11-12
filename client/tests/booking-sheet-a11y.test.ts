import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * The mobile booking sheet (S-03, batch 5B): MobileStickyBookingBar.tsx and its
 * rules in custom.css.
 *
 * Before: the closed sheet was only moved off-screen, so its 16 controls stayed
 * in the Tab order and in the accessibility tree, and the bar's button stayed
 * focusable while the bar was invisible. The open sheet was not a dialog: its
 * close button had no name, focus stayed behind it, Tab walked out to the page,
 * Escape did nothing and focus was never given back. Only <body> was locked,
 * but the page scrolls on <html>, and closing forced `overflow: unset`. At
 * 992px the component unmounted, taking the typed values with it and leaving
 * the page locked. The slide ignored Reduce Motion, and the title was an h4.
 *
 * Behaviour was verified in a browser; these checks keep the pieces in place.
 */

const source = readFileSync(new URL('../src/components/sections/TourListingDetailsOne/components/MobileStickyBookingBar.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/assets/css/custom.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const locale = (lang: string) => JSON.parse(readFileSync(new URL(`../src/i18n/locales/${lang}/tours.json`, import.meta.url), 'utf8'));

/** The JSX opening tag whose className starts with `name`, attributes and all
 *  (braces are skipped, so an arrow's `>` does not end it). */
const tag = (name: string) => {
  const boundary = /\w$/.test(name) ? '(?![\\w-])' : '';
  const at = source.search(new RegExp(`className=\\{?[\`"']${name.replace(/[-]/g, '\\-')}${boundary}`));
  assert.ok(at >= 0, name);
  const start = source.lastIndexOf('<', at);
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    else if (source[i] === '>' && depth === 0) return source.slice(start, i + 1);
  }
  assert.fail(`unclosed tag for ${name}`);
};

test('closed, the sheet is inert and hidden from assistive technology; open, it is a named modal dialog', () => {
  const sheet = tag('mobile-bottom-sheet ');
  assert.match(sheet, /role="dialog"/);
  assert.match(sheet, /aria-modal=\{isSheetOpen \? true : undefined\}/);
  assert.match(sheet, /aria-labelledby=\{titleId\}/);
  assert.match(sheet, /inert=\{!isSheetOpen\}/);
  assert.match(source, /const isSheetOpen = isOpen && isMobile;/);
  // Named by its visible title, which is now an h2 with the same class.
  assert.match(source, /<h2 id=\{titleId\} className="bottom-sheet-title">/);
  assert.match(source, /const titleId = useId\(\);/);
  assert.doesNotMatch(source, /<h4/);
});

test('the bar\'s button is inert whenever the bar is not shown', () => {
  assert.match(tag('mobile-sticky-booking-bar'), /inert=\{!barShown\}/);
  assert.match(source, /const barShown = isMobile && !isOpen && \(isVisible \|\| holdsFocus\);/);
  assert.match(tag('mobile-sticky-booking-bar'), /className=\{`mobile-sticky-booking-bar \$\{barShown \? 'is-visible' : ''\}`\}/);
});

test('the close button has a translated name and a decorative icon', () => {
  const close = tag('bottom-sheet-close');
  assert.match(close, /type="button"/);
  assert.match(close, /aria-label=\{t\("tourDetails\.askModal\.close"\)\}/);
  assert.match(source, /<X size=\{24\} aria-hidden="true" \/>/);
  const names = { en: 'Close', de: 'Schließen', it: 'Chiudi', es: 'Cerrar' };
  for (const [lang, name] of Object.entries(names)) assert.equal(locale(lang).tourDetails.askModal.close, name, lang);
});

test('focus: the close button on opening, the Book button on closing, both without scrolling the page', () => {
  assert.match(source, /closeButtonRef\.current\?\.focus\(\{ preventScroll: true \}\);/);
  assert.match(source, /trigger\?\.focus\(\{ preventScroll: true \}\);/);
  // The bar is kept shown while its button holds that focus.
  assert.match(source, /const closeSheet = \(\) => \{\s*setIsOpen\(false\);\s*setHoldsFocus\(true\);\s*\};/);
  assert.match(source, /onBlur=\{\(\) => setHoldsFocus\(false\)\}/);
  // The backdrop keeps focus in the sheet on mousedown and is not announced.
  const backdrop = tag('mobile-bottom-sheet-backdrop');
  assert.match(backdrop, /aria-hidden="true"/);
  assert.match(backdrop, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(backdrop, /onClick=\{closeSheet\}/);
});

test('Escape closes the sheet only when nothing inside used it; Tab cycles inside', () => {
  // The calendar closes itself on Escape and calls preventDefault.
  assert.match(source, /if \(event\.key === 'Escape'\) \{[\s\S]*?if \(event\.defaultPrevented \|\| event\.isComposing\) \{\s*return;\s*\}/);
  assert.match(source, /document\.addEventListener\('keydown', onKeyDown\);/);
  assert.match(source, /if \(event\.shiftKey && beforeFirst\) \{\s*event\.preventDefault\(\);\s*last\.focus\(\);/);
  assert.match(source, /\} else if \(!event\.shiftKey && afterLast\) \{\s*event\.preventDefault\(\);\s*first\.focus\(\);/);
  // Only controls that can be seen and used are in the cycle.
  assert.match(source, /el\.tabIndex >= 0 &&\s*!el\.matches\(':disabled'\) &&\s*el\.getClientRects\(\)\.length > 0 &&\s*getComputedStyle\(el\)\.visibility !== 'hidden'/);
});

test('the scroll lock holds <html> as well as <body>, and puts back what was there', () => {
  assert.match(source, /html\.style\.overflow = 'hidden';/);
  assert.match(source, /body\.style\.overflow = 'hidden';/);
  assert.match(source, /html\.style\.overflow = previous\.htmlOverflow;/);
  assert.match(source, /body\.style\.overflow = previous\.bodyOverflow;/);
  assert.match(source, /html\.style\.setProperty\('scrollbar-gutter', previous\.gutter\);/);
  assert.doesNotMatch(source, /'unset'/);
});

test('across 992px the form stays mounted but hidden and inert, and the sheet closes', () => {
  assert.match(source, /if \(!isMobile && !hasBeenMobile\) return null;/);
  assert.match(tag('mobile-bottom-sheet '), /hidden=\{!isMobile\}/);
  assert.match(tag('mobile-sticky-booking-bar'), /hidden=\{!isMobile\}/);
  assert.match(source, /\/\/ Closed, not just hidden: coming back below 992px must not reopen it\.\s*setIsOpen\(false\);/);
  // One form in the sheet, mounted once.
  assert.equal(source.match(/<BookingFormLazy /g)?.length, 1);
  assert.match(source, /const DESKTOP_BOOKING_CARD = '\.tour-listing-details__sidebar \.tour-listing-details__sidebar__item-form';/);
});

test('Reduce Motion stops the slide of the sheet only; the sheet content keeps its scroll to itself', () => {
  assert.match(css, /\.mobile-bottom-sheet \{[^}]*transition: transform 0\.4s cubic-bezier\(0\.19, 1, 0\.22, 1\);/);
  assert.match(css, /@media \(max-width: 991px\) and \(prefers-reduced-motion: reduce\) \{\s*\.mobile-bottom-sheet \{\s*transition: none;\s*\}\s*\}/);
  assert.match(css, /\.bottom-sheet-content \{[^}]*overflow-y: auto;\s*overscroll-behavior: contain;/);
});
