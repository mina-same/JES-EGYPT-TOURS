'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { tourAPI, tourSubcategoryAPI } from '@/lib/api/tour';
import { ITour, ITourSubcategory } from '@/types/tour';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, MapPin, Clock, 
  Star, CheckCircle, XCircle, Tag, MessageSquare
} from 'lucide-react';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';

import { PaginationControls } from '@/components/admin/PaginationControls';

export default function ToursPage() {
  const { toast } = useToast();
  const { canEdit, canDelete, canCreate } = usePermissions();
  const [tours, setTours] = useState<ITour[]>([]);
  const [subcategories, setSubcategories] = useState<ITourSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Fetch tours
  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit,
        search: searchTerm || undefined,
      };
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }
      
      if (featuredFilter !== 'all') {
        params.isFeatured = featuredFilter === 'featured';
      }
      
      if (subcategoryFilter !== 'all') {
        params.subcategory = subcategoryFilter;
      }

      const response = await tourAPI.getAll(params);
      
      if (response.success && response.data) {
        setTours(response.data);
        setTotalPages(response.totalPages || 1);
      } else {
        setError(response.error || 'Failed to fetch tours');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Fetch subcategories for filter
  const fetchSubcategories = async () => {
    try {
      const response = await tourSubcategoryAPI.getAll({ isActive: true });
      if (response.success && response.data) {
        setSubcategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch subcategories:', err);
    }
  };

  // Delete tour
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
      const results = await Promise.all(deleteIds.map((id) => tourAPI.delete(id)));
      const failed = results.find((r: any) => !r?.success);
      if (failed) {
        throw new Error((failed as any).error || 'Failed to delete tour(s)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Tour deleted successfully.'
            : `${deleteIds.length} tours deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchTours();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete tour(s)';
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

  // Toggle tour status
  const handleToggleStatus = async (id: string) => {
    try {
      setToggling(id);
      const response = await tourAPI.toggleStatus(id);
      
      if (response.success) {
        await fetchTours();
      } else {
        setError(response.error || 'Failed to toggle tour status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setToggling(null);
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (id: string) => {
    try {
      setToggling(id);
      const response = await tourAPI.toggleFeatured(id);
      
      if (response.success) {
        await fetchTours();
      } else {
        setError(response.error || 'Failed to toggle featured status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setToggling(null);
    }
  };

  // Get subcategory name
  const getSubcategoryName = (subcategory: any) => {
    // Handle both populated object and ID string
    if (typeof subcategory === 'object' && subcategory?.name) {
      return typeof subcategory.name === 'object' ? subcategory.name.en : subcategory.name;
    }
    if (typeof subcategory === 'string') {
      const found = subcategories.find(s => s._id === subcategory);
      return found ? (typeof found.name === 'object' ? found.name.en : found.name) : 'Unknown';
    }
    return 'Unknown';
  };

  // Calculate stats
  const stats = {
    total: tours.length,
    active: tours.filter(t => t.isActive).length,
    inactive: tours.filter(t => !t.isActive).length,
    featured: tours.filter(t => t.isFeatured).length,
  };

  const columns: Array<AdminTableColumn<ITour>> = [
    {
      header: 'Tour',
      render: (tour) => (
        <div className="tour-info">
          {tour.images && tour.images.length > 0 ? (
            <img
              src={tour.images[0].url}
              alt={(typeof tour.images[0].alt === 'object' ? (tour.images[0].alt as any).en : tour.images[0].alt) || (typeof tour.name === 'object' ? (tour.name as any).en : tour.name) || (typeof tour.heading === 'object' ? (tour.heading as any).en : tour.heading)}
              className="tour-image"
            />
          ) : (
            <div className="tour-image tour-image-placeholder">
              <MapPin size={24} color="#9ca3af" />
            </div>
          )}
          <div className="tour-details">
            <div className="tour-name">
              {(typeof tour.heading === 'object' ? (tour.heading as any).en : tour.heading) || (typeof tour.name === 'object' ? (tour.name as any).en : tour.name) || 'Untitled Tour'}
            </div>
            <div className="tour-meta">
              {tour.tourLocation && (
                <div className="tour-meta-item">
                  <MapPin size={12} />
                  {typeof tour.tourLocation === 'object' ? (tour.tourLocation as any).en : tour.tourLocation}
                </div>
              )}
              {tour.viewCount !== undefined && (
                <div className="tour-meta-item">
                  <Eye size={12} />
                  {tour.viewCount} views
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Subcategory',
      render: (tour) => (
        <span className="subcategory-badge">
          <Tag size={14} />
          {getSubcategoryName(tour.subcategory)}
        </span>
      ),
    },
    {
      header: 'Duration',
      render: (tour) => (
        <div className="tour-meta-item">
          <Clock size={14} />
          {(typeof tour.duration === 'object' ? (tour.duration as any).en : tour.duration) || 'N/A'}
        </div>
      ),
    },
    {
      header: 'Price',
      render: (tour) => (
        <div className="price-display">
          {tour.priceStartingFrom ? (
            <>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>From </span>
              ${typeof tour.priceStartingFrom === 'object' ? (tour.priceStartingFrom as any).USD : tour.priceStartingFrom}
            </>
          ) : (
            'N/A'
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (tour) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span className={`status-badge ${tour.isActive ? 'status-active' : 'status-inactive'}`}>
            {tour.isActive ? (
              <>
                <CheckCircle size={14} /> Active
              </>
            ) : (
              <>
                <XCircle size={14} /> Inactive
              </>
            )}
          </span>
          {tour.isFeatured && (
            <span className="featured-badge">
              <Star size={14} />
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (tour) => (
        <div className="action-buttons">
          {canEdit('tour') && (
            <Link href={`/admin/tour/tour/${tour._id}/edit`}>
              <button className="btn-icon btn-edit" title="Edit">
                <Edit2 size={16} />
              </button>
            </Link>
          )}
          {canEdit('tour') && (
            <>
              <button
                className="btn-icon btn-toggle"
                onClick={() => handleToggleStatus(tour._id)}
                disabled={toggling === tour._id}
                title={tour.isActive ? 'Deactivate' : 'Activate'}
              >
                {tour.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                className={`btn-icon btn-featured ${tour.isFeatured ? 'is-featured' : ''}`}
                onClick={() => handleToggleFeatured(tour._id)}
                disabled={toggling === tour._id}
                title={tour.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
              >
                <Star size={16} />
              </button>
            </>
          )}
          <Link href={`/admin/tour/tour/${tour._id}/reviews`}>
            <button className="btn-icon btn-view" title="Reviews / Messages">
              <MessageSquare size={16} />
            </button>
          </Link>
          {canDelete('tour') && (
            <button
              className="btn-icon btn-delete"
              onClick={() => handleDelete(tour._id)}
              disabled={deleting === tour._id}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const subcategoriesFetchedRef = useRef(false);

  useEffect(() => {
    fetchTours();
  }, [page, searchTerm, statusFilter, subcategoryFilter, featuredFilter]);

  useEffect(() => {
    if (subcategoriesFetchedRef.current) return;
    subcategoriesFetchedRef.current = true;
    fetchSubcategories();
  }, []);

  if (initialLoad) {
    return <AdminPageSkeleton showStats showFilters tableRows={12} />;
  }

  return (
    <div className="tour-admin admin-scope">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tours</h1>
          <p className="admin-page-subtitle">Manage your tour packages and itineraries</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchTours} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          {canCreate('tour') && (
            <Link href="/admin/tour/tour/new" className="btn-add-new">
              <Plus size={18} />
              New Tour
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={MapPin} value={stats.total} label="Total Tours" iconVariant="total" />
        <StatCard icon={CheckCircle} value={stats.active} label="Active" iconVariant="active" />
        <StatCard icon={XCircle} value={stats.inactive} label="Inactive" iconVariant="inactive" />
        <StatCard icon={Star} value={stats.featured} label="Featured Tours" iconVariant="featured" />
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Tag size={18} />
          <select value={subcategoryFilter} onChange={(e) => setSubcategoryFilter(e.target.value)}>
            <option value="all">All Subcategories</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory._id} value={subcategory._id}>
                {typeof subcategory.name === 'object' ? (subcategory.name as any).en : subcategory.name}
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
        <div className="filter-group">
          <Star size={18} />
          <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)}>
            <option value="all">All Tours</option>
            <option value="featured">Featured</option>
            <option value="regular">Regular</option>
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
        onDeleteSelected={canDelete('tour') ? handleBulkDelete : () => {}}
        deleteDisabled={loading || !canDelete('tour')}
      />

      {/* Tours Table */}
      <div className="tours-table-container">
        <AdminTable<ITour>
          data={tours}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className="loading-state">
              <Loader2 size={48} className="spinner" />
              <p>Loading tours...</p>
            </div>
          }
          emptyNode={
            <div className="empty-state">
              <MapPin size={64} />
              <h3>No tours found</h3>
              <p>There are no tours matching your criteria.</p>
              <Link href="/admin/tour/tour/new" className="btn-add-new" style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First Tour
              </Link>
            </div>
          }
          tableClassName="tours-table"
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={stats.total}
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
}
