"use client";
import { useRef, useState } from 'react';
import { adminFetch, announceRequestsChanged } from '@/lib/adminNotifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { workflowHistoryDescription } from '@/lib/requestWorkflowHistory';
import type { RequestWorkflowData } from '@/lib/requestWorkflowTypes';
export default function RequestWorkflow({ record, url, onUpdated, onReload, editable = true, hasUnsavedChanges = false, saving = false, onBusyChange }: { record: RequestWorkflowData; url: string; onUpdated: (record: any) => void; onReload?: (record: any) => void; editable?: boolean; hasUnsavedChanges?: boolean; saving?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const { user } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const mine = !!record.assignedTo && record.assignedTo === user?.id;
  const assignedElsewhere = !!record.assignedTo && !mine;
  const canAssign = !assignedElsewhere || user?.role === 'superadmin';
  const run = async (operation: () => Promise<void>) => {
    if (locked.current || saving) return;
    locked.current = true; setBusy(true); onBusyChange?.(true); setError('');
    try { await operation(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to update request'); }
    finally { locked.current = false; setBusy(false); onBusyChange?.(false); }
  };
  const assign = (assignment: 'me' | 'release') => run(async () => {
    const body = await adminFetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignment, editVersion: record.editVersion || 0 }) });
    onUpdated(body.data); announceRequestsChanged(); await refreshUnreadCount();
  });
  const reload = () => {
    if (locked.current || saving) return;
    if (hasUnsavedChanges && !window.confirm('Reloading will discard your unsaved status and notes. Continue?')) return;
    return run(async () => { const body = await adminFetch(url); (onReload || onUpdated)(body.data); });
  };
  const history = record.history || [];
  return <div className="space-y-2 rounded-md border p-3 text-sm" aria-busy={busy}>
    <p>Assigned to: <strong>{record.assignedName || 'Unassigned'}</strong></p>
    {editable && <div className="flex gap-2"><button type="button" disabled={busy || saving || mine || !canAssign} className="rounded border px-2 py-1" onClick={() => void assign('me')}>{mine ? 'Assigned to you' : 'Assign to me'}</button>{record.assignedTo && <button type="button" disabled={busy || saving || !canAssign} className="rounded border px-2 py-1" onClick={() => void assign('release')}>Release assignment</button>}</div>}
    {editable && !canAssign && <p className="text-xs text-muted-foreground">Only the assigned employee or a superadmin can change this assignment.</p>}
    <button type="button" disabled={busy || saving} className="rounded border px-2 py-1" onClick={() => void reload()}>Reload latest request</button>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <p className="text-xs text-muted-foreground">Status changes are internal records. Contact the customer separately to send a confirmation or reply.</p>
    <details><summary className="cursor-pointer">Activity history ({history.length})</summary><ul className="mt-2 space-y-2">{history.length ? history.slice().reverse().map((entry, index) => <li key={index}><p>{workflowHistoryDescription(entry)}</p><p className="text-xs text-muted-foreground">{new Date(entry.at).toLocaleString()}{' ? '}{entry.actorName || 'Employee'}</p></li>) : <li>No changes recorded yet.</li>}</ul></details>
  </div>;
}
