import type {} from '../src/types/express';
import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import type { Request, Response } from 'express';
import sift from 'sift';
import Booking from '../src/models/Booking';
import ContactSubmission from '../src/models/ContactSubmission';
import TailorMadeRequest from '../src/models/TailorMadeRequest';
import Tour from '../src/models/Tour';
import User from '../src/models/User';
import { getAllContactSubmissions, getContactStats } from '../src/controllers/contactController';
import { getAdminOverview, requestCounts } from '../src/controllers/notificationController';
import { buildDashboardStats } from '../src/realtime/socket';
import { GENUINE_SUBMISSION } from '../src/utils/submission';

/*
 * Business decision: what a public form's spam trap filed (`isSpam: true`) is
 * not a customer enquiry, so it must not count in the Admin's enquiry
 * statistics. It stays in the Contact Forms list, marked Spam.
 *
 * Before: the Contact Forms cards (Total, New, Replied, Archived) counted it,
 * and the dashboard's "New contact forms", its queue and the live counts
 * counted it as soon as someone moved it back to New.
 *
 * The real controllers, over an in-memory collection; filters are evaluated
 * with sift (MongoDB query semantics), the two aggregation stages by hand.
 */

type Doc = Record<string, unknown> & { _id: string; status: string; createdAt: Date };
const now = Date.now();
const doc = (_id: string, status: string, isSpam: boolean | undefined, daysAgo: number): Doc => ({
  _id, status, name: `Person ${_id}`, email: `${_id}@example.com`, message: `Message ${_id}`, source: 'contact',
  createdAt: new Date(now - daysAgo * 86400000), ...(isSpam === undefined ? {} : { isSpam }),
});
const MIXED: Doc[] = [
  doc('g1', 'new', false, 1),
  doc('g2', 'new', undefined, 2), // no spam metadata (older record): an enquiry
  doc('g3', 'replied', false, 3),
  doc('g4', 'archived', false, 4), // archived by hand: still an enquiry
  doc('g5', 'archived', undefined, 20), // older than the 14-day chart
  doc('s1', 'archived', true, 1),
  doc('s2', 'archived', true, 2),
  doc('s3', 'new', true, 3), // spam someone moved back to New: still spam
];
const ONLY_SPAM = MIXED.filter((d) => d.isSpam === true);
const SUPERADMIN = { _id: 'u1', role: 'superadmin', permissions: [] };

const cairoDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(date);
const groupKey = (row: Doc, id: unknown): unknown => {
  if (typeof id === 'string') return row[id.slice(1)];
  if (id && typeof id === 'object' && '$dateToString' in id) return cairoDate(row.createdAt);
  throw new Error(`unsupported $group _id ${JSON.stringify(id)}`);
};
type Stage = { $match?: Record<string, unknown>; $group?: { _id: unknown } };
function aggregate(rows: Doc[], pipeline: Stage[]) {
  let current = rows;
  for (const stage of pipeline) {
    if (stage.$match) current = current.filter(sift(stage.$match));
    else if (stage.$group) {
      const groups = new Map<unknown, number>();
      for (const row of current) { const key = groupKey(row, stage.$group._id); groups.set(key, (groups.get(key) || 0) + 1); }
      return [...groups].map(([_id, count]) => ({ _id, count }));
    } else throw new Error(`unsupported stage ${Object.keys(stage)}`);
  }
  return current;
}
/** A query's chain (sort by createdAt, skip, limit, populate), awaitable. */
interface Chain extends PromiseLike<Doc[]> { sort(order: { createdAt: 1 | -1 }): Chain; skip(n: number): Chain; limit(n: number): Chain; populate(): Chain }
function chain(rows: Doc[]): Chain {
  let result = rows;
  const query: Chain = {
    sort(order) { const dir = order.createdAt; result = [...result].sort((a, b) => (a.createdAt > b.createdAt ? dir : -dir)); return query; },
    skip(n) { result = result.slice(n); return query; },
    limit(n) { result = result.slice(0, n); return query; },
    populate() { return query; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  return query;
}
function useCollection(context: TestContext, rows: Doc[]) {
  context.mock.method(ContactSubmission, 'aggregate', (pipeline: Stage[]) => Promise.resolve(aggregate(rows, pipeline)));
  context.mock.method(ContactSubmission, 'countDocuments', (filter: object = {}) => Promise.resolve(rows.filter(sift(filter)).length));
  context.mock.method(ContactSubmission, 'find', (filter: object = {}) => chain(rows.filter(sift(filter))));
  const empty = { aggregate: () => Promise.resolve([]), countDocuments: () => Promise.resolve(0), find: () => chain([]) };
  for (const model of [Booking, TailorMadeRequest, Tour, User] as unknown as Array<typeof empty>) {
    for (const name of ['aggregate', 'countDocuments', 'find'] as const) context.mock.method(model, name, empty[name]);
  }
}
type Handler = (req: Request, res: Response) => Promise<void>;
/** What these controllers answer, as far as the tests read it. */
interface Body {
  data: Doc[] & { total: number; new: number; replied: number; archived: number; spam: number };
  pagination: { total: number; pages: number };
  counts: { contactNew: number };
  queues: { contacts: Doc[] };
  analytics: { leads: number[] };
}
async function call(handler: Handler, query: Record<string, string> = {}) {
  const res = { statusCode: 200, body: null as unknown as Body, status(code: number) { res.statusCode = code; return res; }, json(body: Body) { res.body = body; return res; } };
  await handler({ query, params: {}, body: {}, user: SUPERADMIN } as unknown as Request, res as unknown as Response);
  return res;
}

test('a spam record is one explicitly marked isSpam: true — missing or false metadata is an enquiry', () => {
  const genuine = MIXED.filter(sift(GENUINE_SUBMISSION)).map((d) => d._id);
  assert.deepEqual(genuine, ['g1', 'g2', 'g3', 'g4', 'g5']);
  assert.deepEqual(MIXED.filter(sift({ status: 'new', ...GENUINE_SUBMISSION })).map((d) => d._id), ['g1', 'g2']);
});

test('Contact Forms statistics count enquiries only, and report the spam they leave out', async (context) => {
  useCollection(context, MIXED);
  const { body } = await call(getContactStats);
  assert.deepEqual(body, { success: true, data: { total: 5, new: 2, replied: 1, archived: 2, spam: 3 } });
  const { total, new: fresh, replied, archived, spam } = body.data;
  assert.equal(total, fresh + replied + archived, 'the cards add up to the total');
  assert.equal(total + spam, MIXED.length, 'with the spam, every stored submission is accounted for');
});

test('with no enquiries at all — only spam, or nothing — the statistics are zero', async (context) => {
  useCollection(context, ONLY_SPAM);
  assert.deepEqual((await call(getContactStats)).body.data, { total: 0, new: 0, replied: 0, archived: 0, spam: 3 });
  assert.equal((await requestCounts(SUPERADMIN)).contactNew, 0);
  context.mock.restoreAll();
  useCollection(context, []);
  assert.deepEqual((await call(getContactStats)).body.data, { total: 0, new: 0, replied: 0, archived: 0, spam: 0 });
});

test('the dashboard — new count, queue, live counts and the leads chart — leaves spam out, even spam moved back to New', async (context) => {
  useCollection(context, MIXED);
  assert.equal((await requestCounts(SUPERADMIN)).contactNew, 2);
  assert.equal((await buildDashboardStats()).contactNew, 2);
  const { body } = await call(getAdminOverview);
  assert.equal(body.counts.contactNew, 2);
  assert.deepEqual(body.queues.contacts.map((d: Doc) => d._id), ['g1', 'g2']);
  // The 14-day chart: g1–g4 (g5 is older); none of the spam.
  assert.equal(body.analytics.leads.reduce((n: number, v: number) => n + v, 0), 4);
  // The same "new" figure as the Contact Forms card.
  context.mock.restoreAll();
  useCollection(context, MIXED);
  assert.equal((await call(getContactStats)).body.data.new, body.counts.contactNew);
});

test('the Contact Forms list still shows spam — filters, search and pagination unchanged', async (context) => {
  useCollection(context, MIXED);
  const all = (await call(getAllContactSubmissions, { limit: '5' })).body;
  assert.equal(all.pagination.total, MIXED.length);
  assert.equal(all.pagination.pages, 2);
  assert.equal(all.data.length, 5);
  const page2 = (await call(getAllContactSubmissions, { limit: '5', page: '2' })).body;
  assert.equal(page2.data.length, 3);
  const archived = (await call(getAllContactSubmissions, { status: 'archived' })).body;
  assert.deepEqual(archived.data.map((d: Doc) => [d._id, d.isSpam === true]), [['s1', true], ['s2', true], ['g4', false], ['g5', false]]);
  const searched = (await call(getAllContactSubmissions, { search: 'Message s3' })).body;
  assert.deepEqual(searched.data.map((d: Doc) => d._id), ['s3']);
});
