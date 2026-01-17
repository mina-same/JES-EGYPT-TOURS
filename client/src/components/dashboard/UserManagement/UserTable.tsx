"use client";
import React, { useState } from 'react';
import { User } from '@/lib/api/auth';
import DeleteConfirmModal from './DeleteConfirmModal';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
  isLoading?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading = false,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete?.id) return;
    
    setDeletingId(userToDelete.id);
    try {
      await onDelete(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      await onToggleStatus(userId, !currentStatus);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
      '#10b981', '#06b6d4', '#6366f1', '#f97316'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <div className="table-container">
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h3>Loading Users</h3>
          <p>Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-illustration">
            <svg viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" fill="#f3f4f6" />
              <path d="M100 60c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 60c-16.5 0-30 6.7-30 15v5h60v-5c0-8.3-13.5-15-30-15z" fill="#d1d5db" />
              <circle cx="140" cy="70" r="15" fill="#e5e7eb" />
              <circle cx="60" cy="70" r="15" fill="#e5e7eb" />
            </svg>
          </div>
          <h3>No Users Found</h3>
          <p>There are no users matching your search criteria.</p>
          <div className="empty-actions">
            <button className="btn-empty-action" onClick={() => window.location.reload()}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DeleteConfirmModal
        show={showDeleteModal}
        user={userToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={!!deletingId}
      />
      
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id || user.email || index}>
                <td>
                  <div className="user-info">
                    <div 
                      className="avatar" 
                      style={{ backgroundColor: getAvatarColor(user.name) }}
                    >
                      {getInitials(user.name)}
                    </div>
                    <span className="user-name">{user.name}</span>
                  </div>
                </td>
                <td>
                  <span className="email">{user.email}</span>
                </td>
                <td>
                  <span className="role-badge">Admin</span>
                </td>
                <td>
                  <button
                    className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}
                    onClick={() => user.id && handleToggleStatus(user.id, user.isActive)}
                    disabled={!user.id || togglingId === user.id}
                  >
                    {togglingId === user.id ? (
                      <span className="mini-spinner"></span>
                    ) : (
                      <>
                        <span className="status-dot"></span>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </>
                    )}
                  </button>
                </td>
                <td>
                  <span className="date">{formatDate(user.createdAt)}</span>
                </td>
                <td>
                  <div className="actions">
                    <button
                      className="action-btn edit"
                      onClick={() => onEdit(user)}
                      title="Edit user"
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteClick(user)}
                      title="Delete user"
                      disabled={deletingId === user.id}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 20px;
          text-align: center;
        }

        .loading-spinner {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 24px;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-radius: 50%;
          animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .spinner-ring:nth-child(1) {
          border-top-color: #d4af37;
          animation-delay: -0.45s;
        }

        .spinner-ring:nth-child(2) {
          border-top-color: #f4d03f;
          animation-delay: -0.3s;
        }

        .spinner-ring:nth-child(3) {
          border-top-color: #d4af37;
          animation-delay: -0.15s;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-state h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .loading-state p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 20px;
          text-align: center;
        }

        .empty-illustration {
          width: 160px;
          height: 160px;
          margin-bottom: 24px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .empty-illustration svg {
          width: 100%;
          height: 100%;
        }

        .empty-state h3 {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 15px;
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        .empty-actions {
          display: flex;
          gap: 12px;
        }

        .btn-empty-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-empty-action svg {
          width: 18px;
          height: 18px;
        }

        .btn-empty-action:hover {
          background: #f9fafb;
          border-color: #d4af37;
          color: #d4af37;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
        }

        .user-table thead {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .user-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .actions-header {
          text-align: right;
        }

        .user-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s ease;
        }

        .user-table tbody tr:last-child {
          border-bottom: none;
        }

        .user-table tbody tr:hover {
          background: #f9fafb;
        }

        .user-table td {
          padding: 16px;
          font-size: 14px;
          color: #111827;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 500;
          color: #111827;
        }

        .email {
          color: #6b7280;
          font-size: 14px;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(244, 208, 63, 0.1) 100%);
          color: #92400e;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.active:hover:not(:disabled) {
          background: #a7f3d0;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.inactive:hover:not(:disabled) {
          background: #fecaca;
        }

        .status-badge:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .mini-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .date {
          color: #6b7280;
          font-size: 13px;
        }

        .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }

        .action-btn svg {
          width: 18px;
          height: 18px;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .action-btn.edit:hover:not(:disabled) {
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border-color: #d4af37;
        }

        .action-btn.edit:hover:not(:disabled) svg {
          color: white;
        }

        .action-btn.delete:hover:not(:disabled) {
          background: #ef4444;
          border-color: #ef4444;
        }

        .action-btn.delete:hover:not(:disabled) svg {
          color: white;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .user-table th,
          .user-table td {
            padding: 12px;
            font-size: 13px;
          }

          .avatar {
            width: 36px;
            height: 36px;
            font-size: 12px;
          }

          .user-name {
            font-size: 13px;
          }

          .email {
            font-size: 12px;
          }

          .action-btn {
            width: 32px;
            height: 32px;
          }

          .action-btn svg {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default UserTable;
