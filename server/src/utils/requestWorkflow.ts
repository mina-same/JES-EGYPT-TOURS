import { Schema } from 'mongoose';
import type { Request } from 'express';
export function addRequestWorkflow(schema: any) {
  schema.add({
    editVersion: { type: Number, default: 0 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedName: { type: String, default: '' },
    history: [{ actor: { type: Schema.Types.ObjectId, ref: 'User' }, actorName: String, at: { type: Date, default: Date.now }, status: String, previousStatus: String, assignedName: String, changes: [String] }],
  });
}
export async function updateRequestRecord(model: any, req: Request, statuses: string[]) {
  const user = (req as any).user, { status, adminNotes, editVersion, assignment } = req.body;
  const fail = (message: string, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode, code: 'REQUEST_CONFLICT' }); };
  if (!Number.isSafeInteger(editVersion) || editVersion < 0) fail('Reload this request before saving it.');
  if (status !== undefined && !statuses.includes(status)) fail('Invalid request status');
  if (adminNotes !== undefined && (typeof adminNotes !== 'string' || adminNotes.length > 10000)) fail('Notes must be text up to 10000 characters');
  if (assignment !== undefined && !['me', 'release'].includes(assignment)) fail('Invalid assignment');
  const current = await model.findById(req.params.id);
  if (!current) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  if ((current.editVersion || 0) !== editVersion) fail('Another employee updated this request. Reload it before saving.', 409);
  const patch: any = {};
  if (status !== undefined) patch.status = status;
  if (adminNotes !== undefined) patch.adminNotes = adminNotes;
  if (assignment) {
    if (current.assignedTo && String(current.assignedTo) !== String(user._id) && user.role !== 'superadmin') fail('This request is assigned to another employee.', 409);
    patch.assignedTo = assignment === 'me' ? user._id : null;
    patch.assignedName = assignment === 'me' ? user.name : '';
  }
  const changes = Object.keys(patch).filter(key => String(current[key] ?? '') !== String(patch[key] ?? ''));
  if (!changes.length) return current;
  const versionQuery = editVersion === 0 ? { $or: [{ editVersion: 0 }, { editVersion: { $exists: false } }] } : { editVersion };
  const updated = await model.findOneAndUpdate({ _id: current._id, ...versionQuery }, {
    $set: patch, $inc: { editVersion: 1 },
    $push: { history: { actor: user._id, actorName: user.name, at: new Date(), status: patch.status || current.status, previousStatus: current.status, ...(assignment ? { assignedName: patch.assignedName } : {}), changes } },
  }, { new: true, runValidators: true });
  if (!updated) fail('Another employee updated this request. Reload it before saving.', 409);
  return updated;
}
