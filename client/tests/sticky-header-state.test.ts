import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { TOP_BAR_QUERY, getStickyHeaderState } from '../src/components/layout/SiteHeader/stickyHeaderState';

/*
 * The sticky (scroll-up) copy of the header: what a keyboard and a screen
 * reader may reach in each of its states. It used to be `aria-hidden` at all
 * times while its currency and language buttons stayed in the tab order; then
 * it was exposed below the top bar's breakpoint, where its switchers were the
 * only ones. Below that breakpoint the real header now has its own language &
 * currency button, so the copy is a visual repeat at every width.
 */

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/^\s*\/\/.*$/gm, '');

test('off screen the copy is inert', () => {
  assert.deepEqual(getStickyHeaderState(false), { inert: true, ariaHidden: true });
});

test('on screen it is a copy for the pointer: hidden, clickable', () => {
  assert.deepEqual(getStickyHeaderState(true), { inert: false, ariaHidden: true });
});

test('the breakpoint is the one the stylesheet hides the top bar at', () => {
  assert.equal(TOP_BAR_QUERY, '(min-width: 992px)');
  assert.match(source('assets/css/gotur.css'), /@media \(max-width: 991px\) \{\s*\.top-one \{\s*display: none;\s*\}\s*\}/);
});

test('SiteHeader applies that state to the header element, and every control of the copy leaves the tab order', () => {
  const code = withoutComments(source('components/layout/SiteHeader/SiteHeader.tsx'));
  assert.match(code, /const stickyShown = isSticky && scrolledUp;/);
  assert.match(code, /const sticky = isSticky \? getStickyHeaderState\(stickyShown\) : null;/);
  for (const attribute of ['aria-hidden={sticky?.ariaHidden}', 'inert={sticky?.inert}']) {
    assert.ok(code.includes(attribute), attribute);
  }
  assert.match(code, /const tabIndex = isSticky \? -1 : undefined;/);
  // Logo, Home, menu items, submenu items, language & currency button, search,
  // wishlist, currency, language, CTA, menu button.
  assert.equal(code.split('tabIndex={tabIndex}').length - 1, 11);
  assert.equal(/tabIndex=\{(?!tabIndex\})/.test(code), false, 'no control with a tab index of its own');
  // The states that let keyboard focus into the copy are gone with it.
  assert.equal(/holdsFocus|topBarShown|role=\{/.test(code), false);
});

test('the copy\'s two switchers are not displayed below the top bar\'s breakpoint', () => {
  const code = withoutComments(source('components/layout/SiteHeader/SiteHeader.tsx'));
  assert.match(code, /className='main-header__switchers'/);
  // Display comes from the stylesheet, not the inline style, so the media query can hide it.
  assert.equal(/main-header__switchers'\s*style=\{\{[^}]*display/.test(code), false);
  const css = source('components/common/SitePreferences/sitePreferences.css');
  assert.match(css, /@media \(max-width: 991px\) \{\s*\.main-header__switchers \{\s*display: none;\s*\}\s*\}/);
});

test('both controls pass their tabIndex on to the button and to every item', () => {
  const currency = withoutComments(source('components/common/CurrencySwitcher/CurrencySwitcher.tsx'));
  const language = withoutComments(source('components/common/LanguageSelector/LanguageSelector.tsx'));
  assert.equal(currency.split('tabIndex={tabIndex}').length - 1, 2, 'currency: button and options');
  assert.equal(language.split('tabIndex={tabIndex}').length - 1, 2, 'language: button and links');
});

test('every page that shows a sticky copy also shows the top bar', () => {
  const missing: string[] = [];
  const walk = (directory: URL) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) walk(url);
      else if (entry.name.endsWith('.tsx')) {
        const code = withoutComments(readFileSync(url, 'utf8'));
        if (code.includes('<HeaderOneCloned') && !code.includes('<TopbarOne')) missing.push(url.pathname.split('/src/')[1]);
      }
    }
  };
  walk(new URL('../src/app/(visitor)/', import.meta.url));
  assert.deepEqual(missing, []);
});
