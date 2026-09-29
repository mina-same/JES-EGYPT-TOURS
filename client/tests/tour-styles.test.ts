import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Compile the actual JSX control without introducing a UI testing dependency.
function loadSource(relative: string, overrides: Record<string, unknown> = {}) {
  const url = new URL(relative, import.meta.url);
  const require = createRequire(url);
  const compiledModule = { exports: {} as any };
  const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: fileURLToPath(url),
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(
    (name: string) => overrides[name] ?? require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const catalog = loadSource('../src/lib/tours/catalog.ts');
test('exactly the five approved style IDs have the requested labels in all four languages', () => {
  const ids = ['classic', 'luxury', 'family', 'honeymoon', 'accessible'];
  assert.deepEqual(Object.keys(catalog.catalog.styles), ids);
  const expected = {
    en: ['Classic', 'Luxury', 'Family', 'Honeymoon', 'Accessible'],
    de: ['Klassisch', 'Luxus', 'Familie', 'Flitterwochen', 'Barrierefrei'],
    it: ['Classico', 'Lusso', 'Famiglia', 'Luna di miele', 'Accessibile'],
    es: ['Clásico', 'Lujo', 'Familiar', 'Luna de miel', 'Accesible'],
  };
  for (const [locale, labels] of Object.entries(expected)) {
    assert.deepEqual(catalog.catalogOptions('styles', locale), ids.map((id, index) => ({ id, label: labels[index] })));
    assert.deepEqual(catalog.tourStyleLabels(ids, locale), labels);
  }
});
const Select = loadSource('../src/components/admin/tour/TourStyleSelect.tsx', {
  '@/lib/tours/catalog': catalog,
}).default;
function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

test('Admin loads selections and adds/removes styles without mutating loaded data', () => {
  const original = ['luxury', 'honeymoon'];
  let value = [...original];
  const render = () => Select({ value, onChange: (next: string[]) => { value = next; } });
  let buttons = nodes(render()).filter(node => node.type === 'button');
  assert.equal(buttons.length, Object.keys(catalog.catalog.styles).length);
  assert.equal(buttons.filter(b => b.props['aria-pressed']).length, 2);
  assert.ok(buttons.every(b => b.props.type === 'button'));
  buttons.find(b => b.props.children[0] === 'Family').props.onClick();
  assert.deepEqual(value, ['luxury', 'honeymoon', 'family']);
  buttons = nodes(render()).filter(node => node.type === 'button');
  buttons.find(b => b.props.children[0] === 'Luxury').props.onClick();
  assert.deepEqual(value, ['honeymoon', 'family']);
  assert.deepEqual(original, ['luxury', 'honeymoon']);
});

test('empty Admin styles remain optional with no warning, free text or language tabs', () => {
  const tree = nodes(Select({ onChange() {} }));
  assert.ok(!tree.some(n => n.props?.role === 'status'));
  assert.ok(!tree.some(n => n.type === 'input' || n.props?.role === 'tab'));
  assert.ok(tree.filter(n => n.type === 'button').every(n => !n.props['aria-pressed']));
});

test('visitor labels use the shared catalog in all languages without modifying stored IDs', () => {
  const value = ['luxury', 'honeymoon'];
  for (const [locale, expected] of Object.entries({ en: 'Luxury', de: 'Luxus', it: 'Lusso', es: 'Lujo' })) {
    const labels = catalog.tourStyleLabels(value, locale);
    assert.equal(labels[0], expected);
    assert.equal(labels.length, 2);
    assert.ok(labels.every((label: string) => !value.includes(label)));
  }
  assert.deepEqual(value, ['luxury', 'honeymoon']);
  assert.deepEqual(catalog.tourStyleLabels(['unknown-id']), []);
  assert.deepEqual(catalog.tourStyleLabels({ en: 'Luxury' }), []);
  assert.deepEqual(catalog.tourStyleLabels(undefined), []);
  assert.deepEqual(catalog.tourStyleLabels([]), []);
});
