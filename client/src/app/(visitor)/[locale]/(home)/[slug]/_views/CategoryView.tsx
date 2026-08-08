'use client';
import React, { useState, useEffect, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import Pagination from "@/components/common/Pagination/Pagination";
import { tourAPI, tourCategoryAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { Loader2, ChevronRight, Check, Filter, X, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
// import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { useWishlist } from "@/contexts/WishlistContext";
import { tourAPI as tourApiForFetch } from "@/lib/api/tour";
import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import EnhancedSectionHeader from "@/components/sections/EnhancedSectionHeader/EnhancedSectionHeader";
import { getLocalizedValue } from "@/lib/localize";
import { getDisplayName } from "@/lib/displayName";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import TourCard from "@/components/common/TourCard/TourCard";
import { SlugManager } from "@/components/common/SlugManager";
import { useTranslation } from 'react-i18next';
import { useCurrency } from "@/contexts/CurrencyContext";
import ListingGallery from "@/components/common/ListingSections/ListingGallery";
import ListingFaqs from "@/components/common/ListingSections/ListingFaqs";
import ListingBlogs from "@/components/common/ListingSections/ListingBlogs";
import ListingPromo from "@/components/common/ListingSections/ListingPromo";
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";

const FiltersContent = ({ 
  t, 
  draftFilters, 
  setDraftFilters, 
  subcategories, 
  locale, 
  tourTypeOptions, 
  tourStyleOptions, 
  handleApplyFilters, 
  handleResetFilters,
  currencySymbol = "$",
  noBorder = false,
  hideHeader = false,
  fullHeight = false
}: any) => {
  return (
    <div 
      className='listing__sidebar__item__inner' 
      style={{ 
        borderRadius: noBorder ? 0 : 14, 
        border: noBorder ? "none" : "1px solid #eee", 
        background: noBorder ? "transparent" : "#fff",
        height: fullHeight ? '100%' : 'auto',
        display: fullHeight ? 'flex' : 'block',
        flexDirection: 'column'
      }}
    >
      {!hideHeader && (
        <div style={{ padding: noBorder ? "0 0 18px 0" : 18, borderBottom: "1px solid #f0f0f0" }} className="d-flex justify-content-between align-items-center">
          <span className='listing__sidebar__title' style={{ margin: 0, fontSize: noBorder ? '22px' : '18px', fontWeight: 800, color: '#1d231f', display: 'block' }}>{t('filters.title')}</span>
          <Filter className="w-5 h-5 text-[#b79c5c]" />
        </div>
      )}
      <div style={{ padding: noBorder ? (hideHeader ? "10px 20px 24px" : "24px 20px") : 18, display: "grid", gap: 14, flex: fullHeight ? 1 : 'none' }}>
        <div>
          <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.search')}</label>
          <input className='form-control rounded-3' style={{ padding: '10px 15px' }} value={draftFilters.search} onChange={(e) => setDraftFilters((p: any) => ({ ...p, search: e.target.value }))} placeholder={t('filters.searchPlaceholder')} />
        </div>
        {subcategories && (
          <div>
            <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.subcategory')}</label>
            <select className='form-select rounded-3' style={{ padding: '10px' }} value={draftFilters.subcategoryId} onChange={(e) => setDraftFilters((p: any) => ({ ...p, subcategoryId: e.target.value }))}>
              <option value="">{t('filters.all')}</option>
              {subcategories.map((s: any) => (<option key={s._id} value={s._id}>{getDisplayName(s, locale)}</option>))}
            </select>
          </div>
        )}
        <div className='row g-2 align-items-end'>
          <div className='col-6'>
            <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.minPrice')}</label>
            <div className='input-group'><span className='input-group-text bg-white border-end-0'>{currencySymbol}</span><input className='form-control border-start-0 rounded-end-3' style={{ padding: '10px' }} value={draftFilters.minPrice} onChange={(e) => setDraftFilters((p: any) => ({ ...p, minPrice: e.target.value.replace(/[^0-9.]/g, "") }))} inputMode="decimal" placeholder="0" /></div>
          </div>
          <div className='col-6'>
            <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.maxPrice')}</label>
            <div className='input-group'><span className='input-group-text bg-white border-end-0'>{currencySymbol}</span><input className='form-control border-start-0 rounded-end-3' style={{ padding: '10px' }} value={draftFilters.maxPrice} onChange={(e) => setDraftFilters((p: any) => ({ ...p, maxPrice: e.target.value.replace(/[^0-9.]/g, "") }))} inputMode="decimal" placeholder="9999" /></div>
          </div>
        </div>
        <div>
          <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.tourType')}</label>
          <select className='form-select rounded-3' style={{ padding: '10px' }} value={draftFilters.tourType} onChange={(e) => setDraftFilters((p: any) => ({ ...p, tourType: e.target.value }))}>
            <option value="">{t('filters.all')}</option>
            {tourTypeOptions.map((tOp: any) => (<option key={tOp} value={tOp}>{tOp}</option>))}
          </select>
        </div>
        <div>
          <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.tourStyle')}</label>
          <select className='form-select rounded-3' style={{ padding: '10px' }} value={draftFilters.tourStyle} onChange={(e) => setDraftFilters((p: any) => ({ ...p, tourStyle: e.target.value }))}>
            <option value="">{t('filters.all')}</option>
            {tourStyleOptions.map((tOp: any) => (<option key={tOp} value={tOp}>{tOp}</option>))}
          </select>
        </div>
      </div>
      <div style={{ padding: noBorder ? "24px 20px" : 18, borderTop: "1px solid #f0f0f0", marginTop: 'auto' }}>
        <div className='row g-2'>
          <div className='col-6'><button type="button" onClick={handleApplyFilters} className='gotur-btn' style={{ width: "100%", borderRadius: 10 }}>{t('filters.apply')}</button></div>
          <div className='col-6'><button type="button" onClick={handleResetFilters} className='gotur-btn' style={{ width: "100%", background: "transparent", color: "#111", border: "1px solid #e5e5e5", borderRadius: 10 }}>{t('filters.reset')}</button></div>
        </div>
      </div>
    </div>
  );
};

export default function CategoryView({ 
  slug, 
  locale, 
  initialCategory, 
  initialSubcategories 
}: { 
  slug: string; 
  locale: string; 
  initialCategory?: any;
  initialSubcategories?: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation('tours');
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  const { toggleWishlist, isInWishlist } = useWishlist();
  const [initialLoading, setInitialLoading] = useState(!initialCategory);
  const [pageLoading, setPageLoading] = useState(false);
  const [category, setCategory] = useState<any>(initialCategory || null);
  const [subcategories, setSubcategories] = useState<any[]>(initialSubcategories || []);
  const [tours, setTours] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<string>("-createdAt");
  const [draftFilters, setDraftFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    subcategoryId: "",
    tourType: "",
    tourStyle: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    subcategoryId: "",
    tourType: "",
    tourStyle: "",
  });
  const toursPerPage = 9;
  const prevSlugRef = useRef<string | null>(null);
  const [tourTypeOptions, setTourTypeOptions] = useState<string[]>([]);
  const [tourStyleOptions, setTourStyleOptions] = useState<string[]>([]);

  useEffect(() => {
    const fromQueryPage = Number(searchParams?.get("page") || "1");
    const safePage = Number.isFinite(fromQueryPage) && fromQueryPage > 0 ? Math.floor(fromQueryPage) : 1;
    const fromSort = searchParams?.get("sort") || "-createdAt";

    const next = {
      search: searchParams?.get("search") || "",
      minPrice: searchParams?.get("minPrice") || "",
      maxPrice: searchParams?.get("maxPrice") || "",
      subcategoryId: searchParams?.get("subcategory") || "",
      tourType: searchParams?.get("tourType") || "",
      tourStyle: searchParams?.get("tourStyle") || "",
    };

    setCurrentPage(safePage);
    setSort(fromSort);
    setDraftFilters(next);
    setAppliedFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const buildUrl = (overrides?: Partial<{ page: number; sort: string }> & Partial<typeof appliedFilters>) => {
    const p = overrides?.page ?? currentPage;
    const s = overrides?.sort ?? sort;
    const f = { ...appliedFilters, ...overrides };

    const sp = new URLSearchParams();
    if (p && p !== 1) sp.set("page", String(p));
    if (s && s !== "-createdAt") sp.set("sort", s);
    if (f.search) sp.set("search", f.search);
    if (f.minPrice) sp.set("minPrice", f.minPrice);
    if (f.maxPrice) sp.set("maxPrice", f.maxPrice);
    if (f.subcategoryId) sp.set("subcategory", f.subcategoryId);
    if (f.tourType) sp.set("tourType", f.tourType);
    if (f.tourStyle) sp.set("tourStyle", f.tourStyle);

    const qs = sp.toString();
    return `/${locale}/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isNewSlug = prevSlugRef.current !== slug;
        if (isNewSlug) prevSlugRef.current = slug;

        const isInitial = isNewSlug || category === null;
        if (isInitial) setInitialLoading(true);
        else setPageLoading(true);

        if (!initialCategory) {
          const catResponse = await tourCategoryAPI.getBySlug(slug, locale);
          if (!catResponse.success || !catResponse.data) {
            setError("Category not found");
            setInitialLoading(false);
            setPageLoading(false);
            return;
          }
          setCategory(catResponse.data);

          const subResponse = await tourSubcategoryAPI.getByCategory(catResponse.data._id);
          if (subResponse.success && subResponse.data) setSubcategories(subResponse.data);
        } else {
          // If we have initialCategory but not subcategories (unlikely but safe)
          if (initialSubcategories) {
            setSubcategories(initialSubcategories);
          } else if (initialCategory?._id) {
            const subResponse = await tourSubcategoryAPI.getByCategory(initialCategory._id);
            if (subResponse.success && subResponse.data) setSubcategories(subResponse.data);
          }
        }

        const catId = initialCategory?._id || category?._id;
        if (!catId && !initialCategory) return;

        const toursResponse = await tourAPI.getAll({
          ...(appliedFilters.subcategoryId
            ? { subcategory: appliedFilters.subcategoryId }
            : { category: initialCategory?._id || category?._id }),
          page: currentPage,
          limit: toursPerPage,
          sort,
          ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
          ...(appliedFilters.minPrice ? { minPrice: Number(appliedFilters.minPrice) } : {}),
          ...(appliedFilters.maxPrice ? { maxPrice: Number(appliedFilters.maxPrice) } : {}),
          ...(appliedFilters.tourType ? { tourType: appliedFilters.tourType } : {}),
          ...(appliedFilters.tourStyle ? { tourStyle: appliedFilters.tourStyle } : {}),
        });

        if (toursResponse.success && toursResponse.data) {
          setTotalPages(toursResponse.totalPages || 1);
          const mappedTours = toursResponse.data.map((tour: any) => {
            const tourSlug = getStrictLocalizedSlug(tour.slug, locale as SupportedLocale);
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
              imageAlt: getLocalizedValue(tour.images?.[0]?.alt || tour.gallery?.[0]?.alt, locale),
              allImages: uniqueImages.length > 0 ? uniqueImages : [TOUR_IMAGE_PLACEHOLDER],
              title: getLocalizedValue(tour.heading, locale) || getLocalizedValue(tour.name, locale),
              link: `/${locale}/${tourSlug}`,
              price: tour.priceStartingFrom || { USD: 0 },
              videoId: tour.videoLink || "",
              discount: "",
              description:
              // Editor-written card teaser wins; the long intro is the fallback.
              getLocalizedValue(tour.cardDescription, locale) ||
              getLocalizedValue(tour.Description?.text, locale) ||
              "",
              meta: [
                { id: 1, title: getLocalizedValue(tour.tourLocation, locale) || t('fallback.location'), icon: "icon-location" },
                { id: 2, title: `${getLocalizedValue(tour.duration, locale) || t('fallback.days')}`, icon: "icon-clock" },
                ...(getDisplayName(tour.subcategory, locale)
                  ? [{ id: 4, title: getDisplayName(tour.subcategory, locale), icon: "icon-flag" }]
                  : []),
              ],
            };
          }).filter(Boolean);
          setTours(mappedTours);

          const types = Array.from(new Set(toursResponse.data.map((t: any) => String(t?.tourType || "").trim()).filter(Boolean))).sort() as string[];
          const styles = Array.from(new Set(toursResponse.data.map((t: any) => String(t?.tourStyle || "").trim()).filter(Boolean))).sort() as string[];
          setTourTypeOptions(types);
          setTourStyleOptions(styles);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(t('status.errorFetching'));
      } finally {
        setInitialLoading(false);
        setPageLoading(false);
      }
    };

    fetchData();
  }, [slug, currentPage, sort, appliedFilters.search, appliedFilters.minPrice, appliedFilters.maxPrice, appliedFilters.subcategoryId, appliedFilters.tourType, appliedFilters.tourStyle]);

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
      const res = await tourApiForFetch.getBySlug(tourSlug, locale);
      if (res.success && res.data) {
        const vids = (Array.isArray(res.data.reviews) ? res.data.reviews : [])
          .map((r: any) => getYouTubeVideoId(typeof r?.url === "string" ? r.url : ""))
          .filter(Boolean);
        if (vids.length > 0) { setVideoIds(vids); setOpen(true); }
        else toast({ title: t('status.noVideoTitle'), description: t('status.noVideoInfo'), variant: "info" });
      }
    } catch {
      toast({ title: t('status.failedVideoTitle'), description: t('status.failedVideo'), variant: "destructive" });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.replace(buildUrl({ page }), { scroll: false } as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    router.replace(buildUrl({ page: 1, ...draftFilters }), { scroll: false } as any);
  };

  const handleResetFilters = () => {
    const empty = { search: "", minPrice: "", maxPrice: "", subcategoryId: "", tourType: "", tourStyle: "" };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setSort("-createdAt");
    setCurrentPage(1);
    router.replace(`/${locale}/${encodeURIComponent(slug)}`, { scroll: false } as any);
  };

  const handleSortChange = (nextSort: string) => {
    setSort(nextSort);
    setCurrentPage(1);
    router.replace(buildUrl({ page: 1, sort: nextSort }), { scroll: false } as any);
  };

  if (initialLoading) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" />
        <div className="flex items-center justify-center min-h-[60vh]" suppressHydrationWarning>
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <FooterOne />
      </Layout>
    );
  }

  if (error || !category) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" />
        <PageHeader title={t('status.notFound')} />
        <div className="flex items-center justify-center min-h-[400px] text-red-500">
          <h3>{error || t('status.categoryNotFound')}</h3>
        </div>
        <FooterOne />
      </Layout>
    );
  }

  // Per-image language visibility: absent/empty languages = all locales.
  const imgAllows = (img: any) =>
    !Array.isArray(img?.languages) || img.languages.length === 0 || img.languages.includes(locale);
  const visibleImages = (category.images || []).filter(imgAllows);
  const visibleGallery = (category.gallery || []).filter(imgAllows);

  return (
    <Layout>
      {category?.slug && <SlugManager slugs={category.slug} />}
      <TopbarOne /><HeaderOne linkTheme="light" />

      {/* Mobile Filter Drawer (Top-level for proper stacking context) */}
      <div className={`mobile-filter-drawer ${isFilterOpen ? 'is-open' : ''} d-lg-none`}>
        <div className="mobile-filter-drawer__overlay" onClick={() => setIsFilterOpen(false)} />
        <div className="mobile-filter-drawer__content">
          <div className="mobile-filter-drawer__header">
            <span className="m-0" style={{ fontWeight: 800, fontSize: '20px' }}>{t('filters.title')}</span>
            <button onClick={() => setIsFilterOpen(false)} className="btn-close-filter" aria-label="Close Filter">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mobile-filter-drawer__body">
            <FiltersContent 
              t={t} 
              draftFilters={draftFilters} 
              setDraftFilters={setDraftFilters} 
              subcategories={subcategories} 
              locale={locale} 
              tourTypeOptions={tourTypeOptions} 
              tourStyleOptions={tourStyleOptions} 
              handleApplyFilters={() => { handleApplyFilters(); setIsFilterOpen(false); }} 
              handleResetFilters={() => { handleResetFilters(); setIsFilterOpen(false); }} 
              currencySymbol={currencySymbol}
              noBorder={true}
              hideHeader={true}
              fullHeight={true}
            />
          </div>
        </div>
      </div>
      <PageHeader
        title={getLocalizedValue(category.name, locale)}
        subTitle={getLocalizedValue(category.description, locale)}
        bgImage={visibleImages[0]?.url || undefined}
        alt={getLocalizedValue(visibleImages[0]?.alt, locale)}
        imageTitle={
          getLocalizedValue(visibleImages[0]?.title, locale) ||
          getLocalizedValue(visibleImages[0]?.alt, locale) ||
          getLocalizedValue(category.name, locale)
        }
        breadcrumbs={[
          { label: getDisplayName(category, locale) },
        ]}
      />

      {(() => {
        const sh = category?.sectionHeader;
        const images = (Array.isArray(sh?.images) && sh.images.length ? sh.images : (sh?.image?.url ? [sh.image] : [])).filter(imgAllows);
        const hasData = sh && sh.isEnabled !== false && (!!sh?.title || !!sh?.description || images.length > 0 || (!!sh?.button?.label && !!sh?.button?.href));
        if (!hasData) return null;
        return (
          <EnhancedSectionHeader
            title={getLocalizedValue(sh?.title, locale)}
            descriptionHtml={getLocalizedValue(sh?.description, locale)}
            button={sh?.button ? { ...sh.button, label: getLocalizedValue(sh.button.label, locale) } : undefined}
            images={images.map((img: any) => ({ ...img, title: getLocalizedValue(img.title, locale), alt: getLocalizedValue(img.alt, locale) }))}
          />
        );
      })()}

      {subcategories.length > 0 && (
        <section className="subcategory-section">
          <Container>
            <div className="subcategory-header">
              <h2 className="subcategory-header__title">
                {category.subcategorySectionTitle && getLocalizedValue(category.subcategorySectionTitle, locale) ? (
                  getLocalizedValue(category.subcategorySectionTitle, locale)
                ) : (
                  <>
                    Explore <span>{getLocalizedValue(category.name, locale) || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span> Subcategories
                  </>
                )}
              </h2>
            </div>
            <div className="subcategory-slider-wrapper">
              <div className="subcategory-slider">
                {subcategories.map((sub: any) => {
                  const isActive = appliedFilters.subcategoryId === sub._id;
                  const subSlug = getStrictLocalizedSlug(sub.slug, locale as SupportedLocale);
                  if (!isActive && !subSlug) return null;
                  const subName = getDisplayName(sub, locale);
                  return (
                    <div key={sub._id} className="subcategory-slide">
                      <Link
                        href={isActive ? `/${locale}/${slug}` : `/${locale}/${subSlug}`}
                        className="subcategory-card-link"
                        aria-current={isActive ? 'page' : undefined}
                        title={`View ${subName} Tours`}
                      >
                        <div className={`subcategory-card${isActive ? " is-active" : ""}`}>
                          <div className="subcategory-card__image-box">
                            <Image 
                              src={sub.images?.[0]?.url || TOUR_IMAGE_PLACEHOLDER} 
                              alt={getLocalizedValue(sub.images?.[0]?.alt, locale) || subName} 
                              title={getLocalizedValue(sub.images?.[0]?.title, locale) || getLocalizedValue(sub.images?.[0]?.alt, locale) || subName}
                              fill 
                              className="subcategory-card__image" 
                            />
                            <div className="subcategory-card__overlay" />
                          </div>
                          <div className="subcategory-card__content">
                            <h3 className="subcategory-card__title">{subName}</h3>
                            <span className="subcategory-card__icon">
                              {isActive ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>
      )}

      <section className='tour-listing-page'>
        <Container>
          <Row className='gutter-y-40'>
            {/* Desktop Sidebar */}
            <Col lg={4} xl={3} className="d-none d-lg-block p-0">
              <aside className='listing__sidebar sticky-top' style={{ top: '0', height: '100vh', padding: '120px 20px 40px', background: '#fff', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
                <FiltersContent 
                  t={t} 
                  draftFilters={draftFilters} 
                  setDraftFilters={setDraftFilters} 
                  subcategories={subcategories} 
                  locale={locale} 
                  tourTypeOptions={tourTypeOptions} 
                  tourStyleOptions={tourStyleOptions} 
                  handleApplyFilters={() => { handleApplyFilters(); setIsFilterOpen(false); }} 
                  handleResetFilters={() => { handleResetFilters(); setIsFilterOpen(false); }} 
                  currencySymbol={currencySymbol}
                  noBorder={true}
                />
              </aside>
            </Col>


            <Col lg={8} xl={9}>
              {/* Tours Section Title */}
              <div className="mb-4">
                <h2 className="subcategory-header__title" style={{ fontSize: '36px', letterSpacing: '-0.5px' }}>
                  {category.toursSectionTitle && getLocalizedValue(category.toursSectionTitle, locale) ? (
                    getLocalizedValue(category.toursSectionTitle, locale)
                  ) : (
                    <>
                      Available <span>{getLocalizedValue(category.name, locale)}</span> Tours
                    </>
                  )}
                </h2>
                {category.toursSectionSubTitle && getLocalizedValue(category.toursSectionSubTitle, locale) && (
                  <div 
                    className="mt-2 text-muted-foreground html-content" 
                    style={{ fontSize: '16px', maxWidth: '1000px' }}
                    dangerouslySetInnerHTML={{ __html: getLocalizedValue(category.toursSectionSubTitle, locale) }}
                  />
                )}
                <div style={{ width: '80px', height: '4px', background: '#b79c5c', borderRadius: '2px', marginTop: '12px', marginBottom: '30px' }} />
              </div>

              {/* Controls bar */}
              <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded-4 mb-4" style={{ gap: 12 }}>
                <div className="d-flex align-items-center gap-3">
                  <button 
                    className="d-lg-none flex items-center gap-2 px-4 py-2 bg-[#b79c5c] text-white rounded-lg font-bold shadow-sm"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>{t('filters.title')}</span>
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{t('listing.sortBy')}</span>
                  <select value={sort} onChange={(e) => handleSortChange(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e5e5", background: "#fff", minWidth: 220 }}>
                    <option value="-createdAt">{t('listing.sortOptions.newest')}</option>
                    <option value="createdAt">{t('listing.sortOptions.oldest')}</option>
                    <option value="heading">{t('listing.sortOptions.nameAsc')}</option>
                    <option value="tourLocation">{t('listing.sortOptions.locationAsc')}</option>
                    <option value="priceStartingFrom">{t('listing.sortOptions.priceAsc')}</option>
                    <option value="-priceStartingFrom">{t('listing.sortOptions.priceDesc')}</option>
                  </select>
                </div>
              </div>
              
              {pageLoading && (<div className="flex items-center justify-center mb-4" style={{ minHeight: 40 }}><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>)}
              <Row className='gutter-y-30 gutter-x-30'>
                {tours.length > 0 ? (
                  tours.map((item: any) => (<Col lg={4} md={6} key={item.id}><TourCard item={item} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} openVideoReviews={openVideoReviews} /></Col>))
                ) : (
                  <div className="flex items-center justify-center min-h-[200px] w-full"><p className="text-xl text-gray-500">{t('listing.noToursCategory')}</p></div>
                )}
                <Col xs={12} className="pb-5 mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

       <ListingPromo 
        title={category.bottomSection?.title} 
        description={category.bottomSection?.description} 
        button={category.bottomSection?.button}
        image1={category.bottomSection?.image1}
        image2={category.bottomSection?.image2}
        images={[
          ...visibleImages,
          ...visibleGallery
        ]}
        subtitle={category.name}
        locale={locale}
      />

        {/* FAQ Section */}
      <ListingFaqs 
        faqs={category.faqs} 
        sectionTitle={category.faqsSectionTitle}
        title={"FAQs about " + getLocalizedValue(category.name, locale)} 
        locale={locale} 
      />

      {/* Gallery Section */}
      <ListingGallery
        images={visibleGallery.length > 0 ? visibleGallery : visibleImages}
        sectionTitle={category.gallerySectionTitle}
        title={getLocalizedValue(category.name, locale) + " Gallery"}
        locale={locale}
      />

      {/* Reviews Section */}

      {/* Blogs Section */}
      <ListingBlogs 
        blogs={category.featuredBlogs} 
        sectionTitle={category.blogsSectionTitle}
        title={getLocalizedValue(category.name, locale) + " " + t('blogAndNews')} 
        locale={locale} 
      />

      
      <style jsx global>{`
        .subcategory-section {
          background: transparent;
          padding: 60px 0;
        }
        .subcategory-header {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 10px;
          padding-bottom: 24px;
          border-bottom: 3px solid #b79c5c;
        }
        .subcategory-header__title {
          font-size: 42px;
          font-weight: 800;
          color: #1d231f;
          margin: 0;
          line-height: 1.1;
          letter-spacing: -1px;
        }
        @media (max-width: 768px) {
          .subcategory-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .subcategory-header__title {
            font-size: 28px;
          }
        }
        .subcategory-header__title span {
          color: #b79c5c;
          position: relative;
        }
        .subcategory-slider-wrapper {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 10px 15px 30px;
          margin: 0 -15px;
          scrollbar-width: thin;
          scrollbar-color: #b79c5c #f0f0f0;
        }
        .subcategory-slider-wrapper::-webkit-scrollbar {
          height: 6px;
        }
        .subcategory-slider-wrapper::-webkit-scrollbar-track {
          background: #f7f3ed;
          border-radius: 10px;
        }
        .subcategory-slider-wrapper::-webkit-scrollbar-thumb {
          background: #d4c193;
          border-radius: 10px;
        }
        .subcategory-slider {
          display: flex;
          gap: 24px;
          min-width: 100%;
        }
        @media (max-width: 576px) {
          .subcategory-slider {
            gap: 15px;
          }
        }
        .subcategory-slide {
          flex: 0 0 auto;
          width: auto;
          min-width: 200px;
          perspective: 1000px;
        }
        @media (max-width: 576px) {
          .subcategory-slide {
            min-width: 160px;
          }
        }
        .subcategory-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .subcategory-card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          border: 1px solid rgba(183,156,92,0.1);
          height: 240px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 576px) {
          .subcategory-card {
            height: 180px;
          }
        }
        .subcategory-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(183,156,92,0.15);
          border-color: rgba(183,156,92,0.4);
        }
        .subcategory-card__image-box {
          position: relative;
          flex: 1;
          width: 100%;
          overflow: hidden;
        }
        .subcategory-card__image {
          transition: transform 0.8s ease;
        }
        .subcategory-card:hover .subcategory-card__image {
          transform: scale(1.1);
        }
        .subcategory-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(29,35,31,0.8) 0%, transparent 60%);
          z-index: 1;
        }
        .subcategory-card__content {
          padding: 12px 16px;
          background: white;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.3s ease;
        }
        .subcategory-card__title {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: #1d231f;
          transition: color 0.3s ease;
          white-space: nowrap;
          flex-grow: 1;
        }
        .subcategory-card__icon {
          width: 28px;
          height: 28px;
          background: #f7f3ed;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #b79c5c;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .subcategory-card:hover .subcategory-card__icon {
          background: #b79c5c;
          color: white;
          transform: rotate(45deg);
        }
        /* Active State */
        .subcategory-card.is-active {
          border-color: #b79c5c;
          box-shadow: 0 15px 35px rgba(183,156,92,0.25);
          transform: scale(1.02);
        }
        .subcategory-card.is-active .subcategory-card__content {
          background: #b79c5c;
        }
        .subcategory-card.is-active .subcategory-card__title {
          color: white;
        }
        .subcategory-card.is-active .subcategory-card__icon {
          background: white;
          color: #b79c5c;
        }
        /* SEO Refinement: Hidden label but semantic */
        .subcategory-card-link[aria-current="page"] .subcategory-card {
           /* styles already included in .is-active */
        }
        /* Mobile Filter Drawer Styles */
        .mobile-filter-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100dvh;
          z-index: 999999;
          visibility: hidden;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .mobile-filter-drawer.is-open {
          visibility: visible;
        }
        .mobile-filter-drawer__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .mobile-filter-drawer.is-open .mobile-filter-drawer__overlay {
          opacity: 1;
        }
        .mobile-filter-drawer__content {
          position: absolute;
          top: 0;
          left: -100%;
          width: 85%;
          max-width: 380px;
          height: 100%;
          background: #fff;
          display: flex;
          flex-direction: column;
          transition: left 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 20px 0 50px rgba(0,0,0,0.15);
          overflow-x: hidden;
        }
        .mobile-filter-drawer.is-open .mobile-filter-drawer__content {
          left: 0;
        }
        .mobile-filter-drawer__header {
          padding: 24px 20px;
          border-bottom: 2px solid #f7f3ed;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
        }
        .mobile-filter-drawer__header h3 {
          font-size: 20px;
          font-weight: 800;
          color: #1d231f;
          letter-spacing: -0.5px;
        }
        .mobile-filter-drawer__body {
          padding: 0;
          overflow-y: auto;
          flex: 1;
          -webkit-overflow-scrolling: touch;
        }
        /* Custom scrollbar for drawer */
        .mobile-filter-drawer__body::-webkit-scrollbar {
          width: 4px;
        }
        .mobile-filter-drawer__body::-webkit-scrollbar-thumb {
          background: #b79c5c;
          border-radius: 10px;
        }
        .btn-close-filter {
          background: #f7f3ed;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111;
          transition: all 0.3s ease;
        }
        .btn-close-filter:active {
          transform: scale(0.9);
          background: #b79c5c;
          color: #fff;
        }
      `}</style>
      <VideoModal isOpen={isOpen} setOpen={setOpen} ids={videoIds} />
      <FooterOne />
    </Layout>
  );
}
