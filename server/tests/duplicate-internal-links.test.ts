import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { findDuplicateInternalLinks, assertNoDuplicateInternalLinks, DuplicateInternalLinksError, respondToDuplicateInternalLinks } from '../src/utils/duplicateInternalLinks';
import { applyContentUpdate, duplicateInternalLinksPlugin } from '../src/utils/duplicateInternalLinksPlugin';
import Faq from '../src/models/Faq';
import GeneralContent from '../src/models/GeneralContent';

const link = (href = '/en/museum') => `<p><a href="${href}">Museum</a></p>`;

test('groups relative and absolute targets across fields with exact language and locations', () => {
  const groups = findDuplicateInternalLinks({
    contentBlocks: [{ content: { en: link() } }, { content: { en: link('https://www.jesegypttours.com/en/museum') } }],
  });
  assert.equal(groups.length, 1);
  assert.equal(groups[0].count, 2);
  assert.equal(groups[0].locale, 'en');
  assert.deepEqual(groups[0].locations.map((item) => item.path), ['contentBlocks.0.content.en', 'contentBlocks.1.content.en']);
  assert.equal(groups[0].locations[1].label, 'Content blocks · Item 2 · Content');
});

test('counts repetitions in the same field, decodes HTML entities and ignores anchor text', () => {
  const groups = findDuplicateInternalLinks({ content: { de: '<a href="/de/museum?a=1&amp;b=2">First</a><a href="https://jesegypttours.com/de/museum?a=1&b=2">Other text</a>' } });
  assert.equal(groups[0].target, '/de/museum?a=1&b=2');
  assert.deepEqual(groups[0].locations.map((item) => item.occurrence), [1, 2]);
});

test('keeps languages, query values and section targets distinct', () => {
  assert.deepEqual(findDuplicateInternalLinks({ content: { en: link() + link('/en/museum?x=1') + link('/en/museum#hours'), de: link() } }), []);
});

test('excludes external, local navigation, metadata and populated related content', () => {
  assert.deepEqual(findDuplicateInternalLinks({
    content: { en: link() + link('https://example.com/en/museum').repeat(2) + link('#section').repeat(2) + link('?sort=1').repeat(2) + link('mailto:test@example.com').repeat(2) },
    seo: { metaDescription: { en: link().repeat(2) } },
    ogDescription: { en: link().repeat(2) },
    featuredDestinations: [{ description: { en: link().repeat(2) } }],
  }), []);
});

test('supports nested localized lists and legacy English HTML', () => {
  const groups = findDuplicateInternalLinks({ summary: { it: [link('/it/museum'), link('/it/museum')] }, content: link().repeat(2) });
  assert.deepEqual(groups.map((group) => group.locale), ['it', 'en']);
  assert.equal(groups[0].locations[1].path, 'summary.it.1');
});

test('partial updates are checked against unchanged saved fields', () => {
  const saved = { intro: { en: link() }, content: { en: '' } };
  const next = applyContentUpdate(saved, { $set: { 'content.en': link() } });
  assert.throws(() => assertNoDuplicateInternalLinks(next), DuplicateInternalLinksError);
  assert.equal(saved.content.en, '');
  assertNoDuplicateInternalLinks(applyContentUpdate(next, { $set: { 'intro.en': '<p>Museum</p>' } }));
});

test('whole object replacement, unset, array index and setOnInsert match update semantics', () => {
  const saved = { content: { en: link(), de: 'old' }, notes: [{ text: { en: link() } }] };
  assertNoDuplicateInternalLinks(applyContentUpdate(saved, { $unset: { 'content.en': 1 } }));
  assertNoDuplicateInternalLinks(applyContentUpdate(saved, { $set: { 'notes.0.text.en': '' } }));
  assert.deepEqual(applyContentUpdate(saved, { content: { de: 'new' } }).content, { de: 'new' });
  assertNoDuplicateInternalLinks(applyContentUpdate({}, { $setOnInsert: { content: { en: link() } } }, true));
  assert.throws(() => assertNoDuplicateInternalLinks(applyContentUpdate({}, { $setOnInsert: { content: { en: link().repeat(2) } } }, true)), DuplicateInternalLinksError);
});

test('unsupported update shapes cannot bypass the guard', () => {
  assert.throws(() => applyContentUpdate({}, [{ $set: {} }] as any), /pipeline/);
  assert.throws(() => applyContentUpdate({}, { $push: { content: link() } }), /Unsupported/);
  assert.throws(() => applyContentUpdate({}, { $set: { 'content.$[].en': link() } }), /explicit/);
});

