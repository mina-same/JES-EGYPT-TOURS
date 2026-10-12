import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  isPublishedDestination,
  isPublishing,
  publishClassificationErrors,
} from '../src/lib/admin/blogClassification';

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

const classified = { category: 'c1', subCategory: 's1', destination: 'cairo' };
// The Admin's destination list: published pages and drafts alike.
const destinations = [
  { _id: 'cairo', status: 'published', isActive: true },
  { _id: 'abu-simbel', status: 'draft', isActive: true },
  { _id: 'switched-off', status: 'published', isActive: false },
];
const UNPUBLISHED = {
  field: 'Destination',
  message: 'The selected destination has no published page. Choose a published destination before publishing',
  path: 'destination',
};

test('a draft may leave its category, subcategory and destination open', () => {
  assert.deepEqual(publishClassificationErrors({ status: 'draft' }), []);
  assert.deepEqual(publishClassificationErrors({ status: 'draft', category: '', subCategory: '', destination: '' }), []);
});

test('a draft may be filed under a destination that is still a draft', () => {
  assert.deepEqual(publishClassificationErrors({ status: 'draft', ...classified, destination: 'abu-simbel' }, { destinations }), []);
});

test('publishing or scheduling names each one that is still on "None"', () => {
  for (const status of ['published', 'scheduled']) {
    assert.deepEqual(publishClassificationErrors({ status, ...classified }, { destinations }), [], status);
    assert.deepEqual(publishClassificationErrors({ status, ...classified, destination: '' }, { destinations }), [
      { field: 'Destination', message: 'Destination is required before publishing', path: 'destination' },
    ], status);
    assert.deepEqual(
      publishClassificationErrors({ status, category: 'none', subCategory: null }).map((error) => error.path),
      ['category', 'subCategory', 'destination'],
      status
    );
  }
});

test('publishing or scheduling under a destination with no published page is stopped in the form', () => {
  for (const status of ['published', 'scheduled']) {
    assert.deepEqual(publishClassificationErrors({ status, ...classified, destination: 'abu-simbel' }, { destinations }), [UNPUBLISHED], status);
    assert.deepEqual(publishClassificationErrors({ status, ...classified, destination: 'switched-off' }, { destinations }), [UNPUBLISHED], status);
  }
  // A destination the form does not know — the list still loading, or one
  // removed from it — is left to the API, which decides in any case.
  assert.deepEqual(publishClassificationErrors({ status: 'published', ...classified, destination: 'elsewhere' }, { destinations }), []);
  assert.deepEqual(publishClassificationErrors({ status: 'published', ...classified, destination: 'abu-simbel' }), []);
});

test('the form\'s reading of "published" is the API\'s: published, and not switched off', () => {
  assert.deepEqual(destinations.map(isPublishedDestination), [true, false, false]);
  // Stored before the flag existed: on.
  assert.equal(isPublishedDestination({ _id: 'legacy', status: 'published' }), true);
  assert.deepEqual(['draft', 'published', 'scheduled', undefined].map(isPublishing), [false, true, true, false]);
});

test('both article editors run the check and give the error panel a select to scroll to', () => {
  for (const page of ['new/page.tsx', '[id]/edit/page.tsx']) {
    const editor = source(`app/(admin)/admin/blogs/articles/${page}`);
    assert.match(editor, /validationErrors\.push\(\.\.\.publishClassificationErrors\(formData, \{ destinations \}\)\);/, page);
    // The panel scrolls to the element whose id is the error's `path`.
    for (const id of ['category', 'subCategory', 'destination']) {
      assert.ok(editor.includes(`<SelectTrigger id="${id}">`), `${page}: ${id}`);
    }
    assert.ok(editor.includes('{PUBLISH_CLASSIFICATION_HINT}'), page);
    // Drafts still save with "None": the option stays.
    assert.equal((editor.match(/<SelectItem value="none">None<\/SelectItem>/g) || []).length >= 3, true, page);
  }
});

test('a draft destination is marked in the list and cannot be picked for a public article', () => {
  for (const page of ['new/page.tsx', '[id]/edit/page.tsx']) {
    const editor = source(`app/(admin)/admin/blogs/articles/${page}`);
    assert.match(
      editor,
      /<SelectItem\s+key=\{dest\._id\}\s+value=\{dest\._id\}\s+disabled=\{isPublishing\(formData\.status\) && !isPublishedDestination\(dest\)\}\s*>\s*\{destinationLabel\(dest\)\}\s*<\/SelectItem>/,
      page
    );
    // Only active categories and subcategories are offered in the first place.
    assert.ok(editor.includes('blogCategoryAPI.getAll({ isActive: true })'), page);
    assert.ok(editor.includes('blogSubcategoryAPI.getByCategory(formData.category, { isActive: true })'), page);
  }
});

test('a refusal to switch off, unpublish or delete a parent reaches the editor in the API\'s own words', () => {
  // The three lists delete; the reason comes back as `error` on a 400.
  for (const page of ['blogs/category/page.tsx', 'blogs/subcategory/page.tsx', 'destinations/page.tsx']) {
    assert.ok(source(`app/(admin)/admin/${page}`).includes('err?.response?.data?.error ||'), page);
  }
  // The three editors switch a parent off or unpublish it on save.
  for (const page of ['blogs/category/new/page.tsx', 'blogs/subcategory/new/page.tsx']) {
    assert.ok(source(`app/(admin)/admin/${page}`).includes('parseApiError(err?.response?.data || { message: err.message })'), page);
  }
  assert.ok(source('app/(admin)/admin/destinations/new/page.tsx').includes('err.response?.data?.error'));
});
