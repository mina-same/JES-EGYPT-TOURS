"use client";
import React from 'react';
import { useNotifications } from './NotificationContext';
export function TailorMadeProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function useTailorMade() {
  const { counts, refreshUnreadCount } = useNotifications();
  return { unreadCount: counts.tailorMadePending, refreshUnreadCount: refreshUnreadCount };
}
