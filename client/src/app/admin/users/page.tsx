"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, RefreshCw, CheckCircle, XCircle, Edit2, Trash2, Plus } from 'lucide-react';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { userAPI, User } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { PaginationControls } from '@/components/admin/PaginationControls';

const UsersPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
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

  const detailedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, page, limit]);

  // Handle delete user
  const handleDelete = async (userId: string) => {
    setDeleteIds([userId]);
    setDeleteModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;
    setDeleteIds(selectedRowKeys);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteIds.length === 0) return;
    setDeleteBusy(true);
    try {
      await Promise.all(deleteIds.map((id) => userAPI.deleteUser(id)));
      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Administrator deleted successfully.'
            : `${deleteIds.length} administrators deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete user(s)';
      setError(msg);
      toast({
        title: 'Delete failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setDeleteBusy(false);
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

  // Handle create new user
  const handleCreateNew = () => {
    router.push('/admin/users/new');
  };

  const handleEdit = (user: User) => {
    router.push(`/admin/users/${user.id}/edit`);
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    filtered: filteredUsers.length,
    superadmins: users.filter(u => (u as any).role === 'superadmin').length,
    admins: users.filter(u => (u as any).role === 'admin').length,
  };

  const columns: Array<AdminTableColumn<User>> = [
    {
      header: 'User',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Users size={20} className="text-gray-500 dark:text-slate-400" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
            <div className="text-sm text-gray-500 dark:text-slate-400">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (user) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          (user as any).role === 'superadmin' 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {(user as any).role || 'admin'}
        </span>
      ),
    },
    {
      header: 'Status',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (user) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.isActive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {user.isActive ? (
            <>
              <CheckCircle size={12} className="mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle size={12} className="mr-1" />
              Inactive
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            onClick={() => handleEdit(user)}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            className={`p-2 text-gray-400 rounded-md transition-colors disabled:opacity-50 ${
              user.isActive
                ? 'hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                : 'hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
            onClick={() => handleToggleStatus(user.id, !user.isActive)}
            title={user.isActive ? 'Deactivate' : 'Activate'}
          >
            {user.isActive ? (
              <XCircle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
          </button>
          <button
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            onClick={() => handleDelete(user.id)}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (initialLoad) {
    return <AdminPageSkeleton showStats showFilters tableRows={8} />;
  }

  return (
    <div className="users-admin admin-scope">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Administrators</h1>
          <p className="admin-page-subtitle">Manage superadmin and admin accounts and permissions</p>
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
        <StatCard icon={Users} value={stats.total} label="Total Administrators" iconVariant="total" />
        <StatCard icon={CheckCircle} value={stats.active} label="Active" iconVariant="active" />
        <StatCard icon={XCircle} value={stats.inactive} label="Inactive" iconVariant="inactive" />
        <StatCard icon={Filter} value={stats.superadmins} label="Superadmins" iconVariant="filtered" />
        <StatCard icon={Filter} value={stats.admins} label="Admins" iconVariant="filtered" />
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

      <BulkActionsBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        onDeleteSelected={handleBulkDelete}
        deleteDisabled={isLoading}
      />

      {/* Administrators Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 shadow-sm overflow-hidden">
        <AdminTable<User>
          data={detailedUsers}
          columns={columns}
          getRowKey={(row) => row.id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={isLoading}
          loadingNode={
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={48} className="animate-spin text-gray-400 dark:text-slate-600" />
              <span className="ml-3 text-gray-500 dark:text-slate-400">Loading administrators...</span>
            </div>
          }
          emptyNode={
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-gray-400 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No administrators found</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-6">There are no administrators matching your criteria.</p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Add First Administrator
              </button>
            </div>
          }
          wrapperClassName="overflow-x-auto"
          tableClassName="w-full"
          theadClassName="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700"
          tbodyClassName="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800"
          rowClassName="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(stats.filtered / limit)}
          totalItems={stats.filtered}
          itemsPerPage={limit}
          onPageChange={setPage}
          onItemsPerPageChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (deleteBusy) return;
          setDeleteModalOpen(open);
          if (!open) setDeleteIds([]);
        }}
        count={deleteIds.length}
        onConfirm={confirmDelete}
        confirmDisabled={deleteBusy}
      />
    </div>
  );
};

export default UsersPage;
