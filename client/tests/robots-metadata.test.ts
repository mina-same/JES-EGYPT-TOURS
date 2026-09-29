import assert from 'node:assert/strict';
import test from 'node:test';
import { getNotFoundRobotsMetadata, getRobotsMetadata, isSiteIndexable } from '../src/lib/seo/robots';

/*
 * Page robots: the site switch (NEXT_PUBLIC_SITE_INDEXABLE) first, then the
 * page entity's editor "No Index". Next inlines the flag at build time; the
 * helper reads it at call time, so each case here sets it and restores it.
 */

const withFlag = (value: string | undefined, run: () => void) => {
  const previous = process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  else process.env.NEXT_PUBLIC_SITE_INDEXABLE = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_INDEXABLE;
    else process.env.NEXT_PUBLIC_SITE_INDEXABLE = previous;
  }
};

const NOINDEX_NOFOLLOW = { index: false, follow: false };

test('during development every page is noindex, nofollow, whatever its editor set', () => {
  for (const flag of [undefined, '', 'false', 'FALSE', '0']) {
    withFlag(flag, () => {
      assert.equal(isSiteIndexable(), false, `flag ${JSON.stringify(flag)}`);
      assert.deepEqual(getRobotsMetadata(false), NOINDEX_NOFOLLOW, `noIndex=false, flag ${JSON.stringify(flag)}`);
      assert.deepEqual(getRobotsMetadata(true), NOINDEX_NOFOLLOW, `noIndex=true, flag ${JSON.stringify(flag)}`);
      assert.deepEqual(getRobotsMetadata(), NOINDEX_NOFOLLOW, `noIndex absent, flag ${JSON.stringify(flag)}`);
      assert.deepEqual(getRobotsMetadata(null), NOINDEX_NOFOLLOW, `noIndex null, flag ${JSON.stringify(flag)}`);
    });
  }
});

test('only the exact value "true" opens indexing', () => {
  for (const flag of ['TRUE', 'True', '1', 'yes', ' true']) {
    withFlag(flag, () => {
      assert.equal(isSiteIndexable(), false, JSON.stringify(flag));
      assert.deepEqual(getRobotsMetadata(false), NOINDEX_NOFOLLOW, JSON.stringify(flag));
    });
  }
});

test('after launch: indexed unless the editor switched on "No Index"', () => {
  withFlag('true', () => {
    assert.equal(isSiteIndexable(), true);
    assert.deepEqual(getRobotsMetadata(false), { index: true, follow: true }, 'noIndex=false');
    assert.deepEqual(getRobotsMetadata(), { index: true, follow: true }, 'noIndex absent');
    assert.deepEqual(getRobotsMetadata(null), { index: true, follow: true }, 'noIndex null');
    assert.deepEqual(getRobotsMetadata(true), { index: false, follow: true }, 'noIndex=true');
  });
});

test('a 404 is noindex, nofollow before and after launch', () => {
  for (const flag of [undefined, 'false', 'true']) {
    withFlag(flag, () => {
      assert.deepEqual(getNotFoundRobotsMetadata(), NOINDEX_NOFOLLOW, `flag ${JSON.stringify(flag)}`);
    });
  }
});
