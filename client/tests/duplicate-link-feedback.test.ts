import assert from 'node:assert/strict';
import test from 'node:test';
import { DUPLICATE_LINK_FEEDBACK, reportDuplicateLinkResponse } from '../src/lib/duplicateLinkFeedback';

test('save rejection publishes locations without replacing the response; successful retry clears the report', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const browser = new EventTarget() as EventTarget & { location: { pathname: string } };
  browser.location = { pathname: '/admin/blogs/articles/new' };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  const reports: unknown[] = [];
  browser.addEventListener(DUPLICATE_LINK_FEEDBACK, (event) => reports.push((event as CustomEvent).detail));
  try {
    const duplicates = [{ locale: 'en', target: '/en/museum', count: 2, locations: [{ path: 'content.en', label: 'Content', occurrence: 1 }, { path: 'content.en', label: 'Content', occurrence: 2 }] }];
    const rejected = { success: false, code: 'DUPLICATE_INTERNAL_LINKS', duplicates };
    assert.equal(reportDuplicateLinkResponse(rejected), rejected);
    assert.deepEqual(reports, [duplicates]);
    reportDuplicateLinkResponse({ success: false, error: 'Unrelated validation error' });
    assert.equal(reports.length, 1);
    reportDuplicateLinkResponse({ success: true });
    assert.deepEqual(reports, [duplicates, []]);
    browser.location.pathname = '/en/museum';
    reportDuplicateLinkResponse(rejected);
    assert.equal(reports.length, 2);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
