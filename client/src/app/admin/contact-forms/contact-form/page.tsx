"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Mail, MessageSquare, RefreshCw, Search, Trash2, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { useContactForm } from '@/contexts/ContactFormContext';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { PaginationControls } from '@/components/admin/PaginationControls';

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'replied' | 'archived';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const ContactFormPage: React.FC = () => {
  const { refreshCount } = useContactForm();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'replied' | 'archived'>('all');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'new' | 'replied' | 'archived'>('new');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const url =
        statusFilter === 'all'
          ? API_ENDPOINTS.CONTACT.BASE
          : `${API_ENDPOINTS.CONTACT.BASE}?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setSubmissions([]);
        return;
      }

      const json = await response.json().catch(() => null);
      setSubmissions(json?.data || []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSubmissions();
    }, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => fetchSubmissions();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [statusFilter]);

  const filteredSubmissions = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return submissions;
    return submissions.filter((item) => {
      return (
        item.name.toLowerCase().includes(s) ||
        item.email.toLowerCase().includes(s) ||
        item.message.toLowerCase().includes(s)
      );
    });
  }, [submissions, searchTerm]);

  const paginatedSubmissions = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredSubmissions.slice(start, end);
  }, [filteredSubmissions, page, limit]);

  const handleViewDetails = (submission: ContactSubmission) => {
    setSelected(submission);
    setAdminNotes(submission.adminNotes || '');
    setNewStatus(submission.status);
    setShowModal(true);
  };

  const handleUpdateSubmission = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.CONTACT.BY_ID(selected._id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchSubmissions();
        refreshCount();
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
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
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Missing auth token');
      }

      const results = await Promise.all(
        deleteIds.map((id) =>
          fetch(API_ENDPOINTS.CONTACT.BY_ID(id), {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      const failed = results.find((r) => !r.ok);
      if (failed) {
        throw new Error('Failed to delete submission(s)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Submission deleted successfully.'
            : `${deleteIds.length} submissions deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchSubmissions();
      refreshCount();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete submission(s)';
      toast({
        title: 'Delete failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'status-pending';
      case 'replied':
        return 'status-completed';
      case 'archived':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const stats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === 'new').length,
    replied: submissions.filter(s => s.status === 'replied').length,
    archived: submissions.filter(s => s.status === 'archived').length,
  };

  const columns: Array<AdminTableColumn<ContactSubmission>> = [
    {
      header: 'Customer',
      render: (item) => (
        <div className='customer-info'>
          <div className='customer-name'>{item.name}</div>
          <div className='customer-details'>
            <Mail size={14} /> {item.email}
          </div>
        </div>
      ),
    },
    {
      header: 'Message',
      render: (item) => (
        <div className='travel-info'>
          <div className='travel-dates'>
            {item.message.slice(0, 120)}
            {item.message.length > 120 ? '...' : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (item) => (
        <span className={`status-badge ${getStatusColor(item.status)}`}>{item.status}</span>
      ),
    },
    {
      header: 'Date',
      render: (item) => (
        <div className='date-info'>{new Date(item.createdAt).toLocaleDateString()}</div>
      ),
    },
    {
      header: 'Actions',
      render: (item) => (
        <div className='action-buttons'>
          <button
            className='btn-icon btn-view'
            onClick={() => handleViewDetails(item)}
            title='View Details'
          >
            <Eye size={16} />
          </button>
          <button
            className='btn-icon btn-delete'
            onClick={() => handleDeleteSubmission(item._id)}
            title='Delete'
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (initialLoad) {
    return <AdminPageSkeleton showStats showFilters tableRows={8} />;
  }

  return (
    <div className='tailor-made-admin admin-scope'>
      <div className='admin-page-header'>
        <div>
          <h1 className='admin-page-title'>Contact Forms</h1>
          <p className='admin-page-subtitle'>Manage general contact form submissions</p>
        </div>
        <button className='btn-refresh' onClick={fetchSubmissions} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={MessageSquare} value={stats.total} label="Total Submissions" iconVariant="total" />
        <StatCard icon={Clock} value={stats.new} label="New" iconVariant="pending" />
        <StatCard icon={CheckCircle} value={stats.replied} label="Replied" iconVariant="completed" />
        <StatCard icon={XCircle} value={stats.archived} label="Archived" iconVariant="cancelled" />
      </div>

      <div className='filters-bar'>
        <div className='search-box'>
          <Search size={18} />
          <input
            type='text'
            placeholder='Search by name, email, or message...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className='filter-group'>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value='all'>All Status</option>
            <option value='new'>New</option>
            <option value='replied'>Replied</option>
            <option value='archived'>Archived</option>
          </select>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        onDeleteSelected={handleBulkDelete}
        deleteDisabled={loading}
      />

      <div className='requests-table-container'>
        <AdminTable<ContactSubmission>
          data={paginatedSubmissions}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className='loading-state'>
              <Loader2 size={48} className='spinner' />
              <p>Loading submissions...</p>
            </div>
          }
          emptyNode={
            <div className='empty-state'>
              <MessageSquare size={64} />
              <h3>No submissions found</h3>
              <p>There are no contact submissions matching your criteria.</p>
            </div>
          }
          tableClassName='requests-table'
        />
        
        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(filteredSubmissions.length / limit)}
          totalItems={filteredSubmissions.length}
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

      {showModal && selected && (
        <div className='modal-overlay' onClick={() => setShowModal(false)}>
          <div className='modal-content max-w-2xl' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div className="flex items-center gap-3">
                <div className="bg-[#b79c5c]/10 p-2 rounded-lg">
                  <MessageSquare className="text-[#b79c5c]" size={20} />
                </div>
                <div>
                  <h2>Submission Details</h2>
                  <p className="text-xs text-gray-500 font-normal">Received on {new Date(selected.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button className='modal-close' onClick={() => setShowModal(false)}>
                <XCircle size={22} />
              </button>
            </div>

            <div className='modal-body'>
              <div className='detail-section'>
                <h3><User size={14} /> Customer Information</h3>
                <div className='detail-grid'>
                  <div className='detail-item'>
                    <label>Full Name</label>
                    <p>{selected.name}</p>
                  </div>
                  <div className='detail-item'>
                    <label>Email Address</label>
                    <p className="flex items-center gap-2">
                       <Mail size={14} className="text-[#b79c5c]" />
                       {selected.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className='detail-section'>
                <h3><MessageSquare size={14} /> Message Content</h3>
                <p className='comments-text'>{selected.message}</p>
              </div>

              <div className='detail-section'>
                <h3><CheckCircle size={14} /> Admin Actions</h3>
                <div className='admin-management-grid'>
                  <div className='admin-field'>
                    <label>Update Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className='status-select'
                    >
                      <option value='new'>New Submission</option>
                      <option value='replied'>Mark as Replied</option>
                      <option value='archived'>Archive Submission</option>
                    </select>
                  </div>
                  <div className='admin-field'>
                    <label>Admin Internal Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder='Add internal notes regarding this submission...'
                      rows={4}
                      className='admin-notes-textarea'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className='modal-footer'>
              <button className='btn-secondary' onClick={() => setShowModal(false)}>
                Close
              </button>
              <button className='btn-primary' onClick={handleUpdateSubmission} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 size={18} className='spinner' />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactFormPage;
