import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const url = new URL('../src/components/common/Pagination/Pagination.tsx', import.meta.url);
const require = createRequire(url);
const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  fileName: fileURLToPath(url),
}).outputText;
const compiledModule = { exports: {} as { default: React.ComponentType<any> } };
new Function('require', 'module', 'exports', compiled)(
  (id: string) => id === 'react-i18next' ? { useTranslation: () => ({ t: (key: string) => key }) } : require(id),
  compiledModule, compiledModule.exports,
);
const Pagination = compiledModule.exports.default;

test('clean base pagination exposes real crawlable adjacent links', () => {
  const html = renderToStaticMarkup(React.createElement(Pagination, {
    currentPage: 2, totalPages: 3,
    hrefForPage: (page: number) => `/en/egypt-tour-packages${page === 1 ? '' : `?page=${page}`}`,
  }));
  assert.match(html, /<a href="\/en\/egypt-tour-packages"/);
  assert.match(html, /<a href="\/en\/egypt-tour-packages\?page=3"/);
  assert.match(html, /aria-current="page"/);
});

test('utility pagination retains accessible buttons without crawlable facet links', () => {
  const html = renderToStaticMarkup(React.createElement(Pagination, { currentPage: 2, totalPages: 3 }));
  assert.ok(!html.includes('<a href='));
  assert.match(html, /<button/);
  assert.match(html, /aria-current="page"/);
});
