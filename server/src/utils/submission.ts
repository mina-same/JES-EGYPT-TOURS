import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { isEmail } from 'validator';

export const isSubmissionEmail = (value: string): boolean => isEmail(value);

export function paginationInput(query: Request['query'], defaultLimit = 10) {
  const number = (value: unknown, fallback: number, max: number) => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
  };
  const page = number(query.page, 1, 1000000);
  const limit = number(query.limit, defaultLimit, 100);
  return { page, limit, skip: (page - 1) * limit };
}

export function respondSubmissionError(res: Response, error: any, fallback: string) {
  if (error?.statusCode === 409) {
    res.status(409).json({ success: false, code: error.code || 'IDEMPOTENCY_KEY_REUSED', error: error.message });
  } else if (error?.statusCode >= 400 && error?.statusCode < 500) {
    res.status(error.statusCode).json({ success: false, error: error.message });
  } else if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    const messages = Object.values(error.errors || {}).map((item: any) => item.message);
    res.status(400).json({ success: false, error: messages[0] || 'Invalid request data' });
  } else {
    res.status(500).json({ success: false, error: fallback });
  }
}

export async function savePublicSubmission(model: any, req: Request, fields: Record<string, unknown>) {
  const key = req.get('Idempotency-Key')?.toLowerCase();
  if (!key) return { document: await model.create({ ...fields, notificationPending: true }), replay: false };
  const fingerprint = createHash('sha256').update(JSON.stringify(Object.keys(fields).sort().map(key => [key, fields[key]]))).digest('hex');
  const replay = (document: any) => {
    if (document.requestFingerprint !== fingerprint) {
      throw Object.assign(new Error('This Idempotency-Key was already used with different request data'), { statusCode: 409 });
    }
    return { document, replay: true };
  };
  await model.init();
  const existing = await model.findOne({ idempotencyKey: key }).select('+requestFingerprint');
  if (existing) return replay(existing);
  try {
    return { document: await model.create({ ...fields, notificationPending: true, idempotencyKey: key, requestFingerprint: fingerprint }), replay: false };
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing = await model.findOne({ idempotencyKey: key }).select('+requestFingerprint');
      if (existing) return replay(existing);
    }
    throw error;
  }
}

/** A retry can happen after an employee has already worked on the request.
 * Public receipts must never expose internal notes, assignment or audit history. */
export function publicSubmissionReceipt(document: any) {
  const receipt = { ...(typeof document.toObject === 'function' ? document.toObject() : document) };
  for (const key of ['adminNotes', 'history', 'assignedTo', 'assignedName', 'editVersion', 'notificationPending', 'idempotencyKey', 'requestFingerprint', '__v']) Reflect.deleteProperty(receipt, key);
  return receipt;
}