test('real FAQ and general content models reject duplicates during validation and accept correction', async () => {
  const faq = new Faq({ question: { en: 'Museum?' }, answer: { en: link().repeat(2) } });
  await assert.rejects(faq.validate(), DuplicateInternalLinksError);
  faq.set('answer.en', link());
  await faq.validate();
  const content = new GeneralContent({ slug: 'test-content', title: { en: 'Title' }, content: { en: link().repeat(2) } });
  await assert.rejects(content.validate(), DuplicateInternalLinksError);
});

test('query middleware rejects a partial update before any database write; corrected retry succeeds', async () => {
  const schema = new mongoose.Schema({ intro: mongoose.Schema.Types.Mixed, content: mongoose.Schema.Types.Mixed });
  schema.plugin(duplicateInternalLinksPlugin);
  const Model = mongoose.model('DuplicateLinkQueryTest', schema);
  let writes = 0;
  const saved = { _id: new mongoose.Types.ObjectId(), intro: { en: link() }, content: { en: '' } };
  const snapshot = { session() { return this; }, limit() { return this; }, sort() { return this; }, async lean() { return [saved]; } };
  Model.find = (() => snapshot) as any;
  Model.collection.updateOne = (async () => { writes++; return { acknowledged: true, matchedCount: 1, modifiedCount: 1 }; }) as any;
  try {
    await assert.rejects(Model.updateOne({ _id: saved._id }, { $set: { 'content.en': link() } }).exec(), DuplicateInternalLinksError);
    assert.equal(writes, 0);
    await Model.updateOne({ _id: saved._id }, { $set: { 'content.en': link('/en/other') } }).exec();
    assert.equal(writes, 1);
  } finally { mongoose.deleteModel('DuplicateLinkQueryTest'); }
});

test('API failure is a structured 422 with all locations, not a generic server error', () => {
  const groups = findDuplicateInternalLinks({ content: { en: link().repeat(2) } });
  let status = 0;
  let body: any;
  const response = { status(value: number) { status = value; return this; }, json(value: unknown) { body = value; return this; } };
  assert.equal(respondToDuplicateInternalLinks(new DuplicateInternalLinksError(groups), response as any), true);
  assert.equal(status, 422);
  assert.equal(body.code, 'DUPLICATE_INTERNAL_LINKS');
  assert.equal(body.duplicates[0].locations.length, 2);
  assert.equal(respondToDuplicateInternalLinks(new Error('other'), response as any), false);
});


test('upsert middleware rejects duplicates, including equality fields from the insert filter', async () => {
  const schema = new mongoose.Schema({ content: mongoose.Schema.Types.Mixed });
  schema.plugin(duplicateInternalLinksPlugin);
  const Model = mongoose.model('DuplicateLinkUpsertTest', schema);
  const snapshot = { session() { return this; }, limit() { return this; }, async lean() { return []; } };
  Model.find = (() => snapshot) as any;
  let writes = 0;
  Model.collection.updateOne = (async () => { writes++; return { acknowledged: true }; }) as any;
  try {
    await assert.rejects(Model.updateOne({}, { $set: { content: { en: link().repeat(2) } } }, { upsert: true }).exec(), DuplicateInternalLinksError);
    await assert.rejects(Model.updateOne({ content: { en: link().repeat(2) } }, { $set: { 'content.de': '' } }, { upsert: true }).exec(), DuplicateInternalLinksError);
    assert.equal(writes, 0);
    await Model.updateOne({}, { $set: { content: { en: link() } } }, { upsert: true }).exec();
    assert.equal(writes, 1);
  } finally { mongoose.deleteModel('DuplicateLinkUpsertTest'); }
});

test('bulk insert rejects duplicates even when lean disables Mongoose validation', async () => {
  const schema = new mongoose.Schema({ content: mongoose.Schema.Types.Mixed });
  schema.plugin(duplicateInternalLinksPlugin);
  const Model = mongoose.model('DuplicateLinkInsertTest', schema);
  let writes = 0;
  Model.collection.insertMany = (async () => { writes++; return { acknowledged: true }; }) as any;
  try {
    await assert.rejects(Model.insertMany([{ content: { en: link().repeat(2) } }], { lean: true }), DuplicateInternalLinksError);
    assert.equal(writes, 0);
  } finally { mongoose.deleteModel('DuplicateLinkInsertTest'); }
});
