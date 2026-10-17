"use client";
import React from 'react';
import { useNotifications } from './NotificationContext';
export function ContactFormProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function useContactForm() {
  const { counts, refreshUnreadCount } = useNotifications();
  return { newCount: counts.contactNew, refreshCount: refreshUnreadCount };
}
