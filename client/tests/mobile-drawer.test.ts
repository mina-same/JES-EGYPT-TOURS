import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * The mobile menu (Drawer): how it opens and closes, and how its submenus
 * expand. Measured frame by frame before these rules: a submenu jumped open
 * in one frame and closed ~0.9 s late, the drawer took two 500 ms stages each
 * way, the first open had no animation at all, and a tap in the first second
 * of a page opened nothing.
 */

const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const css = (path: string) => read(path).replace(/\/\*[\s\S]*?\*\//g, '');
// JSX comments first, whole, so no empty `{}` is left where they stood.
const code = (path: string) => read(path).replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const gotur = () => css('assets/css/gotur.css');
const drawer = () => code('components/layout/Drawer/Drawer.tsx');

test('a submenu animates its real height, not a 1600px max-height', () => {
  const sheet = gotur();
  assert.equal(/max-height:\s*1600px/.test(sheet), false);
  assert.equal(/\.main-menu__list ul\.(close|open)/.test(sheet), false);
  assert.match(sheet, /\.mobile-nav__submenu \{\s*display: grid;\s*grid-template-rows: 0fr;\s*transition: grid-template-rows 250ms/);
  assert.match(sheet, /\.mobile-nav__submenu\.is-open \{\s*grid-template-rows: 1fr;\s*\}/);
  assert.match(sheet, /\.mobile-nav__submenu > ul \{\s*display: block;\s*min-height: 0;\s*overflow: hidden;\s*\}/);
});

test('the chevron and the label change in step with the submenu (250 ms)', () => {
  const sheet = gotur();
  assert.match(sheet, /transform: rotate\(-90deg\);\s*transition: transform 250ms cubic-bezier\(0\.4, 0, 0\.2, 1\),\s*background-color 250ms ease, color 250ms ease;/);
  assert.match(sheet, /height: 46px;\s*align-items: center;\s*transition: color 250ms ease, background-color 250ms ease;/);
});

test('a closed submenu takes no height: the separator line sits inside it', () => {
  const sheet = gotur();
  // No border on the list itself (it showed as a 1px strip under a closed parent).
  assert.equal(/\.mobile-nav__content \.main-menu__list ul \{\s*display: none;\s*border-top/.test(sheet), false);
  assert.match(sheet, /\.mobile-nav__submenu > ul > li:first-child \{\s*border-top: 1px solid/);
});

test('both submenu levels render the animated wrapper, inert while closed', () => {
  const source = drawer();
  assert.equal(source.split('className={`mobile-nav__submenu${isOpen ? " is-open" : ""}`}').length - 1, 1);
  assert.equal(source.split('className={`mobile-nav__submenu${isSubOpen ? " is-open" : ""}`}').length - 1, 1);
  assert.match(source, /id=\{controlsId\}\s*className=\{`mobile-nav__submenu\$\{isOpen \? " is-open" : ""\}`\}\s*inert=\{!isOpen\}\s*>\s*<ul>/);
  assert.match(source, /id=\{subControlsId\}\s*className=\{`mobile-nav__submenu\$\{isSubOpen \? " is-open" : ""\}`\}\s*inert=\{!isSubOpen\}\s*>\s*<ul>/);
  assert.equal(/className=\{`close/.test(source), false);
});

test('a third-level list belongs to its own parent, and closes with it', () => {
  const source = drawer();
  assert.match(source, /const \[isSubItems, setIsSubItems\] = useState<string \| null>\(null\);/);
  assert.match(source, /const subKey = `\$\{idx\}-\$\{sidx\}`;\s*const isSubOpen = isSubItems === subKey;/);
  assert.match(source, /toggleSubItemDropdown\(subKey\)/);
  assert.match(source, /setIsItems\(\(prevItem\) => \(prevItem === itemId \? null : itemId\)\);\s*setIsSubItems\(null\);/);
});

test('the drawer opens in one 300 ms movement and closes in one of 250 ms', () => {
  const sheet = gotur();
  assert.match(sheet, /\.mobile-nav__wrapper \{[^}]*visibility: hidden;\s*transition: visibility 0s linear 250ms;\s*\}/);
  assert.match(sheet, /\.mobile-nav__wrapper\.expanded \{\s*visibility: visible;\s*transition: visibility 0s linear 0s;\s*\}/);
  assert.match(sheet, /\.mobile-nav__overlay \{[^}]*opacity: 0;[^}]*transition: opacity 250ms ease;\s*\}/);
  assert.match(sheet, /\.mobile-nav__wrapper\.expanded \.mobile-nav__overlay \{\s*opacity: 0\.6;\s*transition-duration: 300ms;\s*\}/);
  assert.match(sheet, /\.mobile-nav__content \{[^}]*transform: translateX\(-100%\);\s*transition: transform 250ms cubic-bezier\(0\.4, 0, 1, 1\);\s*\}/);
  assert.match(sheet, /\.mobile-nav__wrapper\.expanded \.mobile-nav__content \{\s*transform: translateX\(0\);\s*transition: transform 300ms cubic-bezier\(0, 0, 0\.2, 1\);\s*\}/);
  // No stage waits for another, and the panel has no visibility of its own to wait on.
  assert.equal(/\.mobile-nav__(wrapper|content)[^{]*\{[^}]*500ms ease 500ms/.test(sheet + css('assets/css/custom.css')), false);
  assert.equal(/\.mobile-nav__content \{[^}]*visibility: hidden/.test(sheet), false);
  // The JS timings follow the stylesheet.
  assert.match(drawer(), /const OPEN_SETTLE_MS = 400;/);
  assert.match(drawer(), /const CLOSE_MS = 250;/);
});

test('reduced motion turns every drawer and submenu transition off', () => {
  const block = gotur().match(/@media \(prefers-reduced-motion: reduce\) \{\s*\.mobile-nav__wrapper,[\s\S]*?\}\s*\}/);
  assert.ok(block, 'reduced-motion block');
  for (const selector of ['.mobile-nav__overlay', '.mobile-nav__wrapper.expanded .mobile-nav__content', '.mobile-nav__submenu', '.main-menu__list__wrapper button']) {
    assert.ok(block[0].includes(selector), selector);
  }
  assert.match(block[0], /transition: none;/);
});

test('hover colours apply only to pointers that hover (touch keeps :hover on the last row tapped)', () => {
  const sheet = gotur();
  assert.equal(/\n\.mobile-nav__content \.main-menu__list > li:hover > a/.test(sheet), false);
  assert.match(sheet, /@media \(hover: hover\) \{\s*\.mobile-nav__content \.main-menu__list > li:hover > a \{/);
  const custom = css('assets/css/custom.css');
  assert.match(custom, /@media \(hover: hover\) \{\s*\.mobile-nav__content \.main-menu__list > li:hover > \.main-menu__list__wrapper > a \{/);
});

test('the chevron takes taps over 44x44 around its 30x30 square', () => {
  const custom = css('assets/css/custom.css');
  assert.match(custom, /\.main-menu__list__wrapper button \{\s*position: relative;/);
  assert.match(custom, /\.main-menu__list__wrapper button::before \{\s*content: "";\s*position: absolute;\s*inset: -7px;\s*\}/);
});

test('the first open slides in like every other: the closed state is laid out first', () => {
  const source = drawer();
  assert.match(source, /useLayoutEffect\(\(\) => \{\s*wrapperRef\.current\?\.getBoundingClientRect\(\);\s*setHasLaidOutClosed\(true\);\s*\}, \[\]\);/);
  assert.match(source, /const isExpanded = mobileDrawerStatus && hasLaidOutClosed;/);
  assert.match(source, /ref=\{wrapperRef\}\s*className=\{`mobile-nav__wrapper \$\{isExpanded \? "expanded" : ""\}`\}/);
  // inert follows the request itself, so focus handling is unchanged.
  assert.match(source, /inert=\{!mobileDrawerStatus\}/);
});

test('every open starts with the submenus collapsed, reset after the slide-out', () => {
  assert.match(drawer(), /if \(mobileDrawerStatus\) return;\s*const timer = window\.setTimeout\(\(\) => \{\s*setIsItems\(null\);\s*setIsSubItems\(null\);\s*\}, CLOSE_MS\);\s*return \(\) => window\.clearTimeout\(timer\);/);
});

test('below 1200px the drawer is fetched once the page has loaded and mounted closed, so the first tap only slides it in', () => {
  const header = code('components/layout/SiteHeader/SiteHeader.tsx');
  assert.match(header, /if \(isSticky \|\| !window\.matchMedia\("\(max-width: 1199px\)"\)\.matches\) return;/);
  // Not before the page has loaded and the browser is idle: any earlier, its
  // code competed with the page's own requests.
  assert.match(header, /if \(document\.readyState === "complete"\) whenIdle\(\);\s*else window\.addEventListener\("load", whenIdle, \{ once: true \}\);/);
  assert.match(header, /window\.requestIdleCallback\(\(\) => void loadDrawer\(\), \{ timeout: 3000 \}\)/);
  // Wider screens, and taps before that moment: the menu button's press fetches it.
  assert.match(header, /onPointerDown=\{\(\) => void loadDrawer\(\)\}/);
  assert.match(header, /void loadDrawer\(\);\s*setMobileDrawerStatus\(true\);/);
  // The import is the header's, never the layout shell's: from the layout, the
  // drawer's chunk carried its own copy of next/link and next/image (10 KB gzip).
  assert.match(header, /drawerRequest = import\("@\/components\/layout\/Drawer\/Drawer"\)\.then\(\s*\(module\) => provideDrawer\(module\.default\),/);
  const shell = code('app/(visitor)/[locale]/(home)/HomeClientShell.tsx');
  assert.equal(shell.includes('components/layout/Drawer/Drawer"'), false, 'the shell does not import the drawer');
  assert.match(shell, /const Drawer = useDrawerComponent\(\);/);
  assert.match(shell, /\{enableNonCriticalUi && Drawer \? <Drawer \/> : null\}/);
  // The hamburger is hidden from 1200px up: the same breakpoint.
  assert.match(gotur(), /@media \(min-width: 1200px\) \{\s*\.mobile-nav__btn \{\s*display: none;\s*\}\s*\}/);
});

test('navigation closes the drawer and the sheet on a change of path only, never on mount', () => {
  const observer = code('components/layout/LayoutObserver/LayoutObserver.tsx');
  assert.match(observer, /^let lastPathname: string \| null = null;$/m);
  assert.match(observer, /const changed = lastPathname !== null && lastPathname !== pathname;\s*lastPathname = pathname;\s*if \(!changed\) return;/);
  for (const action of ['setMobileDrawerStatus(false)', 'setMobileDrawerTwoStatus(false)', 'setPreferencesSheetStatus(false)']) {
    assert.ok(observer.includes(action), action);
  }
});
