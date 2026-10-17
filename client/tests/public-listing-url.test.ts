import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY_PUBLIC_LISTING, parsePublicListingQuery, publicListingUrl, shouldRedirectPublicQuery,
} from '../src/lib/tours/publicListingUrl';

test('public URL uses stable keys, one occurrence and the canonical order', () => {
  const url = publicListingUrl('/en/egypt-tour-packages', {
    q: ' Nile ', destinations: 'luxor,aswan,luxor', duration: '7-9,1-3',
    tourType: 'nile-cruise,day-tour', tourStyles: 'luxury,family,luxury',
    minPrice: '00100', maxPrice: '600.00', sort: 'price-asc', page: 2,
  });
  assert.equal(url, '/en/egypt-tour-packages?q=Nile&destinations=aswan,luxor&duration=1-3,7-9&tourType=nile-cruise,day-tour&tourStyles=luxury,family&minPrice=100&maxPrice=600&sort=price-asc&page=2');
  assert.ok(!/\b(?:search|durationRange|subcategory)=/.test(url));
});

test('default and equivalent direct requests normalize once while preserving attribution', () => {
  const query = new URLSearchParams('page=01&sort=recommended&tourStyles=luxury,luxury&minPrice=00100&utm_source=google&gclid=abc');
  const parsed = parsePublicListingQuery(query);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.redirectSearch, '?tourStyles=luxury&minPrice=100&utm_source=google&gclid=abc');
  assert.equal(shouldRedirectPublicQuery(query, parsed), true);
  assert.equal(shouldRedirectPublicQuery(new URLSearchParams(parsed.redirectSearch), parsed), false);
  assert.equal(parsePublicListingQuery(new URLSearchParams('page=1')).redirectSearch, '');
});

test('invalid public values reject before listing, valid empty inventory remains valid', () => {
  const bad = [
    'destinations=68aabbccddeeff0011223344', 'destinations=unknown',
    'tourType=unknown', 'tourStyles=beach', 'duration=unknown',
    'sort=priceStartingFrom', 'minPrice=-1', 'maxPrice=foo',
    'minPrice=200&maxPrice=100', 'page=0', 'page=2.5', 'page=-2',
    'search=nile', 'durationRange=1-3', 'subcategory=68aabbccddeeff0011223344',
    'tourStyles=luxury&tourStyles=family',
  ];
  for (const query of bad) {
    assert.ok(parsePublicListingQuery(new URLSearchParams(query), { destinationKeys: ['aswan', 'luxor'] }).error, query);
  }
  const valid = parsePublicListingQuery(new URLSearchParams('destinations=aswan&tourStyles=family&page=2'), { destinationKeys: ['aswan', 'luxor'] });
  assert.equal(valid.error, undefined);
  assert.equal(valid.isUtility, true);
});

test('page alone is an indexable base state; facets and sort are utility states', () => {
  assert.equal(parsePublicListingQuery(new URLSearchParams('page=2')).isUtility, false);
  assert.equal(parsePublicListingQuery(new URLSearchParams('sort=price-desc&page=2')).isUtility, true);
  assert.equal(parsePublicListingQuery(new URLSearchParams('q=luxor')).isUtility, true);
  assert.equal(parsePublicListingQuery(new URLSearchParams('utm_medium=email')).isUtility, false);
});

// ── Tracking parameters ─────────────────────────────────────────────────────
// Attribution on an inbound link rides along on every public listing: accepted,
// carried through a redirect, and never part of the listing state — so never
// part of the API query, the canonical or an alternate.

const TRACKING = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid', 'srsltid', 'ref'];

test('every tracking parameter is accepted and leaves the listing state exactly as it was', () => {
  const options = { destinationKeys: ['aswan'] };
  const clean = parsePublicListingQuery(new URLSearchParams('destinations=aswan&page=2'), options);
  for (const key of TRACKING) {
    const alone = new URLSearchParams(`${key}=abc`);
    const parsed = parsePublicListingQuery(alone);
    assert.equal(parsed.error, undefined, key);
    assert.deepEqual(parsed.state, EMPTY_PUBLIC_LISTING, key);
    assert.equal(parsed.normalizedSearch, '', key);
    assert.equal(parsed.isUtility, false, `${key} is not a facet`);
    // The clean URL plus tracking is served as it is, not redirected.
    assert.equal(parsed.redirectSearch, `?${key}=abc`, key);
    assert.equal(shouldRedirectPublicQuery(alone, parsed), false, key);

    const withState = parsePublicListingQuery(new URLSearchParams(`destinations=aswan&page=2&${key}=abc`), options);
    assert.deepEqual(withState.state, clean.state, key);
    assert.equal(withState.normalizedSearch, clean.normalizedSearch, key);
    assert.equal(withState.isUtility, clean.isUtility, key);
  }
});

