/**
 * The accommodation icon enum exists twice — once in the client types, once in
 * the server model — because there is no shared package between them. Nothing
 * stopped the two from drifting, and drift means the admin can offer a value
 * the server's enum rejects, or a legacy value stops being drawn.
 *
 * This compares the two files directly. Run it from `client/`:
 *
 *     node scripts/checkIconParity.mjs
 *
 * Exits non-zero and names the difference when they disagree.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const CLIENT_TYPES = resolve(here, '../src/types/tour.ts');
const SERVER_MODEL = resolve(here, '../../server/src/models/Tour.ts');

const read = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    console.error(`cannot read ${path}: ${error.message}`);
    process.exit(2);
  }
};

/** Pulls the string literals out of `export const NAME = [ ... ] as const;` */
const arrayLiterals = (source, name, path) => {
  const match = source.match(
    new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`)
  );
  if (!match) {
    console.error(`FAIL  ${name} not found in ${path}`);
    process.exit(1);
  }
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
};

/** Pulls the keys out of `export const NAME = { key: 'value', ... } as const` */
const objectKeys = (source, name, path) => {
  const match = source.match(
    new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\} as const`)
  );
  if (!match) {
    console.error(`FAIL  ${name} not found in ${path}`);
    process.exit(1);
  }
  return [...match[1].matchAll(/^\s*([A-Za-z_][\w]*)\s*:/gm)].map((m) => m[1]);
};

const client = read(CLIENT_TYPES);
const server = read(SERVER_MODEL);

let failures = 0;
const compare = (label, a, b) => {
  const left = [...a].sort();
  const right = [...b].sort();
  const same = left.length === right.length && left.every((v, i) => v === right[i]);
  console.log(`${same ? 'PASS' : 'FAIL'}  ${label}`);
  if (!same) {
    failures++;
    const onlyClient = left.filter((v) => !right.includes(v));
    const onlyServer = right.filter((v) => !left.includes(v));
    if (onlyClient.length) console.log(`        only in client: ${onlyClient.join(', ')}`);
    if (onlyServer.length) console.log(`        only in server: ${onlyServer.join(', ')}`);
  } else {
    console.log(`        ${left.join(', ')}`);
  }
};

compare(
  'current icons match',
  arrayLiterals(client, 'ACCOMMODATION_ICONS', CLIENT_TYPES),
  arrayLiterals(server, 'ACCOMMODATION_ICONS', SERVER_MODEL)
);

compare(
  'legacy icons match',
  objectKeys(client, 'LEGACY_ACCOMMODATION_ICONS', CLIENT_TYPES),
  arrayLiterals(server, 'LEGACY_ACCOMMODATION_ICONS', SERVER_MODEL)
);

// Every legacy value must point at an icon that still exists.
const current = arrayLiterals(client, 'ACCOMMODATION_ICONS', CLIENT_TYPES);
const mapBody = client.match(
  /export const LEGACY_ACCOMMODATION_ICONS = \{([\s\S]*?)\} as const/
)[1];
const targets = [...mapBody.matchAll(/^\s*([A-Za-z_][\w]*)\s*:\s*['"]([^'"]+)['"]/gm)];
const dangling = targets.filter(([, , target]) => !current.includes(target));
console.log(`${dangling.length ? 'FAIL' : 'PASS'}  every legacy value maps to a drawn icon`);
if (dangling.length) {
  failures++;
  dangling.forEach(([, key, target]) => console.log(`        ${key} -> ${target} (no such icon)`));
}

console.log(failures ? `\n>>> ${failures} MISMATCH` : '\n>>> CLIENT AND SERVER AGREE');
process.exit(failures ? 1 : 0);
