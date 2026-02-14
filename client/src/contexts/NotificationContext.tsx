"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAdminSocket } from '@/lib/realtime/adminSocket';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '@/config/api';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}?status=unread&limit=1`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      const socket = getAdminSocket();
      if (socket) {
        const handleNotification = () => {
          fetchUnreadCount();
        };

        socket.on('admin-notification', handleNotification);

        return () => {
          socket.off('admin-notification', handleNotification);
        };
      }
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount: fetchUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
