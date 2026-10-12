import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const url = new URL('../src/components/common/RichHtml/RichHtml.tsx', import.meta.url);
const require = createRequire(url);
const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: fileURLToPath(url),
}).outputText;
const compiledModule = { exports: {} as { default: any } };
new Function('require', 'module', 'exports', compiled)(require, compiledModule, compiledModule.exports);
const RichHtml = compiledModule.exports.default;

/* Copy as an editor writes it: a link, an entity, a list, inline emphasis. */
const CMS_HTML =
  '<p>Visit <a href="/en/cairo">Cairo</a> &amp; Giza, <strong>early</strong>.</p><ul><li>Guide</li><li>Lunch</li></ul>';

const inline = (tag: string, props: Record<string, unknown>, html: string) =>
  renderToStaticMarkup(React.createElement(tag, { ...props, dangerouslySetInnerHTML: { __html: html } }));

test('renders the same element as the inline dangerouslySetInnerHTML form', () => {
  const style = { color: '#595959', fontSize: '1rem', lineHeight: '1.8' };
  const cases: Array<[string | undefined, Record<string, unknown>]> = [
    [undefined, { className: 'tour-listing-details__text html-content', style }],
    [undefined, { className: 'html-content tour-plan__text' }],
    ['span', { className: 'text-dark fw-medium html-content tour-highlight__text' }],
    ['li', { className: 'tour-pack__item html-content' }],
    [undefined, {}],
  ];
  for (const [as, props] of cases) {
    assert.equal(
      renderToStaticMarkup(React.createElement(RichHtml, { ...props, as, html: CMS_HTML })),
      inline(as ?? 'div', props, CMS_HTML),
    );
  }
});

test('the markup is passed through untouched', () => {
  const html = renderToStaticMarkup(React.createElement(RichHtml, { html: CMS_HTML }));
  assert.equal(html, `<div>${CMS_HTML}</div>`);
  assert.equal(renderToStaticMarkup(React.createElement(RichHtml, { html: '' })), '<div></div>');
});

test('is memoised with the default comparison, so only its props decide a re-render', () => {
  assert.equal(RichHtml.$$typeof, Symbol.for('react.memo'));
  assert.equal(RichHtml.compare, null);
});

/* React rewrites innerHTML whenever the dangerouslySetInnerHTML object is a new
   one. These three files render the tour page's CMS copy and re-render while
   the page scrolls, so the object has to stay behind RichHtml's memo. An inline
   style object would defeat that memo just as an inline __html object did. */
test('the tour view, the itinerary and the question list set HTML only through RichHtml', () => {
  for (const file of [
    '../src/components/sections/TourListingDetailsOne/TourListingDetailsOne.tsx',
    '../src/components/sections/TourListingDetailsOne/components/TourPlan.tsx',
    '../src/components/common/Faq/FaqAccordion.tsx',
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.ok(!source.includes('dangerouslySetInnerHTML'), `${file} sets innerHTML inline`);
    assert.match(source, /<RichHtml\b/);
    assert.doesNotMatch(source, /<RichHtml\b[^>]*style=\{\{/, `${file} passes RichHtml an inline style object`);
  }
});
