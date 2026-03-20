'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Loader2, Plus, Edit2, Trash2, Eye, EyeOff, 
  Search, Filter, RefreshCw, Image as ImageIcon, 
  CheckCircle, XCircle, ArrowUpDown
} from 'lucide-react';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { SliderItem, SliderUnderPromo } from '@/types/slider';
import { API_ENDPOINTS } from '@/config/api';
import { sliderService } from '@/services/sliderService';
import { getLocalizedValue } from '@/lib/localize';
import AdminLanguageTabs, { AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

const sliderAPI = {
  getAll: async (params: { isActive?: boolean } = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Missing auth token');

    const queryParams = new URLSearchParams();
    if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));

    const url = `${API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BASE}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new Error(json?.message || json?.error || 'Failed to fetch slider content');
    }

    return json as { success: boolean; data: SliderItem[]; pagination?: any };
  },

  delete: async (id: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Missing auth token');

    const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BY_ID(id), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new Error(json?.message || json?.error || 'Failed to delete slider item');
    }

    return json as { success: boolean };
  },

  toggleStatus: async (id: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Missing auth token');

    const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_TOGGLE_ACTIVE(id), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new Error(json?.message || json?.error || 'Failed to toggle slider item');
    }

    return json as { success: boolean; data?: SliderItem };
  },
};

export default function SliderContentPage() {
  const { toast } = useToast();
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(true);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promo, setPromo] = useState<SliderUnderPromo | null>(null);
  const [promoForm, setPromoForm] = useState<SliderUnderPromo>({
    text: { en: '', de: '', it: '', es: '' },
    linkText: { en: '', de: '', it: '', es: '' },
    link: '',
    linkDirection: '_self',
  });
  const [activePromoLanguage, setActivePromoLanguage] = useState<AdminLanguage>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'status-completed' : 'status-cancelled';
  };

  const fetchPromo = async () => {
    try {
      setPromoLoading(true);
      const p = await sliderService.getAdminSliderPromo();
      setPromo(p);
      setPromoForm({
        text: p?.text || { en: '', de: '', it: '', es: '' },
        linkText: p?.linkText || { en: '', de: '', it: '', es: '' },
        link: p?.link || '',
        linkDirection: p?.linkDirection || '_self',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to load promo',
        description: err?.message || 'Failed to load promo',
        variant: 'destructive',
      });
      setPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const savePromo = async () => {
    const payload: SliderUnderPromo = {
      text: promoForm.text,
      linkText: promoForm.linkText,
      link: promoForm.link.trim(),
      linkDirection: promoForm.linkDirection,
    };

    if (!payload.text?.en?.trim() || !payload.linkText?.en?.trim() || !payload.link) {
      toast({
        title: 'Validation error',
        description: 'Promo text, link text, and link are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPromoSaving(true);
      const saved = await sliderService.upsertAdminSliderPromo(payload);
      setPromo(saved);
      toast({
        title: 'Saved',
        description: 'Under slider promo updated successfully.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message || 'Failed to update promo',
        variant: 'destructive',
      });
    } finally {
      setPromoSaving(false);
    }
  };

  const clearPromo = async () => {
    try {
      setPromoSaving(true);
      await sliderService.clearAdminSliderPromo();
      setPromo(null);
      setPromoForm({
        text: { en: '', de: '', it: '', es: '' },
        linkText: { en: '', de: '', it: '', es: '' },
        link: '',
        linkDirection: '_self',
      });
      toast({
        title: 'Cleared',
        description: 'Under slider promo removed.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Clear failed',
        description: err?.message || 'Failed to clear promo',
        variant: 'destructive',
      });
    } finally {
      setPromoSaving(false);
    }
  };

  // Fetch slider items
  const fetchSliderItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
      };
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      const response = await sliderAPI.getAll(params);
      
      if (response.success && response.data) {
        // Keep the same UI search box behavior by filtering client-side
        const s = searchTerm.trim().toLowerCase();
        const filtered = !s
          ? response.data
          : response.data.filter((item) =>
              getLocalizedValue(item.title, 'en')?.toLowerCase().includes(s) || 
              getLocalizedValue(item.subtitle, 'en')?.toLowerCase().includes(s)
            );

        setSliderItems(filtered);
      } else {
        setError('Failed to fetch slider content');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Delete slider item
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
      const results = await Promise.all(deleteIds.map((id) => sliderAPI.delete(id)));
      const failed = results.find((r: any) => !r?.success);
      if (failed) {
        throw new Error((failed as any).error || 'Failed to delete slider item(s)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Slider item deleted successfully.'
            : `${deleteIds.length} slider items deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchSliderItems();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete slider item(s)';
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

  // Toggle slider status
  const handleToggleStatus = async (id: string) => {
    try {
      setToggling(id);
      await sliderAPI.toggleStatus(id);
      await fetchSliderItems();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setToggling(null);
    }
  };

  // Calculate stats
  const stats = {
    total: sliderItems.length,
    active: sliderItems.filter(item => item.isActive).length,
    inactive: sliderItems.filter(item => !item.isActive).length,
  };

  const columns: Array<AdminTableColumn<SliderItem>> = [
    {
      header: 'Slider Content',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.image?.url ? (
            <img
              src={item.image.url}
              alt={getLocalizedValue(item.image.alt, 'en') || 'Slider image'}
              className="slider-image"
            />
          ) : (
            <div className="h-14 w-20 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center">
              <ImageIcon size={20} className="text-gray-400" />
            </div>
          )}

          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {getLocalizedValue(item.title, 'en')}
              <span className="text-[#63ab45] mx-1">{getLocalizedValue(item.titleSpan, 'en')}</span>
              {getLocalizedValue(item.titleEnd, 'en')}
            </div>
            <div className="text-xs text-gray-500 truncate">{getLocalizedValue(item.subtitle, 'en')}</div>
            <div className="mt-1 flex flex-col gap-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ArrowUpDown size={12} />
                Order: {item.order}
              </div>
              {item.button?.text && <div>Button: {getLocalizedValue(item.button.text, 'en')}</div>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (item) => (
        <span className={`status-badge ${getStatusColor(item.isActive)}`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Created',
      render: (item) => (
        <div className='date-info'>
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (item) => (
        <div className='action-buttons'>
          <Link href={`/admin/content-management/slider-content/${item._id}/edit`}>
            <button className='btn-icon btn-edit' title='Edit'>
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className='btn-icon btn-toggle'
            onClick={() => handleToggleStatus(item._id)}
            disabled={toggling === item._id}
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className='btn-icon btn-delete'
            onClick={() => handleDelete(item._id)}
            disabled={deleting === item._id}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchSliderItems();
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchPromo();
  }, []);

  return (
    <div className='tailor-made-admin'>
      {/* Header */}
      <div className='admin-page-header'>
        <div>
          <h1 className='admin-page-title'>Slider Content</h1>
          <p className='admin-page-subtitle'>Manage homepage slider content and banners</p>
        </div>
        <div className='header-actions'>
          <button className='btn-refresh' onClick={fetchSliderItems} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href='/admin/content-management/slider-content/new' className='btn-add-new'>
            <Plus size={18} />
            New Slider Item
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='stats-grid'>
        <StatCard icon={ImageIcon} value={stats.total} label='Total Items' iconVariant='total' />
        <StatCard icon={CheckCircle} value={stats.active} label='Active' iconVariant='completed' />
        <StatCard icon={XCircle} value={stats.inactive} label='Inactive' iconVariant='cancelled' />
      </div>

      <div className='rounded-xl border border-gray-200 bg-white p-4 mb-5'>
        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
          <div>
            <div className='text-sm font-semibold text-gray-900'>Under Slider Promo (Global)</div>
            <div className='text-xs text-gray-500'>Shown under the homepage slider only when set.</div>
          </div>
          <div className='flex items-center gap-2'>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                promo?.text && promo?.link && promo?.linkText
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {promo?.text && promo?.link && promo?.linkText ? 'Active' : 'Not set'}
            </span>
          </div>
        </div>

        <AdminLanguageTabs activeLanguage={activePromoLanguage} onLanguageChange={setActivePromoLanguage} />
        <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-4'>
          <div className='md:col-span-2'>
            <LocalizedField
              label='Promo Text'
              value={promoForm.text}
              globalLanguage={activePromoLanguage}
              onChange={(lang, val) =>
                setPromoForm((p) => ({ ...p, text: { ...p.text, [lang]: val } }))
              }
            >
              {(lang, currentValue, handleLang) => (
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={currentValue || ''}
                  onChange={(e) => handleLang(e.target.value)}
                  disabled={promoLoading || promoSaving}
                  placeholder={`Promo text in ${lang}`}
                />
              )}
            </LocalizedField>
          </div>

          <div className='md:col-span-2'>
            <LocalizedField
              label='Link Text'
              value={promoForm.linkText}
              globalLanguage={activePromoLanguage}
              onChange={(lang, val) =>
                setPromoForm((p) => ({ ...p, linkText: { ...p.linkText, [lang]: val } }))
              }
            >
              {(lang, currentValue, handleLang) => (
                <input
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
                  value={currentValue || ''}
                  onChange={(e) => handleLang(e.target.value)}
                  disabled={promoLoading || promoSaving}
                  placeholder={`Link text in ${lang}`}
                />
              )}
            </LocalizedField>
          </div>

          <label className='block text-xs text-gray-600 md:col-span-2'>
            <div className='mb-1'>Link Direction</div>
            <select
              className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
              value={promoForm.linkDirection}
              onChange={(e) => setPromoForm((p) => ({ ...p, linkDirection: e.target.value as '_blank' | '_self' }))}
              disabled={promoLoading || promoSaving}
            >
              <option value='_self'>Same tab</option>
              <option value='_blank'>New tab</option>
            </select>
          </label>

          <label className='block text-xs text-gray-600 md:col-span-2'>
            <div className='mb-1'>Link Destination URL</div>
            <input
              className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#63ab45]'
              value={promoForm.link}
              onChange={(e) => setPromoForm((p) => ({ ...p, link: e.target.value }))}
              disabled={promoLoading || promoSaving}
            />
          </label>
        </div>

        <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center'>
          <button
            className='btn-add-new'
            type='button'
            onClick={savePromo}
            disabled={promoLoading || promoSaving}
          >
            {promoSaving ? 'Saving...' : 'Save Promo'}
          </button>
          <button
            className='btn-refresh'
            type='button'
            onClick={clearPromo}
            disabled={promoLoading || promoSaving}
          >
            Remove Promo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className='filters-bar'>
        <div className='search-box'>
          <Search size={18} />
          <input
            type='text'
            placeholder='Search by title or subtitle...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className='filter-group'>
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
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

      {/* Slider Items Table */}
      <div className='requests-table-container'>
        <AdminTable<SliderItem>
          data={sliderItems}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className='loading-state'>
              <Loader2 size={48} className='spinner' />
              <p>Loading slider content...</p>
            </div>
          }
          emptyNode={
            <div className='empty-state'>
              <ImageIcon size={64} />
              <h3>No slider content found</h3>
              <p>There are no slider items matching your criteria.</p>
              <Link href='/admin/content-management/slider-content/new' className='btn-add-new' style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First Slider Item
              </Link>
            </div>
          }
          tableClassName='requests-table'
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
