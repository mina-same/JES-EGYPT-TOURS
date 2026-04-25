'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { destinationAPI } from '@/lib/api/blogAdmin';
import { 
  Loader2, Plus, Edit2, Trash2, Search, Filter, 
  RefreshCw, MapPin, CheckCircle, XCircle, Eye, EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { getLocalizedValue } from '@/lib/localize';

export default function DestinationsListPage() {
  const { toast } = useToast();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        search: searchTerm || undefined,
        limit: 100
      };
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }
      const res = await destinationAPI.getAll(params);
      setDestinations(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load destinations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchDestinations, 300);
    return () => clearTimeout(timer);
  }, [fetchDestinations]);

  const handleDelete = (id: string) => {
    setDeleteIds([id]);
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
      await Promise.all(deleteIds.map(id => destinationAPI.delete(id)));
      toast({ 
        title: 'Deleted', 
        description: deleteIds.length === 1 ? 'Destination deleted.' : `${deleteIds.length} destinations deleted.` 
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      fetchDestinations();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete destination(s)', variant: 'destructive' });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await destinationAPI.toggleStatus(id);
      if (res.success) {
        setDestinations(prev => prev.map(d => d._id === id ? { ...d, isActive: !d.isActive } : d));
        toast({ title: 'Updated', description: 'Status changed.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle status', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const stats = {
    total: destinations.length,
    active: destinations.filter(d => d.isActive).length,
    inactive: destinations.filter(d => !d.isActive).length,
  };

  const columns: Array<AdminTableColumn<any>> = [
    {
      header: 'Destination',
      render: (dest) => (
        <div className="category-info">
          {dest.coverImage?.url ? (
            <img src={dest.coverImage.url} alt="" className="category-image" />
          ) : (
            <div className="category-image d-flex align-items-center justify-content-center bg-gray-100">
              <MapPin size={20} className="text-gray-400" />
            </div>
          )}
          <div className="category-details">
            <div className="category-name">{getLocalizedValue(dest.name)}</div>
            {dest.region && (
              <div className="tour-meta-item">
                <MapPin size={12} />
                {getLocalizedValue(dest.region)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Slug',
      render: (dest) => <code className="category-slug">/{getLocalizedValue(dest.slug)}</code>,
    },
    {
      header: 'Status',
      render: (dest) => (
        <span className={`status-badge ${dest.isActive ? 'status-active' : 'status-inactive'}`}>
          {dest.isActive ? (
            <><CheckCircle size={14} /> Active</>
          ) : (
            <><XCircle size={14} /> Inactive</>
          )}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (dest) => (
        <div className="action-buttons">
          <Link href={`/admin/destinations/new?edit=${dest._id}`}>
            <button className="btn-icon btn-edit" title="Edit">
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className="btn-icon btn-toggle"
            onClick={() => handleToggle(dest._id)}
            disabled={togglingId === dest._id}
            title={dest.isActive ? 'Deactivate' : 'Activate'}
          >
            {togglingId === dest._id ? (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            ) : dest.isActive ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDelete(dest._id)}
            disabled={deletingId === dest._id}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="destinations-admin admin-scope">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Destinations</h1>
          <p className="admin-page-subtitle">Manage your travel destinations and regions</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchDestinations} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href="/admin/destinations/new" className="btn-add-new">
            <Plus size={18} />
            New Destination
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={MapPin} value={stats.total} label="Total Destinations" iconVariant="total" />
        <StatCard icon={CheckCircle} value={stats.active} label="Active" iconVariant="active" />
        <StatCard icon={XCircle} value={stats.inactive} label="Inactive" iconVariant="inactive" />
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        onDeleteSelected={handleBulkDelete}
        deleteDisabled={loading}
      />

      {/* Destinations Table */}
      <div className="tours-table-container">
        <AdminTable<any>
          data={destinations}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className="loading-state">
              <Loader2 size={48} className="spinner" />
              <p>Loading destinations...</p>
            </div>
          }
          emptyNode={
            <div className="empty-state">
              <MapPin size={64} />
              <h3>No destinations found</h3>
              <p>There are no destinations matching your criteria.</p>
              <Link href="/admin/destinations/new" className="btn-add-new" style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First Destination
              </Link>
            </div>
          }
          tableClassName="tours-table"
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
}
