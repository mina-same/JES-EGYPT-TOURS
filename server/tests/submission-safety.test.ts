import assert from 'node:assert/strict';
import test from 'node:test';
import { validationResult } from 'express-validator';
import Booking from '../src/models/Booking';
import TailorMadeRequest from '../src/models/TailorMadeRequest';
import ContactSubmission from '../src/models/ContactSubmission';
import Notification from '../src/models/Notification';
import { tailorMadeRequestValidation } from '../src/middleware/validation';
import { createTailorMadeRequest } from '../src/controllers/tailorMadeController';
import { createContactSubmission, createTourQuestionSubmission, createTravelTradeSubmission } from '../src/controllers/contactController';
import { paginationInput, savePublicSubmission, respondSubmissionError, publicSubmissionReceipt } from '../src/utils/submission';
import { budgetAmount, validBudgetRange, validTravelRange } from '../src/utils/tailorMade';

const payload = () => ({ fullName: 'Test Visitor', email: 'alice+trip@example.travel', country: 'Germany', startMonth: 'January', startYear: '2099', endMonth: 'February', endYear: '2099', adults: 2, comments: 'Travel request', minBudget: '$1,000', maxBudget: '$2,000', locale: 'de' });
const response = () => ({ code: 0, body: null as any, status(code: number) { this.code = code; return this; }, json(body: any) { this.body = body; return this; } });

test('email validation accepts aliases and long domains in all submission models', () => {
  for (const Model of [Booking, TailorMadeRequest, ContactSubmission]) {
    for (const email of ['alice+trip@example.com', 'alice@example.travel']) {
      const document = new (Model as any)({ ...payload(), name: 'Test Visitor', email });
      assert.equal(document.validateSync()?.errors?.email, undefined);
    }
    assert.ok(new (Model as any)({ email: 'invalid' }).validateSync()?.errors?.email);
  }
});

test('tailor validation rejects past/inverted months and inverted/malformed budgets', async () => {
  assert.equal(validTravelRange(payload()), true);
  assert.equal(validTravelRange({ ...payload(), endYear: '2098' }), false);
  assert.equal(validTravelRange({ ...payload(), startYear: '2000' }), false);
  assert.equal(validTravelRange({ ...payload(), startYear: 'invalid' }), false);
  assert.equal(validBudgetRange({ minBudget: '$5,000+', maxBudget: '$1,000' }), false);
  assert.equal(validBudgetRange({ minBudget: 'invalid' }), false);
  assert.equal(validBudgetRange({ minBudget: '$5,000+', maxBudget: 'No Limit' }), true);
  assert.equal(budgetAmount('$1,000'), 1000);
  const req: any = { body: { ...payload(), endYear: '2098', maxBudget: '$500' } };
  for (const rule of tailorMadeRequestValidation) await rule.run(req);
  assert.ok(validationResult(req).array().length >= 2);
});

test('pagination bounds invalid values and caps requested result sizes', () => {
  assert.deepEqual(paginationInput({ page: '-1', limit: '0' }), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(paginationInput({ page: '2', limit: '999999' }), { page: 2, limit: 100, skip: 100 });
});

test('tailor allowlist forces pending and ignores injected administrative fields; notifications cannot fail saved requests', async context => {
  const req: any = { body: { ...payload(), status: 'completed', adminNotes: 'injected', budgetMinAmount: 1 }, get: () => undefined };
  for (const rule of tailorMadeRequestValidation) await rule.run(req);
  assert.equal(validationResult(req).isEmpty(), true);
  let fields: any;
  context.mock.method(TailorMadeRequest, 'create', async (data: any) => { fields = data; return { ...data, _id: 'test', createdAt: new Date() }; });
  context.mock.method(Notification, 'init', async () => Notification);
  context.mock.method(Notification, 'findOneAndUpdate', async () => { throw new Error('Notification unavailable'); });
  context.mock.method(console, 'error', () => {});
  const res = response();
  await createTailorMadeRequest(req, res as any);
  assert.equal(res.code, 201);
  assert.equal(res.body.success, true);
  assert.equal(fields.status, 'pending');
  assert.equal(fields.adminNotes, undefined);
  assert.equal(fields.budgetMinAmount, 1000);
  assert.equal(fields.locale, 'de');
});

test('all contact submission types remain successful after notification failure', async context => {
  context.mock.method(ContactSubmission, 'create', async (data: any) => ({ ...data, _id: 'test', createdAt: new Date() }));
  context.mock.method(Notification, 'init', async () => Notification);
  context.mock.method(Notification, 'findOneAndUpdate', async () => { throw new Error('Notification unavailable'); });
  context.mock.method(console, 'error', () => {});
  for (const controller of [createContactSubmission, createTourQuestionSubmission, createTravelTradeSubmission]) {
    const res = response();
    await controller({ body: { name: 'Visitor', email: 'visitor@example.com', message: 'Question' }, get: () => undefined } as any, res as any);
    assert.equal(res.code, 201);
    assert.equal(res.body.success, true);
  }
});

test('submission retries replay once, reject changed data and handle simultaneous insert collision', async () => {
  let stored: any = null;
  let writes = 0;
  const model = {
    init: async () => {},
    findOne: () => ({ select: async () => stored }),
    create: async (fields: any) => { writes++; stored = { ...fields, _id: 'test' }; return stored; },
  };
  const req: any = { get: () => '8b943bad-4418-46dc-8425-35f4ef629a62' };
  assert.equal((await savePublicSubmission(model, req, { name: 'Visitor' })).replay, false);
  assert.equal((await savePublicSubmission(model, req, { name: 'Visitor' })).replay, true);
  assert.equal(writes, 1);
  await assert.rejects(savePublicSubmission(model, req, { name: 'Changed' }), (error: any) => error.statusCode === 409);
  const original = stored;
  stored = null;
  model.create = async () => { stored = original; throw Object.assign(new Error('duplicate'), { code: 11000 }); };
  assert.equal((await savePublicSubmission(model, req, { name: 'Visitor' })).replay, true);
});

test('submission technical keys are hidden from public serialization and indexed uniquely', () => {
  for (const Model of [TailorMadeRequest, ContactSubmission]) {
    const doc = new (Model as any)({ idempotencyKey: 'secret', requestFingerprint: 'secret' });
    assert.equal(doc.toJSON().idempotencyKey, undefined);
    assert.equal(doc.toJSON().requestFingerprint, undefined);
    assert.ok(Model.schema.indexes().some(([fields, options]) => fields.idempotencyKey === 1 && options.unique && options.sparse));
  }
});

test('validation and malformed ids return client errors', () => {
  const res = response();
  respondSubmissionError(res as any, { name: 'ValidationError', errors: { email: { message: 'Invalid email' } } }, 'Internal error');
  assert.equal(res.code, 400);
  assert.equal(res.body.error, 'Invalid email');
});

test('public retries cannot reveal employee notes, assignment or audit history', () => {
  const receipt = publicSubmissionReceipt({ _id: 'request', name: 'Visitor', adminNotes: 'Private', history: ['private'], assignedTo: 'employee', assignedName: 'Employee', editVersion: 5, notificationPending: true });
  assert.deepEqual(receipt, { _id: 'request', name: 'Visitor' });
});