test('srsltid and ref go through a page-1 or leading-zero redirect exactly as utm_source does', () => {
  for (const key of ['utm_source', 'srsltid', 'ref']) {
    const pageOne = new URLSearchParams(`page=1&${key}=abc`);
    const one = parsePublicListingQuery(pageOne);
    assert.equal(shouldRedirectPublicQuery(pageOne, one), true, key);
    assert.equal(one.redirectSearch, `?${key}=abc`, `${key}: clean page 1, tracking kept`);

    const padded = new URLSearchParams(`page=02&${key}=abc`);
    const two = parsePublicListingQuery(padded);
    assert.equal(shouldRedirectPublicQuery(padded, two), true, key);
    assert.equal(two.redirectSearch, `?page=2&${key}=abc`, key);
    // The target is final.
    assert.equal(shouldRedirectPublicQuery(new URLSearchParams(two.redirectSearch), two), false, key);
  }
  // Listing state first, then tracking in the order it came.
  const mixed = new URLSearchParams('utm_source=google&srsltid=abc&destinations=aswan&ref=partner');
  const parsed = parsePublicListingQuery(mixed, { destinationKeys: ['aswan'] });
  assert.equal(parsed.redirectSearch, '?destinations=aswan&utm_source=google&srsltid=abc&ref=partner');
  assert.equal(parsed.normalizedSearch, '?destinations=aswan');
});

test('a repeated tracking parameter keeps every value; a repeated page is still rejected', () => {
  for (const key of ['utm_source', 'srsltid', 'ref']) {
    const query = new URLSearchParams(`${key}=a&${key}=b`);
    const parsed = parsePublicListingQuery(query);
    assert.equal(parsed.error, undefined, key);
    assert.equal(parsed.redirectSearch, `?${key}=a&${key}=b`, key);
    assert.equal(shouldRedirectPublicQuery(query, parsed), false, key);
  }
  for (const query of ['page=2&page=3', 'page=2&page=2', 'page=2&page=3&srsltid=a&srsltid=b', 'srsltid=a&page=2&ref=b&page=3']) {
    assert.equal(parsePublicListingQuery(new URLSearchParams(query)).error, 'Duplicate page', query);
  }
});

test('an empty tracking value is accepted and kept, as an empty utm_source always was', () => {
  for (const key of ['utm_source', 'gclid', 'srsltid', 'ref']) {
    for (const spelling of [`${key}=`, key]) {
      const query = new URLSearchParams(spelling);
      const parsed = parsePublicListingQuery(query);
      assert.equal(parsed.error, undefined, spelling);
      assert.equal(parsed.redirectSearch, `?${key}=`, spelling);
      assert.equal(shouldRedirectPublicQuery(query, parsed), false, spelling);
    }
  }
});

test('tracking names match in any case, as they always have; listing names do not', () => {
  for (const key of ['UTM_SOURCE', 'Utm_Campaign', 'GCLID', 'FbClid', 'Srsltid', 'SRSLTID', 'REF', 'Ref']) {
    const parsed = parsePublicListingQuery(new URLSearchParams(`${key}=abc`));
    assert.equal(parsed.error, undefined, key);
    assert.deepEqual(parsed.state, EMPTY_PUBLIC_LISTING, key);
  }
  for (const key of ['PAGE', 'Page', 'Destinations', 'SORT', 'Q']) {
    assert.equal(parsePublicListingQuery(new URLSearchParams(`${key}=2`)).error, `Unknown parameter: ${key}`, key);
  }
});

