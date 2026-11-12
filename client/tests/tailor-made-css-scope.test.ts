import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * tailorMade.css is a global stylesheet, and once a visitor has opened the
 * tailor-made page it stays in the document through client-side navigation.
 * Its generic class names used to restyle other pages: the tour booking form's
 * traveller counters (.counter-controls / .counter-btn / .counter-value), the
 * listing filters' and search page's .form-label, the search page's
 * .form-select. Every rule must therefore name something only this page has.
 */

const css = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/tailor-made/tailorMade.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/** Every style rule's selectors, with the at-rules around it. */
function styleRules(source: string) {
  const rules: { selectors: string[]; context: string[]; body: string }[] = [];
  const stack: string[] = [];
  let start = 0;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '{') {
      const prelude = source.slice(start, i).trim();
      if (prelude.startsWith('@')) {
        stack.push(prelude);
      } else {
        const close = source.indexOf('}', i);
        rules.push({ selectors: prelude.split(',').map((s) => s.trim()), context: [...stack], body: source.slice(i + 1, close) });
        i = close;
      }
      start = i + 1;
    } else if (source[i] === '}') {
      stack.pop();
      start = i + 1;
    }
  }
  return rules;
}

const rules = styleRules(css);
const PAGE_ONLY = /^(\.tailor-made-section(\s|$|[:.])|\.tailor-made-[\w-]+|\.tm-phone[\w-]*)/;

test('every rule is scoped to the tailor-made page', () => {
  const styleRulesOnly = rules.filter((rule) => !rule.context.some((at) => at.startsWith('@keyframes')));
  assert.ok(styleRulesOnly.length > 90, `found ${styleRulesOnly.length} rules`);
  const unscoped = styleRulesOnly.flatMap((rule) => rule.selectors).filter((selector) => !PAGE_ONLY.test(selector));
  assert.deepEqual(unscoped, []);
  // The class names that leaked are still styled, but only inside the page.
  for (const name of ['form-label', 'form-select', 'counter-btn', 'counter-controls', 'counter-value', 'spinner', 'form-group', 'required']) {
    const selectors = styleRulesOnly.flatMap((rule) => rule.selectors).filter((selector) => new RegExp(`\\.${name}(?![\\w-])`).test(selector));
    assert.ok(selectors.length > 0, `${name} is still styled`);
    for (const selector of selectors) assert.match(selector, /^\.tailor-made-(section|form) |^\.tm-phone/, selector);
  }
});

test('the spinner animation has a name of its own (custom.css also defines `spin`)', () => {
  assert.equal(/@keyframes\s+spin\b/.test(css), false);
  assert.match(css, /@keyframes tailor-made-spin \{/);
  assert.match(css, /\.tailor-made-section \.spinner \{\s*animation: tailor-made-spin 1s linear infinite;/);
});

test('below 1200px the form takes the full width and the sidebar follows it', () => {
  // The 380px sidebar column exists only from 1200px up.
  const twoColumn = rules.filter((rule) => /grid-template-columns:\s*1fr 380px/.test(rule.body));
  assert.equal(twoColumn.length, 1);
  assert.deepEqual(twoColumn[0].context, []);
  assert.deepEqual(twoColumn[0].selectors, ['.tailor-made-content-wrapper']);

  const below1200 = rules.filter((rule) => rule.context.join(' ') === '@media (max-width: 1199.98px)');
  const wrapper = below1200.find((rule) => rule.selectors.includes('.tailor-made-content-wrapper'));
  // minmax(0, …): one column that never outgrows the container (the stacked
  // sidebar's e-mail address widened it by 8.8px at 360px with a plain 1fr).
  assert.ok(wrapper && /grid-template-columns:\s*minmax\(0, 1fr\);/.test(wrapper.body));
  const sidebar = below1200.find((rule) => rule.selectors.includes('.tailor-made-sidebar'));
  assert.ok(sidebar, 'sidebar rule');
  assert.match(sidebar.body, /position:\s*static;/);
  assert.match(sidebar.body, /max-height:\s*none;/);
  assert.match(sidebar.body, /overflow-y:\s*visible;/);

  // Tablets: two columns for the sidebar's cards and for the four feature cards.
  const tablet = rules.filter((rule) => rule.context.join(' ') === '@media (min-width: 769px) and (max-width: 1199.98px)');
  for (const selector of ['.tailor-made-features', '.tailor-made-sidebar']) {
    const rule = tablet.find((r) => r.selectors.includes(selector));
    assert.ok(rule && /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/.test(rule.body), selector);
  }
  // These rules come after the sidebar's own rule, which would otherwise win.
  const order = (predicate: (rule: (typeof rules)[number]) => boolean) => rules.findIndex(predicate);
  const base = order((rule) => rule.context.length === 0 && rule.selectors.includes('.tailor-made-sidebar'));
  assert.ok(base >= 0);
  assert.ok(order((rule) => rule === sidebar) > base);
  assert.ok(order((rule) => tablet.includes(rule) && rule.selectors.includes('.tailor-made-sidebar')) > base);
});
