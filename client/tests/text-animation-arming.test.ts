import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const url = new URL('../src/components/common/AnimatedText/TextAnimation.tsx', import.meta.url);
const require = createRequire(url);
const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  fileName: fileURLToPath(url),
}).outputText;
const load = (resolve: (id: string) => unknown) => {
  const compiledModule = { exports: {} as { default: React.ComponentType<any> } };
  new Function('require', 'module', 'exports', compiled)(resolve, compiledModule, compiledModule.exports);
  return compiledModule.exports.default;
};

test('server markup carries the words and no reveal state', () => {
  const TextAnimation = load(require);
  assert.equal(
    renderToStaticMarkup(React.createElement(TextAnimation, { text: 'More Tours', animationType: 'left', semantic: true })),
    '<span class="text-animation" data-anim="left" style="display:inline"><span style="--word-index:0">More </span><span style="--word-index:1">Tours</span></span>',
  );
  assert.equal(
    renderToStaticMarkup(React.createElement(TextAnimation, { text: 'Got Questions?', animationType: 'right' })),
    '<div class="text-animation" data-anim="right"><span style="--word-index:0">Got</span><span style="--word-index:1">Questions?</span></div>',
  );
});

/**
 * Runs the component's effect the way React does for headings mounted in one
 * pass: every effect in order, in one synchronous stack. `log` records each
 * measurement and each write as it happens.
 */
const mount = (tops: number[], { reducedMotion = false, innerHeight = 800 } = {}) => {
  const log: string[] = [];
  const observers: { cb: (entries: { isIntersecting: boolean }[]) => void; node: number }[] = [];
  const nodes = tops.map((top, id) => ({
    dataset: new Proxy({} as Record<string, string>, {
      set(target, key, value) { target[String(key)] = value; log.push(`write:${id}:${value}`); return true; },
    }),
    getBoundingClientRect() { log.push(`read:${id}`); return { top }; },
  }));
  const effects: (() => void | (() => void))[] = [];
  let next = 0;
  const TextAnimation = load((id) => {
    if (id === 'react') return { useMemo: (factory: () => unknown) => factory(), useRef: () => ({ current: nodes[next++] }), useEffect: (effect: () => void | (() => void)) => { effects.push(effect); } };
    if (id === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
    return require(id);
  }) as unknown as (props: { text: string; animationType: string }) => unknown;
  const saved = { window: (globalThis as any).window, IntersectionObserver: (globalThis as any).IntersectionObserver };
  (globalThis as any).window = { innerHeight, matchMedia: () => ({ matches: reducedMotion }) };
  (globalThis as any).IntersectionObserver = class {
    private entry: { cb: (entries: { isIntersecting: boolean }[]) => void; node: number };
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) { this.entry = { cb, node: -1 }; }
    observe(node: unknown) { this.entry.node = nodes.indexOf(node as (typeof nodes)[number]); observers.push(this.entry); log.push(`observe:${this.entry.node}`); }
    disconnect() { log.push(`disconnect:${this.entry.node}`); }
  };
  tops.forEach(() => TextAnimation({ text: 'A heading', animationType: 'left' }));
  const cleanups = effects.map((effect) => effect());
  const restore = () => { (globalThis as any).window = saved.window; (globalThis as any).IntersectionObserver = saved.IntersectionObserver; };
  return { log, observers, cleanups, restore };
};
const microtasks = () => new Promise<void>((resolve) => queueMicrotask(resolve));

test('headings mounted together all measure before any of them is armed', async () => {
  const { log, restore } = mount([2000, 2100, 3000]);
  try {
    // One synchronous pass of effects: three measurements, nothing written yet,
    // so no heading's arming can dirty the page under the next one's read.
    assert.deepEqual(log, ['read:0', 'read:1', 'read:2']);
    await microtasks();
    assert.deepEqual(log.slice(3), ['write:0:pending', 'observe:0', 'write:1:pending', 'observe:1', 'write:2:pending', 'observe:2']);
  } finally { restore(); }
});

test('a heading at or above the fold is measured and then left alone', async () => {
  const { log, restore } = mount([100, 799, 800]);
  try {
    await microtasks();
    assert.deepEqual(log, ['read:0', 'read:1', 'read:2', 'write:2:pending', 'observe:2']);
  } finally { restore(); }
});

test('unmounting before the arming runs cancels it; afterwards it disconnects', async () => {
  const early = mount([2000]);
  try {
    (early.cleanups[0] as () => void)();
    await microtasks();
    assert.deepEqual(early.log, ['read:0']);
  } finally { early.restore(); }
  const late = mount([2000]);
  try {
    await microtasks();
    (late.cleanups[0] as () => void)();
    assert.deepEqual(late.log, ['read:0', 'write:0:pending', 'observe:0', 'disconnect:0']);
  } finally { late.restore(); }
});

test('reaching the viewport reveals once; reduced motion never measures or arms', async () => {
  const { log, observers, restore } = mount([2000]);
  try {
    await microtasks();
    observers[0].cb([{ isIntersecting: false }]);
    observers[0].cb([{ isIntersecting: true }]);
    assert.deepEqual(log.slice(3), ['write:0:in', 'disconnect:0']);
  } finally { restore(); }
  const reduced = mount([2000], { reducedMotion: true });
  try {
    await microtasks();
    assert.deepEqual(reduced.log, []);
  } finally { reduced.restore(); }
});
