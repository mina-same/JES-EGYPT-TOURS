import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBookingSidebarLayout } from '../src/lib/bookingSidebarUx';

test('a tall booking card uses the full sidebar viewport beside the fixed navigation', () => {
  const layout = calculateBookingSidebarLayout({
    rowTop: 0,
    rowBottom: 5000,
    cardHeight: 1100,
    viewportHeight: 900,
  });

  assert.deepEqual(layout, {
    top: 20,
    availableHeight: 860,
    visibleHeight: 860,
    canFix: true,
    reachedEnd: false,
  });
});

test('a short booking card keeps its natural visible height', () => {
  const layout = calculateBookingSidebarLayout({
    rowTop: 100,
    rowBottom: 5000,
    cardHeight: 600,
    viewportHeight: 900,
  });

  assert.equal(layout.availableHeight, 860);
  assert.equal(layout.visibleHeight, 600);
  assert.equal(layout.canFix, false);
});

test('parking uses visible panel height rather than hidden form height', () => {
  const layout = calculateBookingSidebarLayout({
    rowTop: -3000,
    rowBottom: 850,
    cardHeight: 1100,
    viewportHeight: 900,
  });

  assert.equal(layout.reachedEnd, true);
  assert.equal(layout.visibleHeight, 860);
});
