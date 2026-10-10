import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubcategoryParent } from '../src/lib/blog/subcategoryParent';

const egyptBlog = {
  _id: 'c1',
  name: { en: 'Egypt Blog', de: 'Ägypten Blog', it: "Blog sull'Egitto", es: 'Blog de Egipto' },
  slug: { en: 'egypt-blog', de: 'aegypten-blog', it: 'blog-egitto', es: 'blog-de-egipto' },
};

test('a deleted parent (populated as null) is no parent, not a crash', () => {
  // The regression: `typeof null === 'object'`, so the page read `.name` of
  // null and answered 500 after the parent category was deleted.
  assert.equal(getSubcategoryParent(null, 'en'), null);
  assert.equal(getSubcategoryParent(undefined, 'de'), null);
});

test('an unpopulated parent id is no parent either', () => {
  assert.equal(getSubcategoryParent('69f6114b42c9bca0c9a08d3e', 'en'), null);
});

test('a populated parent gives its localized name and its page in that language', () => {
  assert.deepEqual(getSubcategoryParent(egyptBlog, 'it'), { name: "Blog sull'Egitto", href: '/it/blog-egitto' });
  assert.deepEqual(getSubcategoryParent(egyptBlog, 'es'), { name: 'Blog de Egipto', href: '/es/blog-de-egipto' });
});

test('a parent with no page in this language keeps its name but not a link', () => {
  const parent = { name: { en: 'Egypt Blog', de: 'Ägypten Blog' }, slug: { en: 'egypt-blog' } };
  assert.deepEqual(getSubcategoryParent(parent, 'de'), { name: 'Ägypten Blog' });
});

test('a parent with no name is dropped rather than shown as an empty step', () => {
  assert.equal(getSubcategoryParent({ slug: { en: 'egypt-blog' } }, 'en'), null);
});
