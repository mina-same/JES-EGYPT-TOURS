"use client";
import React from 'react';
import { useNotifications } from './NotificationContext';
export function BookingProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function useBooking() {
  const { counts, refreshUnreadCount } = useNotifications();
  return { pendingCount: counts.bookingsPending, refreshCount: refreshUnreadCount };
}
