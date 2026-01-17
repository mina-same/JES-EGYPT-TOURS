'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { blogAPI } from '@/lib/api/blogAdmin';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, FileText, Clock, 
  User, Calendar, CheckCircle, XCircle, Tag, MessageSquare
} from 'lucide-react';
import Image from 'next/image';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  featuredImage: {
    url: string;
    fileName?: string;
    title?: string;
    alt?: string;
  } | string;
  featuredImageAlt?: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled';
  isFeatured: boolean;
  publishedAt?: string;
  viewCount: number;
  readingTime?: number;
  commentsEnabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Fetch blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: 12,
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

      const response = await blogAPI.getAllAdmin(params);
      
      if (response.success && response.data) {
        setBlogs(response.data);
        setTotalPages((response as any).totalPages || (response as any).pagination?.pages || 1);
        
        // Extract unique tags from all blogs
        const tagsSet = new Set<string>();
        response.data.forEach((blog: BlogPost) => {
          if (blog.tags) {
            blog.tags.forEach(tag => tagsSet.add(tag));
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
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      setDeleting(id);
      const response = await blogAPI.delete(id);
      
      if (response.success) {
        await fetchBlogs();
      } else {
        setError(response.error || 'Failed to delete blog post');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  // Toggle blog status (publish/unpublish)
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      setToggling(id);
      let response;
      
      if (currentStatus === 'published') {
        response = await blogAPI.unpublish(id);
      } else {
        response = await blogAPI.publish(id);
      }
      
      if (response.success) {
        await fetchBlogs();
      } else {
        setError(response.error || 'Failed to toggle blog status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setToggling(null);
    }
  };

  // Toggle comments
  const handleToggleComments = async (id: string) => {
    try {
      setToggling(id);
      const response = await blogAPI.toggleComments(id);
      
      if (response.success) {
        await fetchBlogs();
      } else {
        setError(response.error || 'Failed to toggle comments');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setToggling(null);
    }
  };


  // Format date
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

  // Calculate stats
  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    drafts: blogs.filter(b => b.status === 'draft').length,
    scheduled: blogs.filter(b => b.status === 'scheduled').length,
  };

  useEffect(() => {
    fetchBlogs();
  }, [page, searchTerm, statusFilter, tagFilter, featuredFilter]);

  return (
    <div className="mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-gray-500 mt-1">Manage your blog content and articles</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchBlogs} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-gray-800"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link 
            href="/admin/blogs/new" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={18} />
            New Post
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Posts</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.published}</p>
              <p className="text-sm text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.drafts}</p>
              <p className="text-sm text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.scheduled}</p>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title, content, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <select
              value={featuredFilter}
              onChange={(e) => {
                setFeaturedFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            >
              <option value="all">All Blogs</option>
              <option value="true">Featured Only</option>
              <option value="false">Non-Featured Only</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Blogs Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={48} className="animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading blog posts...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-500 mb-6">There are no blog posts matching your criteria.</p>
            <Link 
              href="/admin/blogs/new" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={18} />
              Create First Post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-16 h-16">
                          {(() => {
                            const imageUrl = typeof blog.featuredImage === 'string' 
                              ? blog.featuredImage 
                              : blog.featuredImage?.url;
                            const imageAlt = typeof blog.featuredImage === 'object' && blog.featuredImage?.alt
                              ? blog.featuredImage.alt
                              : blog.featuredImageAlt || blog.title;
                            
                            if (imageUrl) {
                              return (
                                <img
                                  src={imageUrl}
                                  alt={imageAlt}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
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
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">{blog.title}</div>
                          {blog.excerpt && (
                            <div className="text-sm text-gray-500 line-clamp-1 mt-1">{blog.excerpt}</div>
                          )}
                          {blog.readingTime && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <Clock size={12} className="mr-1" />
                              {blog.readingTime} min read
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {blog.tags && blog.tags.length > 0 ? (
                          blog.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Tag size={10} className="mr-1" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No tags</span>
                        )}
                        {blog.tags && blog.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{blog.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {blog.isFeatured ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <CheckCircle size={12} className="mr-1" />
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{blog.author.name}</div>
                          <div className="text-xs text-gray-500">{blog.author.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(blog.status)}`}>
                          {blog.status === 'published' && <CheckCircle size={12} className="mr-1" />}
                          {blog.status === 'draft' && <XCircle size={12} className="mr-1" />}
                          {blog.status === 'scheduled' && <Calendar size={12} className="mr-1" />}
                          {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                        </span>
                        {blog.status !== 'published' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 w-fit">
                            Not Published
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{formatDate(blog.publishedAt || blog.createdAt)}</div>
                      <div className="text-xs text-gray-400">
                        Updated: {formatDate(blog.updatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Eye size={14} className="mr-1" />
                        {blog.viewCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/blogs/blog/${blog._id}/edit`}>
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(blog._id, blog.status)}
                          disabled={toggling === blog._id}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                          title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {blog.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleToggleComments(blog._id)}
                          disabled={toggling === blog._id}
                          className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                            blog.commentsEnabled 
                              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={blog.commentsEnabled ? 'Disable Comments' : 'Enable Comments'}
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          disabled={deleting === blog._id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
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
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 border rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
