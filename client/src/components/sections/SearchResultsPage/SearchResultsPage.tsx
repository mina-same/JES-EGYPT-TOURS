"use client";

import '@/components/common/TourListingFilters/visitorFilters.css';

import { formatTourDestinations } from '@/lib/tours/destinations';
import { sanitizeTourFilters } from '@/lib/tours/filterValues';
import FilterChips from '@/components/common/TourListingFilters/FilterChips';
import TourEmptyState from '@/components/common/TourListingFilters/TourEmptyState';
import TourSort from '@/components/common/TourListingFilters/TourSort';
import TourListingFilters from '@/components/common/TourListingFilters/TourListingFilters';
import TourFilterDrawer from '@/components/common/TourListingFilters/TourFilterDrawer';
import { useAccessibleDrawer } from '@/hooks/useAccessibleDrawer';
import type { TourFilterValues } from '@/lib/tours/listingFilters';
import React, { useEffect, useMemo, useState } from "react";
import type { FilterOption } from '@/lib/tours/catalog';
import { Container, Row, Col } from "react-bootstrap";
import { Loader2 } from "lucide-react";

import { tourAPI } from "@/lib/api/tour";
import { getAllBlogs, getAllSubCategories, BlogSubCategory } from "@/lib/api/blog";
import Pagination from "@/components/common/Pagination/Pagination";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useWishlist } from "@/contexts/WishlistContext";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { getLocalizedValue } from "@/lib/localize";
import { getDisplayName } from "@/lib/displayName";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import TourCard from "@/components/common/TourCard/TourCard";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";
import { getTourReviewVideoIds } from "@/lib/video/youtube";
import { countActiveTourFilters, validateTourPriceRange } from "@/lib/tours/listingFilters";

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

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ initialSearchParams }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tours, setTours] = useState<any[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState<string | null>(null);
  const [toursPage, setToursPage] = useState(1);
  const [toursTotalPages, setToursTotalPages] = useState(1);
  const [toursTotal, setToursTotal] = useState(0);

  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogsPagination, setBlogsPagination] = useState<any>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<BlogSubCategory[]>([]);

  const { locale } = useParams() as { locale: string };
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t } = useTranslation('search');
  const { t: tourT } = useTranslation('tours');
  const { currency, currencySymbol } = useCurrency();
  const [filterError, setFilterError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const closeFilters = () => setIsFilterOpen(false);
  const { dialogRef, triggerRef } = useAccessibleDrawer(isFilterOpen, closeFilters);

  // Filter options state
  const [tourTypeOptions, setTourTypeOptions] = useState<FilterOption[]>([]);
  const [tourStyleOptions, setTourStyleOptions] = useState<FilterOption[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<FilterOption[]>([]);
  const [filterOptionsReady, setFilterOptionsReady] = useState(false);

  // Video reviews state
  const [isOpen, setOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);


  // The ids are already on the card: the listing payload carries `reviews`, so
  // opening the player needs no round-trip. This used to re-fetch the whole
  // tour on every click just to read URLs it already had.
  const openVideoReviewsFor = (ids: string[]) => {
    setVideoIds(ids);
    setOpen(true);
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

  // The URL is the committed snapshot: page, sort and filters change together.
  const appliedFilters = useMemo(() => sanitizeTourFilters({
    q: toStr((effectiveParams as any).q) || "",
    minPrice: toStr((effectiveParams as any).minPrice) || "",
    maxPrice: toStr((effectiveParams as any).maxPrice) || "",
    tourType: toStr((effectiveParams as any).tourType) || "",
    tourStyles: toStr((effectiveParams as any).tourStyles) || "",
    destinations: toStr((effectiveParams as any).destinations) || "",
    durationRange: toStr((effectiveParams as any).durationRange) || "",
    blogSubCategory: toStr((effectiveParams as any).blogSubCategory) || "",
    sort: toStr((effectiveParams as any).sort) || "recommended",
  }), [effectiveParams]);
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const filterSignature = JSON.stringify({ ...appliedFilters, sort: undefined });
  useEffect(() => {
    setDraftFilters(appliedFilters);
    // Page/sort-only navigation must not discard un-applied filter edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSignature, locale]);

  const q = appliedFilters.q;
  const page = toNum((effectiveParams as any).page, 1);
  const blogPage = toNum((effectiveParams as any).blogPage, 1);
  const searchBasePath = `/${locale}/search`;

  const updateUrl = (patch: Partial<typeof appliedFilters> & { page?: string; blogPage?: string }) => {
    const next: Record<string, string | undefined> = { 
      ...appliedFilters, 
      ...patch,
      page: patch.page || String(page),
      blogPage: patch.blogPage || String(blogPage)
    };

    // Reset pagination when searching or filtering
    if (patch.q !== undefined || patch.minPrice !== undefined || patch.maxPrice !== undefined || patch.tourType !== undefined || patch.tourStyles !== undefined || patch.destinations !== undefined || patch.durationRange !== undefined || patch.sort !== undefined) {
      next.page = "1";
    }
    if (patch.q !== undefined || patch.blogSubCategory !== undefined) {
      next.blogPage = "1";
    }

    router.push(`${searchBasePath}${buildQueryString(sanitizeTourFilters(next, filterOptionsReady ? destinationOptions : undefined))}`);
  };

  const handleApplyFilters = () => {
    const priceIssue = validateTourPriceRange(draftFilters.minPrice, draftFilters.maxPrice);
    if (priceIssue) {

      setFilterError(t(priceIssue === 'range' ? 'priceRangeError' : 'priceInvalidError'));
      return;
    }
    setFilterError(null);
    updateUrl({ ...draftFilters, sort: appliedFilters.sort, blogSubCategory: appliedFilters.blogSubCategory, page: "1", blogPage: "1" });
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const empty = {
      q: "",
      minPrice: "",
      maxPrice: "",
      tourType: "",
      destinations: "", durationRange: "", tourStyles: "",
      blogSubCategory: "",
      sort: "recommended",
    };
    setDraftFilters(empty);
    setFilterError(null);
    router.push(searchBasePath);
  };

  const tourFilterForm = (mobile = false) => <TourListingFilters
    t={tourT} locale={locale} draftFilters={{ ...draftFilters, search: draftFilters.q }}
    setDraftFilters={(action: React.SetStateAction<TourFilterValues>) => setDraftFilters(previous => {
      const next = typeof action === 'function' ? action({ ...previous, search: previous.q }) : action;
      const { search, ...rest } = next;
      return { ...previous, ...rest, q: search };
    })}
    tourTypeOptions={tourTypeOptions} tourStyleOptions={tourStyleOptions} destinationOptions={destinationOptions}
    currencySymbol={currencySymbol} validationError={filterError} hideSearch
    handleApplyFilters={handleApplyFilters}
    handleResetFilters={() => { handleResetFilters(); closeFilters(); }}
    fullHeight={mobile} noBorder={mobile} hideHeader={mobile}
  />;

  const removeTourFilter = (key: 'q' | 'minPrice' | 'maxPrice' | 'tourType' | 'tourStyles' | 'destinations' | 'durationRange', remaining = '') => {
    const next = { ...appliedFilters, [key]: remaining };
    setDraftFilters(next);
    setFilterError(null);
    updateUrl({ [key]: remaining, page: '1', ...(key === 'q' ? { blogPage: '1' } : {}) });
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
    const controller = new AbortController();
    const fetchTours = async () => {
      try {
        setToursLoading(true);
        setToursError(null);

        const directPriceIssue = validateTourPriceRange(appliedFilters.minPrice, appliedFilters.maxPrice);
        if (directPriceIssue) {
          setFilterError(t(directPriceIssue === 'range' ? 'priceRangeError' : 'priceInvalidError'));
          setTours([]);
          setToursTotal(0);
          return;
        }

        const res = await tourAPI.getAll({
          page,
          limit: 9,
          search: q || undefined,
          sort: appliedFilters.sort || undefined,
          minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
          maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
          tourType: appliedFilters.tourType || undefined,
          tourStyles: appliedFilters.tourStyles || undefined,
          destinations: appliedFilters.destinations || undefined,
          durationRange: appliedFilters.durationRange || undefined,
          currency,
        }, locale, controller.signal);

        if (!res.success) {
          setToursError(tourT('status.errorFetching'));
          setTours([]);
          setToursTotal(0);
          setToursTotalPages(1);
          return;
        }

        const mapped = (Array.isArray(res.data) ? res.data : []).map((tour: any) => {
          const tourSlug = typeof tour.slug === 'string'
            ? tour.slug.trim()
            : getStrictLocalizedSlug(tour.slug, locale as SupportedLocale);
          if (!tourSlug) return null;
          const galleryImages = [
            ...(tour.images || []).map((img: any) => img.url),
            ...(tour.gallery || []).map((img: any) => img.url),
          ].filter(Boolean);
          const uniqueImages = Array.from(new Set(galleryImages));
          return {
            id: tour._id,
            slug: tourSlug,
            image: uniqueImages[0] || TOUR_IMAGE_PLACEHOLDER,
            allImages: uniqueImages.length > 0 ? uniqueImages : [TOUR_IMAGE_PLACEHOLDER],
            title: getLocalizedValue(tour.heading, locale) || getLocalizedValue(tour.name, locale),
            link: `/${locale}/${tourSlug}`,
            price: tour.priceStartingFrom || { USD: 0 },
            videoId: tour.videoLink || "",
            // Gates the card's video button. The listing payload already carries
            // `reviews`, so this costs no extra request — without it the button
            // showed on every card and only revealed "no videos" after a click.
            videoIds: getTourReviewVideoIds(tour.reviews),
            discount: "",
            description:
              // Editor-written card teaser wins; the long intro is the fallback.
              getLocalizedValue(tour.cardDescription, locale) ||
              getLocalizedValue(tour.Description?.text, locale) ||
              "",
            meta: [
              { id: 1, title: formatTourDestinations(tour.destinations, locale), icon: "icon-location" },
              { id: 2, title: `${getLocalizedValue(tour.duration, locale) || '3 Days'}`, icon: "icon-clock" },
              ...(getDisplayName(tour.subcategory, locale)
                  ? [{ id: 4, title: getDisplayName(tour.subcategory, locale), icon: "icon-flag" }]
                  : []),
            ]
          };
        }).filter(Boolean);

        setTours(mapped);
        const lastPage = res.totalPages || 1;
        setToursTotalPages(lastPage);
        setToursTotal(res.total || 0);
        if ((res.total || 0) > 0 && page > lastPage) {
          updateUrl({ page: String(lastPage) });
          return;
        }

      } catch (e: any) {
        if (e?.code === 'ERR_CANCELED') return;
        console.error(e);
        setToursError(tourT('status.errorFetching'));
        setTours([]);
        setToursTotal(0);
        setToursTotalPages(1);
      } finally {
        if (!controller.signal.aborted) setToursLoading(false);
      }
    };

    void fetchTours();
    return () => controller.abort();
  }, [q, page, appliedFilters.sort, appliedFilters.minPrice, appliedFilters.maxPrice, appliedFilters.tourType, appliedFilters.tourStyles, appliedFilters.destinations, appliedFilters.durationRange, locale, currency]);

  useEffect(() => {
    const controller = new AbortController();
    setFilterOptionsReady(false);
    tourAPI.getFilterOptions({ currency }, locale, controller.signal)
      .then((response) => {
        if (response.success && response.data) {
          setTourTypeOptions(response.data.tourTypes);
          setTourStyleOptions(response.data.tourStyles);
          setDestinationOptions(response.data.destinations);
          setFilterOptionsReady(true);
        }
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') console.error('Failed to load tour filter options:', error);
      });
    return () => controller.abort();
  }, [currency, locale]);

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
  }, [q, blogPage, appliedFilters.blogSubCategory]);

  return (
    <section className="section-space">
      <Container>
        {/* Keyword Search Bar at Top */}
        <Row className="mb-5">
          <Col lg={10} className="mx-auto">
            <div className="search-box-wrapper visitor-search">
              <div className="input-group shadow-sm rounded-pill overflow-hidden border bg-white">
                <input
                  type="search"
                  aria-label={t('searchPlaceholder')}
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
                  type="button"
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

        <TourFilterDrawer open={isFilterOpen} close={closeFilters} dialogRef={dialogRef} title={tourT('filters.title')} closeLabel={tourT('filters.close')}>
          {tourFilterForm(true)}
        </TourFilterDrawer>
        <div className="d-lg-none mb-3">
          <button ref={triggerRef} type="button" className="btn visitor-filter-open" aria-expanded={isFilterOpen} aria-controls="tour-filter-dialog" onClick={() => setIsFilterOpen(true)}>{tourT('filters.title')}</button>
        </div>
        <Row className="gutter-y-40">
          {/* SIDEBAR FILTERS */}
          <Col lg={4} xl={3}>
            <aside className="listing__sidebar visitor-filters">
              <div className="d-none d-lg-block">{tourFilterForm()}</div>
              <div className="p-3 border rounded mt-3">
                  {/* BLOGS FILTER SECTION */}
                  <div className="filter-group">
                    <h4 style={{ fontSize: 14, textTransform: 'uppercase', color: '#b79c5c', fontWeight: 800, marginBottom: 12, borderLeft: '3px solid #b79c5c', paddingLeft: 8 }}>{t('knowledge')}</h4>
                    
                    <div className="mb-3">
                      <label htmlFor="search-blog-category" className="form-label font-weight-bold small">{t('blogCategory')}</label>
                      <select
                        id="search-blog-category"
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

                  </div>
                <button type="button" className="btn btn-outline-dark" onClick={() => updateUrl({ blogSubCategory: draftFilters.blogSubCategory })}>{t('applyFilters')}</button>
              </div>
            </aside>
          </Col>

          {/* RESULTS CONTENT */}
          <Col lg={8} xl={9}>
            {/* TOURS RESULTS */}
            <div className="results-wrapper mb-5 pb-5">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <FilterChips values={appliedFilters} destinations={destinationOptions} locale={locale} currencySymbol={currencySymbol} t={tourT} remove={(key, remaining) => removeTourFilter(key as 'q' | 'minPrice' | 'maxPrice' | 'tourType' | 'tourStyles' | 'destinations' | 'durationRange', remaining)} />
                {countActiveTourFilters(appliedFilters) > 0 && <button type="button" className="btn btn-link" onClick={handleResetFilters}>{tourT('filters.clearAll')}</button>}
              </div>
              <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
                <h2 className="section-title mb-0" style={{ fontSize: 24 }}>{t('experiencesFound')}</h2>
                <span className="badge bg-light text-dark px-3 py-2 rounded-pill border" aria-live="polite">{t('showingResults', { count: toursTotal })}</span>
                <TourSort value={appliedFilters.sort} onChange={sort => updateUrl({ sort, page: '1' })} t={tourT} />
              </div>

              {toursLoading ? (
                <div className="text-center py-5">
                  <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
                </div>
              ) : toursError ? (
                <div className="alert alert-danger shadow-sm border-0">{toursError}</div>
              ) : tours.length === 0 ? (
                <TourEmptyState filtered={countActiveTourFilters(appliedFilters) > 0} emptyText={tourT('listing.noToursAvailable')} clear={handleResetFilters} t={tourT} />
              ) : (
                <>
                  <Row className="gutter-y-30">
                    {tours.map((t) => (
                      <Col lg={4} md={6} key={t.id}>
                        <TourCard 
                          item={t}
                          toggleWishlist={toggleWishlist}
                          isInWishlist={isInWishlist}
                          openVideoReviews={t.videoIds?.length ? () => openVideoReviewsFor(t.videoIds) : undefined}
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
                    basePath={`${searchBasePath}${buildQueryString({
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
