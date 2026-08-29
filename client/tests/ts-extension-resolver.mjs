// Node's built-in TypeScript stripping runs the real ESM resolver, which — unlike
// webpack/tsc — will not guess a missing file extension or the `@/` alias. Rather
// than write `../src/lib/thing.ts` in tests (and forbid every library under test
// from importing its own neighbours the normal way), this hook fills in what the
// bundler would have.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE_ROOT = new URL('../src/', import.meta.url);
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.mjs', '.cjs'];

function firstExistingUrl(base) {
  for (const suffix of [...EXTENSIONS, ...EXTENSIONS.map((ext) => `/index${ext}`)]) {
    const candidate = new URL(base.href + suffix);
    if (existsSync(fileURLToPath(candidate))) return candidate.href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const aliased = specifier.startsWith('@/')
    ? new URL(specifier.slice(2), SOURCE_ROOT).href
    : specifier;

  try {
    return await nextResolve(aliased, context);
  } catch (error) {
    const parentURL = context.parentURL;
    if (!parentURL && !aliased.startsWith('file:')) throw error;
    if (!aliased.startsWith('file:') && !aliased.startsWith('.')) throw error;

    const resolved = firstExistingUrl(new URL(aliased, parentURL));
    if (!resolved) throw error;
    return nextResolve(resolved, context);
  }
}
