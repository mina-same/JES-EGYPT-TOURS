"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import UserTable from '@/components/dashboard/UserManagement/UserTable';
import UserModal from '@/components/dashboard/UserManagement/UserModal';
import { userAPI, authAPI, User, RegisterData } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import './modern-users.css';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { user: currentUser } = useAuth();

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await userAPI.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  // Handle create/edit user
  const handleSubmit = async (data: RegisterData) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      if (selectedUser) {
        // Update user
        await userAPI.updateUser(selectedUser.id, {
          name: data.name,
          role: data.role,
        });
        setSuccess('User updated successfully');
      } else {
        // Create user
        await authAPI.register(data);
        setSuccess('User created successfully');
      }
      
      await fetchUsers();
      setShowModal(false);
      setSelectedUser(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    try {
      setError('');
      await userAPI.deleteUser(userId);
      setSuccess('User deleted successfully');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (userId: string, newStatus: boolean) => {
    try {
      setError('');
      await userAPI.updateUser(userId, { isActive: newStatus });
      setSuccess(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  // Handle edit user
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Handle create new user
  const handleCreateNew = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    filtered: filteredUsers.length,
  };

  return (
    <div className="users-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">Manage administrator accounts and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-refresh" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-add-user" onClick={handleCreateNew}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Administrator
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Users size={20} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-active">
            <CheckCircle size={20} />
          </div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-inactive">
            <XCircle size={20} />
          </div>
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-filtered">
            <Filter size={20} />
          </div>
          <div className="stat-value">{stats.filtered}</div>
          <div className="stat-label">Filtered Results</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading}
      />

      {/* User Modal */}
      <UserModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleSubmit}
        user={selectedUser}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default UsersPage;
