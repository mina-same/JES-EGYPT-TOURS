"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit, Trash2, 
  Calendar, Users, MapPin, Mail, Phone,
  CheckCircle, Clock, XCircle, Loader2, RefreshCw,
  ChevronDown, FileText
} from 'lucide-react';
import { getAllBookings, deleteBooking, updateBooking, getBookingStats, IBooking } from '@/lib/api/booking';
import Image from 'next/image';
import './booking.css';

const BookingPage: React.FC = () => {
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
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    setDeleting(id);
    try {
      await deleteBooking(id);
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    } finally {
      setDeleting(null);
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
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-confirmed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.confirmed}</div>
            <div className="stat-label">Confirmed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-cancelled">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>
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

      {/* Bookings Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spinning" />
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <p>No bookings found</p>
          </div>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Tour</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Date & Time</th>
                <th>Travelers</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const tour = typeof booking.tour === 'object' ? booking.tour : null;
                return (
                  <tr key={booking._id || booking.id}>
                    <td>
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
                          <div className="tour-name">
                            {tour?.heading || 'Tour Not Found'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{booking.name}</div>
                        {booking.nationality && (
                          <div className="customer-nationality">{booking.nationality}</div>
                        )}
                      </div>
                    </td>
                    <td>
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
                    </td>
                    <td>
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
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(booking.status || 'pending')}`}>
                        {getStatusIcon(booking.status || 'pending')}
                        {booking.status || 'pending'}
                      </span>
                    </td>
                    <td>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

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

