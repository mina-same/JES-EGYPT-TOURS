'use client';
import React, { useState, useEffect, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import Pagination from "@/components/common/Pagination/Pagination";
import { tourAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { Loader2, ChevronRight, Check, X, SlidersHorizontal } from "lucide-react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { useWishlist } from "@/contexts/WishlistContext";
import { tourAPI as tourApiForFetch } from "@/lib/api/tour";
import { toast } from "@/hooks/use-toast";
import EnhancedSectionHeader from "@/components/sections/EnhancedSectionHeader/EnhancedSectionHeader";
import { useRouter, useSearchParams } from "next/navigation";
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
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";
import { getTourReviewVideoIds } from "@/lib/video/youtube";
import TourListingFilters from "@/components/common/TourListingFilters/TourListingFilters";
import { countActiveTourFilters, readTourListingState, validateTourPriceRange } from "@/lib/tours/listingFilters";
import { useAccessibleDrawer } from "@/hooks/useAccessibleDrawer";
import { mapApiTourToCard } from "@/lib/tours/cardViewModel";


export default function SubcategoryView({
  slug,
  locale,
  initialSubcategory,
  initialSiblings,
  initialTours,
}: {
  slug: string;
  locale: string;
  initialSubcategory?: any;
  initialSiblings?: any[];
  initialTours?: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation('tours');
  const { currency, currencySymbol } = useCurrency();
  const initialListing = readTourListingState(searchParams);
  const initialCards = (Array.isArray(initialTours?.data) ? initialTours.data : [])
    .map((tour: any) => mapApiTourToCard(tour, locale, {
      location: t('fallback.location'),
      duration: t('fallback.days'),
    }))
    .filter(Boolean);

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  const { toggleWishlist, isInWishlist } = useWishlist();
  const [initialLoading, setInitialLoading] = useState(!initialSubcategory);
  // Mounting with server data means a tours fetch is already pending, so start
  // in pageLoading — otherwise the first paint flashes "no tours" before it lands.
  const [pageLoading, setPageLoading] = useState(!initialTours);
  const [subcategory, setSubcategory] = useState<any>(initialSubcategory || null);
  const [siblingSubcategories, setSiblingSubcategories] = useState<any[]>(initialSiblings || []);
  const [tours, setTours] = useState<any[]>(initialCards);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(initialListing.page);
  const [totalPages, setTotalPages] = useState(initialTours?.totalPages || 1);
  const [sort, setSort] = useState<string>(initialListing.sort);
  const toursPerPage = 9;
  // Seeded with the current slug when the server already resolved the
  // subcategory: starting at null made the first effect see a "new slug" and
  // blank the server-rendered page behind the white-on-white loading screen.
  const prevSlugRef = useRef<string | null>(initialSubcategory ? slug : null);
  const skipInitialFetchRef = useRef(Boolean(initialTours?.success));
  const [draftFilters, setDraftFilters] = useState(initialListing.filters);
  const [appliedFilters, setAppliedFilters] = useState(initialListing.filters);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(initialTours?.total || 0);
  const [tourTypeOptions, setTourTypeOptions] = useState<string[]>([]);
  const [tourStyleOptions, setTourStyleOptions] = useState<string[]>([]);
  const closeFilters = () => setIsFilterOpen(false);
  const { dialogRef, triggerRef } = useAccessibleDrawer(isFilterOpen, closeFilters);

  useEffect(() => {
    const fromQueryPage = Number(searchParams?.get("page") || "1");
    const safePage = Number.isFinite(fromQueryPage) && fromQueryPage > 0 ? Math.floor(fromQueryPage) : 1;
    const fromSort = searchParams?.get("sort") || "-createdAt";
    const next = {
      search: searchParams?.get("search") || "",
      minPrice: searchParams?.get("minPrice") || "",
      maxPrice: searchParams?.get("maxPrice") || "",
      tourType: searchParams?.get("tourType") || "",
      tourStyle: searchParams?.get("tourStyle") || "",
    };
    setCurrentPage(safePage);
    setSort(fromSort);
    setDraftFilters(next);
    setAppliedFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, searchParams]);

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
    if (f.tourType) sp.set("tourType", f.tourType);
    if (f.tourStyle) sp.set("tourStyle", f.tourStyle);
    const qs = sp.toString();
    // Flat URL — just the subcategory slug
    return `/${locale}/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.replace(buildUrl({ page }), { scroll: false } as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = () => {
    const priceIssue = validateTourPriceRange(draftFilters.minPrice, draftFilters.maxPrice);
    if (priceIssue) {
      setFilterError(t(priceIssue === 'range' ? 'filters.priceRangeError' : 'filters.priceInvalidError'));
      return;
    }
    setFilterError(null);
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    setFilterError(null);
    router.replace(buildUrl({ page: 1, ...draftFilters }), { scroll: false } as any);
  };

  const handleResetFilters = () => {
    const empty = { search: "", minPrice: "", maxPrice: "", tourType: "", tourStyle: "" };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setSort("-createdAt");
    setCurrentPage(1);
    setFilterError(null);
    router.replace(`/${locale}/${encodeURIComponent(slug)}`, { scroll: false } as any);
  };

  const handleSortChange = (nextSort: string) => {
    setSort(nextSort);
    setCurrentPage(1);
    router.replace(buildUrl({ page: 1, sort: nextSort }), { scroll: false } as any);
  };

  const removeFilter = (key: keyof typeof appliedFilters) => {
    const next = { ...appliedFilters, [key]: '' };
    setDraftFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
    setFilterError(null);
    router.replace(buildUrl({ page: 1, ...next }), { scroll: false } as any);
  };

  useEffect(() => {
    const directPriceIssue = validateTourPriceRange(appliedFilters.minPrice, appliedFilters.maxPrice);
    if (directPriceIssue) {
      setFilterError(t(directPriceIssue === 'range' ? 'filters.priceRangeError' : 'filters.priceInvalidError'));
      setTours([]);
      setTotalResults(0);
      setInitialLoading(false);
      setPageLoading(false);
      return;
    }
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      setInitialLoading(false);
      setPageLoading(false);
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setError(null);
        const isNewSlug = prevSlugRef.current !== slug;
        if (isNewSlug) prevSlugRef.current = slug;

        const isInitial = isNewSlug || subcategory === null;
        if (isInitial) setInitialLoading(true);
        else setPageLoading(true);

        let resolvedSubcategory = initialSubcategory || subcategory;
        if (!initialSubcategory) {
          const subResponse = await tourSubcategoryAPI.getBySlug(slug, undefined, locale);
          if (!subResponse.success || !subResponse.data) {
            setError(t('status.subcategoryNotFound'));
            setInitialLoading(false);
            setPageLoading(false);
            return;
          }
          setSubcategory(subResponse.data);
          resolvedSubcategory = subResponse.data;

          const categoryId = typeof subResponse.data?.category === "string"
            ? subResponse.data.category
            : subResponse.data?.category?._id;

          if (categoryId) {
            const siblingsRes = await tourSubcategoryAPI.getByCategory(categoryId);
            setSiblingSubcategories(siblingsRes?.success && Array.isArray(siblingsRes.data) ? siblingsRes.data : []);
          } else {
            setSiblingSubcategories([]);
          }
        } else {
          if (initialSiblings) {
            setSiblingSubcategories(initialSiblings);
          } else {
            const categoryId = typeof initialSubcategory?.category === "string"
              ? initialSubcategory.category
              : initialSubcategory?.category?._id;
            if (categoryId) {
              const siblingsRes = await tourSubcategoryAPI.getByCategory(categoryId);
              setSiblingSubcategories(siblingsRes?.success && Array.isArray(siblingsRes.data) ? siblingsRes.data : []);
            }
          }
        }

        const subId = resolvedSubcategory?._id;
        if (!subId) return;

        const toursResponse = await tourAPI.getAll({
          subcategory: subId,
          page: currentPage,
          limit: toursPerPage,
          sort,
          ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
          ...(appliedFilters.minPrice ? { minPrice: Number(appliedFilters.minPrice) } : {}),
          ...(appliedFilters.maxPrice ? { maxPrice: Number(appliedFilters.maxPrice) } : {}),
          ...(appliedFilters.tourType ? { tourType: appliedFilters.tourType } : {}),
          ...(appliedFilters.tourStyle ? { tourStyle: appliedFilters.tourStyle } : {}),
          currency,
        }, locale, controller.signal);

        if (toursResponse.success && toursResponse.data) {
          const lastPage = toursResponse.totalPages || 1;
          setTotalPages(lastPage);
          setTotalResults(toursResponse.total || 0);
          if ((toursResponse.total || 0) > 0 && currentPage > lastPage) {
            setCurrentPage(lastPage);
            router.replace(buildUrl({ page: lastPage }), { scroll: false } as any);
            return;
          }
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
                { id: 1, title: getLocalizedValue(tour.tourLocation, locale) || t('fallback.location'), icon: "icon-location" },
                { id: 2, title: `${getLocalizedValue(tour.duration, locale) || t('fallback.days')}`, icon: "icon-clock" },
                ...(getDisplayName(tour.subcategory, locale)
                  ? [{ id: 4, title: getDisplayName(tour.subcategory, locale), icon: "icon-flag" }]
                  : []),
              ],
            };
          }).filter(Boolean);
          setTours(mappedTours);
        }
      } catch (err: any) {
        if (err?.code === 'ERR_CANCELED') return;
        console.error("Error fetching data:", err);
        setError(t('status.errorFetching'));
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false);
          setPageLoading(false);
        }
      }
    };

    void fetchData();
    return () => controller.abort();
  }, [slug, currentPage, sort, currency, appliedFilters.search, appliedFilters.minPrice, appliedFilters.maxPrice, appliedFilters.tourType, appliedFilters.tourStyle]);

  useEffect(() => {
    const subcategoryId = initialSubcategory?._id || subcategory?._id;
    if (!subcategoryId) return;
    const controller = new AbortController();
    tourAPI.getFilterOptions({ subcategory: subcategoryId, currency }, locale, controller.signal)
      .then((response) => {
        if (response.success && response.data) {
          setTourTypeOptions(response.data.tourTypes);
          setTourStyleOptions(response.data.tourStyles);
        }
      })
      .catch((err) => {
        if (err?.code !== 'ERR_CANCELED') console.error('Failed to load tour filter options:', err);
      });
    return () => controller.abort();
  }, [subcategory?._id, initialSubcategory?._id, currency, locale]);


  // The ids are already on the card: the listing payload carries `reviews`, so
  // opening the player needs no round-trip. This used to re-fetch the whole
  // tour on every click just to read URLs it already had.
  const openVideoReviewsFor = (ids: string[]) => {
    setVideoIds(ids);
    setOpen(true);
  };

  if (initialLoading) {
    return (
      <Layout>
        {/* dark links: this branch has no PageHeader, so the transparent header
            sits on white and light links would be invisible. */}
        <TopbarOne /><HeaderOne linkTheme="dark" />
        <div className="flex items-center justify-center min-h-[60vh]" suppressHydrationWarning>
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <FooterOne />
      </Layout>
    );
  }

  if (!subcategory) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" />
        <PageHeader title={t('status.notFound')} />
        <div className="flex items-center justify-center min-h-[400px] text-red-500">
          <h3>{error || t('status.subcategoryNotFound')}</h3>
        </div>
        <FooterOne />
      </Layout>
    );
  }

  // Build the category link (flat — just the category's slug)
  const categoryLocalizedSlug = getStrictLocalizedSlug(subcategory.category?.slug, locale as SupportedLocale);

  // Per-image language visibility: absent/empty languages = all locales.
  const imgAllows = (img: any) =>
    !Array.isArray(img?.languages) || img.languages.length === 0 || img.languages.includes(locale);
  const visibleImages = (subcategory.images || []).filter(imgAllows);
  const visibleGallery = (subcategory.gallery || []).filter(imgAllows);

  return (
    <Layout>
      {subcategory?.slug && <SlugManager slugs={subcategory.slug} />}
      <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />

      {/* Mobile Filter Drawer (Top-level for proper stacking context) */}
      <div className={`mobile-filter-drawer ${isFilterOpen ? 'is-open' : ''} d-lg-none`} aria-hidden={!isFilterOpen}>
        <button type="button" className="mobile-filter-drawer__overlay" onClick={closeFilters} tabIndex={-1} aria-label={t('filters.close')} />
        <div ref={dialogRef} id="tour-filter-dialog" className="mobile-filter-drawer__content" role="dialog" aria-modal="true" aria-labelledby="tour-filter-title">
          <div className="mobile-filter-drawer__header">
            <span id="tour-filter-title" className="m-0" style={{ fontWeight: 800, fontSize: '20px' }}>{t('filters.title')}</span>
            <button type="button" onClick={closeFilters} className="btn-close-filter" aria-label={t('filters.close')}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mobile-filter-drawer__body">
            <TourListingFilters
              t={t}
              draftFilters={draftFilters}
              setDraftFilters={setDraftFilters}
              locale={locale}
              tourTypeOptions={tourTypeOptions}
              tourStyleOptions={tourStyleOptions}
              handleApplyFilters={() => { handleApplyFilters(); setIsFilterOpen(false); }}
              handleResetFilters={() => { handleResetFilters(); setIsFilterOpen(false); }}
              currencySymbol={currencySymbol}
              validationError={filterError}
              noBorder={true}
              hideHeader={true}
              fullHeight={true}
            />
          </div>
        </div>
      </div>
      <PageHeader
        title={getLocalizedValue(subcategory.name, locale)}
        subTitle={getLocalizedValue(subcategory.description, locale)}
        bgImage={visibleImages[0]?.url || undefined}
        alt={getLocalizedValue(visibleImages[0]?.alt, locale)}
        imageTitle={
          getLocalizedValue(visibleImages[0]?.title, locale) ||
          getLocalizedValue(visibleImages[0]?.alt, locale) ||
          getLocalizedValue(subcategory.name, locale)
        }
        breadcrumbs={[
          {
            label: getDisplayName(subcategory.category, locale) || t('breadcrumb.category'),
            href: categoryLocalizedSlug ? `/${locale}/${categoryLocalizedSlug}` : undefined,
          },
          { label: getDisplayName(subcategory, locale) },
        ]}
      />

      {(() => {
        const sh = subcategory?.sectionHeader;
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

      {siblingSubcategories.length > 0 && (
        <section className="subcategory-section">
          <Container>
            <div className="subcategory-header">
              <h2 className="subcategory-header__title">
                {subcategory.subcategorySectionTitle && getLocalizedValue(subcategory.subcategorySectionTitle, locale) ? (
                  getLocalizedValue(subcategory.subcategorySectionTitle, locale)
                ) : (
                  <>
                    Explore <span>{getLocalizedValue(subcategory.category?.name, locale) || t('breadcrumb.category')}</span> Subcategories
                  </>
                )}
              </h2>
            </div>
            <div className="subcategory-slider-wrapper">
              <div className="subcategory-slider">
                {siblingSubcategories.map((sub: any) => {
                  const isActive = String(sub?._id || "") === String(subcategory?._id || "") || String(sub?.slug || "") === String(slug || "");
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

      <section className='tour-listing-page section-space'>
        <Container>
          <Row className='gutter-y-40'>
            {/* Desktop Sidebar */}
            <Col lg={4} xl={3} className="d-none d-lg-block p-0">
              <aside className='listing__sidebar sticky-top' style={{ top: '0', height: '100vh', padding: '120px 20px 40px', background: '#fff', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
                <TourListingFilters
                  t={t}
                  draftFilters={draftFilters}
                  setDraftFilters={setDraftFilters}
                  locale={locale}
                  tourTypeOptions={tourTypeOptions}
                  tourStyleOptions={tourStyleOptions}
                  handleApplyFilters={() => { handleApplyFilters(); setIsFilterOpen(false); }}
                  handleResetFilters={() => { handleResetFilters(); setIsFilterOpen(false); }}
                  currencySymbol={currencySymbol}
                  validationError={filterError}
                  noBorder={true}
                />
              </aside>
            </Col>


            <Col lg={8} xl={9}>
              {/* Tours Section Title */}
              <div className="mb-4">
                <h2 className="subcategory-header__title" style={{ fontSize: '36px', letterSpacing: '-0.5px' }}>
                  {subcategory.toursSectionTitle && getLocalizedValue(subcategory.toursSectionTitle, locale) ? (
                    getLocalizedValue(subcategory.toursSectionTitle, locale)
                  ) : (
                    <>
                      Available <span>{getLocalizedValue(subcategory.name, locale)}</span> Tours
                    </>
                  )}
                </h2>
                {subcategory.toursSectionSubTitle && getLocalizedValue(subcategory.toursSectionSubTitle, locale) && (
                  <div 
                    className="mt-2 text-muted-foreground html-content" 
                    style={{ fontSize: '16px', maxWidth: '1000px' }}
                    dangerouslySetInnerHTML={{ __html: getLocalizedValue(subcategory.toursSectionSubTitle, locale) }}
                  />
                )}
                <div style={{ width: '80px', height: '4px', background: '#b79c5c', borderRadius: '2px', marginTop: '12px', marginBottom: '30px' }} />
              </div>

              {/* Controls bar */}
              <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded-4 mb-4" style={{ gap: 12 }}>
                <div className="d-flex align-items-center gap-3">
                  <button
                    ref={triggerRef}
                    type="button"
                    className="d-lg-none flex items-center gap-2 px-4 py-2 bg-[#b79c5c] text-white rounded-lg font-bold"
                    onClick={() => setIsFilterOpen(true)}
                    aria-expanded={isFilterOpen}
                    aria-controls="tour-filter-dialog"
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
              <div className="d-flex flex-wrap align-items-center gap-2 mb-4" aria-live="polite">
                <span className="text-muted">{t('listing.resultsCount', { count: totalResults })}</span>
                {Object.entries(appliedFilters).filter(([, value]) => value).map(([key, value]) => (
                  <button key={key} type="button" className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1" onClick={() => removeFilter(key as keyof typeof appliedFilters)} aria-label={`${t('filters.remove')} ${value}`}>
                    {value} <X size={14} aria-hidden="true" />
                  </button>
                ))}
                {countActiveTourFilters(appliedFilters) > 1 && (
                  <button type="button" className="btn btn-sm btn-link" onClick={handleResetFilters}>{t('filters.clearAll')}</button>
                )}
              </div>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              {pageLoading && (<div className="flex items-center justify-center mb-4" style={{ minHeight: 40 }}><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>)}
              <Row className='gutter-y-30 gutter-x-30'>
                {tours.length > 0 ? (
                  tours.map((item: any) => (<Col lg={4} md={6} key={item.id}><TourCard item={item} toggleWishlist={toggleWishlist} isInWishlist={isInWishlist} openVideoReviews={item.videoIds?.length ? () => openVideoReviewsFor(item.videoIds) : undefined} /></Col>))
                ) : pageLoading ? null : (
                  <div className="flex items-center justify-center min-h-[200px] w-full"><p className="text-xl text-gray-500">{t('listing.noToursSubcategory')}</p></div>
                )}
                <Col xs={12} className="pb-5 mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>


      {/* Bottom Promo Section */}
      <ListingPromo
        title={subcategory.bottomSection?.title}
        description={subcategory.bottomSection?.description}
        button={subcategory.bottomSection?.button}
        image1={subcategory.bottomSection?.image1}
        image2={subcategory.bottomSection?.image2}
        images={[
          ...visibleImages,
          ...visibleGallery
        ]}
        subtitle={subcategory.name}
        locale={locale}
      />

       {/* FAQ Section */}
      <ListingFaqs
        faqs={subcategory.faqs}
        sectionTitle={subcategory.faqsSectionTitle}
        title={"FAQs about " + getLocalizedValue(subcategory.name, locale)}
        locale={locale}
      />

      {/* Gallery Section */}
      <ListingGallery
        images={visibleGallery.length > 0 ? visibleGallery : visibleImages}
        sectionTitle={subcategory.gallerySectionTitle}
        title={getLocalizedValue(subcategory.name, locale) + " Gallery"}
        locale={locale}
      />

      {/* Reviews Section */}

      {/* Blogs Section */}
      <ListingBlogs
        blogs={subcategory.featuredBlogs}
        sectionTitle={subcategory.blogsSectionTitle}
        title={getLocalizedValue(subcategory.name, locale) + " " + t('blogAndNews')}
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
