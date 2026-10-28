import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * The Admin's Contact Forms page and the submissions the public forms' spam
 * trap files (`isSpam: true`, archived, never notified). Before, nothing on the
 * page told them apart from an enquiry someone archived by hand.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const page = read('../src/app/(admin)/admin/contact-forms/contact-form/page.tsx');
const css = read('../src/app/(admin)/admin-ui.css');

test('the Spam badge is shown only for submissions explicitly marked as spam', () => {
  assert.match(page, /isSpam\?: boolean;/);
  // Strictly `true`: missing or false metadata (older records, every real
  // enquiry) never gets the badge.
  const uses = [...page.matchAll(/(\w+)\.isSpam\b(.{0,9})/g)].map(([, owner, rest]) => `${owner}.isSpam${rest}`);
  assert.deepEqual(uses.map((use) => /\.isSpam === true/.test(use)), uses.map(() => true), uses.join(' | '));
  assert.match(page, /\{item\.isSpam === true && <>\{' '\}<SpamBadge \/><\/>\}/);
  assert.match(page, /\{selected\.isSpam === true && <SpamBadge \/>\}/);
  assert.match(page, /\{selected\.isSpam === true && \(\s*<p className='submission-spam-note'>/);
});

test('the badge carries a word and an icon, not a colour alone, in both themes', () => {
  const badge = page.match(/const SpamBadge[\s\S]*?\);/);
  assert.ok(badge, 'SpamBadge');
  assert.match(badge[0], /className='status-badge spam-badge'/);
  assert.match(badge[0], /<ShieldAlert size=\{12\} aria-hidden='true' \/>/);
  assert.match(badge[0], /\s+Spam\s+<\/span>/);
  assert.match(css, /\.admin-scope \.spam-badge \{[^}]*border: 1px solid #fda4af;/);
  assert.match(css, /\.dark \.admin-scope \.spam-badge \{[^}]*color: #fda4af;/);
});

test('filters, search, pagination and actions are the page\'s own, unchanged', () => {
  // The badge is display only: no new filter, query parameter or request.
  assert.equal(/isSpam/.test(page.match(/const fetchSubmissions[\s\S]*?\}, \[page, limit, statusFilter, searchTerm\]\);/)?.[0] || 'missing'), false);
  for (const value of ['all', 'new', 'replied', 'archived']) assert.match(page, new RegExp(`<option value='${value}'>`));
});

test('the statistics are enquiries only, and the page says how many spam records it left out', () => {
  assert.match(page, /useState\(\{ total: 0, new: 0, replied: 0, archived: 0, spam: 0 \}\)/);
  assert.match(page, /\{stats\.spam > 0 && \(\s*<p className='stats-spam-note'>/);
  assert.match(page, /Not counted above: \{stats\.spam\} \{stats\.spam === 1 \? 'submission' : 'submissions'\} filed as spam\. They stay in the list, marked Spam\./);
  assert.match(css, /\.admin-scope \.stats-spam-note \{/);
  assert.match(css, /\.dark \.admin-scope \.stats-spam-note \{/);
});
