'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  RefreshCw, Play, CheckCircle, XCircle, Search, Youtube
} from 'lucide-react';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { videoReviewService, VideoReviewItem } from '@/services/videoReviewService';
import Image from 'next/image';
import { getLocalizedValue } from '@/lib/localize';

export default function VideoManagementPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<VideoReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await videoReviewService.getAll();
      setItems(data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch video reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      setToggling(id);
      await videoReviewService.toggleActive(id);
      setItems(prev => prev.map(item => item._id === id ? { ...item, isActive: !item.isActive } : item));
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

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteBusy(true);
      await videoReviewService.delete(deleteId);
      toast({
        title: 'Deleted',
        description: 'Video review deleted successfully',
        variant: 'success',
      });
      setDeleteModalOpen(false);
      setDeleteId(null);
      await fetchItems();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete video review',
        variant: 'destructive',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const filteredItems = items.filter(item => 
    getLocalizedValue(item.title, 'en').toLowerCase().includes(searchTerm.toLowerCase()) || 
    getLocalizedValue(item.tourName, 'en').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: items.length,
    active: items.filter(i => i.isActive).length,
    inactive: items.filter(i => !i.isActive).length,
  };

  const columns: Array<AdminTableColumn<VideoReviewItem>> = [
    {
      header: 'Video Info',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-16 w-24 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
            <Image 
              src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
              alt={getLocalizedValue(item.title, 'en')}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
               <Play size={16} fill="white" color="white" />
            </div>
          </div>
          <div className="min-w-0 max-w-[300px]">
            <div className="font-semibold text-sm text-gray-900 truncate" title={getLocalizedValue(item.title, 'en')}>
              {getLocalizedValue(item.title, 'en')}
            </div>
            <div className="text-xs text-[#b79c5c] font-medium">{getLocalizedValue(item.tourName, 'en')}</div>
            <div className="text-[10px] text-gray-400 mt-1 truncate">{item.url}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Order',
      render: (item) => (
        <span className="text-sm font-medium text-gray-600">#{item.order}</span>
      ),
    },
    {
      header: 'Status',
      render: (item) => (
        <span className={`status-badge ${item.isActive ? 'status-completed' : 'status-cancelled'}`}>
          {item.isActive ? 'Active' : 'Hidden'}
        </span>
      ),
    },
    {
      header: 'Created On',
      render: (item) => (
        <div className="text-xs text-gray-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (item) => (
        <div className="action-buttons">
          <Link href={`/admin/content-management/video-management/${item._id}/edit`}>
            <button className="btn-icon btn-edit" title="Edit">
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className="btn-icon btn-toggle"
            onClick={() => handleToggleStatus(item._id)}
            disabled={toggling === item._id}
            title={item.isActive ? 'Hide from Web' : 'Show on Web'}
          >
            {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDeleteClick(item._id)}
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
          <h1 className='admin-page-title'>Video Management</h1>
          <p className='admin-page-subtitle'>Manage Reflective Reviews traveler video feedback</p>
        </div>
        <div className='header-actions'>
          <button className='btn-refresh' onClick={fetchItems} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href='/admin/content-management/video-management/new' className='btn-add-new'>
            <Plus size={18} />
            Add Video
          </Link>
        </div>
      </div>

      <div className='stats-grid'>
        <StatCard icon={Youtube} value={stats.total} label='Total Videos' iconVariant='total' />
        <StatCard icon={CheckCircle} value={stats.active} label='Published' iconVariant='completed' />
        <StatCard icon={XCircle} value={stats.inactive} label='Hidden' iconVariant='cancelled' />
      </div>

      <div className='filters-bar'>
        <div className='search-box'>
          <Search size={18} />
          <input
            type='text'
            placeholder='Search by title or tour name...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='requests-table-container'>
        <AdminTable<VideoReviewItem>
          data={filteredItems}
          columns={columns}
          getRowKey={(row) => row._id}
          loading={loading}
          loadingNode={
            <div className='loading-state'>
              <Loader2 size={48} className='spinner' />
              <p>Loading video reviews...</p>
            </div>
          }
          emptyNode={
            <div className='empty-state'>
              <Youtube size={64} className="opacity-20 mb-4" />
              <h3>No video reviews found</h3>
              <p>Start by adding your first traveler video testimonial.</p>
              <Link href='/admin/content-management/video-management/new' className='btn-add-new' style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Add First Video
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
