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
import './subcategory.css';

export default function TourSubcategoriesPage() {
  const router = useRouter();
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
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      setDeleting(id);
      const response = await tourSubcategoryAPI.delete(id);
      
      if (response.success) {
        setSubcategories(subcategories.filter(s => s._id !== id));
      } else {
        setError(response.error || 'Failed to delete subcategory');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setDeleting(null);
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
      return category.name;
    }
    if (typeof category === 'string') {
      const found = categories.find(c => c._id === category);
      return found?.name || 'Unknown Category';
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
  const filteredSubcategories = subcategories.filter(subcategory => 
    subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subcategory.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Tag size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Subcategories</div>
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
          <div className="stat-icon stat-icon-tours">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalTours}</div>
            <div className="stat-label">Total Tours</div>
          </div>
        </div>
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
                {category.name}
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

      {/* Subcategories Table */}
      <div className="subcategories-table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={48} className="spinner" />
            <p>Loading subcategories...</p>
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="empty-state">
            <Tag size={64} />
            <h3>No subcategories found</h3>
            <p>There are no tour subcategories matching your criteria.</p>
            <Link href="/admin/tour/subcategory/new" className="btn-add-new" style={{ marginTop: '16px' }}>
              <Plus size={18} />
              Create First Subcategory
            </Link>
          </div>
        ) : (
          <table className="subcategories-table">
            <thead>
              <tr>
                <th>Subcategory</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Tours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubcategories.map((subcategory) => (
                <tr key={subcategory._id}>
                  <td>
                    <div className="subcategory-info">
                      {subcategory.image?.url && (
                        <img
                          src={subcategory.image.url}
                          alt={subcategory.image.alt || subcategory.name}
                          className="subcategory-image"
                        />
                      )}
                      <div className="subcategory-details">
                        <div className="subcategory-name">{subcategory.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      <FolderTree size={14} />
                      {getCategoryName(subcategory.category)}
                    </span>
                  </td>
                  <td>
                    <div className="subcategory-slug">/{subcategory.slug}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${subcategory.isActive ? 'status-active' : 'status-inactive'}`}>
                      {subcategory.isActive ? (
                        <><CheckCircle size={14} /> Active</>
                      ) : (
                        <><XCircle size={14} /> Inactive</>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="tours-count">
                      <Layers size={14} />
                      {subcategory.toursCount || 0}
                    </div>
                  </td>
                  <td>
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
