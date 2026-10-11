import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { TOP_BAR_QUERY, getStickyHeaderState } from '../src/components/layout/SiteHeader/stickyHeaderState';

/*
 * The sticky (scroll-up) copy of the header: what a keyboard and a screen
 * reader may reach in each of its states. It used to be `aria-hidden` at all
 * times while its currency and language buttons stayed in the tab order.
 */

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/^\s*\/\/.*$/gm, '');

test('off screen the copy is inert, whatever the width', () => {
  for (const topBarShown of [true, false]) {
    const state = getStickyHeaderState(false, topBarShown);
    assert.equal(state.inert, true);
    assert.equal(state.ariaHidden, true);
  }
});

test('on screen beside the top bar it is a copy for the pointer: hidden, clickable, no tab stop', () => {
  assert.deepEqual(getStickyHeaderState(true, true), {
    inert: false,
    ariaHidden: true,
    role: undefined,
    switcherTabIndex: -1,
  });
});

test('on screen without the top bar its currency and language controls are real, and it is no second banner', () => {
  assert.deepEqual(getStickyHeaderState(true, false), {
    inert: false,
    ariaHidden: undefined,
    role: 'none',
    switcherTabIndex: undefined,
  });
});

test('a focusable control is never left inside a hidden copy', () => {
  for (const shown of [true, false]) {
    for (const topBarShown of [true, false]) {
      const state = getStickyHeaderState(shown, topBarShown);
      const reachable = !state.inert && state.switcherTabIndex === undefined;
      assert.equal(reachable && state.ariaHidden === true, false, `shown ${shown}, top bar ${topBarShown}`);
    }
  }
});

test('the breakpoint is the one the stylesheet hides the top bar at', () => {
  assert.equal(TOP_BAR_QUERY, '(min-width: 992px)');
  assert.match(source('assets/css/gotur.css'), /@media \(max-width: 991px\) \{\s*\.top-one \{\s*display: none;\s*\}\s*\}/);
});

test('SiteHeader applies that state to the header element and to both controls', () => {
  const code = withoutComments(source('components/layout/SiteHeader/SiteHeader.tsx'));
  assert.match(code, /const stickyShown = isSticky && \(scrolledUp \|\| holdsFocus\);/);
  assert.match(code, /const sticky = isSticky \? getStickyHeaderState\(stickyShown, topBarShown\) : null;/);
  for (const attribute of ['aria-hidden={sticky?.ariaHidden}', 'role={sticky?.role}', 'inert={sticky?.inert}']) {
    assert.ok(code.includes(attribute), attribute);
  }
  assert.equal(code.split('tabIndex={sticky?.switcherTabIndex}').length - 1, 2, 'currency and language');
  // The logo, the navigation, search, wishlist, the CTA and the menu button repeat the real header's.
  assert.equal(code.split('aria-hidden={repeated}').length - 1, 6);
  assert.match(code, /const repeated = isSticky \|\| undefined;/);
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
