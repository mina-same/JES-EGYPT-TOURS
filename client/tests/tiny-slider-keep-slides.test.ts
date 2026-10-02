import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const url = new URL('../src/components/common/TinySliderWrapper.tsx', import.meta.url);
const require = createRequire(url);
const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  fileName: fileURLToPath(url),
}).outputText;
const compiledModule = { exports: {} as { TinySliderWrapper: React.ComponentType<any> } };
new Function('require', 'module', 'exports', compiled)(require, compiledModule, compiledModule.exports);
const { TinySliderWrapper } = compiledModule.exports;

const slides = ['a', 'b', 'c'].map((id) => React.createElement('div', { key: id, className: 'item' }, id));
const render = (props: Record<string, unknown>) => renderToStaticMarkup(
  React.createElement(TinySliderWrapper, { settings: { items: 1, loop: false }, ...props }, slides),
);

// The kept-slides runtime is what hydrates the server HTML and what the
// visitor sees until tiny-slider runs, so it must be the placeholder exactly.
test('kept slides render the same markup as the placeholder before activation', () => {
  const props = { placeholderClassName: 'feature-package__carousel tns-placeholder-single' };
  assert.equal(render({ ...props, keepSlidesOnInit: true }), render(props));
  assert.equal(
    render({ ...props, keepSlidesOnInit: true }),
    '<div class="tiny-slider-host" data-tiny-slider-host=""><div class="feature-package__carousel tns-placeholder-single">'
      + '<div class="item">a</div><div class="item">b</div><div class="item">c</div></div></div>',
  );
});

test('placeholder style and the class fallbacks carry over unchanged', () => {
  for (const props of [
    { placeholderClassName: 'p', placeholderStyle: { minHeight: 10 }, className: 'live', style: { gap: 4 } },
    { className: 'live' },
    {},
  ]) {
    assert.equal(render({ ...props, keepSlidesOnInit: true }), render(props));
  }
});
