"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Users, Map, Mail, Calendar, MessageSquare, Activity } from 'lucide-react';
import { getAdminSocket } from '@/lib/realtime/adminSocket';

type AdminNotificationType = 'booking' | 'tailorMade' | 'contact';

interface AdminNotificationPayload {
  type: AdminNotificationType;
  title: string;
  entityId: string;
  createdAt: string;
}

interface AdminDashboardStats {
  usersTotal: number;
  toursTotal: number;
  toursActive: number;
  bookingsTotal: number;
  bookingsPending: number;
  contactNew: number;
  tailorMadePending: number;
  updatedAt: string;
}

const AdminDashboard: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [activityFeed, setActivityFeed] = useState<AdminNotificationPayload[]>([]);

  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) return;

    const onStats = (stats: AdminDashboardStats) => {
      setDashboardStats(stats);
    };

    const onSeed = (items: AdminNotificationPayload[]) => {
      setActivityFeed(Array.isArray(items) ? items : []);
    };

    const onActivityNew = (payload: AdminNotificationPayload) => {
      setActivityFeed((prev) => [payload, ...prev].slice(0, 30));
    };

    socket.on('dashboard:stats', onStats);
    socket.on('dashboard:activity:seed', onSeed);
    socket.on('dashboard:activity:new', onActivityNew);

    return () => {
      socket.off('dashboard:stats', onStats);
      socket.off('dashboard:activity:seed', onSeed);
      socket.off('dashboard:activity:new', onActivityNew);
    };
  }, []);

  const cards = useMemo(() => {
    return [
      {
        icon: Users,
        number: dashboardStats?.usersTotal ?? '—',
        label: 'Total Users',
        color: '#3b82f6',
      },
      {
        icon: Map,
        number: dashboardStats?.toursTotal ?? '—',
        label: 'Total Tours',
        color: '#06b6d4',
      },
      {
        icon: Activity,
        number: dashboardStats?.toursActive ?? '—',
        label: 'Active Tours',
        color: '#10b981',
      },
      {
        icon: Calendar,
        number: dashboardStats?.bookingsPending ?? '—',
        label: 'Pending Bookings',
        color: '#059669',
      },
      {
        icon: Mail,
        number: dashboardStats?.contactNew ?? '—',
        label: 'New Contact Forms',
        color: '#2563eb',
      },
      {
        icon: MessageSquare,
        number: dashboardStats?.tailorMadePending ?? '—',
        label: 'Pending Tailor-Made',
        color: '#d97706',
      },
    ];
  }, [dashboardStats]);

  return (
    <div className="dashboard-overview" suppressHydrationWarning>
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-text">
            <div className="dashboard-greeting">
              <span className="greeting-badge">👋 Welcome Back</span>
              <h1 className="dashboard-title">Admin Dashboard</h1>
            </div>
            <p className="dashboard-subtitle">
              Here's what's happening with your platform today. Manage content, monitor users, and track performance.
            </p>
            <div className="dashboard-quick-stats">
              <div className="quick-stat-item">
                <span className="quick-stat-value">{dashboardStats?.bookingsTotal ?? '—'}</span>
                <span className="quick-stat-label">Total Bookings</span>
              </div>
              <div className="quick-stat-divider"></div>
              <div className="quick-stat-item">
                <span className="quick-stat-value">{dashboardStats?.bookingsPending ?? '—'}</span>
                <span className="quick-stat-label">Pending Bookings</span>
              </div>
              <div className="quick-stat-divider"></div>
              <div className="quick-stat-item">
                <span className="quick-stat-value">{dashboardStats?.updatedAt ? new Date(dashboardStats.updatedAt).toLocaleTimeString() : '—'}</span>
                <span className="quick-stat-label">Last Update</span>
              </div>
            </div>
          </div>
          <div className="dashboard-header-visual">
            <div className="header-icon-wrapper">
              <Activity size={64} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid" suppressHydrationWarning>
        {cards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties} suppressHydrationWarning>
              <div className="stat-card-header">
                <div className="stat-icon-wrapper">
                  <IconComponent size={24} />
                </div>
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-activity" suppressHydrationWarning>
        <div className="dashboard-activity-header">
          <h2 className="dashboard-activity-title">Live Activity</h2>
        </div>
        <div className="dashboard-activity-list">
          {activityFeed.length === 0 ? (
            <div className="dashboard-activity-empty">No recent activity</div>
          ) : (
            activityFeed.map((item) => (
              <div key={`${item.type}:${item.entityId}:${item.createdAt}`} className="dashboard-activity-item">
                <div className="dashboard-activity-item-title">{item.title}</div>
                <div className="dashboard-activity-item-meta">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
