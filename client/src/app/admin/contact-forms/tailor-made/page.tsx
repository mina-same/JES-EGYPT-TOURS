"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Trash2, 
  Calendar, Users, MapPin, MessageSquare,
  CheckCircle, Clock, XCircle, Loader2, RefreshCw,
  Mail, Phone
} from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import StatCard from '@/components/common/StatCard/StatCard';
import AdminTable, { type AdminTableColumn } from '@/components/admin/AdminTable';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';

interface TailorMadeRequest {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  country: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  duration?: string;
  accommodation?: string;
  adults: number;
  children: number;
  infants: number;
  minBudget?: string;
  maxBudget?: string;
  specialOccasion?: string;
  interests: string[];
  dietary?: string;
  mobility?: string;
  comments: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const TailorMadePage: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<TailorMadeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<TailorMadeRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      const url = statusFilter === 'all' 
        ? API_ENDPOINTS.TAILOR_MADE.BASE
        : `${API_ENDPOINTS.TAILOR_MADE.BASE}?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched requests:', data);
        setRequests(data.data || []);
      } else {
        console.error('Failed to fetch requests:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: TailorMadeRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setNewStatus(request.status);
    setShowModal(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_ENDPOINTS.TAILOR_MADE.BY_ID(selectedRequest._id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        fetchRequests();
      }
    } catch (error) {
      console.error('Error updating request:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
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
          fetch(API_ENDPOINTS.TAILOR_MADE.BY_ID(id), {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      const failed = results.find((r) => !r.ok);
      if (failed) {
        throw new Error('Failed to delete request(s)');
      }

      toast({
        title: 'Deleted',
        description:
          deleteIds.length === 1
            ? 'Request deleted successfully.'
            : `${deleteIds.length} requests deleted successfully.`,
        variant: 'success',
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      fetchRequests();
    } catch (err: any) {
      const msg = err.message || 'Failed to delete request(s)';
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
      case 'pending': return 'status-pending';
      case 'contacted': return 'status-contacted';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'contacted': return <MessageSquare size={16} />;
      case 'in-progress': return <Loader2 size={16} className="spinner" />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return null;
    }
  };

  const filteredRequests = requests.filter(request => 
    request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    inProgress: requests.filter(r => r.status === 'in-progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  const columns: Array<AdminTableColumn<TailorMadeRequest>> = [
    {
      header: 'Customer',
      render: (request) => (
        <div className="customer-info">
          <div className="customer-name">{request.fullName}</div>
          <div className="customer-details">
            <Mail size={14} /> {request.email}
          </div>
          {request.phone && (
            <div className="customer-details">
              <Phone size={14} /> {request.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Travel Details',
      render: (request) => (
        <div className="travel-info">
          <div className="travel-dates">
            <Calendar size={14} />
            {request.startMonth} {request.startYear} - {request.endMonth} {request.endYear}
          </div>
          <div className="travel-location">
            <MapPin size={14} /> {request.country}
          </div>
        </div>
      ),
    },
    {
      header: 'Travelers',
      render: (request) => (
        <div className="travelers-count">
          <Users size={14} />
          {request.adults}A {request.children > 0 && `${request.children}C`} {request.infants > 0 && `${request.infants}I`}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (request) => (
        <span className={`status-badge ${getStatusColor(request.status)}`}>
          {getStatusIcon(request.status)}
          {request.status.replace('-', ' ')}
        </span>
      ),
    },
    {
      header: 'Date',
      render: (request) => (
        <div className="date-info">{new Date(request.createdAt).toLocaleDateString()}</div>
      ),
    },
    {
      header: 'Actions',
      render: (request) => (
        <div className="action-buttons">
          <button
            className="btn-icon btn-view"
            onClick={() => handleViewDetails(request)}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDeleteRequest(request._id)}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="tailor-made-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tailor-Made Requests</h1>
          <p className="admin-page-subtitle">Manage custom tour requests from customers</p>
        </div>
        <button className="btn-refresh" onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={Users} value={stats.total} label="Total Requests" iconVariant="total" />
        <StatCard icon={Clock} value={stats.pending} label="Pending" iconVariant="pending" />
        <StatCard icon={Loader2} value={stats.inProgress} label="In Progress" iconVariant="progress" />
        <StatCard icon={CheckCircle} value={stats.completed} label="Completed" iconVariant="completed" />
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="in-progress">In Progress</option>
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

      {/* Requests Table */}
      <div className="requests-table-container">
        <AdminTable<TailorMadeRequest>
          data={filteredRequests}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className="loading-state">
              <Loader2 size={48} className="spinner" />
              <p>Loading requests...</p>
            </div>
          }
          emptyNode={
            <div className="empty-state">
              <MessageSquare size={64} />
              <h3>No requests found</h3>
              <p>There are no tailor-made requests matching your criteria.</p>
            </div>
          }
          tableClassName="requests-table"
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

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Customer Information */}
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <p>{selectedRequest.fullName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{selectedRequest.email}</p>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <p>{selectedRequest.phone || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Country</label>
                    <p>{selectedRequest.country}</p>
                  </div>
                </div>
              </div>

              {/* Travel Details */}
              <div className="detail-section">
                <h3>Travel Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Travel Period</label>
                    <p>{selectedRequest.startMonth} {selectedRequest.startYear} - {selectedRequest.endMonth} {selectedRequest.endYear}</p>
                  </div>
                  <div className="detail-item">
                    <label>Duration</label>
                    <p>{selectedRequest.duration || 'Not specified'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Accommodation</label>
                    <p>{selectedRequest.accommodation || 'Not specified'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Travelers</label>
                    <p>{selectedRequest.adults} Adults, {selectedRequest.children} Children, {selectedRequest.infants} Infants</p>
                  </div>
                </div>
              </div>

              {/* Budget & Preferences */}
              <div className="detail-section">
                <h3>Budget & Preferences</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Budget Range</label>
                    <p>
                      {selectedRequest.minBudget && selectedRequest.maxBudget 
                        ? `$${selectedRequest.minBudget} - $${selectedRequest.maxBudget}`
                        : selectedRequest.minBudget 
                        ? `From $${selectedRequest.minBudget}`
                        : selectedRequest.maxBudget
                        ? `Up to $${selectedRequest.maxBudget}`
                        : 'Not specified'}
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Special Occasion</label>
                    <p>{selectedRequest.specialOccasion || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Interests */}
              {selectedRequest.interests.length > 0 && (
                <div className="detail-section">
                  <h3>Interests</h3>
                  <div className="interests-tags">
                    {selectedRequest.interests.map((interest, index) => (
                      <span key={index} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Requirements */}
              {(selectedRequest.dietary || selectedRequest.mobility) && (
                <div className="detail-section">
                  <h3>Special Requirements</h3>
                  <div className="detail-grid">
                    {selectedRequest.dietary && (
                      <div className="detail-item">
                        <label>Dietary Requirements</label>
                        <p>{selectedRequest.dietary}</p>
                      </div>
                    )}
                    {selectedRequest.mobility && (
                      <div className="detail-item">
                        <label>Mobility Requirements</label>
                        <p>{selectedRequest.mobility}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="detail-section">
                <h3>Customer Comments</h3>
                <p className="comments-text">{selectedRequest.comments}</p>
              </div>

              {/* Metadata */}
              <div className="detail-section">
                <h3>Request Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Submitted On</label>
                    <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="detail-item">
                    <label>Last Updated</label>
                    <p>{new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Admin Management */}
              <div className="detail-section">
                <h3>Admin Management</h3>
                <div className="admin-management-grid">
                  <div className="admin-field">
                    <label>Update Status</label>
                    <select 
                      value={newStatus} 
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="admin-field">
                    <label>Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes about this request..."
                      rows={4}
                      className="admin-notes-textarea"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleUpdateRequest}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 size={18} className="spinner" />
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

export default TailorMadePage;
