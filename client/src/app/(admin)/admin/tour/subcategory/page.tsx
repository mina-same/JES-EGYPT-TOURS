'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tourSubcategoryAPI, tourCategoryAPI } from '@/lib/api/tour';
import { ITourSubcategory, ITourCategory } from '@/types/tour';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, Layers, CheckCircle, 
  XCircle, FolderTree, Tag
} from 'lucide-react';
import Image from 'next/image';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { PaginationControls } from '@/components/admin/PaginationControls';

export default function TourSubcategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<ITourSubcategory[]>([]);
  const [categories, setCategories] = useState<ITourCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await tourCategoryAPI.getAll({ limit: 100 });
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch subcategories
  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      };
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      const response = await tourSubcategoryAPI.getAll(params);
      
      if (response.success && response.data) {
        setSubcategories(response.data);
        setTotalPages(response.totalPages || 1);
      } else {
        setError(response.error || 'Failed to fetch subcategories');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubcategories();
  }, [page, searchTerm, statusFilter, categoryFilter]);

  // Delete subcategory
  const handleDelete = async (id: string) => {
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
    setDeleting(deleteIds.length === 1 ? deleteIds[0] : 'bulk');
    try {
      const results = await Promise.all(deleteIds.map((id) => tourSubcategoryAPI.delete(id)));
      const failed = results.find((r: any) => !r?.success);
      if (failed) {
        throw new Error((failed as any).error || 'Failed to delete subcategory(ies)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Subcategory deleted successfully.'
            : `${deleteIds.length} subcategories deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchSubcategories();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete subcategory(ies)';
      setError(msg);
      toast({
        title: 'Delete failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
      setDeleteBusy(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (id: string) => {
    try {
      setToggling(id);
      const response = await tourSubcategoryAPI.toggleStatus(id);
      
      if (response.success && response.data) {
        setSubcategories(subcategories.map(s => 
          s._id === id ? { ...s, isActive: response.data.isActive } : s
        ));
      } else {
        setError(response.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setToggling(null);
    }
  };

  // Get category name
  const getCategoryName = (category: any) => {
    // Handle both populated object and ID string
    if (typeof category === 'object' && category?.name) {
      return typeof category.name === 'object' ? category.name.en : category.name;
    }
    if (typeof category === 'string') {
      const found = categories.find(c => c._id === category);
      if (!found) return 'Unknown Category';
      return typeof found.name === 'object' ? found.name.en : found.name;
    }
    return 'Unknown Category';
  };

  // Calculate stats
  const stats = {
    total: subcategories.length,
    active: subcategories.filter(s => s.isActive).length,
    inactive: subcategories.filter(s => !s.isActive).length,
    totalTours: subcategories.reduce((sum, s) => sum + (s.toursCount || 0), 0),
  };

  // Filter subcategories by search
  const filteredSubcategories = subcategories.filter(subcategory => {
    const searchLower = searchTerm.toLowerCase();
    const name = subcategory.name;
    const slug = subcategory.slug;
    
    return (
      (name?.en || '').toLowerCase().includes(searchLower) ||
      (name?.de || '').toLowerCase().includes(searchLower) ||
      (name?.it || '').toLowerCase().includes(searchLower) ||
      (name?.es || '').toLowerCase().includes(searchLower) ||
      (slug?.en || '').toLowerCase().includes(searchLower) ||
      (slug?.de || '').toLowerCase().includes(searchLower) ||
      (slug?.it || '').toLowerCase().includes(searchLower) ||
      (slug?.es || '').toLowerCase().includes(searchLower)
    );
  });

  const columns: Array<AdminTableColumn<ITourSubcategory>> = [
    {
      header: 'Subcategory',
      render: (subcategory) => (
        <div className="subcategory-info">
          {(() => {
            const displayImage = subcategory.images?.[0] || (subcategory as any).image;
            if (!displayImage?.url) return null;
            return (
              <img
                src={displayImage.url}
                alt={typeof displayImage.alt === 'object' ? displayImage.alt.en : (typeof subcategory.name === 'object' ? subcategory.name.en : subcategory.name)}
                className="subcategory-image"
              />
            );
          })()}
          <div className="subcategory-details">
            <div className="subcategory-name">
              {typeof subcategory.name === 'object' ? subcategory.name.en : subcategory.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (subcategory) => (
        <span className="category-badge">
          <FolderTree size={14} />
          {getCategoryName(subcategory.category)}
        </span>
      ),
    },
    {
      header: 'Slug',
      render: (subcategory) => {
        const slug = typeof subcategory.slug === 'object' ? subcategory.slug.en : subcategory.slug;
        return <div className="subcategory-slug">/{slug}</div>;
      },
    },
    {
      header: 'Status',
      render: (subcategory) => (
        <span className={`status-badge ${subcategory.isActive ? 'status-active' : 'status-inactive'}`}>
          {subcategory.isActive ? (
            <>
              <CheckCircle size={14} /> Active
            </>
          ) : (
            <>
              <XCircle size={14} /> Inactive
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Tours',
      render: (subcategory) => (
        <div className="tours-count">
          <Layers size={14} />
          {subcategory.toursCount || 0}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (subcategory) => (
        <div className="action-buttons">
          <Link href={`/admin/tour/subcategory/new?id=${subcategory._id}`}>
            <button className="btn-icon btn-edit" title="Edit">
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className="btn-icon btn-toggle"
            onClick={() => handleToggleStatus(subcategory._id)}
            disabled={toggling === subcategory._id}
            title={subcategory.isActive ? 'Deactivate' : 'Activate'}
          >
            {subcategory.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDelete(subcategory._id)}
            disabled={deleting === subcategory._id}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="tour-subcategory-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tour Subcategories</h1>
          <p className="admin-page-subtitle">Manage tour subcategories and organize your tours by specific types</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchSubcategories} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href="/admin/tour/subcategory/new" className="btn-add-new">
            <Plus size={18} />
            New Subcategory
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={Tag} value={stats.total} label="Total Subcategories" iconVariant="total" />
        <StatCard icon={CheckCircle} value={stats.active} label="Active" iconVariant="active" />
        <StatCard icon={XCircle} value={stats.inactive} label="Inactive" iconVariant="inactive" />
        <StatCard icon={Layers} value={stats.totalTours} label="Total Tours" iconVariant="tours" />
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <FolderTree size={18} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {typeof category.name === 'object' ? category.name.en : category.name}
              </option>
            ))}
          </select>
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <BulkActionsBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        onDeleteSelected={handleBulkDelete}
        deleteDisabled={loading}
      />

      {/* Subcategories Table */}
      <div className="subcategories-table-container">
        <AdminTable<ITourSubcategory>
          data={filteredSubcategories}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className="loading-state">
              <Loader2 size={48} className="spinner" />
              <p>Loading subcategories...</p>
            </div>
          }
          emptyNode={
            <div className="empty-state">
              <Tag size={64} />
              <h3>No subcategories found</h3>
              <p>There are no tour subcategories matching your criteria.</p>
              <Link href="/admin/tour/subcategory/new" className="btn-add-new" style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First Subcategory
              </Link>
            </div>
          }
          tableClassName="subcategories-table"
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={stats.total}
          itemsPerPage={10}
          onPageChange={setPage}
          onItemsPerPageChange={() => {}}
          disableLimitChange={true}
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