test('only the named tracking parameters are exempt — no prefix, suffix or look-alike is', () => {
  const unknown = [
    'foo', 'random', 'utm_anything', 'utm', 'xref', 'refx', 'ref_code', 'referrer', 'srsltid2', 'xsrsltid',
    'gclid_x', 'myid', 'clickid', '__proto__', 'constructor', 'hasOwnProperty', 'toString',
  ];
  for (const key of unknown) {
    assert.equal(parsePublicListingQuery(new URLSearchParams(`${key}=x`)).error, `Unknown parameter: ${key}`, key);
    // Beside a tracking parameter it is just as unknown.
    assert.equal(parsePublicListingQuery(new URLSearchParams(`srsltid=a&${key}=x&ref=b`)).error, `Unknown parameter: ${key}`, key);
  }
});

test('a tracking value is carried as data: never read, matched or turned into listing state', () => {
  for (const value of ['__proto__', 'constructor', '{"$ne":null}', '<script>alert(1)</script>', 'https://partner.example/a?b=1&c=2', 'café']) {
    const query = new URLSearchParams();
    query.append('ref', value);
    query.append('srsltid', value);
    const parsed = parsePublicListingQuery(query);
    assert.equal(parsed.error, undefined, value);
    assert.deepEqual(parsed.state, EMPTY_PUBLIC_LISTING, value);
    assert.equal(parsed.normalizedSearch, '', value);
    // Percent-encoded where it is written back out, never interpolated raw.
    assert.ok(parsed.redirectSearch.includes(`ref=${encodeURIComponent(value)}`), value);
  }
  // The record form Next passes in is read the same way.
  const fromRecord = parsePublicListingQuery({ ref: 'constructor', srsltid: ['a', 'b'], page: '2' });
  assert.equal(fromRecord.error, undefined);
  assert.deepEqual(fromRecord.state, { ...EMPTY_PUBLIC_LISTING, page: 2 });
  assert.equal(fromRecord.redirectSearch, '?page=2&ref=constructor&srsltid=a&srsltid=b');
});

// ── Encoding: a normalized URL never redirects again ────────────────────────
// A request arrives decoded, however the link spelled it. The redirect
// decision compares what the query says, never how it was spelled, so
// normalization converges after at most one redirect.

/** The query a Server Component receives for this query string: Next's record, repeated keys as arrays. */
const asRecord = (search: string): Record<string, string | string[]> => {
  const record: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    const seen = record[key];
    record[key] = seen === undefined ? value : Array.isArray(seen) ? [...seen, value] : [seen, value];
  }
  return record;
};

/** Follows the listing's own redirects from `search`, both input forms agreeing at every hop. */
const follow = (search: string, options: { allowBlogKeys?: boolean } = {}) => {
  const hops: string[] = [];
  let current = search;
  for (;;) {
    const fromParams = parsePublicListingQuery(new URLSearchParams(current), options);
    const fromRecord = parsePublicListingQuery(asRecord(current), options);
    const redirects = shouldRedirectPublicQuery(new URLSearchParams(current), fromParams);
    assert.equal(shouldRedirectPublicQuery(asRecord(current), fromRecord), redirects, `${current}: both input forms decide alike`);
    if (fromParams.error || !redirects) return { hops, final: current, parsed: fromParams };
    hops.push(fromParams.redirectSearch);
    assert.ok(hops.length <= 1, `${search}: redirected again, to ${fromParams.redirectSearch}`);
    current = fromParams.redirectSearch;
  }
};

const SPECIAL_VALUES = ['a(b)', 'a)b', 'a~b', 'wow!', "it's", "a(b)~wow!'x"];

