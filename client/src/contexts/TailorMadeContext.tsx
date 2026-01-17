"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS } from '@/config/api';

interface TailorMadeContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const TailorMadeContext = createContext<TailorMadeContextType | undefined>(undefined);

export const TailorMadeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_ENDPOINTS.TAILOR_MADE.BASE}?status=pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    refreshUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TailorMadeContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </TailorMadeContext.Provider>
  );
};

export const useTailorMade = () => {
  const context = useContext(TailorMadeContext);
  if (context === undefined) {
    throw new Error('useTailorMade must be used within a TailorMadeProvider');
  }
  return context;
};
