"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { getAdminSocket, disconnectAdminSocket } from '@/lib/realtime/adminSocket';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import { ADMIN_REQUESTS_CHANGED, ADMIN_NOTIFICATIONS_CHANGED, type AdminNotification } from '@/lib/adminNotifications';
interface Counts { bookingsPending: number; contactNew: number; tailorMadePending: number; updatedAt?: string }
interface NotificationContextType {
  unreadCount: number; counts: Counts; connected: boolean; syncError: string | null;
  events: AdminNotification[]; refreshUnreadCount: () => Promise<void>;
}
const zeroCounts = { bookingsPending: 0, contactNew: 0, tailorMadePending: 0 };
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0), [counts, setCounts] = useState<Counts>(zeroCounts);
  const [events, setEvents] = useState<AdminNotification[]>([]), [connected, setConnected] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncRef = useRef<() => Promise<void>>(async () => {});
  const refreshUnreadCount = useCallback(() => syncRef.current(), []);
  const accountKey = user ? `${user.id}:${(user.permissions || []).join(',')}:${user.role}` : '';
  useEffect(() => {
    setUnreadCount(0); setCounts(zeroCounts); setEvents([]); setConnected(false); setSyncError(null);
    if (!user) { disconnectAdminSocket(); return; }
    let cancelled = false, running = false, again = false, timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const seen = new Set<string>();
    const synchronize = async () => {
      if (cancelled) return;
      if (running) { again = true; return; }
      running = true;
      let delay = 30000;
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        let more = true;
        const received: AdminNotification[] = [];
        while (more && !cancelled) {
          const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/sync`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
          if (response.status === 401) {
            disconnectAdminSocket(); localStorage.setItem('auth_redirect', window.location.pathname + window.location.search);
            localStorage.removeItem('authToken'); localStorage.removeItem('user'); window.location.assign('/login'); return;
          }
          if (response.status === 429) delay = Math.max(30000, Number(response.headers.get('Retry-After') || 60) * 1000);
          const body = await response.json();
          if (!response.ok || !body.success) throw new Error(body.error || 'Notifications could not synchronize. Retrying automatically.');
          if (cancelled) return;
          setUnreadCount(body.unreadCount || 0); setCounts(body.counts || zeroCounts);
          const batch: AdminNotification[] = body.data || [];
          const fresh = batch.filter(item => !seen.has(item._id));
          fresh.forEach(item => seen.add(item._id));
          received.push(...fresh);
          if (received.length) setEvents([...received]);
          if (batch.length) {
            const acknowledgment = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/ack`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: batch.map(item => item._id) }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
            if (!acknowledgment.ok) throw new Error('Notification delivery will be retried.');
          }
          more = body.hasMore;
        }
        if (received.length) { window.dispatchEvent(new Event(ADMIN_NOTIFICATIONS_CHANGED)); }
        window.dispatchEvent(new Event(ADMIN_REQUESTS_CHANGED));
        setSyncError(null);
        setConnected(Boolean(socket?.connected));
      } catch (error) {
        if (!cancelled) { setConnected(false); setSyncError(error instanceof Error ? error.message : 'Notifications could not synchronize.'); }
      } finally {
        running = false;
        if (!cancelled) { clearTimeout(timer); timer = setTimeout(() => void synchronize(), delay); }
        if (again && !cancelled) { again = false; void synchronize(); }
      }
    };
    syncRef.current = synchronize;
    const socket = getAdminSocket();
    const onConnect = () => { setConnected(true); void synchronize(); };
    const onDisconnect = (reason?: string) => {
      setConnected(false); void synchronize();
      if (reason === 'io server disconnect') {
        void fetch(API_ENDPOINTS.AUTH.ME, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }).then(response => {
          if (response.ok && !cancelled) socket?.connect();
        }).catch(() => {});
      }
    };
    const onChanged = () => void synchronize();
    const onConnectError = () => onDisconnect();
    socket?.on('connect', onConnect); socket?.on('notification:new', onChanged); socket?.on('dashboard:stats', onChanged);
    socket?.on('disconnect', onDisconnect); socket?.on('connect_error', onConnectError);
    if (socket?.connected) setConnected(true);
    window.addEventListener('focus', onChanged);
    document.addEventListener('visibilitychange', onChanged);
    void synchronize();
    return () => {
      cancelled = true; controller.abort(); clearTimeout(timer); syncRef.current = async () => {};
      socket?.off('connect', onConnect); socket?.off('notification:new', onChanged); socket?.off('dashboard:stats', onChanged);
      socket?.off('disconnect', onDisconnect); socket?.off('connect_error', onConnectError);
      window.removeEventListener('focus', onChanged); document.removeEventListener('visibilitychange', onChanged);
    };
  // Account/permission changes reset the transport; callbacks stay stable across count updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountKey]);
  return <NotificationContext.Provider value={{ unreadCount, counts, events, connected, syncError, refreshUnreadCount }}>{children}</NotificationContext.Provider>;
}
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
