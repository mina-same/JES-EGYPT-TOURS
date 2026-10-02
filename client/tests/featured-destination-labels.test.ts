import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as labels from '../src/lib/admin/featuredDestinations';

const {
  destinationLabel,
  describeFeaturedDestination,
  LOADING_DESTINATION_LABEL,
  UNAVAILABLE_DESTINATION_LABEL,
} = labels;

/*
 * Featured destinations in the four category/subcategory editors: a draft is
 * labelled "(Draft)" in text, and a saved reference is shown by name, never as
 * its database id, whether the destination is known yet or not.
 */

const name = (en: string) => ({ en, de: `${en} DE`, it: `${en} IT`, es: `${en} ES` });
const cairo = { _id: '69ebf691cd694ad9019c780e', name: name('Cairo'), status: 'published' };
const abuSimbel = { _id: '6abb7dd4eebd0cc00bb64c9a', name: name('Abu Simbel'), status: 'draft' };
const giza = { _id: '69ebf691cd694ad9019c7811', name: name('Visit Giza: Complete Travel Guide'), status: 'published' };
const isRawId = (label: string) => /[a-f0-9]{24}/.test(label);

test('a published destination keeps its name; a draft says "(Draft)"', () => {
  assert.equal(destinationLabel(cairo), 'Cairo');
  assert.equal(destinationLabel(giza), 'Visit Giza: Complete Travel Guide');
  assert.equal(destinationLabel(abuSimbel), 'Abu Simbel (Draft)');
  // The Admin's list read is localized: the name may already be a string.
  assert.equal(destinationLabel({ _id: 'x', name: 'Abu Simbel', status: 'draft' }), 'Abu Simbel (Draft)');
  // A destination stored before statuses existed is treated as it always was.
  assert.equal(destinationLabel({ _id: 'x', name: name('Luxor') }), 'Luxor');
  // No English name: the project's localized fallback, another language.
  assert.equal(destinationLabel({ _id: 'x', name: { de: 'Assuan' }, status: 'draft' }), 'Assuan (Draft)');
  assert.equal(destinationLabel({ _id: 'x', status: 'draft' }), 'Untitled (Draft)');
});

test('a saved reference is shown by name, and never by its id, in every state', () => {
  const known = [abuSimbel];
  const list = [cairo, abuSimbel, giza];

  // Already at hand (the record's populated references): named at once.
  assert.deepEqual(describeFeaturedDestination(abuSimbel._id, known, null), { label: 'Abu Simbel (Draft)', destination: abuSimbel, state: 'resolved' });
  // Not at hand yet: a neutral loading label until the Admin list arrives...
  assert.deepEqual(describeFeaturedDestination(cairo._id, known, null), { label: LOADING_DESTINATION_LABEL, state: 'loading' });
  // ...then its name from that list.
  assert.equal(describeFeaturedDestination(cairo._id, known, list).label, 'Cairo');
  // Matches nothing (deleted, or the list failed to load): a plain fallback.
  const deleted = '0123456789abcdef01234567';
  assert.deepEqual(describeFeaturedDestination(deleted, known, list), { label: UNAVAILABLE_DESTINATION_LABEL, state: 'unavailable' });
  assert.deepEqual(describeFeaturedDestination(deleted, known, []), { label: UNAVAILABLE_DESTINATION_LABEL, state: 'unavailable' });

  for (const loaded of [null, [], list]) {
    for (const id of [cairo._id, abuSimbel._id, giza._id, deleted]) {
      const { label } = describeFeaturedDestination(id, [], loaded);
      assert.ok(!isRawId(label) && !label.includes(id), `${id} with ${loaded ? loaded.length : 'no'} list: "${label}"`);
    }
  }
});

test('publishing or unpublishing changes the label only, never the saved ids', () => {
  const saved = Object.freeze([cairo._id, abuSimbel._id]);
  const labelsWith = (cairoStatus: string) => saved.map((id) =>
    describeFeaturedDestination(id, [], [{ ...cairo, status: cairoStatus }, abuSimbel]).label);
  assert.deepEqual(labelsWith('published'), ['Cairo', 'Abu Simbel (Draft)']);
  assert.deepEqual(labelsWith('draft'), ['Cairo (Draft)', 'Abu Simbel (Draft)']);
  assert.deepEqual(labelsWith('published'), ['Cairo', 'Abu Simbel (Draft)']);
  assert.deepEqual(saved, [cairo._id, abuSimbel._id], 'the ids the editor saves are untouched');
});

// Compile the real hook, as the app does, with the Admin API stubbed.
function loadSource(relative: string, overrides: Record<string, unknown>) {
  const url = new URL(relative, import.meta.url);
  const require = createRequire(url);
  const compiledModule = { exports: {} as any };
  const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: fileURLToPath(url),
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(
    (id: string) => overrides[id] ?? require(id), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

test('the first render, before the Admin list arrives, already shows names or a loading label, never an id', () => {
  const requests: unknown[] = [];
  const { useFeaturedDestinationLookup } = loadSource('../src/hooks/useFeaturedDestinations.ts', {
    '@/lib/admin/featuredDestinations': labels,
    '@/lib/api/blogAdmin': { destinationAPI: { getAll: async (params: unknown) => { requests.push(params); return { data: [], totalPages: 1 }; } } },
  });
  function Chips({ ids, known }: { ids: string[]; known: typeof abuSimbel[] }) {
    const describe = useFeaturedDestinationLookup(known);
    return createElement('ul', null, ids.map((id) => createElement('li', { key: id }, describe(id).label)));
  }
  const html = renderToStaticMarkup(createElement(Chips, { ids: [abuSimbel._id, cairo._id], known: [abuSimbel] }));
  assert.equal(html, `<ul><li>Abu Simbel (Draft)</li><li>${LOADING_DESTINATION_LABEL}</li></ul>`);
  assert.ok(!isRawId(html));
  assert.equal(requests.length, 0, 'the list is requested by the effect, after mount, not during render');
});

test('all four editors label drafts and resolve saved references through the shared helpers', () => {
  const editors = [
    'blogs/category/new/page.tsx',
    'blogs/subcategory/new/page.tsx',
    'tour/category/new/page.tsx',
    'tour/subcategory/new/page.tsx',
  ];
  for (const editor of editors) {
    const source = readFileSync(new URL(`../src/app/(admin)/admin/${editor}`, import.meta.url), 'utf8');
    assert.match(source, /useFeaturedDestinationLookup\(selectedDestObjects\)/, `${editor}: resolves saved ids`);
    assert.match(source, /const title = destinationLabel\(dest\);/, `${editor}: search options use the shared label`);
    assert.match(source, /describeFeaturedDestination\(destId\)/, `${editor}: chips are drawn from the saved ids`);
    // The old fallbacks: a raw id as the chip label, and an unlabelled option.
    assert.doesNotMatch(source, /: destId;/, `${editor}: no raw id fallback`);
    assert.doesNotMatch(source, /dest\.name\?\.en \|\| dest\.name \|\| 'Untitled'/, `${editor}: no unlabelled options`);
  }
  // The lookup reads the Admin's authenticated list, which includes drafts.
  const hook = readFileSync(new URL('../src/hooks/useFeaturedDestinations.ts', import.meta.url), 'utf8');
  assert.match(hook, /import \{ destinationAPI \} from '@\/lib\/api\/blogAdmin';/);
});