test('a value with ( ) ~ ! or \' is served as it is: no redirect, in tracking and in q alike', () => {
  for (const value of SPECIAL_VALUES) {
    for (const key of ['utm_source', 'ref', 'q']) {
      const readable = `${key}=${value}`;
      const encoded = `${key}=${encodeURIComponent(value).replace(/[!'()~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
      for (const search of [readable, encoded]) {
        const { hops, parsed } = follow(search);
        assert.deepEqual(hops, [], `${search}: no redirect`);
        assert.equal(parsed.error, undefined, search);
        // The value itself is kept, not stripped or rewritten.
        if (key === 'q') assert.equal(parsed.state.q, value, search);
        else assert.deepEqual([...new URLSearchParams(parsed.redirectSearch)], [[key, value]], search);
      }
    }
  }
});

test('normalization is idempotent: the normalized form normalizes to itself and never redirects', () => {
  const normalize = (search: string) => parsePublicListingQuery(new URLSearchParams(search), { destinationKeys: ['aswan', 'cairo', 'luxor'] }).redirectSearch;
  const matrix = [
    '', 'page=2', 'page=02', 'page=1', 'sort=recommended&page=1', 'q=%20Nile%20cruise%20',
    'destinations=luxor,aswan&tourStyles=family,luxury&minPrice=00100&page=03&sort=price-asc',
    'utm_source=google&gclid=abc', 'srsltid=AfmBOoq-_Zx9&ref=partner',
    ...SPECIAL_VALUES.flatMap((value) => [`ref=${value}`, `utm_source=${value}`, `q=${value}`]),
    "ref=a~b&destinations=cairo&utm_source=a(b)&page=02", 'q=wow!&sort=price-desc&ref=it%27s',
    'ref=a~b&ref=c(d)&ref=a~b', 'utm_source=a&utm_source=b', 'ref=', 'utm_source=', 'ref',
    'q=hello+world', 'q=hello%20world', 'q=hello%2Bworld', 'ref=hello+world', 'ref=hello%2Bworld',
    'ref=%D9%85%D8%B5%D8%B1', 'utm_source=Espa%C3%B1a', 'ref=日本🙂', 'ref=a%26b', 'ref=a%3Db', 'ref=%2528',
  ];
  for (const search of matrix) {
    const once = normalize(search);
    assert.equal(normalize(once), once, `${search}: normalize(normalize(q)) === normalize(q)`);
    const parsed = parsePublicListingQuery(new URLSearchParams(once), { destinationKeys: ['aswan', 'cairo', 'luxor'] });
    assert.equal(shouldRedirectPublicQuery(new URLSearchParams(once), parsed), false, `${search}: its normalized form ${once} does not redirect`);
    assert.equal(shouldRedirectPublicQuery(asRecord(once), parsed), false, `${search}: nor in the record form Next passes`);
  }
});

test('legitimate normalization still redirects, once, and keeps every special value', () => {
  const cases: [string, string][] = [
    ['page=1&ref=a~b', '?ref=a~b'],
    ['page=02&utm_source=a(b)', '?page=2&utm_source=a(b)'],
    ['ref=a~b&destinations=cairo', '?destinations=cairo&ref=a~b'],
    ['destinations=luxor,aswan&ref=a(b)', '?destinations=aswan,luxor&ref=a(b)'],
    ['sort=recommended&q=wow!', '?q=wow!'],
    ['q=%20wow!%20', '?q=wow!'],
    ["page=01&q=it's&ref=a(b)~wow!'x", "?q=it's&ref=a(b)~wow!'x"],
    ['ref=a~b&ref=c(d)&page=1', '?ref=a~b&ref=c(d)'],
  ];
  for (const [search, target] of cases) {
    const { hops, final } = follow(search, {});
    assert.deepEqual(hops, [target], search);
    assert.equal(final, target, `${search}: the target is served`);
  }
});

test('the normalized spelling of each character, from the existing encoder', () => {
  const spelled = (key: string, value: string) => {
    const query = new URLSearchParams();
    query.append('page', '1');
    query.append(key, value);
    return parsePublicListingQuery(query).redirectSearch;
  };
  // ( ) ~ ! ' are written as they are; a space as %20, a literal + as %2B, Unicode as UTF-8 bytes.
  assert.equal(spelled('ref', "a(b)~wow!'x"), "?ref=a(b)~wow!'x");
  assert.equal(spelled('ref', 'hello world'), '?ref=hello%20world');
  assert.equal(spelled('ref', 'hello+world'), '?ref=hello%2Bworld');
  assert.equal(spelled('ref', 'مصر'), '?ref=%D9%85%D8%B5%D8%B1');
  assert.equal(spelled('utm_source', 'España'), '?utm_source=Espa%C3%B1a');
  assert.equal(spelled('ref', 'a,b'), '?ref=a%2Cb');
  assert.equal(spelled('q', 'a,b'), '?q=a,b');
});

test('a space and a literal plus stay two different values', () => {
  for (const spelling of ['hello world', 'hello+world', 'hello%20world']) {
    const { hops, parsed } = follow(`q=${spelling}&ref=${spelling}`);
    assert.deepEqual(hops, [], spelling);
    assert.equal(parsed.state.q, 'hello world', spelling);
    assert.deepEqual([...new URLSearchParams(parsed.redirectSearch)], [['q', 'hello world'], ['ref', 'hello world']], spelling);
  }
  const plus = follow('q=hello%2Bworld&ref=hello%2Bworld');
  assert.deepEqual(plus.hops, []);
  assert.equal(plus.parsed.state.q, 'hello+world');
  assert.equal(plus.parsed.redirectSearch, '?q=hello%2Bworld&ref=hello%2Bworld');
});

test('Unicode tracking values converge, readable or percent-encoded', () => {
  for (const search of ['ref=مصر', 'ref=%D9%85%D8%B5%D8%B1', 'utm_source=España', 'utm_source=Espa%C3%B1a', 'ref=日本🙂', 'ref=%ED%A0%80']) {
    const { hops, parsed } = follow(search);
    assert.deepEqual(hops, [], search);
    assert.equal(parsed.error, undefined, search);
  }
  assert.deepEqual([...new URLSearchParams(follow('ref=%D9%85%D8%B5%D8%B1').parsed.redirectSearch)], [['ref', 'مصر']]);
});

test('an encoded & or = stays inside its value: no new key, no second decoding', () => {
  for (const [search, value] of [['ref=a%26b', 'a&b'], ['ref=a%3Db', 'a=b'], ['ref=a%26page%3D2', 'a&page=2'], ['ref=x%26foo%3Dbar', 'x&foo=bar'], ['ref=%2528', '%28']] as const) {
    const { hops, parsed } = follow(search);
    assert.deepEqual(hops, [], search);
    assert.equal(parsed.error, undefined, `${search}: no unknown key appeared`);
    assert.deepEqual(parsed.state, EMPTY_PUBLIC_LISTING, `${search}: no listing state appeared`);
    assert.deepEqual([...new URLSearchParams(parsed.redirectSearch)], [['ref', value]], search);
  }
});

test('repeated tracking values keep their order and do not loop; repeated listing keys are still rejected', () => {
  const repeated = follow('ref=a~b&ref=c(d)');
  assert.deepEqual(repeated.hops, []);
  assert.deepEqual([...new URLSearchParams(repeated.parsed.redirectSearch)], [['ref', 'a~b'], ['ref', 'c(d)']]);
  for (const search of ['page=2&page=3', 'page=2&page=02', 'q=a(b)&q=a(b)', 'q=wow!&q=wow%21', 'page=2&ref=a~b&page=3']) {
    assert.match(String(parsePublicListingQuery(new URLSearchParams(search)).error), /^Duplicate /, search);
  }
});

test('unknown keys, and special characters where a listing value has a fixed form, are still rejected', () => {
  for (const search of ['foo=a(b)', 'refx=a~b', 'utm_foo=wow!', 'PAGE=2', "Q=it's", 'destinations=cairo(1)', 'destinations=cairo~', 'sort=price-asc!', 'page=2!', 'minPrice=1(0)']) {
    assert.ok(parsePublicListingQuery(new URLSearchParams(search), { destinationKeys: ['cairo'] }).error, search);
  }
  for (const search of ['ref=', 'utm_source=', 'ref']) assert.deepEqual(follow(search).hops, [], `${search}: an empty value is served as it is`);
});

test('Search: q keeps its punctuation and settles, beside the Blog section parameters', () => {
  for (const search of ['q=wow!', "q=it's", 'q=a(b)~c', 'q=wow!&blogPage=2', 'q=wow!&blogSubCategory=tips&ref=a~b', 'blogPage=2&q=wow!']) {
    const { final, parsed } = follow(search, { allowBlogKeys: true });
    assert.equal(parsed.error, undefined, search);
    assert.ok(parsed.state.q.length > 0, search);
    assert.equal(follow(final, { allowBlogKeys: true }).hops.length, 0, `${search}: its target is final`);
  }
  assert.equal(follow('q=wow!', { allowBlogKeys: true }).parsed.state.q, 'wow!');
  assert.deepEqual(follow('q=wow!&blogPage=2', { allowBlogKeys: true }).hops, []);
});
