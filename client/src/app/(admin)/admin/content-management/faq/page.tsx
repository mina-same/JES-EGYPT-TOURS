"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
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
  // Which list is open: 'yes' = home page, 'no' = FAQ page. There is no "all"
  // view — the two are separate places, and showing them merged is what hid the
  // fact that the FAQ page had nothing in it.
  const [homeFilter, setHomeFilter] = useState<string>("yes");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  // Totals per placement, independent of the current tab, page and filters —
  // they label the tabs, so they must not change when you page through a list.
  const [placementCounts, setPlacementCounts] = useState({ home: 0, faq: 0 });

  const fetchPlacementCounts = useCallback(async () => {
    try {
      // limit: 1 — only `pagination.total` is wanted, not the rows.
      const [home, faq] = await Promise.all([
        faqService.getAllFaqsForAdmin({ displayOnHome: true, limit: 1 }),
        faqService.getAllFaqsForAdmin({ displayOnHome: false, limit: 1 }),
      ]);
      setPlacementCounts({
        home: home.pagination?.total ?? 0,
        faq: faq.pagination?.total ?? 0,
      });
    } catch (error) {
      console.error("Error fetching FAQ placement counts:", error);
    }
  }, []);

  // Declared after fetchPlacementCounts: a `const` callback cannot be referenced
  // in a dependency array before it is initialised.
  useEffect(() => {
    fetchCategories();
    fetchPlacementCounts();
  }, [fetchPlacementCounts]);

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

  const fetchFAQs = useCallback(async () => {
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

      // Admin-only fetcher: always every FAQ in every language, so a row with
      // no text in the current UI language never vanishes from the editor.
      const response = await faqService.getAllFaqsForAdmin(params);
      
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
  }, [page, limit, searchTerm, statusFilter, homeFilter, categoryFilter, toast]);

  // Declared after fetchFAQs on purpose: a `const` callback cannot be referenced
  // in a dependency array before it is initialised. It closes over the filter
  // state, so this re-runs exactly when a filter changes.
  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

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
      // The question now belongs to the OTHER tab, so it has to leave this list
      // rather than sit here mislabelled — and both tab counts have changed.
      fetchFAQs();
      fetchPlacementCounts();
      toast({
        title: "Success",
        description: `Moved to the ${!faq.displayOnHome ? "home page" : "FAQ page"}`,
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
      fetchPlacementCounts();
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
    total: placementCounts.home + placementCounts.faq,
    active: faqs.filter((f) => f.isActive).length,
    inactive: faqs.filter((f) => !f.isActive).length,
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
            title={faq.displayOnHome ? "Move to the FAQ page" : "Move to the home page"}
          >
            {/* A transfer arrow, not a house: the button MOVES the question to
                the other list, and a house icon read as "this is the home one". */}
            <ArrowRightLeft size={16} />
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
          {/* Creates the question in the list you are looking at, so the common
              case needs no extra decision. The form still lets you change it. */}
          <Link
            href={`/admin/content-management/faq/new?placement=${homeFilter === 'yes' ? 'home' : 'faq'}`}
            className='btn-add-new'
          >
            <Plus size={18} />
            {homeFilter === 'yes' ? 'Add to home page' : 'Add to FAQ page'}
          </Link>
        </div>
      </div>

      <div className='stats-grid'>
        <StatCard icon={HelpCircle} value={stats.total} label='Total FAQs' iconVariant='total' />
        <StatCard icon={CheckCircle} value={stats.active} label='Active' iconVariant='active' />
        <StatCard icon={XCircle} value={stats.inactive} label='Hidden' iconVariant='inactive' />
        {/* The two placements side by side: a "FAQ page 0" here is the signal
            that /faq has nothing to show — the state that used to be invisible. */}
        <StatCard icon={Home} value={placementCounts.home} label='Home page' iconVariant='progress' />
        <StatCard icon={HelpCircle} value={placementCounts.faq} label='FAQ page' iconVariant='total' />
      </div>

      {/*
        Two lists, not one with a filter. A question belongs to exactly one of
        them — the FAQ page deliberately leaves out whatever the homepage shows —
        so the editor picks a place first and works inside it. "Add FAQ" then
        creates the question where you already are.
      */}
      <div className='flex flex-wrap items-center gap-2 mb-4'>
        {([
          { key: 'yes', icon: Home, label: 'Home page', count: placementCounts.home },
          { key: 'no', icon: HelpCircle, label: 'FAQ page', count: placementCounts.faq },
        ] as const).map((tab) => {
          const selected = homeFilter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type='button'
              onClick={() => {
                setHomeFilter(tab.key);
                setPage(1);
                setSelectedRowKeys([]);
              }}
              aria-pressed={selected}
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? 'border-[#b79c5c] bg-[#b79c5c]/10 text-[#b79c5c]'
                  : 'border-gray-200 text-gray-600 hover:border-[#b79c5c]/60 dark:border-slate-700 dark:text-gray-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span className='rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10'>
                {tab.count}
              </span>
            </button>
          );
        })}
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
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
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
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
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
