'use client';
import React, { useState, useEffect, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import Pagination from "@/components/common/Pagination/Pagination";
import { tourAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { ChevronRight, Loader2, Check } from "lucide-react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import AboutOne from "@/components/sections/AboutOne/AboutOne";
import { useWishlist } from "@/contexts/WishlistContext";
import { tourAPI as tourApiForFetch } from "@/lib/api/tour";
import { toast } from "@/hooks/use-toast";
import EnhancedSectionHeader from "@/components/sections/EnhancedSectionHeader/EnhancedSectionHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { getLocalizedValue } from "@/lib/localize";
import TourCard from "@/components/common/TourCard/TourCard";
import { SlugManager } from "@/components/common/SlugManager";
import { useTranslation } from 'react-i18next';

export default function SubcategoryView({ slug, locale }: { slug: string; locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation('tours');

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  const { toggleWishlist, isInWishlist } = useWishlist();
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [subcategory, setSubcategory] = useState<any>(null);
  const [siblingSubcategories, setSiblingSubcategories] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<string>("-createdAt");
  const toursPerPage = 10;
  const prevSlugRef = useRef<string | null>(null);
  const [draftFilters, setDraftFilters] = useState({ search: "", minPrice: "", maxPrice: "", tourType: "", tourStyle: "" });
  const [appliedFilters, setAppliedFilters] = useState({ search: "", minPrice: "", maxPrice: "", tourType: "", tourStyle: "" });
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
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    router.replace(buildUrl({ page: 1, ...draftFilters }), { scroll: false } as any);
  };

  const handleResetFilters = () => {
    const empty = { search: "", minPrice: "", maxPrice: "", tourType: "", tourStyle: "" };
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isNewSlug = prevSlugRef.current !== slug;
        if (isNewSlug) prevSlugRef.current = slug;

        const isInitial = isNewSlug || subcategory === null;
        if (isInitial) setInitialLoading(true);
        else setPageLoading(true);

        const subResponse = await tourSubcategoryAPI.getBySlug(slug, undefined, locale);
        if (!subResponse.success || !subResponse.data) {
          setError(t('status.subcategoryNotFound'));
          setInitialLoading(false);
          setPageLoading(false);
          return;
        }
        setSubcategory(subResponse.data);

        const categoryId =
          typeof subResponse.data?.category === "string"
            ? subResponse.data.category
            : subResponse.data?.category?._id;

        if (categoryId) {
          const siblingsRes = await tourSubcategoryAPI.getByCategory(categoryId);
          setSiblingSubcategories(siblingsRes?.success && Array.isArray(siblingsRes.data) ? siblingsRes.data : []);
        } else {
          setSiblingSubcategories([]);
        }

        const toursResponse = await tourAPI.getAll({
          subcategory: subResponse.data._id,
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
            const galleryImages = [
              ...(tour.images || []).map((img: any) => img.url),
              ...(tour.gallery || []).map((img: any) => img.url),
            ].filter(Boolean);
            const uniqueImages = Array.from(new Set(galleryImages));
            return {
              id: tour._id,
              slug: getLocalizedValue(tour.slug, locale),
              image: uniqueImages[0] || "/assets/images/resources/tour-1-1.jpg",
              allImages: uniqueImages.length > 0 ? uniqueImages : ["/assets/images/resources/tour-1-1.jpg"],
              title: getLocalizedValue(tour.heading || tour.name, locale),
              link: `/${locale}/${getLocalizedValue(tour.slug, locale)}`,
              price: tour.priceStartingFrom || 0,
              rating: 5,
              reviews: tour.reviews?.length || 0,
              videoId: tour.videoLink || "",
              discount: "",
              meta: [
                { id: 1, title: `${getLocalizedValue(tour.duration, locale) || t('fallback.days')}`, icon: "icon-clock" },
                { id: 2, title: `${tour.minAge || "12"} +`, icon: "icon-user" },
                { id: 3, title: getLocalizedValue(tour.tourLocation, locale) || t('fallback.location'), icon: "icon-location" },
              ],
            };
          });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentPage, sort, appliedFilters.search, appliedFilters.minPrice, appliedFilters.maxPrice, appliedFilters.tourType, appliedFilters.tourStyle]);

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

  if (initialLoading) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />
        <div className="flex items-center justify-center min-h-[60vh]" suppressHydrationWarning>
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <FooterOne />
      </Layout>
    );
  }

  if (error || !subcategory) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />
        <PageHeader title={t('status.notFound')} />
        <div className="flex items-center justify-center min-h-[400px] text-red-500">
          <h3>{error || t('status.subcategoryNotFound')}</h3>
        </div>
        <FooterOne />
      </Layout>
    );
  }

  // Build the category link (flat — just the category's slug)
  const categoryLocalizedSlug = getLocalizedValue(subcategory.category?.slug, locale);

  return (
    <Layout>
      {subcategory?.slug && <SlugManager slugs={subcategory.slug} />}
      <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />
      <PageHeader
        title={getLocalizedValue(subcategory.name, locale)}
        breadcrumbs={[
          { label: t('breadcrumb.destination'), href: '/' },
          {
            label: getLocalizedValue(subcategory.category?.name, locale) || t('breadcrumb.category'),
            href: categoryLocalizedSlug ? `/${locale}/${categoryLocalizedSlug}` : undefined,
          },
          { label: getLocalizedValue(subcategory.name, locale) },
        ]}
      />

      {(() => {
        const sh = subcategory?.sectionHeader;
        const images = Array.isArray(sh?.images) && sh.images.length ? sh.images : (sh?.image?.url ? [sh.image] : []);
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
        <section className="subcategory-section section-space-top">
          <Container>
            <div className="subcategory-slider-wrapper">
              <div className="subcategory-slider">
                {siblingSubcategories.map((sub: any) => {
                  const isActive = String(sub?._id || "") === String(subcategory?._id || "") || String(sub?.slug || "") === String(slug || "");
                  return (
                    <div key={sub._id} className="subcategory-slide">
                      {/* Flat URL — just the sub's localized slug */}
                      <Link href={`/${locale}/${getLocalizedValue(sub.slug, locale)}`} className="subcategory-card-link">
                        <div className={`subcategory-card${isActive ? " is-active" : ""}`}>
                          <div className="subcategory-card__image-box">
                            <Image src={sub.image?.url || "/assets/images/resources/tour-1-1.jpg"} alt={getLocalizedValue(sub.name, locale)} fill className="subcategory-card__image" />
                            <div className="subcategory-card__overlay" />
                          </div>
                          <div className="subcategory-card__content">
                            <h3 className="subcategory-card__title">{getLocalizedValue(sub.name, locale)}</h3>
                            <span className="subcategory-card__icon">
                              {isActive ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
            <Col lg={4} xl={3}>
              <aside className='listing__sidebar'>
                <div>
                  <div className='listing__sidebar__item__inner' style={{ borderRadius: 14, border: "1px solid #eee", background: "#fff" }}>
                    <div style={{ padding: 18, borderBottom: "1px solid #f0f0f0" }}>
                      <h3 className='listing__sidebar__title' style={{ margin: 0 }}>{t('filters.title')}</h3>
                    </div>
                    <div style={{ padding: 18, display: "grid", gap: 14 }}>
                      <div>
                        <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.search')}</label>
                        <input className='form-control' value={draftFilters.search} onChange={(e) => setDraftFilters((p) => ({ ...p, search: e.target.value }))} placeholder={t('filters.searchPlaceholder')} />
                      </div>
                      <div className='row g-2 align-items-end'>
                        <div className='col-6'>
                          <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.minPrice')}</label>
                          <div className='input-group'><span className='input-group-text'>$</span><input className='form-control' value={draftFilters.minPrice} onChange={(e) => setDraftFilters((p) => ({ ...p, minPrice: e.target.value.replace(/[^0-9.]/g, "") }))} inputMode="decimal" placeholder="0" /></div>
                        </div>
                        <div className='col-6'>
                          <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.maxPrice')}</label>
                          <div className='input-group'><span className='input-group-text'>$</span><input className='form-control' value={draftFilters.maxPrice} onChange={(e) => setDraftFilters((p) => ({ ...p, maxPrice: e.target.value.replace(/[^0-9.]/g, "") }))} inputMode="decimal" placeholder="9999" /></div>
                        </div>
                      </div>
                      <div>
                        <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.tourType')}</label>
                        <select className='form-select' value={draftFilters.tourType} onChange={(e) => setDraftFilters((p) => ({ ...p, tourType: e.target.value }))}>
                          <option value="">{t('filters.all')}</option>
                          {tourTypeOptions.map((tOp) => (<option key={tOp} value={tOp}>{tOp}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className='form-label' style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.tourStyle')}</label>
                        <select className='form-select' value={draftFilters.tourStyle} onChange={(e) => setDraftFilters((p) => ({ ...p, tourStyle: e.target.value }))}>
                          <option value="">{t('filters.all')}</option>
                          {tourStyleOptions.map((tOp) => (<option key={tOp} value={tOp}>{tOp}</option>))}
                        </select>
                      </div>
                    </div>
                    <div style={{ padding: 18, borderTop: "1px solid #f0f0f0" }}>
                      <div className='row g-2'>
                        <div className='col-6'><button type="button" onClick={handleApplyFilters} className='gotur-btn' style={{ width: "100%" }}>{t('filters.apply')}</button></div>
                        <div className='col-6'><button type="button" onClick={handleResetFilters} className='gotur-btn' style={{ width: "100%", background: "transparent", color: "#111", border: "1px solid #e5e5e5" }}>{t('filters.reset')}</button></div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </Col>

            <Col lg={8} xl={9}>
              <div className="d-flex flex-wrap justify-content-between align-items-center" style={{ gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: "#666" }}>
                  {appliedFilters.search || appliedFilters.minPrice || appliedFilters.maxPrice || appliedFilters.tourType || appliedFilters.tourStyle ? (
                    <span>{t('listing.showingWithFilters')}<button type="button" onClick={handleResetFilters} style={{ marginLeft: 10, background: "none", border: "none", color: "#b79c5c", fontWeight: 700 }}>{t('listing.clear')}</button></span>
                  ) : (<span>{t('listing.showingAll')}</span>)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{t('listing.sortBy')}</span>
                  <select value={sort} onChange={(e) => handleSortChange(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e5e5", background: "#fff", minWidth: 220 }}>
                    <option value="-createdAt">{t('listing.sortOptions.newest')}</option>
                    <option value="createdAt">{t('listing.sortOptions.oldest')}</option>
                    <option value="-viewCount">{t('listing.sortOptions.mostViewed')}</option>
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
                  <div className="flex items-center justify-center min-h-[200px] w-full"><p className="text-xl text-gray-500">{t('listing.noToursSubcategory')}</p></div>
                )}
                <Col xs={12}><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      <style jsx global>{`
        .subcategory-slider-wrapper { overflow-x: auto; padding-bottom: 12px; margin: 0 -15px; }
        .subcategory-slider-wrapper::-webkit-scrollbar { height: 6px; }
        .subcategory-slider-wrapper::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 3px; }
        .subcategory-slider-wrapper::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        .subcategory-slider { display: flex; gap: 16px; padding: 0 15px; }
        .subcategory-slide { flex: 0 0 auto; width: 180px; }
        .subcategory-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: all 0.3s ease; position: relative; }
        .subcategory-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .subcategory-card__image-box { position: relative; height: 180px; width: 100%; }
        .subcategory-card__image { object-fit: cover; }
        .subcategory-card__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%); }
        .subcategory-card__content { padding: 15px; display: flex; justify-content: space-between; align-items: center; background: white; }
        .subcategory-card__title { font-size: 18px; font-weight: 700; margin: 0; color: #333; }
        .subcategory-card__icon { width: 28px; height: 28px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.3s ease; }
        .subcategory-card:hover .subcategory-card__icon { background: var(--gotur-primary, #b79c5c); color: white; }
        .subcategory-card-link { text-decoration: none; color: inherit; }
        .subcategory-card.is-active { box-shadow: 0 0 0 2px var(--gotur-primary, #b79c5c), 0 6px 16px rgba(0,0,0,0.12); }
        .subcategory-card.is-active .subcategory-card__content { background: var(--gotur-primary, #b79c5c); }
        .subcategory-card.is-active .subcategory-card__title { color: #1d231f; }
        .subcategory-card.is-active .subcategory-card__icon { background: rgba(255,255,255,0.9); color: #1d231f; }
      `}</style>
      <VideoModal isOpen={isOpen} setOpen={setOpen} ids={videoIds} />
      <AboutOne extraclass='about-one--one' />
      <FooterOne />
    </Layout>
  );
}
