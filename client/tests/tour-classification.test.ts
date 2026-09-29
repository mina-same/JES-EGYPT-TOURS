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
test('type labels come only from current IDs, never translated objects or free text', () => {
  for (const locale of ['en', 'de', 'it', 'es']) {
    for (const [id, labels] of Object.entries(catalog.catalog.types) as [string, Record<string, string>][]) {
      assert.equal(catalog.tourTypeLabel(id, locale), labels[locale]);
    }
    for (const invalid of [{ en: 'day-tour', es: 'Privado' }, { en: 'Private' }, 'Private', 'unknown', '', null, undefined]) {
      assert.equal(catalog.tourTypeLabel(invalid, locale), '');
    }
  }
});
const { validateTourForm } = loadSource('../src/lib/validations/tourValidation.ts', {
  '@/lib/tours/catalog': catalog,
});

test('shared create/edit save validation requires a current type while styles may stay empty', () => {
  for (const tourType of ['', undefined, null, 'Private', { en: 'day-tour' }, ['day-tour']]) {
    assert.ok(validateTourForm({ tourType }).some((error: any) => error.path === 'tourType'));
  }
  for (const tourType of Object.keys(catalog.catalog.types)) {
    const form = { tourType, tourStyles: [], tourKind: 'DAY_TOUR' };
    const before = JSON.stringify(form);
    assert.ok(!validateTourForm(form).some((error: any) => ['tourType', 'tourStyles'].includes(error.path)));
    assert.equal(JSON.stringify(form), before);
  }
});
const React = createRequire(import.meta.url)('react');
const hookDependencies = {
  '@/lib/api/tour': {}, '@/lib/api/upload': {}, '@/hooks/use-toast': {},
  '@/lib/tours/catalog': catalog,
};
test('draft restoration keeps only current scalar type IDs without inferring old translations', () => {
  const { createInitialTourFormData } = loadSource('../src/hooks/useTourForm.ts', hookDependencies);
  for (const tourType of [undefined, null, '', 'Private', 'unknown', { en: 'day-tour', es: 'Privado' }, ['day-tour']]) {
    const restored = createInitialTourFormData({ tourType, tourStyles: [], tourKind: 'DAY_TOUR' });
    assert.equal(restored.tourType, '');
    assert.deepEqual(restored.tourStyles, []);
    assert.equal(restored.tourKind, 'DAY_TOUR');
  }
  for (const tourType of Object.keys(catalog.catalog.types)) {
    assert.equal(createInitialTourFormData({ tourType }).tourType, tourType);
  }
});

