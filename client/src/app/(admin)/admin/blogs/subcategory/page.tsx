'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { blogSubcategoryAPI } from '@/lib/api/blogAdmin';
import { BlogSubCategory, BlogCategory } from '@/lib/api/blog';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, FolderOpen, CheckCircle, 
  XCircle, Layers, ArrowRight
} from 'lucide-react';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { getLocalizedValue } from '@/lib/localize';

const getImageUrl = (image: any) => {
  if (!image) return '';
  return typeof image === 'string' ? image : image.url || '';
};

const getImageTitle = (image: any, fallback: any) => {
  if (!image || typeof image === 'string') return getLocalizedValue(fallback);
  return getLocalizedValue(image.title) || getLocalizedValue(image.alt) || getLocalizedValue(fallback);
};

export default function BlogSubCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<BlogSubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Fetch subcategories
  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: 10,
        search: searchTerm || undefined,
      };
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      const response: any = await blogSubcategoryAPI.getAll(params);
      
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
    fetchSubcategories();
  }, [page, searchTerm, statusFilter]);

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
      const results: any[] = await Promise.all(deleteIds.map((id) => blogSubcategoryAPI.delete(id)));
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
      const response: any = await blogSubcategoryAPI.toggleStatus(id);
      
      if (response.success && response.data) {
        setSubcategories(subcategories.map((c: BlogSubCategory) => 
          c._id === id ? { ...c, isActive: response.data.isActive } : c
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

  const filteredSubcategories = subcategories.filter(subcategory => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (subcategory.name?.en || '').toLowerCase().includes(searchLower) ||
      (subcategory.name?.de || '').toLowerCase().includes(searchLower) ||
      (subcategory.name?.it || '').toLowerCase().includes(searchLower) ||
      (subcategory.name?.es || '').toLowerCase().includes(searchLower) ||
      (subcategory.slug?.en || '').toLowerCase().includes(searchLower) ||
      (subcategory.slug?.de || '').toLowerCase().includes(searchLower) ||
      (subcategory.slug?.it || '').toLowerCase().includes(searchLower) ||
      (subcategory.slug?.es || '').toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const stats = {
    total: subcategories.length,
    active: subcategories.filter(c => c.isActive).length,
    inactive: subcategories.filter(c => !c.isActive).length,
  };

  const columns: Array<AdminTableColumn<BlogSubCategory>> = [
    {
      header: 'Subcategory',
      render: (subcategory) => (
        <div className="category-info">
          {getImageUrl(subcategory.image) && (
            <img
              src={getImageUrl(subcategory.image)}
              alt={getImageTitle(subcategory.image, subcategory.name)}
              title={getImageTitle(subcategory.image, subcategory.name)}
              className="category-image"
            />

          )}
          <div className="category-details">
            <div className="category-name">{getLocalizedValue(subcategory.name)}</div>
          </div>
        </div>
      ),
    },
    {
        header: 'Parent Category',
        render: (subcategory) => {
            const parentName = getLocalizedValue((subcategory.category as BlogCategory)?.name) || 'Uncategorized';
            return (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Layers size={14} />
                    {parentName}
                </div>
            );
        },
    },
    {
      header: 'Slug',
      render: (subcategory) => (
        <div className="category-slug">/{subcategory.slug?.en || ''}</div>
      ),
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
      header: 'Actions',
      render: (subcategory) => (
        <div className="action-buttons">
          <Link href={`/admin/blogs/subcategory/new?id=${subcategory._id}`}>
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
    <div className="blog-subcategory-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog Subcategories</h1>
          <p className="admin-page-subtitle">Manage blog subcategories for finer organization</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchSubcategories} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href="/admin/blogs/subcategory/new" className="btn-add-new">
            <Plus size={18} />
            New Subcategory
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={FolderOpen} value={stats.total} label="Total Subcategories" iconVariant="total" />
        <StatCard icon={CheckCircle} value={stats.active} label="Active" iconVariant="active" />
        <StatCard icon={XCircle} value={stats.inactive} label="Inactive" iconVariant="inactive" />
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
        <AdminTable<BlogSubCategory>
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
              <FolderOpen size={64} />
              <h3>No subcategories found</h3>
              <p>There are no blog subcategories matching your criteria.</p>
              <Link href="/admin/blogs/subcategory/new" className="btn-add-new" style={{ marginTop: '16px' }}>
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
