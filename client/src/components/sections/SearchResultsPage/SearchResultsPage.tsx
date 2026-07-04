"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Loader2 } from "lucide-react";

import { tourAPI } from "@/lib/api/tour";
import { getAllBlogs, getAllSubCategories, BlogSubCategory } from "@/lib/api/blog";
import Pagination from "@/components/common/Pagination/Pagination";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "@/hooks/use-toast";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { getLocalizedValue } from "@/lib/localize";
import TourCard from "@/components/common/TourCard/TourCard";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

type SearchParamValue = string | string[] | undefined;

interface SearchResultsPageProps {
  initialSearchParams: Record<string, SearchParamValue>;
}

const toStr = (v: SearchParamValue): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
};

const toNum = (v: SearchParamValue, fallback: number) => {
  const s = toStr(v);
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const buildQueryString = (params: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, v);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

function getStrictLocalizedSlug(slugValue: any, locale: string): string | null {
  if (!slugValue) return null;

  if (typeof slugValue === "string") {
    const trimmed = slugValue.trim();
    return locale === "en" && trimmed ? trimmed : null;
  }

  if (typeof slugValue !== "object") return null;

  const value = slugValue[locale];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ initialSearchParams }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tours, setTours] = useState<any[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState<string | null>(null);
  const [toursPage, setToursPage] = useState(1);
  const [toursTotalPages, setToursTotalPages] = useState(1);

  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogsPagination, setBlogsPagination] = useState<any>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<BlogSubCategory[]>([]);

  const { locale } = useParams() as { locale: string };
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t } = useTranslation('search');
  const { currencySymbol } = useCurrency();

  // Filter options state
  const [tourTypeOptions, setTourTypeOptions] = useState<string[]>([]);
  const [tourStyleOptions, setTourStyleOptions] = useState<string[]>([]);

  // Video reviews state
  const [isOpen, setOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);

  const getYouTubeVideoId = (url: string): string => {
    if (!url) return "";
    const t = url.trim();
    const s = t.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/); if (s?.[1]) return s[1];
    const w = t.match(/[?&]v=([a-zA-Z0-9_-]{6,})/); if (w?.[1]) return w[1];
    const e = t.match(/\/embed\/([a-zA-Z0-9_-]{6,})/); if (e?.[1]) return e[1];
    const sh = t.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/); if (sh?.[1]) return sh[1];
    return "";
  };

  const openVideoReviews = async (tourSlug: string) => {
    try {
      const res = await tourAPI.getBySlug(tourSlug);
      if (res.success && res.data) {
        const vids = (Array.isArray(res.data.reviews) ? res.data.reviews : [])
          .map((r: any) => getYouTubeVideoId(typeof r?.url === "string" ? r.url : ""))
          .filter(Boolean);
        if (vids.length > 0) {
          setVideoIds(vids);
          setOpen(true);
        } else {
          toast({
            title: t('noVideoReviews'),
            description: t('noVideoReviewsDesc'),
            variant: "info",
          });
        }
      }
    } catch {
      toast({
        title: t('failedVideos'),
        description: t('failedVideosDesc'),
        variant: "destructive",
      });
    }
  };

  const effectiveParams = useMemo(() => {
    const current = searchParams;
    if (!current) return initialSearchParams;
    const obj: Record<string, string> = {};
    current.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [searchParams, initialSearchParams]);

  const [draftFilters, setDraftFilters] = useState({
    q: toStr((effectiveParams as any).q) || "",
    minPrice: toStr((effectiveParams as any).minPrice) || "",
    maxPrice: toStr((effectiveParams as any).maxPrice) || "",
    tourType: toStr((effectiveParams as any).tourType) || "",
    tourStyle: toStr((effectiveParams as any).tourStyle) || "",
    blogSubCategory: toStr((effectiveParams as any).blogSubCategory) || "",
    sort: toStr((effectiveParams as any).sort) || "-createdAt",
    blogSort: toStr((effectiveParams as any).blogSort) || "newest",
  });

  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  useEffect(() => {
    const next = {
      q: toStr((effectiveParams as any).q) || "",
      minPrice: toStr((effectiveParams as any).minPrice) || "",
      maxPrice: toStr((effectiveParams as any).maxPrice) || "",
      tourType: toStr((effectiveParams as any).tourType) || "",
      tourStyle: toStr((effectiveParams as any).tourStyle) || "",
      blogSubCategory: toStr((effectiveParams as any).blogSubCategory) || "",
      sort: toStr((effectiveParams as any).sort) || "-createdAt",
      blogSort: toStr((effectiveParams as any).blogSort) || "newest",
    };
    setDraftFilters(next);
    setAppliedFilters(next);
  }, [effectiveParams]);

  const q = appliedFilters.q;
  const page = toNum((effectiveParams as any).page, 1);
  const blogPage = toNum((effectiveParams as any).blogPage, 1);

  const updateUrl = (patch: Partial<typeof appliedFilters> & { page?: string; blogPage?: string }) => {
    const next: Record<string, string | undefined> = { 
      ...appliedFilters, 
      ...patch,
      page: patch.page || String(page),
      blogPage: patch.blogPage || String(blogPage)
    };

    // Reset pagination when searching or filtering
    if (patch.q !== undefined || patch.minPrice !== undefined || patch.maxPrice !== undefined || patch.tourType !== undefined || patch.tourStyle !== undefined || patch.sort !== undefined) {
      next.page = "1";
    }
    if (patch.q !== undefined || patch.blogSubCategory !== undefined || patch.blogSort !== undefined) {
      next.blogPage = "1";
    }

    router.push(`/search${buildQueryString(next)}`);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    updateUrl({ ...draftFilters, page: "1", blogPage: "1" });
  };

  const handleResetFilters = () => {
    const empty = {
      q: "",
      minPrice: "",
      maxPrice: "",
      tourType: "",
      tourStyle: "",
      blogSubCategory: "",
      sort: "-createdAt",
      blogSort: "newest",
    };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    router.push("/search");
  };

  useEffect(() => {
    setToursPage(page);
  }, [page]);

  // Fetch subcategories
  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const data = await getAllSubCategories();
        setSubCategories(data);
      } catch (e) {
        console.error("Failed to fetch subcategories:", e);
      }
    };
    void fetchSubCategories();
  }, []);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setToursLoading(true);
        setToursError(null);

        const res = await tourAPI.getAll({
          page,
          limit: 9,
          search: q || undefined,
          sort: appliedFilters.sort || undefined,
          minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
          maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
          tourType: appliedFilters.tourType || undefined,
          tourStyle: appliedFilters.tourStyle || undefined,
        });

        if (!res.success) {
          setToursError(res.error || "Failed to load tours");
          setTours([]);
          setToursTotalPages(1);
          return;
        }

        const mapped = (Array.isArray(res.data) ? res.data : []).map((tour: any) => {
          const tourSlug = getStrictLocalizedSlug(tour.slug, locale);
          if (!tourSlug) return null;
          const galleryImages = [
            ...(tour.images || []).map((img: any) => img.url),
            ...(tour.gallery || []).map((img: any) => img.url),
          ].filter(Boolean);
          const uniqueImages = Array.from(new Set(galleryImages));
          return {
            id: tour._id,
            slug: tourSlug,
            image: uniqueImages[0] || "/assets/images/resources/tour-1-1.jpg",
            allImages: uniqueImages.length > 0 ? uniqueImages : ["/assets/images/resources/tour-1-1.jpg"],
            title: getLocalizedValue(tour.heading || tour.name, locale),
            link: `/${locale}/${tourSlug}`,
            price: tour.priceStartingFrom || { USD: 0 },
            rating: 5,
            reviews: tour.reviews?.length || 0,
            videoId: tour.videoLink || "",
            discount: "",
            meta: [
              { id: 1, title: `${getLocalizedValue(tour.duration, locale) || '3 Days'}`, icon: "icon-clock" },
              { id: 2, title: `${tour.minAge || '12'} +`, icon: "icon-user" },
              { id: 3, title: getLocalizedValue(tour.tourLocation, locale) || "Location", icon: "icon-location" },
            ]
          };
        }).filter(Boolean);

        setTours(mapped);
        setToursTotalPages(res.totalPages || 1);

        // Derive options if not already set or whenever we have new results
        if (res.data && Array.isArray(res.data)) {
            const types = Array.from(new Set(res.data.map((t: any) => getLocalizedValue(t.tourType, 'en')).filter(Boolean))).sort();
            const styles = Array.from(new Set(res.data.map((t: any) => getLocalizedValue(t.tourStyle, 'en')).filter(Boolean))).sort();
            setTourTypeOptions(prev => Array.from(new Set([...prev, ...types as string[]])));
            setTourStyleOptions(prev => Array.from(new Set([...prev, ...styles as string[]])));
        }

      } catch (e) {
        console.error(e);
        setToursError("An error occurred while loading tours");
        setTours([]);
        setToursTotalPages(1);
      } finally {
        setToursLoading(false);
      }
    };

    void fetchTours();
  }, [q, page, appliedFilters.sort, appliedFilters.minPrice, appliedFilters.maxPrice, appliedFilters.tourType, appliedFilters.tourStyle, locale]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setBlogsLoading(true);
        setBlogsError(null);

        const opts: any = { 
          page: blogPage, 
          limit: 6, 
          search: q || undefined,
          subCategory: appliedFilters.blogSubCategory || undefined 
        };
        if (appliedFilters.blogSort === "popular") {
          opts.sort = 'popular';
        }

        const res = await getAllBlogs(opts);
        setBlogs(res.data);
        setBlogsPagination(res.pagination);
      } catch (e) {
        console.error(e);
        setBlogsError("Failed to load blogs");
        setBlogs([]);
        setBlogsPagination({ page: 1, limit: 6, total: 0, pages: 1 });
      } finally {
        setBlogsLoading(false);
      }
    };

    void fetchBlogs();
  }, [q, blogPage, appliedFilters.blogSort, appliedFilters.blogSubCategory]);

  return (
    <section className="section-space">
      <Container>
        {/* Keyword Search Bar at Top */}
        <Row className="mb-5">
          <Col lg={10} className="mx-auto">
            <div className="search-box-wrapper">
              <div className="input-group shadow-sm rounded-pill overflow-hidden border bg-white">
                <input
                  className="form-control border-0 px-4"
                  placeholder={t('searchPlaceholder')}
                  value={draftFilters.q}
                  onChange={(e) => setDraftFilters(p => ({ ...p, q: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleApplyFilters();
                    }
                  }}
                  style={{ height: 60, fontSize: 18 }}
                />
                <button
                  className="btn btn-primary px-4 d-flex align-items-center"
                  onClick={handleApplyFilters}
                >
                  <i className="icon-search me-2"></i>
                  {t('searchBtn')}
                </button>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="gutter-y-40">
          {/* SIDEBAR FILTERS */}
          <Col lg={4} xl={3}>
            <aside className="listing__sidebar">
              <div className="listing__sidebar__item__inner" style={{ borderRadius: 14, border: "1px solid #eee", background: "#fff", position: 'sticky', top: 100 }}>
                <div style={{ padding: 18, borderBottom: "1px solid #f0f0f0" }}>
                  <h3 className="listing__sidebar__title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('filterResults')}</h3>
                </div>

                <div style={{ padding: 18, display: "grid", gap: 16 }}>
                  {/* TOURS FILTER SECTION */}
                  <div className="filter-group">
                    <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: '#b79c5c', fontWeight: 800, marginBottom: 12, borderLeft: '3px solid #b79c5c', paddingLeft: 8 }}>{t('experiences')}</h4>
                    
                    <div className="mb-3">
                      <label className="form-label font-weight-bold small">{t('sortToursBy')}</label>
                      <select
                        className="form-select form-select-sm"
                        value={draftFilters.sort}
                        onChange={(e) => setDraftFilters(p => ({ ...p, sort: e.target.value }))}
                      >
                        <option value="-createdAt">{t('newest')}</option>
                        <option value="-viewCount">{t('popularity')}</option>
                        <option value="priceStartingFrom">{t('priceLowToHigh')}</option>
                        <option value="-priceStartingFrom">{t('priceHighToLow')}</option>
                      </select>
                    </div>

                    <div className="row g-2 mb-3">
                       <div className="col-6">
                         <label className="form-label font-weight-bold small">{t('minPrice')}</label>
                         <div className="input-group input-group-sm">
                           <span className="input-group-text bg-white border-end-0">{currencySymbol}</span>
                           <input
                              type="number"
                              className="form-control border-start-0"
                              value={draftFilters.minPrice}
                              onChange={(e) => setDraftFilters(p => ({ ...p, minPrice: e.target.value }))}
                              placeholder="0"
                            />
                         </div>
                       </div>
                       <div className="col-6">
                         <label className="form-label font-weight-bold small">{t('maxPrice')}</label>
                         <div className="input-group input-group-sm">
                           <span className="input-group-text bg-white border-end-0">{currencySymbol}</span>
                           <input
                              type="number"
                              className="form-control border-start-0"
                              value={draftFilters.maxPrice}
                              onChange={(e) => setDraftFilters(p => ({ ...p, maxPrice: e.target.value }))}
                              placeholder="9999"
                            />
                         </div>
                       </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label font-weight-bold small">{t('tourType')}</label>
                      <select
                        className="form-select form-select-sm"
                        value={draftFilters.tourType}
                        onChange={(e) => setDraftFilters(p => ({ ...p, tourType: e.target.value }))}
                      >
                        <option value="">{t('anyType')}</option>
                        {tourTypeOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label font-weight-bold small">{t('tourStyle')}</label>
                      <select
                        className="form-select form-select-sm"
                        value={draftFilters.tourStyle}
                        onChange={(e) => setDraftFilters(p => ({ ...p, tourStyle: e.target.value }))}
                      >
                        <option value="">{t('anyStyle')}</option>
                        {tourStyleOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <hr style={{ margin: '8px 0', opacity: 0.1 }} />

                  {/* BLOGS FILTER SECTION */}
                  <div className="filter-group">
                    <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: '#b79c5c', fontWeight: 800, marginBottom: 12, borderLeft: '3px solid #b79c5c', paddingLeft: 8 }}>{t('knowledge')}</h4>
                    
                    <div className="mb-3">
                      <label className="form-label font-weight-bold small">{t('blogCategory')}</label>
                      <select
                        className="form-select form-select-sm"
                        value={draftFilters.blogSubCategory}
                        onChange={(e) => setDraftFilters(p => ({ ...p, blogSubCategory: e.target.value }))}
                      >
                        <option value="">{t('allArticles')}</option>
                        {subCategories.map(sc => (
                          <option key={sc._id} value={sc._id}>{getLocalizedValue(sc.name, locale)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label font-weight-bold small">{t('sortBlogsBy')}</label>
                      <select
                        className="form-select form-select-sm"
                        value={draftFilters.blogSort}
                        onChange={(e) => setDraftFilters(p => ({ ...p, blogSort: e.target.value }))}
                      >
                        <option value="newest">{t('newestFirst')}</option>
                        <option value="popular">{t('mostPopular')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 18, borderTop: "1px solid #f0f0f0", background: '#f9f9f9', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                  <div className="row g-2">
                    <div className="col-8">
                      <button
                        className="gotur-btn w-100"
                        onClick={handleApplyFilters}
                        style={{ height: 42, fontSize: 14 }}
                      >
                        {t('applyFilters')}
                      </button>
                    </div>
                    <div className="col-4">
                      <button
                        className="gotur-btn w-100"
                        onClick={handleResetFilters}
                        style={{ height: 42, fontSize: 14, background: "transparent", color: "#111", border: "1px solid #ddd" }}
                      >
                        {t('reset')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </Col>

          {/* RESULTS CONTENT */}
          <Col lg={8} xl={9}>
            {/* TOURS RESULTS */}
            <div className="results-wrapper mb-5 pb-5">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="section-title mb-0" style={{ fontSize: 24 }}>{t('experiencesFound')}</h2>
                {tours.length > 0 && <span className="badge bg-light text-dark px-3 py-2 rounded-pill border">{t('showingResults', { count: tours.length })}</span>}
              </div>

              {toursLoading ? (
                <div className="text-center py-5">
                  <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
                </div>
              ) : toursError ? (
                <div className="alert alert-danger shadow-sm border-0">{toursError}</div>
              ) : tours.length === 0 ? (
                <div className="text-center py-5 border rounded bg-light shadow-inner">
                  <i className="icon-search h1 text-muted d-block opacity-25"></i>
                  <p className="mt-3 text-muted">{t('noExperiences')}</p>
                </div>
              ) : (
                <>
                  <Row className="gutter-y-30">
                    {tours.map((t) => (
                      <Col lg={4} md={6} key={t.id}>
                        <TourCard 
                          item={t}
                          toggleWishlist={toggleWishlist}
                          isInWishlist={isInWishlist}
                          openVideoReviews={openVideoReviews}
                        />
                      </Col>
                    ))}
                  </Row>
                  <div className="mt-5 pt-3">
                    <Pagination
                      currentPage={toursPage}
                      totalPages={toursTotalPages}
                      onPageChange={(p) => updateUrl({ page: String(p) })}
                    />
                  </div>
                </>
              )}
            </div>

            {/* BLOGS RESULTS */}
            <div className="results-wrapper mt-5 pt-5 border-top">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="section-title mb-0" style={{ fontSize: 24 }}>{t('fromOurBlog')}</h2>
                {blogs.length > 0 && <span className="badge bg-light text-dark px-3 py-2 rounded-pill border">{t('showingArticles', { count: blogs.length })}</span>}
              </div>

              {blogsLoading ? (
                <div className="text-center py-5">
                  <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
                </div>
              ) : blogsError ? (
                <div className="alert alert-danger shadow-sm border-0">{blogsError}</div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-5 border rounded bg-light shadow-inner">
                  <i className="icon-search h1 text-muted d-block opacity-25"></i>
                  <p className="mt-3 text-muted">{t('noArticles')}</p>
                </div>
              ) : (
                <>
                  <DynamicBlogGrid
                    blogs={blogs}
                    pagination={{ ...blogsPagination, pages: 1 }}
                    basePath={`/search${buildQueryString({
                      ...appliedFilters,
                      page: String(page),
                    })}`}
                  />
                  <div className="mt-5 pt-3">
                    <Pagination
                      currentPage={blogPage}
                      totalPages={blogsPagination?.pages || 1}
                      onPageChange={(p) => updateUrl({ blogPage: String(p) })}
                    />
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>

        <VideoModal
          isOpen={isOpen}
          setOpen={setOpen}
          ids={videoIds}
        />
      </Container>
      
      <style jsx>{`
        .section-title {
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.5px;
        }
        .filter-group label {
          color: #666;
          margin-bottom: 6px;
        }
        .form-select, .form-control {
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          height: 38px;
        }
        .form-select:focus, .form-control:focus {
          border-color: #b79c5c;
          box-shadow: 0 0 0 3px rgba(183,156,92,0.1);
        }
        .search-box-wrapper .btn-primary {
          background-color: var(--thm-primary);
          border-color: var(--thm-primary);
          border-radius: 0 50px 50px 0;
          font-weight: 700;
        }
        .search-box-wrapper .btn-primary:hover {
          background-color: var(--thm-black);
          border-color: var(--thm-black);
        }
        .listing__sidebar__item__inner {
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .animate-in {
          animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default SearchResultsPage;
