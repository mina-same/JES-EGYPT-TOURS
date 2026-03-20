'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Edit2, Trash2, RefreshCw, Menu as MenuIcon, Search } from 'lucide-react';

import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { menuService, type Menu } from '@/services/menuService';
import { getLocalizedValue } from '@/lib/localize';

export default function MenusAdminPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await menuService.adminList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load menus',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return items;
    return items.filter((m) => {
      const title = getLocalizedValue(m.title, 'en').toLowerCase();
      const key = String(m.key || '').toLowerCase();
      return title.includes(t) || key.includes(t);
    });
  }, [items, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((i) => i.isActive).length,
      inactive: items.filter((i) => !i.isActive).length,
    };
  }, [items]);

  const columns: Array<AdminTableColumn<Menu>> = [
    {
      header: 'Menu',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
            <MenuIcon size={20} className="text-[#b79c5c]" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {getLocalizedValue(item.title, 'en')}
            </div>
            <div className="text-xs text-gray-500 font-mono">key: {item.key}</div>
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
      header: 'Updated',
      render: (item) => (
        <div className="text-xs text-gray-500">{new Date(item.updatedAt).toLocaleDateString()}</div>
      ),
    },
    {
      header: 'Actions',
      render: (item) => (
        <div className="action-buttons">
          <Link href={`/admin/content-management/menus/${item._id}/edit`}>
            <button className="btn-icon btn-edit" title="Edit">
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className="btn-icon btn-delete"
            title="Delete"
            disabled={deleteBusy}
            onClick={() => {
              setDeleteId(item._id);
              setDeleteModalOpen(true);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteBusy(true);
      await menuService.adminDelete(deleteId);
      toast({
        title: 'Deleted',
        description: 'Menu deleted successfully',
        variant: 'success',
      });
      setDeleteModalOpen(false);
      setDeleteId(null);
      await fetchItems();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete menu',
        variant: 'destructive',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className='tailor-made-admin'>
      <div className='admin-page-header'>
        <div>
          <h1 className='admin-page-title'>Menus</h1>
          <p className='admin-page-subtitle'>Manage header/navigation menus</p>
        </div>
        <div className='header-actions'>
          <button className='btn-refresh' onClick={fetchItems} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href='/admin/content-management/menus/new' className='btn-add-new'>
            <Plus size={18} />
            Add Menu
          </Link>
        </div>
      </div>

      <div className='stats-grid'>
        <StatCard icon={MenuIcon} value={stats.total} label='Total Menus' iconVariant='total' />
        <StatCard icon={MenuIcon} value={stats.active} label='Active' iconVariant='completed' />
        <StatCard icon={MenuIcon} value={stats.inactive} label='Inactive' iconVariant='cancelled' />
      </div>

      <div className='filters-bar'>
        <div className='search-box'>
          <Search size={18} />
          <input
            type='text'
            placeholder='Search by title or key...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='requests-table-container'>
        <AdminTable<Menu>
          data={filtered}
          columns={columns}
          getRowKey={(row) => row._id}
          loading={loading}
          loadingNode={
            <div className='loading-state'>
              <Loader2 size={48} className='spinner' />
              <p>Loading menus...</p>
            </div>
          }
          emptyNode={
            <div className='empty-state'>
              <MenuIcon size={64} />
              <h3>No menus found</h3>
              <p>Create your first menu to control the header links.</p>
              <Link href='/admin/content-management/menus/new' className='btn-add-new' style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First Menu
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
