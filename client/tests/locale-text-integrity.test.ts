import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';

/*
 * Translation files must not carry text damaged on its way in.
 *
 * Three tailor-made messages arrived with every accented letter replaced by
 * "?" — "W?hlen Sie … zuk?nftige Daten", "all?inizio", "m?ximo … m?nimo" —
 * and German, Italian and Spanish visitors read them like that. A "?" (or the
 * replacement character U+FFFD) between two letters is never a word, and
 * "Ã©" or "â€" is what UTF-8 looks like after being read as Latin-1.
 */

const root = new URL('../src/i18n/locales/', import.meta.url);

test('no translation has a letter replaced by "?" or garbled by a wrong encoding', () => {
  const damaged: string[] = [];
  let files = 0;
  for (const locale of readdirSync(root)) {
    for (const file of readdirSync(new URL(`${locale}/`, root)).filter((name) => name.endsWith('.json'))) {
      files++;
      const text = readFileSync(new URL(`${locale}/${file}`, root), 'utf8');
      text.split(/\r?\n/).forEach((line, index) => {
        if (/\p{L}[?\uFFFD]\p{L}/u.test(line) || line.includes('\uFFFD') || /\u00C3[\u0080-\u00BF]|\u00E2\u20AC/.test(line)) {
          damaged.push(`${locale}/${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
  assert.ok(files >= 40, `read ${files} files`);
  assert.deepEqual(damaged, []);
});
