"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Trash2, 
  Calendar, Users, Mail, Phone,
  CheckCircle, Clock, XCircle, Loader2, RefreshCw,
  MapPin, MessageSquare
} from 'lucide-react';
import { getAllBookings, deleteBooking, updateBooking, getBookingStats, IBooking } from '@/lib/api/booking';
import { useBooking } from '@/contexts/BookingContext';
import Image from 'next/image';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';

import { PaginationControls } from '@/components/admin/PaginationControls';

const BookingPage: React.FC = () => {
  const { refreshCount } = useBooking();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [statusFilter, page, searchTerm]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await getAllBookings(params);
      if (response.success) {
        setBookings(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getBookingStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = (booking: IBooking) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.adminNotes || '');
    setNewStatus(booking.status || 'pending');
    setShowModal(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    
    setUpdating(true);
    try {
      await updateBooking(selectedBooking._id || selectedBooking.id || '', {
        status: newStatus,
        adminNotes: adminNotes,
      });
      
      await fetchBookings();
      await fetchStats();
      refreshCount();
      setShowModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
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
      const results = await Promise.all(deleteIds.map((id) => deleteBooking(id)));
      const failed = results.find((r: any) => !r?.success);
      if (failed) {
        throw new Error((failed as any).message || 'Failed to delete booking(s)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Booking deleted successfully.'
            : `${deleteIds.length} bookings deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      await fetchBookings();
      await fetchStats();
      refreshCount();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete booking(s)';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="status-icon status-confirmed" size={16} />;
      case 'completed':
        return <CheckCircle className="status-icon status-completed" size={16} />;
      case 'cancelled':
        return <XCircle className="status-icon status-cancelled" size={16} />;
      default:
        return <Clock className="status-icon status-pending" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'status-badge-confirmed';
      case 'completed':
        return 'status-badge-completed';
      case 'cancelled':
        return 'status-badge-cancelled';
      default:
        return 'status-badge-pending';
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: Array<AdminTableColumn<IBooking>> = [
    {
      header: 'Tour Information',
      render: (booking) => {
        const tour = typeof booking.tour === 'object' ? booking.tour : null;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
              {tour?.images?.[0]?.url ? (
                <Image
                  src={tour.images[0].url}
                  alt={(typeof tour?.heading === 'object' ? tour.heading.en : tour?.heading) || 'Tour'}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <MapPin size={20} />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                {(typeof tour?.heading === 'object' ? tour.heading.en : tour?.heading) || 'Tour Not Found'}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#b79c5c]">
                Ref: {(booking._id || booking.id || '').slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Customer',
      render: (booking) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#b79c5c]" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{booking.name}</span>
          </div>
          {booking.nationality && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 pl-3">
              <span className="opacity-70">from</span>
              <span className="font-semibold text-gray-600 dark:text-gray-300 italic">{booking.nationality}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Details',
      render: (booking) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
              <Mail size={12} />
            </div>
            <span className="font-medium truncate max-w-[140px]">{booking.email}</span>
          </div>
          {booking.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="w-6 h-6 rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500">
                <Phone size={12} />
              </div>
              <span className="font-medium">{booking.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Schedule',
      render: (booking) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-[#b79c5c]" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {formatDate(booking.dateFrom)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              to {formatDate(booking.dateTo)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Group Size',
      render: (booking) => (
        <div className="flex flex-wrap gap-1 max-w-[120px]">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-100 dark:border-indigo-900/30">
            <Users size={12} />
            <span>{booking.adults} Adl</span>
          </div>
          {booking.children > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-[11px] font-bold border border-violet-100 dark:border-violet-900/30">
              <span>{booking.children} Chl</span>
            </div>
          )}
          {booking.infants > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-100 dark:border-amber-900/30">
              <span>{booking.infants} Inf</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (booking) => {
        const status = booking.status || 'pending';
        return (
          <div className={`status-badge-premium ${status}`}>
            {getStatusIcon(status)}
            <span className="uppercase tracking-widest font-black">{status}</span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      render: (booking) => (
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#b79c5c] text-white shadow-lg shadow-[#b79c5c]/20 hover:bg-[#8a7545] transition-all hover:scale-105 active:scale-95"
            onClick={() => handleViewDetails(booking)}
            title="View Details"
          >
            <Eye size={16} strokeWidth={2.5} />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-105 active:scale-95"
            onClick={() => handleDeleteBooking(booking._id || booking.id || '')}
            disabled={deleting === (booking._id || booking.id)}
            title="Delete Booking"
          >
            {deleting === (booking._id || booking.id) ? (
              <Loader2 size={16} className="spinning" />
            ) : (
              <Trash2 size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      ),
    },
  ];

  if (initialLoad) {
    return <AdminPageSkeleton showStats showFilters tableRows={10} />;
  }

  return (
    <div className="booking-admin admin-scope">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tour Bookings</h1>
          <p className="admin-page-subtitle">Manage all tour booking requests</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchBookings} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={Calendar} value={stats.total} label="Total Bookings" iconVariant="total" />
        <StatCard icon={Clock} value={stats.pending} label="Pending" iconVariant="pending" />
        <StatCard icon={CheckCircle} value={stats.confirmed} label="Confirmed" iconVariant="confirmed" />
        <StatCard icon={CheckCircle} value={stats.completed} label="Completed" iconVariant="completed" />
        <StatCard icon={XCircle} value={stats.cancelled} label="Cancelled" iconVariant="cancelled" />
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        onDeleteSelected={handleBulkDelete}
        deleteDisabled={loading}
      />

      {/* Bookings Table */}
      <div className="table-container">
        <AdminTable<IBooking>
          data={bookings}
          columns={columns}
          getRowKey={(row, index) => (row._id || row.id || String(index)) as string}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className="loading-state">
              <Loader2 size={32} className="spinning" />
              <p>Loading bookings...</p>
            </div>
          }
          emptyNode={
            <div className="empty-state">
              <Calendar size={48} />
              <p>No bookings found</p>
            </div>
          }
          tableClassName="bookings-table"
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={stats.total} // Need verify if this total matches current filter
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

      {/* Details Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="bg-[#b79c5c]/10 p-2 rounded-lg">
                  <Calendar className="text-[#b79c5c]" size={20} />
                </div>
                <div>
                  <h2>Booking Details</h2>
                  <p className="text-xs text-gray-500 font-normal">Reference: {(selectedBooking._id || selectedBooking.id || "").slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <XCircle size={22} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3><MapPin size={14} /> Tour Information</h3>
                {typeof selectedBooking.tour === 'object' && selectedBooking.tour && (
                  <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    {selectedBooking.tour.images?.[0]?.url && (
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                            <Image
                                src={selectedBooking.tour.images[0].url}
                                alt={(typeof selectedBooking.tour.heading === 'object' ? selectedBooking.tour.heading.en : selectedBooking.tour.heading) || 'Tour'}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {(typeof selectedBooking.tour.heading === 'object' ? selectedBooking.tour.heading.en : selectedBooking.tour.heading) || 'N/A'}
                        </p>
                        <p className="text-sm text-[#b79c5c] font-medium flex flex-wrap items-center gap-1.5 mt-1">
                            <Calendar size={12} /> {formatDate(selectedBooking.dateFrom)} <span className="opacity-50 mx-1">to</span> {formatDate(selectedBooking.dateTo)}
                        </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3><Users size={14} /> Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <p>{selectedBooking.name}</p>
                  </div>
                  <div className="detail-item">
                    <label>Nationality</label>
                    <p>{selectedBooking.nationality || 'Not specified'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email Address</label>
                    <p className="flex items-center gap-1.5"><Mail size={12} className="text-[#b79c5c]" /> {selectedBooking.email}</p>
                  </div>
                  <div className="detail-item">
                    <label>Phone Number</label>
                    <p className="flex items-center gap-1.5"><Phone size={12} className="text-[#b79c5c]" /> {selectedBooking.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3><Users size={14} /> Traveler Counts</h3>
                <div className="flex flex-wrap gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 min-w-[80px] text-center">
                        <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Adults</span>
                        <span className="text-lg font-bold">{selectedBooking.adults}</span>
                    </div>
                    {selectedBooking.children > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 min-w-[80px] text-center">
                            <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Children</span>
                            <span className="text-lg font-bold">{selectedBooking.children}</span>
                        </div>
                    )}
                    {selectedBooking.infants > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 min-w-[80px] text-center">
                            <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Infants</span>
                            <span className="text-lg font-bold">{selectedBooking.infants}</span>
                        </div>
                    )}
                </div>
              </div>

              {selectedBooking.requirements && (
                <div className="detail-section">
                    <h3><MessageSquare size={14} /> Special Requirements</h3>
                    <p className="comments-text text-sm italic">{selectedBooking.requirements}</p>
                </div>
              )}

              <div className="detail-section">
                <h3><CheckCircle size={14} /> Status & Internal Notes</h3>
                <div className="space-y-4 pt-2">
                  <div className="admin-field">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Booking Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="status-select w-full"
                    >
                      <option value="pending">Pending Confirmation</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Internal Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      placeholder="Add internal notes about this booking..."
                      className="admin-notes-textarea w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={handleUpdateBooking}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Update Booking
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

export default BookingPage;

