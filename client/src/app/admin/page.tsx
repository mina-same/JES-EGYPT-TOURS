"use client";
import React from 'react';
import { Users, FileText, Map, Mail, TrendingUp, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    { icon: Users, number: '1,234', label: 'Total Users', trend: '+12%', color: '#3b82f6' },
    { icon: FileText, number: '567', label: 'Blog Posts', trend: '+8%', color: '#8b5cf6' },
    { icon: Map, number: '89', label: 'Tours', trend: '+23%', color: '#06b6d4' },
    { icon: Mail, number: '234', label: 'Contact Forms', trend: '+5%', color: '#10b981' },
  ];

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
                <span className="quick-stat-value">98.5%</span>
                <span className="quick-stat-label">Uptime</span>
              </div>
              <div className="quick-stat-divider"></div>
              <div className="quick-stat-item">
                <span className="quick-stat-value">2.4k</span>
                <span className="quick-stat-label">Active Users</span>
              </div>
              <div className="quick-stat-divider"></div>
              <div className="quick-stat-item">
                <span className="quick-stat-value">+15%</span>
                <span className="quick-stat-label">Growth</span>
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
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties} suppressHydrationWarning>
              <div className="stat-card-header">
                <div className="stat-icon-wrapper">
                  <IconComponent size={24} />
                </div>
                <div className="stat-trend">
                  <TrendingUp size={14} />
                  <span>{stat.trend}</span>
                </div>
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
