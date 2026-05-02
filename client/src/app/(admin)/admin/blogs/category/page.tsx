'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { blogCategoryAPI } from '@/lib/api/blogAdmin';
import { BlogCategory } from '@/lib/api/blog';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, Layers, CheckCircle, 
  XCircle, FolderTree
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

export default function BlogCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
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

  // Fetch categories
  const fetchCategories = async () => {
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

      const response: any = await blogCategoryAPI.getAll(params);
      
      if (response.success && response.data) {
        setCategories(response.data);
        setTotalPages(response.totalPages || 1);
      } else {
        setError(response.error || 'Failed to fetch categories');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, searchTerm, statusFilter]);

  // Delete category
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
      const results: any[] = await Promise.all(deleteIds.map((id) => blogCategoryAPI.delete(id)));
      const failed = results.find((r: any) => !r?.success);
      if (failed) {
        throw new Error((failed as any).error || 'Failed to delete category(ies)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Category deleted successfully.'
            : `${deleteIds.length} categories deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchCategories();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete category(ies)';
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
      const response: any = await blogCategoryAPI.toggleStatus(id);
      
      if (response.success && response.data) {
        setCategories(categories.map((c: BlogCategory) => 
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

  // Filter categories by search (client-side backup filtering if server search fails or for instant feedback)
  const filteredCategories = categories.filter(category => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (category.name?.en || '').toLowerCase().includes(searchLower) ||
      (category.name?.de || '').toLowerCase().includes(searchLower) ||
      (category.name?.it || '').toLowerCase().includes(searchLower) ||
      (category.name?.es || '').toLowerCase().includes(searchLower) ||
      (category.slug?.en || '').toLowerCase().includes(searchLower) ||
      (category.slug?.de || '').toLowerCase().includes(searchLower) ||
      (category.slug?.it || '').toLowerCase().includes(searchLower) ||
      (category.slug?.es || '').toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const stats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    inactive: categories.filter(c => !c.isActive).length,
    filtered: filteredCategories.length,
    withSubcategories: categories.filter(c => (c.subcategoriesCount || 0) > 0).length,
    totalSubcategories: categories.reduce((sum, c) => sum + (c.subcategoriesCount || 0), 0),
  };

  const columns: Array<AdminTableColumn<BlogCategory>> = [
    {
      header: 'Category',
      render: (category) => (
        <div className="category-info">
          {getImageUrl(category.image) && (
            <img
              src={getImageUrl(category.image)}
              alt={getImageTitle(category.image, category.name)}
              title={getImageTitle(category.image, category.name)}
              className="category-image"
            />

          )}
          <div className="category-details">
            <div className="category-name">{getLocalizedValue(category.name)}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Slug',
      render: (category) => (
        <div className="category-slug">/{category.slug?.en || ''}</div>
      ),
    },
    {
      header: 'Status',
      render: (category) => (
        <span className={`status-badge ${category.isActive ? 'status-active' : 'status-inactive'}`}>
          {category.isActive ? (
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
      header: 'Subcategories',
      render: (category) => (
        <div className="subcategories-count">
          <FolderTree size={14} />
          {category.subcategoriesCount || 0}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (category) => (
        <div className="action-buttons">
          <Link href={`/admin/blogs/category/new?id=${category._id}`}>
            <button className="btn-icon btn-edit" title="Edit">
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className="btn-icon btn-toggle"
            onClick={() => handleToggleStatus(category._id)}
            disabled={toggling === category._id}
            title={category.isActive ? 'Deactivate' : 'Activate'}
          >
            {category.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDelete(category._id)}
            disabled={deleting === category._id}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="blog-category-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog Categories</h1>
          <p className="admin-page-subtitle">Manage blog categories and organize your posts</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchCategories} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href="/admin/blogs/category/new" className="btn-add-new">
            <Plus size={18} />
            New Category
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={Layers} value={stats.total} label="Total Categories" iconVariant="total" />
        <StatCard icon={CheckCircle} value={stats.active} label="Active" iconVariant="active" />
        <StatCard icon={XCircle} value={stats.inactive} label="Inactive" iconVariant="inactive" />
        {/* <StatCard icon={Filter} value={stats.filtered} label="Filtered" iconVariant="filtered" /> */}
        <StatCard icon={FolderTree} value={stats.withSubcategories} label="With Subcategories" iconVariant="subcategories" />
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

      {/* Categories Table */}
      <div className="categories-table-container">
        <AdminTable<BlogCategory>
          data={filteredCategories}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className="loading-state">
              <Loader2 size={48} className="spinner" />
              <p>Loading categories...</p>
            </div>
          }
          emptyNode={
            <div className="empty-state">
              <Layers size={64} />
              <h3>No categories found</h3>
              <p>There are no blog categories matching your criteria.</p>
              <Link href="/admin/blogs/category/new" className="btn-add-new" style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First Category
              </Link>
            </div>
          }
          tableClassName="categories-table"
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
