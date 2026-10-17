"use client";
import { useEffect, useRef } from 'react';
import { ADMIN_REQUESTS_CHANGED } from '@/lib/adminNotifications';
/** Refresh lists from the same durable synchronization that drives badges. */
export function useAdminRequestListRefresh(refresh: () => void | Promise<void>) {
  const callback = useRef(refresh);
  useEffect(() => { callback.current = refresh; });
  useEffect(() => {
    const update = () => { void callback.current(); };
    window.addEventListener(ADMIN_REQUESTS_CHANGED, update);
    return () => window.removeEventListener(ADMIN_REQUESTS_CHANGED, update);
  }, []);
}
