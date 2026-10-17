import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  clearLanguageFocus,
  hasPendingLanguageFocus,
  isKeyboardClick,
  markLanguageFocus,
} from '../src/components/common/LanguageSelector/languageFocus';

/*
 * Focus after a language switch made from the keyboard: the request that
 * crosses the navigation, and who may act on it.
 */

/** Runs `body` on a page at `pathname`, with a session store that outlives it. */
function onPage(pathname: string, store: Map<string, string>, body: () => void, storage?: Partial<Storage>) {
  const scope = globalThis as { window?: unknown };
  scope.window = {
    location: { pathname },
    sessionStorage: storage ?? {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  };
  try {
    body();
  } finally {
    delete scope.window;
  }
}

/** Runs `body` with the clock moved `ms` ahead. */
function later(ms: number, body: () => void) {
  const realNow = Date.now;
  Date.now = () => realNow() + ms;
  try {
    body();
  } finally {
    Date.now = realNow;
  }
}

test('only a click made without a pointer counts as keyboard-made', () => {
  assert.equal(isKeyboardClick({ detail: 0 }), true); // Enter on the link, click(), a screen reader
  assert.equal(isKeyboardClick({ detail: 1 }), false); // mouse, tap
  assert.equal(isKeyboardClick({ detail: 2 }), false);
});

test('the request is pending on the page the switch was heading for, and stays until cleared', () => {
  const store = new Map<string, string>();
  onPage('/en/egypt-tour-packages', store, () => markLanguageFocus('/de/aegypten-rundreise'));
  onPage('/de/aegypten-rundreise', store, () => {
    assert.equal(hasPendingLanguageFocus(), true);
    assert.equal(hasPendingLanguageFocus(), true, 'asking does not consume it: two selectors ask');
    clearLanguageFocus();
    assert.equal(hasPendingLanguageFocus(), false);
  });
  assert.equal(store.size, 0);
});

test('a trailing slash, a query or a hash on either side is the same page', () => {
  for (const [target, arrived] of [['/de/', '/de'], ['/de', '/de/'], ['/it/faq?x=1#top', '/it/faq'], ['/', '/']]) {
    const store = new Map<string, string>();
    onPage('/en', store, () => markLanguageFocus(target));
    onPage(arrived, store, () => assert.equal(hasPendingLanguageFocus(), true, `${target} -> ${arrived}`));
  }
});

test('on any other page the request is dropped, so it cannot move focus later', () => {
  const store = new Map<string, string>();
  onPage('/en/about', store, () => markLanguageFocus('/de/ueber-uns'));
  onPage('/en/contact', store, () => assert.equal(hasPendingLanguageFocus(), false));
  assert.equal(store.size, 0, 'removed, not just ignored');
  onPage('/de/ueber-uns', store, () => assert.equal(hasPendingLanguageFocus(), false));
});

test('it lasts a few seconds: an abandoned navigation leaves nothing behind', () => {
  const store = new Map<string, string>();
  onPage('/en', store, () => markLanguageFocus('/de'));
  later(14000, () => onPage('/de', store, () => assert.equal(hasPendingLanguageFocus(), true)));
  later(16000, () => onPage('/de', store, () => assert.equal(hasPendingLanguageFocus(), false)));
  assert.equal(store.size, 0);
});

test('nothing is pending by default, and a damaged entry is dropped', () => {
  const store = new Map<string, string>();
  onPage('/de', store, () => assert.equal(hasPendingLanguageFocus(), false));
  for (const damaged of ['not json', '{}', '{"path":"/de"}', '{"path":"/de","at":"now"}', JSON.stringify({ path: '/de', at: Date.now() + 60000 })]) {
    store.set('jes:language-focus', damaged);
    onPage('/de', store, () => assert.equal(hasPendingLanguageFocus(), false, damaged));
    assert.equal(store.size, 0, damaged);
  }
});

test('without session storage nothing throws and nothing is restored', () => {
  const blocked = () => { throw new Error('SecurityError'); };
  onPage('/de', new Map(), () => {
    assert.doesNotThrow(() => markLanguageFocus('/de'));
    assert.equal(hasPendingLanguageFocus(), false);
    assert.doesNotThrow(() => clearLanguageFocus());
  }, { getItem: blocked, setItem: blocked, removeItem: blocked });
});

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('the switch asks for it only when keyboard-made and to another language', () => {
  const hook = source('components/common/LanguageSelector/useLanguageSwitch.ts');
  assert.match(hook, /if \(fromKeyboard && locale !== currentLocale\) markLanguageFocus\(target\);\s*router\.push\(target\);/);
  assert.equal(hook.split('markLanguageFocus(').length - 1, 1);
  // Both language controls go through that switch and tell it how they were used.
  assert.match(source('components/common/LanguageSelector/LanguageSelector.tsx'), /selectLanguage\(option, isKeyboardClick\(event\)\);/);
  assert.match(source('components/common/LanguageSelector/LanguageSelector.tsx'), /switchLanguage\(option\.value, target, fromKeyboard\);/);
  assert.match(source('components/common/SitePreferences/PreferencesPanel.tsx'), /switchLanguage\(locale, target, isKeyboardClick\(event\)\);/);
  for (const path of [
    'components/common/LanguageSelector/LanguageSelector.tsx',
    'components/common/SitePreferences/PreferencesPanel.tsx',
    'components/common/SitePreferences/PreferencesSheet.tsx',
    'components/layout/Drawer/Drawer.tsx',
  ]) {
    assert.equal(source(path).includes('markLanguageFocus('), false, `${path}: nowhere else`);
  }
});

test('the selector the page shows takes the focus back without scrolling; a hidden copy does not', () => {
  const code = source('components/common/LanguageSelector/LanguageSelector.tsx');
  assert.match(code, /if \(!mounted \|\| !hasPendingLanguageFocus\(\)\) return;\s*const button = buttonRef\.current;\s*if \(!canTakeFocus\(button\)\) return;\s*clearLanguageFocus\(\);\s*button\.focus\(\{ preventScroll: true \}\);/);
});

test('below the top bar\'s breakpoint the header\'s language & currency button takes it, the same way', () => {
  const code = source('components/common/SitePreferences/PreferencesButton.tsx');
  assert.match(code, /if \(!hasPendingLanguageFocus\(\)\) return;\s*const button = buttonRef\.current;\s*if \(!canTakeFocus\(button\)\) return;\s*clearLanguageFocus\(\);\s*button\.focus\(\{ preventScroll: true \}\);/);
  // The sticky copy no longer brings itself on screen for it.
  assert.equal(source('components/layout/SiteHeader/SiteHeader.tsx').includes('hasPendingLanguageFocus'), false);
});

test('a dialog closed by a language switch does not pull the focus back to its opener', () => {
  const sheet = source('components/common/SitePreferences/PreferencesSheet.tsx');
  assert.match(sheet, /const closeForLanguageSwitch = useCallback\(\(\) => \{\s*restoreFocusRef\.current = false;\s*close\(\);/);
  assert.match(sheet, /<PreferencesPanel onLanguageSwitch=\{closeForLanguageSwitch\} onDone=\{close\} \/>/);
  const drawer = source('components/layout/Drawer/Drawer.tsx');
  assert.match(drawer, /const onLanguageSwitch = \(\) => \{\s*restoreFocusRef\.current = false;\s*close\(\);/);
  assert.match(drawer, /<PreferencesPanel onLanguageSwitch=\{onLanguageSwitch\} \/>/);
});
