import type { RequestWorkflowData } from './requestWorkflowTypes';

export function workflowStatusLabel(status: string) {
  return ({ pending: 'Pending Confirmation', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', new: 'New', replied: 'Replied', archived: 'Archived', contacted: 'Contacted', 'in-progress': 'In Progress', in_progress: 'In Progress' } as Record<string, string>)[status] || status;
}

export function workflowHistoryDescription(entry: NonNullable<RequestWorkflowData['history']>[number]) {
  const descriptions: string[] = [];
  if (entry.changes.includes('status')) descriptions.push(entry.previousStatus
    ? `Status changed from ${workflowStatusLabel(entry.previousStatus)} to ${workflowStatusLabel(entry.status)}`
    : `Status changed to ${workflowStatusLabel(entry.status)}`);
  if (entry.changes.some(field => field === 'assignedTo' || field === 'assignedName')) descriptions.push(entry.assignedName === undefined
    ? 'Assignment updated' : entry.assignedName ? `Assigned to ${entry.assignedName}` : 'Assignment released');
  if (entry.changes.includes('adminNotes')) descriptions.push('Internal notes updated');
  return descriptions.join('; ') || 'Request updated';
}
