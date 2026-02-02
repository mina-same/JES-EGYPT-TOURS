"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Trash2, 
  Calendar, Users, Mail, Phone,
  CheckCircle, Clock, XCircle, Loader2, RefreshCw,
  
} from 'lucide-react';
import { getAllBookings, deleteBooking, updateBooking, getBookingStats, IBooking } from '@/lib/api/booking';
import { useBooking } from '@/contexts/BookingContext';
import Image from 'next/image';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';

const BookingPage: React.FC = () => {
  const { refreshCount } = useBooking();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
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
        limit: 10,
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string | Date) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: Array<AdminTableColumn<IBooking>> = [
    {
      header: 'Tour',
      render: (booking) => {
        const tour = typeof booking.tour === 'object' ? booking.tour : null;
        return (
          <div className="tour-info">
            {tour?.images?.[0]?.url && (
              <Image
                src={tour.images[0].url}
                alt={tour.heading || 'Tour'}
                width={50}
                height={50}
                className="tour-thumbnail"
              />
            )}
            <div>
              <div className="tour-name">{tour?.heading || 'Tour Not Found'}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Customer',
      render: (booking) => (
        <div className="customer-info">
          <div className="customer-name">{booking.name}</div>
          {booking.nationality && (
            <div className="customer-nationality">{booking.nationality}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Contact',
      render: (booking) => (
        <div className="contact-info">
          <div className="contact-item">
            <Mail size={14} />
            <span>{booking.email}</span>
          </div>
          {booking.phone && (
            <div className="contact-item">
              <Phone size={14} />
              <span>{booking.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Date & Time',
      render: (booking) => (
        <div className="date-time-info">
          <div className="date-item">
            <Calendar size={14} />
            <span>{formatDate(booking.date)}</span>
          </div>
          <div className="time-item">
            <Clock size={14} />
            <span>{formatTime(booking.time)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Travelers',
      render: (booking) => (
        <div className="travelers-info">
          <div className="traveler-item">
            <Users size={14} />
            <span>{booking.adults} Adults</span>
          </div>
          {booking.children > 0 && (
            <div className="traveler-item">
              <span>{booking.children} Children</span>
            </div>
          )}
          {booking.infants > 0 && (
            <div className="traveler-item">
              <span>{booking.infants} Infants</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (booking) => (
        <span className={`status-badge ${getStatusColor(booking.status || 'pending')}`}>
          {getStatusIcon(booking.status || 'pending')}
          {booking.status || 'pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (booking) => (
        <div className="action-buttons">
          <button
            className="btn-action btn-view"
            onClick={() => handleViewDetails(booking)}
          >
            <Eye size={16} />
          </button>
          <button
            className="btn-action btn-delete"
            onClick={() => handleDeleteBooking(booking._id || booking.id || '')}
            disabled={deleting === (booking._id || booking.id)}
          >
            {deleting === (booking._id || booking.id) ? (
              <Loader2 size={16} className="spinning" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="booking-admin">
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
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Tour Information</h3>
                {typeof selectedBooking.tour === 'object' && selectedBooking.tour && (
                  <div className="detail-item">
                    <strong>Tour:</strong> {selectedBooking.tour.heading || 'N/A'}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-item">
                  <strong>Name:</strong> {selectedBooking.name}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {selectedBooking.email}
                </div>
                {selectedBooking.phone && (
                  <div className="detail-item">
                    <strong>Phone:</strong> {selectedBooking.phone}
                  </div>
                )}
                {selectedBooking.nationality && (
                  <div className="detail-item">
                    <strong>Nationality:</strong> {selectedBooking.nationality}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Booking Details</h3>
                <div className="detail-item">
                  <strong>Date:</strong> {formatDate(selectedBooking.date)}
                </div>
                <div className="detail-item">
                  <strong>Time:</strong> {formatTime(selectedBooking.time)}
                </div>
                <div className="detail-item">
                  <strong>Travelers:</strong> {selectedBooking.adults} Adults, {selectedBooking.children} Children, {selectedBooking.infants} Infants
                </div>
                {selectedBooking.requirements && (
                  <div className="detail-item">
                    <strong>Requirements:</strong>
                    <p>{selectedBooking.requirements}</p>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Status & Notes</h3>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Add notes about this booking..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
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
                  'Update Booking'
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

