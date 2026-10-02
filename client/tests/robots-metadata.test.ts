import assert from 'node:assert/strict';
import test from 'node:test';
import { getListingRobotsMetadata, getNotFoundRobotsMetadata, getRobotsMetadata, isSiteIndexable } from '../src/lib/seo/robots';

/*
 * Page robots: the site switch (NEXT_PUBLIC_SITE_INDEXABLE) alone — there is
 * no per-page override. Next inlines the flag at build time; the helper reads
 * it at call time, so each case here sets it and restores it.
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

test('during development every page is noindex, nofollow', () => {
  for (const flag of [undefined, '', 'false', 'FALSE', '0']) {
    withFlag(flag, () => {
      assert.equal(isSiteIndexable(), false, `flag ${JSON.stringify(flag)}`);
      assert.deepEqual(getRobotsMetadata(), NOINDEX_NOFOLLOW, `flag ${JSON.stringify(flag)}`);
      assert.deepEqual(getListingRobotsMetadata(true), NOINDEX_NOFOLLOW);
    });
  }
});

test('only the exact value "true" opens indexing', () => {
  for (const flag of ['TRUE', 'True', '1', 'yes', ' true']) {
    withFlag(flag, () => {
      assert.equal(isSiteIndexable(), false, JSON.stringify(flag));
      assert.deepEqual(getRobotsMetadata(), NOINDEX_NOFOLLOW, JSON.stringify(flag));
    });
  }
});

test('after launch every page is index, follow; unfinished content is a draft, not a robots flag', () => {
  withFlag('true', () => {
    assert.equal(isSiteIndexable(), true);
    assert.deepEqual(getRobotsMetadata(), { index: true, follow: true });
    assert.deepEqual(getListingRobotsMetadata(false), { index: true, follow: true });
    assert.deepEqual(getListingRobotsMetadata(true), { index: false, follow: true });
    // The helper takes no per-page input any more.
    assert.equal(getRobotsMetadata.length, 0);
  });
});

test('a 404 is noindex, nofollow before and after launch', () => {
  for (const flag of [undefined, 'false', 'true']) {
    withFlag(flag, () => {
      assert.deepEqual(getNotFoundRobotsMetadata(), NOINDEX_NOFOLLOW, `flag ${JSON.stringify(flag)}`);
    });
  }
});
