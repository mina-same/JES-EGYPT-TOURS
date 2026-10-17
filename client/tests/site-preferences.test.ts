import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { TOP_BAR_QUERY } from '../src/components/layout/SiteHeader/stickyHeaderState';
import { CURRENCIES, CURRENCY_SYMBOLS, ENDONYMS, FLAGS } from '../src/components/common/SitePreferences/preferenceOptions';

/*
 * Language and currency on phones and tablets (below 992px), where the top
 * bar that carries both switchers is not displayed: the header's button, the
 * bottom sheet it opens, and the same panel in the mobile menu.
 */

const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
// JSX comments first, whole, so no empty `{}` is left where they stood.
const code = (path: string) => read(path).replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const css = () => read('components/common/SitePreferences/sitePreferences.css').replace(/\/\*[\s\S]*?\*\//g, '');

test('the header button is displayed exactly where the top bar is not', () => {
  assert.equal(TOP_BAR_QUERY, '(min-width: 992px)');
  const sheet = css();
  assert.match(sheet, /^\.site-prefs-btn \{\s*display: none;\s*\}/m);
  assert.match(sheet, /@media \(max-width: 991px\) \{\s*\.site-prefs-btn \{\s*position: relative;\s*display: inline-flex;/);
  assert.match(read('assets/css/gotur.css'), /@media \(max-width: 991px\) \{\s*\.top-one \{\s*display: none;\s*\}\s*\}/);
});

test('both header copies render the button first among their icons, the sticky one out of the tab order', () => {
  const header = code('components/layout/SiteHeader/SiteHeader.tsx');
  assert.equal(header.split('<PreferencesButton').length - 1, 1);
  assert.match(header, /className='main-header__info'[\s\S]*?>\s*<PreferencesButton tabIndex=\{tabIndex\} \/>\s*<button\s+type='button'\s+onClick=\{changeSearchPopupStatus\}/);
});

test('the button is server-rendered from the path and the currency, and opens the sheet', () => {
  const button = code('components/common/SitePreferences/PreferencesButton.tsx');
  assert.equal(/mounted|useState/.test(button), false, 'no mount gate: it paints with the header');
  assert.match(button, /const locale = getLocaleFromPath\(pathname\);/);
  assert.match(button, /const \{ currency \} = useCurrency\(\);/);
  assert.match(button, /void loadSheet\(\);\s*setPreferencesSheetStatus\(true\);/);
  assert.match(button, /aria-haspopup='dialog'/);
  // Its name says what it is before the visible abbreviations.
  assert.match(button, /<span className='sr-only'>\{t\("preferences\.title"\)\}: <\/span>/);
  // Its stylesheet is the layout's (next test).
  assert.equal(button.includes('.css"'), false);
});

test('the stylesheet loads with the layout, after globals.css, and from no client component', () => {
  // Imported by a client component, it was merged with other pages' CSS
  // modules (Contact, Travel Trade, policies, author) into a stylesheet every
  // page had to load before painting.
  const layout = code('app/(visitor)/[locale]/(home)/layout.tsx');
  assert.match(layout, /import "\.\/globals\.css";\s*import "@\/components\/common\/SitePreferences\/sitePreferences\.css";/);
  for (const file of ['PreferencesButton.tsx', 'PreferencesPanel.tsx', 'PreferencesSheet.tsx']) {
    assert.equal(code(`components/common/SitePreferences/${file}`).includes('sitePreferences.css'), false, file);
  }
});

test('the language and currency switchers\' stylesheets load with the layout too', () => {
  // Imported by the switchers, they were merged with the blog banner's and
  // blog grid's CSS modules into a stylesheet every page had to load.
  const layout = code('app/(visitor)/[locale]/(home)/layout.tsx');
  assert.match(layout, /import "@\/components\/common\/SitePreferences\/sitePreferences\.css";\s*import "@\/components\/common\/LanguageSelector\/langusgeSelect\.css";\s*import "@\/components\/common\/CurrencySwitcher\/currencySwitcher\.css";/);
  assert.equal(code('components/common/LanguageSelector/LanguageSelector.tsx').includes('.css'), false);
  assert.equal(code('components/common/CurrencySwitcher/CurrencySwitcher.tsx').includes('.css'), false);
});

test('the sheet is loaded on first use, closed on navigation, and closes itself from 992px up', () => {
  const shell = code('app/(visitor)/[locale]/(home)/HomeClientShell.tsx');
  // Fetched by the button from the press on, never by the layout's shell:
  // from there its chunk repeated the language code every page already has.
  const button = code('components/common/SitePreferences/PreferencesButton.tsx');
  assert.match(button, /sheetRequest = import\("\.\/PreferencesSheet"\)\.then\(\s*\(module\) => provideSheet\(module\.default\),/);
  assert.match(button, /onPointerDown=\{\(\) => void loadSheet\(\)\}/);
  assert.equal(shell.includes('SitePreferences/PreferencesSheet"'), false, 'the shell does not import the sheet');
  assert.match(shell, /const PreferencesSheet = usePreferencesSheet\(\);/);
  assert.match(shell, /\{enableNonCriticalUi && shouldMountPreferences && PreferencesSheet \? <PreferencesSheet \/> : null\}/);
  assert.match(code('components/layout/LayoutObserver/LayoutObserver.tsx'), /setPreferencesSheetStatus\(false\);\s*\}, \[pathname\]\);/);
  const sheet = code('components/common/SitePreferences/PreferencesSheet.tsx');
  assert.match(sheet, /const wideQuery = window\.matchMedia\(TOP_BAR_QUERY\);/);
});

test('the sheet is a modal dialog named by its title, with a named close button', () => {
  const sheet = code('components/common/SitePreferences/PreferencesSheet.tsx');
  assert.match(sheet, /role='dialog'\s*aria-modal='true'\s*aria-labelledby=\{titleId\}/);
  assert.match(sheet, /<h2 id=\{titleId\}/);
  assert.match(sheet, /aria-label=\{t\("preferences\.close"\)\}/);
  assert.match(sheet, /if \(event\.key === "Escape"\)/);
  assert.match(sheet, /opener\.focus\(\{ preventScroll: true \}\);/);
});

test('the drawer offers the same panel', () => {
  const drawer = code('components/layout/Drawer/Drawer.tsx');
  assert.match(drawer, /<section className='mobile-nav__prefs' aria-label=\{t\("preferences\.title"\)\}>\s*<PreferencesPanel onLanguageSwitch=\{onLanguageSwitch\} \/>\s*<\/section>/);
});

test('the panel takes its links from the shared switch: no target logic of its own', () => {
  const panel = code('components/common/SitePreferences/PreferencesPanel.tsx');
  assert.match(panel, /const \{ options, currentLocale, getTargetUrl, switchLanguage \} = useLanguageSwitch\(\);/);
  assert.equal(/localizeInternalUrl|localizeStaticPathSegment|router\.push|document\.cookie/.test(panel), false);
  // Unavailable languages are not links, as in the top bar's selector.
  assert.match(panel, /const href = option\.isDisabled \? null : getTargetUrl\(option\.value\);/);
  assert.match(panel, /role='link'\s*aria-disabled='true'/);
  // The current language and the selected currency are marked, not only coloured.
  assert.match(panel, /aria-current=\{isCurrent \? "page" : undefined\}/);
  assert.match(panel, /aria-pressed=\{code === currency\}/);
  // A modified click stays the browser's (new tab).
  assert.match(panel, /if \(event\.button !== 0 \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey\) return;/);
});

test('every language is offered in its own name, with a flag, and every currency with its symbol', () => {
  assert.deepEqual(ENDONYMS, { en: 'English', de: 'Deutsch', it: 'Italiano', es: 'Español' });
  assert.deepEqual(Object.keys(FLAGS).sort(), ['de', 'en', 'es', 'it']);
  assert.deepEqual([...CURRENCIES], ['USD', 'EUR', 'GBP']);
  assert.deepEqual(CURRENCY_SYMBOLS, { USD: '$', EUR: '€', GBP: '£' });
});

test('the four languages carry the sheet\'s texts', () => {
  for (const locale of ['en', 'de', 'it', 'es']) {
    const common = JSON.parse(read(`i18n/locales/${locale}/common.json`));
    for (const key of ['title', 'currency', 'close', 'unavailable']) {
      const value = common.preferences?.[key];
      assert.equal(typeof value === 'string' && value.trim().length > 0, true, `${locale}: preferences.${key}`);
    }
    assert.equal(typeof common.language?.label, 'string', `${locale}: language.label`);
  }
});

test('touch targets are at least 44px tall', () => {
  const sheet = css();
  assert.match(sheet, /\.site-prefs-btn \{[^}]*height: 34px;/);
  assert.match(sheet, /\.site-prefs-btn::before \{\s*content: "";\s*position: absolute;\s*inset: -5px -4px;/);
  assert.match(sheet, /\.site-prefs \.site-prefs__option \{[^}]*min-height: 48px;/);
  assert.match(sheet, /\.site-prefs-sheet__close \{[^}]*width: 44px;\s*height: 44px;/);
});
