'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  RefreshCw, FileText, CheckCircle, XCircle, Search
} from 'lucide-react';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { generalContentService, GeneralContentItem } from '@/services/generalContentService';
import { getLocalizedValue } from '@/lib/localize';

export default function GeneralContentPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<GeneralContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await generalContentService.getAll();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contents');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch contents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggleStatus = async (slug: string) => {
    try {
      setToggling(slug);
      await generalContentService.toggleActive(slug);
      await fetchItems();
      toast({
        title: 'Success',
        description: 'Status updated successfully',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to toggle status',
        variant: 'destructive',
      });
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteClick = (slug: string) => {
    setDeleteSlug(slug);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteSlug) return;
    try {
      setDeleteBusy(true);
      await generalContentService.delete(deleteSlug);
      toast({
        title: 'Deleted',
        description: 'Content deleted successfully',
        variant: 'success',
      });
      setDeleteModalOpen(false);
      setDeleteSlug(null);
      await fetchItems();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete content',
        variant: 'destructive',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const filteredItems = items.filter(item => 
    getLocalizedValue(item.title, 'en').toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: items.length,
    active: items.filter(i => i.isActive).length,
    inactive: items.filter(i => !i.isActive).length,
  };

  const columns: Array<AdminTableColumn<GeneralContentItem>> = [
    {
      header: 'Content Info',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
            <FileText size={20} className="text-[#b79c5c]" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {getLocalizedValue(item.title, 'en')}
            </div>
            <div className="text-xs text-gray-500 font-mono">slug: {item.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (item) => (
        <span className={`status-badge ${item.isActive ? 'status-completed' : 'status-cancelled'}`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Last Updated',
      render: (item) => (
        <div className="text-xs text-gray-500">
          {new Date(item.updatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (item) => (
        <div className="action-buttons">
          <Link href={`/admin/content-management/general-content/${item.slug}/edit`}>
            <button className="btn-icon btn-edit" title="Edit">
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className="btn-icon btn-toggle"
            onClick={() => handleToggleStatus(item.slug)}
            disabled={toggling === item.slug}
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDeleteClick(item.slug)}
            disabled={deleteBusy}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className='tailor-made-admin'>
      <div className='admin-page-header'>
        <div>
          <h1 className='admin-page-title'>General Content</h1>
          <p className='admin-page-subtitle'>Manage reusable text blocks and banners</p>
        </div>
        <div className='header-actions'>
          <button className='btn-refresh' onClick={fetchItems} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href='/admin/content-management/general-content/new' className='btn-add-new'>
            <Plus size={18} />
            Add Block
          </Link>
        </div>
      </div>

      <div className='stats-grid'>
        <StatCard icon={FileText} value={stats.total} label='Total Blocks' iconVariant='total' />
        <StatCard icon={CheckCircle} value={stats.active} label='Active' iconVariant='completed' />
        <StatCard icon={XCircle} value={stats.inactive} label='Inactive' iconVariant='cancelled' />
      </div>

      <div className='filters-bar'>
        <div className='search-box'>
          <Search size={18} />
          <input
            type='text'
            placeholder='Search by title or slug...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='requests-table-container'>
        <AdminTable<GeneralContentItem>
          data={filteredItems}
          columns={columns}
          getRowKey={(row) => row._id}
          loading={loading}
          loadingNode={
            <div className='loading-state'>
              <Loader2 size={48} className='spinner' />
              <p>Loading content blocks...</p>
            </div>
          }
          emptyNode={
            <div className='empty-state'>
              <FileText size={64} />
              <h3>No content blocks found</h3>
              <p>Start by creating a new content block for your site.</p>
              <Link href='/admin/content-management/general-content/new' className='btn-add-new' style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First Block
              </Link>
            </div>
          }
          tableClassName='requests-table'
        />
      </div>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        count={1}
        onConfirm={confirmDelete}
        confirmDisabled={deleteBusy}
      />
    </div>
  );
}
