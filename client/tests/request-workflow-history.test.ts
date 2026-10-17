import assert from 'node:assert/strict';
import test from 'node:test';
import { workflowHistoryDescription } from '../src/lib/requestWorkflowHistory';

test('history describes status transitions, assignment and notes without technical fields', () => {
  const entry = { at: '', status: 'confirmed', previousStatus: 'pending', assignedName: 'Admin', changes: ['status', 'assignedTo', 'assignedName', 'adminNotes'] };
  assert.equal(workflowHistoryDescription(entry), 'Status changed from Pending Confirmation to Confirmed; Assigned to Admin; Internal notes updated');
  assert.equal(workflowHistoryDescription({ ...entry, assignedName: '', changes: ['assignedTo', 'assignedName'] }), 'Assignment released');
});

test('legacy history does not invent previous statuses or assignment identities', () => {
  assert.equal(workflowHistoryDescription({ at: '', status: 'confirmed', changes: ['status'] }), 'Status changed to Confirmed');
  assert.equal(workflowHistoryDescription({ at: '', status: 'pending', changes: ['assignedTo', 'assignedName'] }), 'Assignment updated');
});
