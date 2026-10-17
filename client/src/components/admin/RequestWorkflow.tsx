"use client";
import { useState } from 'react';
import { adminFetch, announceRequestsChanged } from '@/lib/adminNotifications';
import { useNotifications } from '@/contexts/NotificationContext';
import type { RequestWorkflowData } from '@/lib/requestWorkflowTypes';
export default function RequestWorkflow({ record, url, onUpdated, onReload, editable = true }: { record: RequestWorkflowData; url: string; onUpdated: (record: any) => void; onReload?: (record: any) => void; editable?: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const { refreshUnreadCount } = useNotifications();
  const assign = async (assignment: 'me' | 'release') => {
    setBusy(true); setError('');
    try { const body = await adminFetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignment, editVersion: record.editVersion || 0 }) }); onUpdated(body.data); announceRequestsChanged(); await refreshUnreadCount(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to update assignment'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2 rounded-md border p-3 text-sm">
    <p>Assigned to: <strong>{record.assignedName || 'Unassigned'}</strong></p>
    {editable && <div className="flex gap-2"><button type="button" disabled={busy} className="rounded border px-2 py-1" onClick={() => void assign('me')}>Assign to me</button>{record.assignedTo && <button type="button" disabled={busy} className="rounded border px-2 py-1" onClick={() => void assign('release')}>Release assignment</button>}</div>}
    <button type="button" disabled={busy} className="rounded border px-2 py-1" onClick={async () => { try { const body = await adminFetch(url); (onReload || onUpdated)(body.data); setError(''); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to reload request'); } }}>Reload latest request</button>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <p className="text-xs text-muted-foreground">Status changes are internal records. Contact the customer separately to send a confirmation or reply.</p>
    <details><summary className="cursor-pointer">Activity history ({record.history?.length || 0})</summary><ul className="mt-2 space-y-1">{record.history?.slice().reverse().map((entry, index) => <li key={index}>{new Date(entry.at).toLocaleString()} ? {entry.actorName || 'Employee'} ? {entry.status} ? {entry.changes.join(', ')}</li>) || <li>No changes recorded yet.</li>}</ul></details>
  </div>;
}
