import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * The Admin's separators read "?" — "Automatic refresh ? Updated",
 * "Analytics ? last 14 days" — because the files were saved by a tool that
 * replaced every non-ASCII character with "?" (the same commit brought the
 * "W?hlen" / "m?ximo" strings into the tailor-made translations). The dot is
 * the Admin's own separator ("Blog category · read-only").
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const FILES = {
  dashboard: '../src/app/(admin)/admin/page.tsx',
  notifications: '../src/components/admin/AdminNotificationControls.tsx',
  imagePreview: '../src/components/admin/ImagePreview.tsx',
} as const;

test('no "?" stands between two pieces of text any more', () => {
  for (const [name, path] of Object.entries(FILES)) {
    const source = read(path);
    assert.equal(/\} \? \{/.test(source), false, `${name}: "} ? {"`);
    assert.equal(/>[^<>{}]*\w \? \w[^<>{}]*</.test(source), false, `${name}: text " ? "`);
    assert.equal(source.includes('�'), false, `${name}: replacement character`);
  }
});

test('the dot separates them, as elsewhere in the Admin', () => {
  const dashboard = read(FILES.dashboard);
  assert.match(dashboard, /'Automatic refresh'\} · \{data \?/);
  assert.match(dashboard, /<CardTitle>Analytics · last 14 days \(Egypt time\)<\/CardTitle>/);
  assert.match(dashboard, /<h3>Bookings · Total: /);
  assert.match(dashboard, /<h3>Contact \+ tailor-made · Total: /);
  assert.match(read(FILES.notifications), /'Notifications: auto refresh'\} · \{sound\.enabled/);
  assert.match(read(FILES.imagePreview), /'Full image'\} · \{current \+ 1\} \/ \{images\.length\}/);
});
