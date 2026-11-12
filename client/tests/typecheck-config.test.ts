import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * `npm run typecheck`. tsconfig.json (the editor's and Next's) includes both
 * .next/types and .next/dev/types; only `next dev` rewrites the latter, so
 * after a route is removed while the dev server is stopped it still validates
 * the deleted pages. The check regenerates .next/types and leaves the dev copy
 * out, as `next build` means to (its filter misses Windows paths).
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const json = (path: string) => JSON.parse(read(path).replace(/^\s*\/\/.*$/gm, ''));

test('the type check regenerates the route types, then checks without the dev server\'s copy', () => {
  assert.equal(json('../package.json').scripts.typecheck, 'next typegen && tsc --noEmit -p tsconfig.typecheck.json');
  const check = json('../tsconfig.typecheck.json');
  assert.equal(check.extends, './tsconfig.json');
  assert.ok(check.include.includes('.next/types/**/*.ts'), 'route types from next typegen');
  assert.equal(check.include.some((entry: string) => entry.includes('.next/dev')), false, 'no dev types');
  for (const entry of ['next-env.d.ts', '**/*.ts', '**/*.tsx', 'types/**/*']) assert.ok(check.include.includes(entry), entry);
  // The editor and Next keep their own configuration, dev types included.
  assert.ok(json('../tsconfig.json').include.includes('.next/dev/types/**/*.ts'));
});