test('form changes keep scalar type IDs for every locale and reject localized leaf changes', () => {
  let form: any;
  const { useTourForm } = loadSource('../src/hooks/useTourForm.ts', {
    ...hookDependencies,
    react: { ...React, useEffect() {}, useRef: (value: unknown) => ({ current: value }), useState(initial: any) {
      let state = typeof initial === 'function' ? initial() : initial;
      const isForm = state && typeof state === 'object' && 'tourType' in state;
      if (isForm) form = state;
      return [state, (update: any) => {
        state = typeof update === 'function' ? update(state) : update;
        if (isForm) form = state;
      }];
    } },
  });
  const hook = useTourForm({ tourType: 'day-tour', tourKind: 'DAY_TOUR', tourStyles: [] });
  for (const locale of ['en', 'de', 'it', 'es']) {
    hook.handleChange('tourType', 'multi-day', locale);
    assert.equal(form.tourType, 'multi-day');
    hook.handleChange(`tourType.${locale}`, 'day-tour');
    assert.equal(form.tourType, 'multi-day');
    assert.deepEqual(catalog.catalogOptions('types', locale).map((o: any) => o.id), Object.keys(catalog.catalog.types));
  }
  hook.handleChange('tourType', { en: 'day-tour' }, 'en');
  assert.equal(form.tourType, '');
  assert.equal(form.tourKind, 'DAY_TOUR');
  assert.deepEqual(form.tourStyles, []);
});
const Fields = loadSource('../src/components/admin/tour/TourFilterFields.tsx', {
  '@/lib/tours/catalog': catalog,
  './TourStyleSelect': () => null,
  '@/lib/api/destination': {},
  react: { ...React, useId: () => 'test', useEffect() {}, useState: (initial: unknown) => [initial, () => {}] },
}).default;
function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const complete = { tourType: 'day-tour', tourStyles: [], destinations: ['saved-id'], durationHours: 8, recommendedOrder: 3 };
test('classification loads values, type is single-select, advanced collapsed and no hours input', () => {
  const changes: any[] = [];
  const tree = nodes(Fields({ value: complete, onChange: (...change: unknown[]) => changes.push(change) }));
  const radios = tree.filter(n => n.type === 'input' && n.props.type === 'radio');
  assert.equal(radios.length, 4);
  assert.equal(radios.filter(n => n.props.checked).length, 1);
  radios.find(n => n.props.value === 'multi-day').props.onChange();
  assert.deepEqual(changes.pop(), ['tourType', 'multi-day']);
  assert.equal(tree.find(n => n.type === 'details').props.open, undefined);
  const numbers = tree.filter(n => n.type === 'input' && n.props.type === 'number');
  assert.equal(numbers.length, 1);
  assert.equal(numbers[0].props.value, 3);
  numbers[0].props.onChange({ target: { value: '7' } });
  assert.deepEqual(changes.pop(), ['recommendedOrder', 7]);
  numbers[0].props.onChange({ target: { value: '' } });
  assert.deepEqual(changes.pop(), ['recommendedOrder', null]);
  assert.ok(!tree.some(n => n.props?.role === 'status'));
  const places = tree.find(n => n.props?.isMulti);
  assert.equal(places.props.isSearchable, true);
  assert.equal(places.props.value[0].value, 'saved-id');
  places.props.onChange([{ value: 'new-id' }, { value: 'second-id' }]);
  assert.deepEqual(changes.pop(), ['destinations', ['new-id', 'second-id']]);
  places.props.onChange([]);
  assert.deepEqual(changes.pop(), ['destinations', []]);
});
test('missing fields are specific and never include optional styles or ordering', () => {
  const tree = nodes(Fields({ value: {}, onChange() {} }));
  assert.deepEqual(tree.filter(n => n.type === 'li').map(n => n.props.children), ['Tour Type', 'Places Visited', 'Duration (in Tour Details)']);
});
const duration = loadSource('../src/lib/tours/duration.ts');
test('opening an existing tour fills only missing reliable metadata and preserves saved hours', () => {
  const Stub = () => null;
  const Overview = loadSource('../src/components/admin/tour/OverviewTab.tsx', {
    './TourFilterFields': Stub, './DurationSelect': Stub,
    react: { ...React, useEffect: (run: () => void) => run() },
    '@/lib/tours/duration': duration,
    '@/components/ui/card': { Card: Stub, CardContent: Stub, CardHeader: Stub, CardTitle: Stub, CardDescription: Stub },
    '@/components/ui/label': { Label: Stub }, '@/components/ui/input': { Input: Stub },
    '../LocalizedRichText': Stub, '@/components/admin/SubcategorySelect': Stub,
    '@/components/admin/LocalizedInput': Stub, '@/components/admin/LocalizedTagsInput': Stub,
    '@/lib/utils': { cn: (...parts: unknown[]) => parts.filter(Boolean).join(' ') },
  }).default;
  const labels = duration.DURATION_OPTIONS.find((o: any) => o.id === 'd8').labels;
  for (const [display, hours, expected] of [
    [labels, undefined, [['durationHours', 192]]],
    [labels, 192, []], [labels, 200, []],
    [{ en: 'Full Day Tour', es: '4 Horas' }, undefined, []],
  ] as any[]) {
    const changes: unknown[] = [];
    Overview({ formData: { duration: display, durationHours: hours }, subcategories: [], activeLanguage: 'en', handleChange: (...args: unknown[]) => changes.push(args) });
    assert.deepEqual(changes, expected);
  }
});
test('duration metadata preserves hour precision and days without parsing at query time', () => {
  for (const [id, hours] of [['h6', 6], ['h8', 8], ['h12', 12], ['d1', 24], ['d2', 48], ['d8', 192]]) {
    const option = duration.DURATION_OPTIONS.find((o: any) => o.id === id);
    assert.equal(option.hours, hours);
    assert.equal(duration.findDurationOption(option.labels).id, id);
  }
  assert.equal(duration.findDurationOption({ en: 'Full Day Tour', es: '4 Horas' }), undefined);
  assert.equal(duration.findDurationOption({ en: '8 Hours', de: '6 Stunden' }), undefined);
});

test('DurationSelect emits synchronized labels and hours and preserves custom values until changed', () => {
  const Duration = loadSource('../src/components/admin/tour/DurationSelect.tsx', {
    '@/lib/tours/duration': duration,
    '@/lib/utils': { cn: (...parts: unknown[]) => parts.filter(Boolean).join(' ') },
  }).default;
  let saved: any;
  const tree = nodes(Duration({ value: duration.DURATION_OPTIONS.find((o: any) => o.id === 'h8').labels, onChange: (...values: unknown[]) => { saved = values; } }));
  const picker = tree.find(n => n.props?.instanceId === 'tour-duration');
  for (const id of ['h6', 'h8', 'h12', 'd1', 'd2', 'd8']) {
    const option = duration.DURATION_OPTIONS.find((o: any) => o.id === id);
    const choice = picker.props.options.flatMap((group: any) => group.options).find((o: any) => o.value === id);
    picker.props.onChange(choice);
    assert.deepEqual(saved, [option.labels, option.hours]);
  }
  saved = undefined;
  picker.props.onChange({ isCustom: true });
  assert.equal(saved, undefined);
  picker.props.onChange(null);
  assert.deepEqual(saved, [duration.EMPTY_DURATION, null]);
});
