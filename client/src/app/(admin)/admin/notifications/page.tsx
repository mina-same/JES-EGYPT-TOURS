"use client";

import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { Bell, Trash2, CheckCircle, Check, Filter } from 'lucide-react';
import { getAdminSocket } from '@/lib/realtime/adminSocket';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';

interface Notification {
  _id: string;
  type: 'contact' | 'tailorMade' | 'booking' | 'system';
  title: string;
  message: string;
  createdAt: string;
  readBy: string[];
  isRead: boolean;
  entityId?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { toast } = useToast();
  const { refreshUnreadCount } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications
    const socket = getAdminSocket();
    if (socket) {
      const handleNewNotification = () => {
        console.log('New notification received, refreshing list...');
        fetchNotifications();
        refreshUnreadCount();
        toast({
          title: "New notification",
          description: "A new notification has arrived",
        });
      };

      socket.on('admin-notification', handleNewNotification);

      return () => {
        socket.off('admin-notification', handleNewNotification);
      };
    }
  }, [toast, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const query = filter !== 'all' ? `?status=${filter}` : '';
      
      const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const token = localStorage.getItem('authToken');
      await fetch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Optimistic update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshUnreadCount();
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('authToken');
      await fetch(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast({
        title: "Deleted",
        description: "Notification deleted",
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    if (notification.entityId) {
      switch (notification.type) {
        case 'booking':
          router.push(`/admin/tour/booking?id=${notification.entityId}`);
          break;
        case 'contact':
          router.push(`/admin/contact-forms/contact-form?id=${notification.entityId}`);
          break;
        case 'tailorMade':
          router.push(`/admin/contact-forms/tailor-made?id=${notification.entityId}`);
          break;
        default:
          break;
      }
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'contact': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'tailorMade': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      case 'booking': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading && notifications.length === 0) {
    return <AdminPageSkeleton showStats={false} showFilters={false} tableRows={5} />;
  }

  return (
    <div className="admin-scope">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Notifications</h1>
          <p className="admin-page-subtitle">Manage your alerts and updates</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={markAllAsRead}
            className="btn-secondary flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm shadow-gray-200/50 dark:shadow-none">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-4 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'unread' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'read' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            Read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Bell className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-medium">No notifications found</p>
            <p className="text-sm opacity-70">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 transition-colors cursor-pointer group border-l-4 ${
                  notification.isRead 
                    ? 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50 border-transparent' 
                    : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${getIconColor(notification.type)}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-sm truncate ${
                        notification.isRead ? 'text-gray-700 dark:text-slate-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    
                    <p className={`text-sm mb-2 line-clamp-2 ${
                      notification.isRead ? 'text-gray-500 dark:text-slate-500' : 'text-gray-600 dark:text-slate-400'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => markAsRead(notification._id, e)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification._id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
