'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tourCategoryAPI } from '@/lib/api/tour';
import { ITourCategory } from '@/types/tour';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, Layers, CheckCircle, 
  XCircle, FolderTree
} from 'lucide-react';
import Image from 'next/image';
import './category.css';

export default function TourCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ITourCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
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

      const response = await tourCategoryAPI.getAll(params);
      
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
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      setDeleting(id);
      const response = await tourCategoryAPI.delete(id);
      
      if (response.success) {
        setCategories(categories.filter((c: ITourCategory) => c._id !== id));
      } else {
        setError(response.error || 'Failed to delete category');
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
      const response = await tourCategoryAPI.toggleStatus(id);
      
      if (response.success && response.data) {
        setCategories(categories.map((c: ITourCategory) => 
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

  // Calculate stats
  const stats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    inactive: categories.filter(c => !c.isActive).length,
    totalSubcategories: categories.reduce((sum, c) => sum + (c.subcategoriesCount || 0), 0),
  };

  // Filter categories by search
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tour-category-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tour Categories</h1>
          <p className="admin-page-subtitle">Manage tour categories and organize your tours</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchCategories} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href="/admin/tour/category/new" className="btn-add-new">
            <Plus size={18} />
            New Category
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Categories</div>
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
          <div className="stat-icon stat-icon-subcategories">
            <FolderTree size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSubcategories}</div>
            <div className="stat-label">Subcategories</div>
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

      {/* Categories Table */}
      <div className="categories-table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={48} className="spinner" />
            <p>Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state">
            <Layers size={64} />
            <h3>No categories found</h3>
            <p>There are no tour categories matching your criteria.</p>
            <Link href="/admin/tour/category/new" className="btn-add-new" style={{ marginTop: '16px' }}>
              <Plus size={18} />
              Create First Category
            </Link>
          </div>
        ) : (
          <table className="categories-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Subcategories</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category: ITourCategory) => (
                <tr key={category._id}>
                  <td>
                    <div className="category-info">
                      {category.image?.url && (
                        <img
                          src={category.image.url}
                          alt={category.image.alt || category.name}
                          className="category-image"
                        />
                      )}
                      <div className="category-details">
                        <div className="category-name">{category.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="category-slug">/{category.slug}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${category.isActive ? 'status-active' : 'status-inactive'}`}>
                      {category.isActive ? (
                        <><CheckCircle size={14} /> Active</>
                      ) : (
                        <><XCircle size={14} /> Inactive</>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="subcategories-count">
                      <FolderTree size={14} />
                      {category.subcategoriesCount || 0}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link href={`/admin/tour/category/new?id=${category._id}`}>
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
