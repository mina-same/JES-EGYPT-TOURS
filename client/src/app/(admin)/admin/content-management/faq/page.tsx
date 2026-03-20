"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  HelpCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Tag,
} from "lucide-react";

import { faqService, type FAQ } from "@/services/faqService";
import { getLocalizedValue } from "@/lib/localize";
import AdminTable, { type AdminTableColumn } from "@/components/admin/AdminTable";
import StatCard from "@/components/common/StatCard/StatCard";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { AdminPageSkeleton } from "@/components/admin/AdminPageSkeleton";

const AdminFAQManagement: React.FC = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [homeFilter, setHomeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchFAQs();
  }, [page, limit, searchTerm, statusFilter, homeFilter, categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await faqService.getFaqCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sort: 'category,order',
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }

      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      if (homeFilter !== 'all') {
        params.displayOnHome = homeFilter === 'yes';
      }

      const response = await faqService.getAllFaqs(params);
      
      if (response.success && response.data) {
        setFaqs(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalItems(response.pagination?.total || response.data.length);
      } else {
        setFaqs([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast({
        title: "Error",
        description: "Failed to load FAQs",
        variant: "destructive",
      });
      setFaqs([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      setToggling(faq._id);
      const response = await faqService.updateFaq(faq._id, {
        isActive: !faq.isActive
      });

      if (!response.success) return;
      setFaqs(faqs.map(f => 
        f._id === faq._id ? { ...f, isActive: !f.isActive } : f
      ));
      toast({
        title: "Success",
        description: `FAQ ${!faq.isActive ? "activated" : "deactivated"}`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error toggling FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  };

  const handleToggleHomeDisplay = async (faq: FAQ) => {
    try {
      setToggling(faq._id);
      const response = await faqService.updateFaq(faq._id, {
        displayOnHome: !faq.displayOnHome
      });

      if (!response.success) return;
      setFaqs(faqs.map(f => 
        f._id === faq._id ? { ...f, displayOnHome: !f.displayOnHome } : f
      ));
      toast({
        title: "Success",
        description: `FAQ ${!faq.displayOnHome ? "added to" : "removed from"} home page`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error toggling home display:", error);
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteClick = (id: string) => {
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
    try {
      setDeleteBusy(true);
      const results = await Promise.all(deleteIds.map(id => faqService.deleteFaq(id)));
      const failed = results.find(r => !r.success);
      if (failed) throw new Error("Failed to delete some FAQs");

      toast({
        title: "Deleted",
        description: deleteIds.length === 1 ? "FAQ deleted successfully" : `${deleteIds.length} FAQs deleted successfully`,
        variant: "success",
      });
      setSelectedRowKeys([]);
      setDeleteModalOpen(false);
      setDeleteIds([]);
      fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ(s)",
        variant: "destructive",
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const stats = {
    total: totalItems,
    active: faqs.filter((f) => f.isActive).length,
    inactive: faqs.filter((f) => !f.isActive).length,
    home: faqs.filter((f) => f.displayOnHome).length,
  };

  const columns: Array<AdminTableColumn<FAQ>> = [
    {
      header: "FAQ",
      render: (faq: FAQ) => (
        <div className="faq-row-info">
          <div className="faq-icon-wrapper">
            <HelpCircle size={20} />
          </div>
          <div className="faq-content-wrapper">
            <div className="faq-question-text">{getLocalizedValue(faq.question, 'en') || 'Untitled FAQ'}</div>
            <div className="faq-answer-preview">
              {faq.answer ? (getLocalizedValue(faq.answer, 'en').length > 100 ? getLocalizedValue(faq.answer, 'en').substring(0, 100) + '...' : getLocalizedValue(faq.answer, 'en')) : 'No answer provided'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (faq: FAQ) => (
        <span className="subcategory-badge">
          <Tag size={14} />
          {faq.category || "General"}
        </span>
      ),
    },
    {
      header: "Order",
      render: (faq: FAQ) => (
        <div className="tour-meta-item">
          <span>#{faq.order}</span>
        </div>
      ),
    },
    {
      header: "Status",
      render: (faq: FAQ) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span className={`status-badge ${faq.isActive ? 'status-active' : 'status-inactive'}`}>
            {faq.isActive ? (
              <>
                <CheckCircle size={14} /> Active
              </>
            ) : (
              <>
                <XCircle size={14} /> Inactive
              </>
            )}
          </span>
          {faq.displayOnHome && (
            <span className="featured-badge">
              <Home size={14} />
              Home Page
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      render: (faq: FAQ) => (
        <div className="action-buttons">
          <Link href={`/admin/content-management/faq/${faq._id}/edit`}>
            <button className="btn-icon btn-edit" title="Edit">
              <Edit2 size={16} />
            </button>
          </Link>
          <button
            className="btn-icon btn-toggle"
            onClick={() => handleToggleActive(faq)}
            disabled={toggling === faq._id}
            title={faq.isActive ? "Deactivate" : "Activate"}
          >
            {faq.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className={`btn-icon btn-featured ${faq.displayOnHome ? 'is-featured' : ''}`}
            onClick={() => handleToggleHomeDisplay(faq)}
            disabled={toggling === faq._id}
            title={faq.displayOnHome ? "Remove from Home" : "Show on Home"}
          >
            <Home size={16} />
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDeleteClick(faq._id)}
            disabled={deleteBusy}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (initialLoad) {
    return <AdminPageSkeleton showStats showFilters tableRows={10} />;
  }

  return (
    <div className='tailor-made-admin'>
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

      <div className='admin-page-header'>
        <div>
          <h1 className='admin-page-title'>FAQ Management</h1>
          <p className='admin-page-subtitle'>Manage frequently asked questions for your website</p>
        </div>
        <div className='header-actions'>
          <button className='btn-refresh' onClick={fetchFAQs} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <Link href='/admin/content-management/faq/new' className='btn-add-new'>
            <Plus size={18} />
            Add FAQ
          </Link>
        </div>
      </div>

      <div className='stats-grid'>
        <StatCard icon={HelpCircle} value={stats.total} label='Total FAQs' iconVariant='total' />
        <StatCard icon={CheckCircle} value={stats.active} label='Active' iconVariant='active' />
        <StatCard icon={XCircle} value={stats.inactive} label='Hidden' iconVariant='inactive' />
        <StatCard icon={Home} value={stats.home} label='On Home' iconVariant='progress' />
      </div>

      <div className='filters-bar'>
        <div className='search-box'>
          <Search size={18} />
          <input
            type='text'
            placeholder='Search by question or category...'
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className='filter-group'>
          <Tag size={18} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value='all'>All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className='filter-group'>
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
        </div>
        <div className='filter-group'>
          <Home size={18} />
          <select value={homeFilter} onChange={(e) => setHomeFilter(e.target.value)}>
            <option value='all'>All Visibility</option>
            <option value='yes'>On Home</option>
            <option value='no'>Not on Home</option>
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
        <AdminTable<FAQ>
          data={faqs}
          columns={columns}
          getRowKey={(row) => row._id}
          enableSelection
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={setSelectedRowKeys}
          loading={loading}
          loadingNode={
            <div className='loading-state'>
              <Loader2 size={48} className='spinner' />
              <p>Loading FAQs...</p>
            </div>
          }
          emptyNode={
            <div className='empty-state'>
              <HelpCircle size={64} />
              <h3>No FAQs found</h3>
              <p>There are no FAQs matching your criteria.</p>
              <Link href='/admin/content-management/faq/new' className='btn-add-new' style={{ marginTop: '16px' }}>
                <Plus size={18} />
                Create First FAQ
              </Link>
            </div>
          }
          tableClassName='requests-table'
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageChange={setPage}
          onItemsPerPageChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default AdminFAQManagement;
