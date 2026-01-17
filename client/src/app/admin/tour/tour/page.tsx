'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tourAPI, tourSubcategoryAPI } from '@/lib/api/tour';
import { ITour, ITourSubcategory } from '@/types/tour';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, MapPin, Clock, 
  DollarSign, Star, CheckCircle, XCircle, Tag
} from 'lucide-react';
import Image from 'next/image';
import './tour.css';

export default function ToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<ITour[]>([]);
  const [subcategories, setSubcategories] = useState<ITourSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Fetch tours
  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: 12,
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
    if (!confirm('Are you sure you want to delete this tour?')) return;
    
    try {
      setDeleting(id);
      const response = await tourAPI.delete(id);
      
      if (response.success) {
        await fetchTours();
      } else {
        setError(response.error || 'Failed to delete tour');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setDeleting(null);
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
      return subcategory.name;
    }
    if (typeof subcategory === 'string') {
      const found = subcategories.find(s => s._id === subcategory);
      return found?.name || 'Unknown';
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

  const subcategoriesFetchedRef = useRef(false);

  useEffect(() => {
    fetchTours();
  }, [page, searchTerm, statusFilter, subcategoryFilter, featuredFilter]);

  useEffect(() => {
    if (subcategoriesFetchedRef.current) return;
    subcategoriesFetchedRef.current = true;
    fetchSubcategories();
  }, []);

  return (
    <div className="tour-admin">
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
          <Link href="/admin/tour/tour/new" className="btn-add-new">
            <Plus size={18} />
            New Tour
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <MapPin size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tours</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-inactive">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-featured">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.featured}</div>
            <div className="stat-label">Featured Tours</div>
          </div>
        </div>
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
                {subcategory.name}
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

      {/* Tours Table */}
      <div className="tours-table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={48} className="spinner" />
            <p>Loading tours...</p>
          </div>
        ) : tours.length === 0 ? (
          <div className="empty-state">
            <MapPin size={64} />
            <h3>No tours found</h3>
            <p>There are no tours matching your criteria.</p>
            <Link href="/admin/tour/tour/new" className="btn-add-new" style={{ marginTop: '16px' }}>
              <Plus size={18} />
              Create First Tour
            </Link>
          </div>
        ) : (
          <table className="tours-table">
            <thead>
              <tr>
                <th>Tour</th>
                <th>Subcategory</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <tr key={tour._id}>
                  <td>
                    <div className="tour-info">
                      {tour.images && tour.images.length > 0 ? (
                        <img
                          src={tour.images[0].url}
                          alt={tour.images[0].alt || tour.name}
                          className="tour-image"
                        />
                      ) : (
                        <div className="tour-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                          <MapPin size={24} color="#9ca3af" />
                        </div>
                      )}
                      <div className="tour-details">
                        <div className="tour-name">{tour.name || tour.heading || 'Untitled Tour'}</div>
                        <div className="tour-meta">
                          {tour.location && (
                            <div className="tour-meta-item">
                              <MapPin size={12} />
                              {tour.location}
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
                  </td>
                  <td>
                    <span className="subcategory-badge">
                      <Tag size={14} />
                      {getSubcategoryName(tour.subcategory)}
                    </span>
                  </td>
                  <td>
                    <div className="tour-meta-item">
                      <Clock size={14} />
                      {tour.duration || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="price-display">
                      {tour.priceStartingFrom ? (
                        <>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>From </span>
                          ${tour.priceStartingFrom}
                        </>
                      ) : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span className={`status-badge ${tour.isActive ? 'status-active' : 'status-inactive'}`}>
                        {tour.isActive ? (
                          <><CheckCircle size={14} /> Active</>
                        ) : (
                          <><XCircle size={14} /> Inactive</>
                        )}
                      </span>
                      {tour.isFeatured && (
                        <span className="featured-badge">
                          <Star size={14} />
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link href={`/admin/tour/tour/${tour._id}/edit`}>
                        <button className="btn-icon btn-edit" title="Edit">
                          <Edit2 size={16} />
                        </button>
                      </Link>
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
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(tour._id)}
                        disabled={deleting === tour._id}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
