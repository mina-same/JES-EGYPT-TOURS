 'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, FileText, Clock, 
  User, Calendar, CheckCircle, XCircle, Tag, MapPin
} from 'lucide-react';
import { blogAPI, destinationAPI } from '@/lib/api/blogAdmin';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { PaginationControls } from '@/components/admin/PaginationControls';
import { ILocalizedString, ILocalizedMixed } from '@/types/shared';
import { getLocalizedValue } from '@/lib/localize';

interface BlogPost {
  _id: string;
  title: ILocalizedString;
  slug: ILocalizedString;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  featuredImage: {
    url: string;
    fileName?: string;
    title?: ILocalizedString;
    alt?: ILocalizedString;
  } | string;
  featuredImageAlt?: ILocalizedString;
  excerpt?: ILocalizedString;
  status: 'draft' | 'published' | 'scheduled';
  isFeatured: boolean;
  publishedAt?: string;
  viewCount: number;
  readingTime?: number;
  tags: ILocalizedMixed;
  destination?: {
    _id: string;
    name: ILocalizedString;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BlogsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');
  const [destinations, setDestinations] = useState<any[]>([]);
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Fetch blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: 100,
        search: searchTerm || undefined,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (tagFilter !== 'all') {
        params.tags = tagFilter;
      }

      if (featuredFilter !== 'all') {
        params.isFeatured = featuredFilter === 'true';
      }

      if (destinationFilter !== 'all') {
        params.destination = destinationFilter;
      }

      const response = await blogAPI.getAllAdmin(params);
      
      if (response.success && response.data) {
        setBlogs(response.data);
        setTotalPages((response as any).totalPages || (response as any).pagination?.pages || 1);
        
        // Extract unique tags from all blogs (using English as default for filters)
        const tagsSet = new Set<string>();
        response.data.forEach((blog: BlogPost) => {
          const enTags = blog.tags?.en || [];
          if (Array.isArray(enTags)) {
            enTags.forEach(tag => tagsSet.add(tag));
          }
        });
        setAllTags(Array.from(tagsSet).sort());
      } else {
        setError(response.error || 'Failed to fetch blogs');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Delete blog
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
      const results = await Promise.all(deleteIds.map((id) => blogAPI.delete(id)));
      const failed = results.find((r: any) => !r?.success);
      if (failed) {
        throw new Error((failed as any).error || 'Failed to delete blog post(s)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Blog post deleted successfully.'
            : `${deleteIds.length} blog posts deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchBlogs();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete blog post(s)';
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

  // Toggle blog status (publish/unpublish)
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const blog = blogs.find(b => b._id === id);
    const newStatus = currentStatus === 'published' ? 'unpublished' : 'published';
    
    try {
      setToggling(id);
      let response;
      
      if (currentStatus === 'published') {
        response = await blogAPI.unpublish(id);
      } else {
        response = await blogAPI.publish(id);
      }
      
      if (response.success) {
        toast({
          title: `Blog post ${newStatus}`,
          description: `"${getLocalizedValue(blog?.title)}" has been ${newStatus} successfully.`,
        });
        await fetchBlogs();
      } else {
        setError(response.error || 'Failed to toggle blog status');
        toast({
          title: "Status update failed",
          description: response.error || 'Failed to toggle blog status',
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      toast({
        title: "Error",
        description: err.message || 'An error occurred while updating blog status',
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  };

  // Delete blog post date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Array<AdminTableColumn<BlogPost>> = [
    {
      header: 'Post',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (blog) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 w-16 h-16">
            {(() => {
              const imageUrl =
                typeof blog.featuredImage === 'string' ? blog.featuredImage : blog.featuredImage?.url;
              const imageAlt =
                typeof blog.featuredImage === 'object' && blog.featuredImage?.alt
                  ? getLocalizedValue(blog.featuredImage.alt)
                  : blog.featuredImageAlt || getLocalizedValue(blog.title);

              if (imageUrl) {
                return (
                  <img src={imageUrl} alt={imageAlt} className="w-16 h-16 object-cover rounded-lg" />
                );
              }
              return (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-gray-400" />
                </div>
              );
            })()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{getLocalizedValue(blog.title)}</div>
            {blog.excerpt && <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">{getLocalizedValue(blog.excerpt)}</div>}
            {blog.readingTime && (
              <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                <Clock size={12} className="mr-1" />
                {blog.readingTime} min read
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Tags',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (blog) => (
        <div className="flex flex-wrap gap-1">
          {blog.tags?.en && blog.tags.en.length > 0 ? (
            (blog.tags.en as string[]).slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              >
                <Tag size={10} className="mr-1" />
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No tags</span>
          )}
          {blog.tags?.en && (blog.tags.en as string[]).length > 3 && (
            <span className="text-xs text-gray-500">+{(blog.tags.en as string[]).length - 3}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Destination',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (blog) => (
        <div className="flex items-center">
          <MapPin size={14} className="text-gray-400 mr-1" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {blog.destination?.name ? getLocalizedValue(blog.destination.name) : '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Featured',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (blog) =>
        blog.isFeatured ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
            <CheckCircle size={12} className="mr-1" />
            Featured
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        ),
    },
    {
      header: 'Author',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (blog) => (
        <div className="flex items-center">
          <User size={16} className="text-gray-400 dark:text-gray-500 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{blog.author?.name || 'Unknown Author'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{blog.author?.email || 'No email'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (blog) => (
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
              blog.status
            )}`}
          >
            {blog.status === 'published' && <CheckCircle size={12} className="mr-1" />}
            {blog.status === 'draft' && <XCircle size={12} className="mr-1" />}
            {blog.status === 'scheduled' && <Calendar size={12} className="mr-1" />}
            {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
          </span>
          {blog.status !== 'published' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 w-fit">
              Not Published
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4 text-sm text-gray-500',
      render: (blog) => (
        <>
          <div className="dark:text-gray-300">{formatDate(blog.publishedAt || blog.createdAt)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">Updated: {formatDate(blog.updatedAt)}</div>
        </>
      ),
    },
    {
      header: 'Views',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4 text-sm text-gray-500',
      render: (blog) => (
        <div className="flex items-center dark:text-gray-300">
          <Eye size={14} className="mr-1 text-gray-400 dark:text-gray-500" />
          {blog.viewCount}
        </div>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      cellClassName: 'px-6 py-4',
      render: (blog) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/blogs/blog/${blog._id}/edit`}>
            <button
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            onClick={() => handleToggleStatus(blog._id, blog.status)}
            disabled={toggling === blog._id}
            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
            title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
          >
            {blog.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={() => handleDelete(blog._id)}
            disabled={deleting === blog._id}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    drafts: blogs.filter(b => b.status === 'draft').length,
    scheduled: blogs.filter(b => b.status === 'scheduled').length,
    featured: blogs.filter(b => b.isFeatured).length,
  };

  const totalItems = blogs.length;

  useEffect(() => {
    fetchBlogs();
  }, [page, searchTerm, statusFilter, tagFilter, featuredFilter, destinationFilter]);

  useEffect(() => {
    destinationAPI.getAll({ isActive: true }).then(res => {
      if (res.success && res.data) setDestinations(res.data);
    });
  }, []);

  return (
    <div className="tailor-made-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog Posts</h1>
          <p className="admin-page-subtitle">Manage your blog content and articles</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={fetchBlogs} 
            disabled={loading}
            className="btn-refresh"
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link 
            href="/admin/blogs/blog/new" 
            className="btn-add-new"
          >
            <Plus size={18} />
            New Post
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={FileText} value={stats.total} label="Total Posts" iconVariant="total" />
        <StatCard icon={CheckCircle} value={stats.published} label="Published" iconVariant="active" />
        <StatCard icon={Clock} value={stats.drafts} label="Drafts" iconVariant="pending" />
        <StatCard icon={Calendar} value={stats.scheduled} label="Scheduled" iconVariant="confirmed" />
        <StatCard icon={Tag} value={stats.featured} label="Featured" iconVariant="featured" />
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by title, content, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={tagFilter}
            onChange={(e) => {
              setTagFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Blogs</option>
            <option value="true">Featured Only</option>
            <option value="false">Non-Featured Only</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            value={destinationFilter}
            onChange={(e) => {
              setDestinationFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Destinations</option>
            {destinations.map((dest) => (
              <option key={dest._id} value={dest._id}>
                {dest.name?.en || dest.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <BulkActionsBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        onDeleteSelected={handleBulkDelete}
        deleteDisabled={loading}
      />

      {/* Blogs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm overflow-hidden">
        <AdminTable<BlogPost>
          data={blogs}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className="flex items-center justify-center py-12">
              <Loader2 size={48} className="animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading blog posts...</span>
            </div>
          }
          emptyNode={
            <div className="text-center py-12">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No blog posts found</h3>
              <p className="text-gray-500 dark:text-gray-400">There are no blog posts matching your criteria.</p>
            </div>
          }
          wrapperClassName="overflow-x-auto"
          tableClassName="w-full"
          theadClassName="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600"
          tbodyClassName="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
          rowClassName="hover:bg-gray-50 dark:hover:bg-gray-700"
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
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
