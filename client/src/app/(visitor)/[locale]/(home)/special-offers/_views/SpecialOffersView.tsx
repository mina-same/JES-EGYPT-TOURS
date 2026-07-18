'use client';
import React, { useState, useEffect, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Loader2, Tag, ShieldCheck, BadgePercent, Clock3, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import TourCard from "@/components/common/TourCard/TourCard";
import Pagination from "@/components/common/Pagination/Pagination";
import ListingPromo from "@/components/common/ListingSections/ListingPromo";
import ListingFaqs from "@/components/common/ListingSections/ListingFaqs";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { tourAPI } from "@/lib/api/tour";
import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, getLocalizedStaticSlug, type SupportedLocale } from "@/lib/url";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "@/hooks/use-toast";
import { SPECIAL_OFFERS_FAQS } from "../specialOffersFaqs";

const GOLD = "#b79c5c";
const DARK = "#1d231f";

// Fields the card actually needs — keeps the list payload ~95% smaller than
// full tour documents (the API supports comma-separated projection).
const CARD_FIELDS =
  "slug,heading,name,images,gallery,priceStartingFrom,reviewsCount,videoLink,specialOfferDiscount,duration,minAge,tourLocation";

// The API localizes documents per the X-Locale header: on non-EN locales
// `tour.slug` arrives as an already-localized plain STRING. Accept it as-is;
// only object slugs need the strict per-locale lookup.
function mapTour(tour: any, locale: string) {
  const tourSlug =
    typeof tour.slug === "string"
      ? tour.slug.trim().replace(/^\/+|\/+$/g, "") || null
      : getStrictLocalizedSlug(tour.slug, locale as SupportedLocale);
  if (!tourSlug) return null;
  const galleryImages = [
    ...(tour.images || []).map((img: any) => img.url),
    ...(tour.gallery || []).map((img: any) => img.url),
  ].filter(Boolean);
  const uniqueImages = Array.from(new Set(galleryImages)) as string[];
  return {
    id: tour._id,
    slug: tourSlug,
    image: uniqueImages[0] || "/assets/images/resources/tour-1-1.jpg",
    imageAlt: getLocalizedValue(tour.images?.[0]?.alt || tour.gallery?.[0]?.alt, locale),
    allImages: uniqueImages.length > 0 ? uniqueImages : ["/assets/images/resources/tour-1-1.jpg"],
    title: getLocalizedValue(tour.heading || tour.name, locale),
    link: `/${locale}/${tourSlug}`,
    price: tour.priceStartingFrom || { USD: 0 },
    rating: 5,
    reviews: tour.reviewsCount || tour.reviews?.length || 0,
    videoId: tour.videoLink || "",
    discount: tour.specialOfferDiscount ? String(tour.specialOfferDiscount) : undefined,
    meta: [
      { id: 1, title: getLocalizedValue(tour.duration, locale) || "1 Day", icon: "icon-clock" },
      { id: 2, title: `${tour.minAge || "12"} +`, icon: "icon-user" },
      { id: 3, title: getLocalizedValue(tour.tourLocation, locale) || "Egypt", icon: "icon-location" },
    ],
  };
}

interface SpecialOffersViewProps {
  locale: string;
  /** Page-1 offers fetched server-side so the grid is part of the SSR HTML. */
  initialTours?: any[];
  initialTotal?: number;
  initialTotalPages?: number;
}

export default function SpecialOffersView({ locale, initialTours, initialTotal, initialTotalPages }: SpecialOffersViewProps) {
  const { t, i18n } = useTranslation("specialOffers");
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  const [tours, setTours] = useState<any[]>(() =>
    (initialTours || []).map((tour) => mapTour(tour, locale)).filter(Boolean)
  );
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [loading, setLoading] = useState(!initialTours);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 1);
  const [sort, setSort] = useState("-createdAt");
  const [isOpen, setOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const toursPerPage = 9;

  const maxDiscount = tours.reduce((max, t) => {
    const d = Number(t.discount);
    return d > max ? d : max;
  }, 0);

  const fetchTours = async (page: number, sortVal: string, initial = false) => {
    if (initial) setLoading(true); else setPageLoading(true);
    try {
      const res = await tourAPI.getAll({ isSpecialOffer: true, page, limit: toursPerPage, sort: sortVal, fields: CARD_FIELDS });
      if (res.success && res.data) {
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || res.count || 0);
        setTours(res.data.map((tour: any) => mapTour(tour, locale)).filter(Boolean));
      }
    } catch {
      toast({ title: "Error", description: "Failed to load tours.", variant: "destructive" });
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // Server-provided page 1 is already in state — skip the mount fetch and
  // only hit the API for pagination/sort interactions.
  const skipFirstFetch = useRef(Boolean(initialTours));
  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    fetchTours(currentPage, sort, currentPage === 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sort]);

  const getYouTubeVideoId = (url: string) => {
    if (!url) return "";
    const s = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/); if (s?.[1]) return s[1];
    const w = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/); if (w?.[1]) return w[1];
    const e = url.match(/\/embed\/([a-zA-Z0-9_-]{6,})/); if (e?.[1]) return e[1];
    return "";
  };

  const openVideoReviews = async (tourSlug: string) => {
    try {
      const res = await tourAPI.getBySlug(tourSlug, locale);
      if (res.success && res.data) {
        const vids = (Array.isArray(res.data.reviews) ? res.data.reviews : [])
          .map((r: any) => getYouTubeVideoId(typeof r?.url === "string" ? r.url : ""))
          .filter(Boolean);
        if (vids.length > 0) { setVideoIds(vids); setOpen(true); }
        else toast({ title: "No video", description: "No video reviews available.", variant: "info" as any });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load video.", variant: "destructive" });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayDiscount = maxDiscount > 0 ? maxDiscount : 30;

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />

      <PageHeader
        title={t("header.title")}
        subTitle={t("header.subtitle")}
        breadcrumbs={[{ label: t("header.title") }]}
        bgImage="/egypt-nile-cruise-ancient-wonders-tour.webp"
      />

      {/* ── Deal Banner ──────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "120px 0" }}>
        {/* Background image with dark overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(29,35,31)" }} />
        </div>

        <Container style={{ position: "relative", zIndex: 1 }}>
          <Row className="align-items-center gutter-y-40">
            {/* Left: copy */}
            <Col lg={7}>
              <div style={{ borderLeft: `4px solid ${GOLD}`, paddingLeft: 28 }}>
                <span style={{
                  display: "inline-block",
                  background: "rgba(183,156,92,0.15)",
                  color: GOLD,
                  border: `1px solid rgba(183,156,92,0.4)`,
                  borderRadius: 50,
                  padding: "6px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}>
                  {t("banner.tagline")}
                </span>

                <h2 style={{
                  color: "#fff",
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-1.5px",
                  marginBottom: 20,
                }}>
                  {t("banner.upTo")}{" "}
                  <span style={{ color: GOLD }}>{displayDiscount}% {t("banner.off")}</span>
                  <br />
                  {t("banner.heading")}
                </h2>

                <p style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 17,
                  lineHeight: 1.7,
                  maxWidth: 520,
                  marginBottom: 36,
                }}>
                  {t("banner.description")}
                </p>

                {/* Trust badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {[
                    { Icon: BadgePercent, label: t("banner.trust.discountLabel", { percent: displayDiscount }), sub: t("banner.trust.discountSub") },
                    { Icon: ShieldCheck,  label: t("banner.trust.guidesLabel"),   sub: t("banner.trust.guidesSub") },
                    { Icon: Clock3,       label: t("banner.trust.timeLabel"),     sub: t("banner.trust.timeSub") },
                  ].map(({ Icon, label, sub }) => (
                    <div key={label} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      padding: "10px 16px",
                    }}>
                      <Icon size={18} color={GOLD} strokeWidth={1.8} />
                      <div>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            {/* Right: circular stat */}
            <Col lg={5} className="text-center text-lg-end">
              <div style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: `3px solid rgba(183,156,92,0.35)`,
                background: "rgba(183,156,92,0.08)",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  inset: -12,
                  borderRadius: "50%",
                  border: `1px solid rgba(183,156,92,0.15)`,
                }} />
                <span style={{ color: GOLD, fontSize: 62, fontWeight: 900, lineHeight: 1, letterSpacing: "-3px" }}>
                  {displayDiscount}<span style={{ fontSize: 32 }}>%</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
                  {t("banner.badge")}
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Tours Grid ───────────────────────────────────────────────── */}
      <section style={{ padding: "72px 0 40px" }}>
        <Container>
          {/* Controls bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 36,
            padding: "16px 20px",
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #f0f0f0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36,
                background: "#fff8ee",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Tag size={16} color={GOLD} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: 15, color: DARK }}>
                  {loading
                    ? t("controls.loading")
                    : t("controls.found_other", { count: total })}
                </span>
                {!loading && (
                  <span style={{ color: "#999", fontSize: 13, marginLeft: 6 }}>{t("controls.available")}</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#777" }}>{t("controls.sort")}</span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: "9px 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  color: DARK,
                  cursor: "pointer",
                  minWidth: 190,
                }}
              >
                <option value="-createdAt">{t("controls.sortNewest")}</option>
                <option value="priceStartingFrom">{t("controls.sortPriceAsc")}</option>
                <option value="-priceStartingFrom">{t("controls.sortPriceDesc")}</option>
                <option value="heading">{t("controls.sortNameAz")}</option>
              </select>
            </div>
          </div>

          {pageLoading && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
              <Loader2 size={40} className="animate-spin" style={{ color: GOLD }} />
            </div>
          ) : tours.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #f0f0f0",
            }}>
              <div style={{
                width: 72, height: 72,
                borderRadius: "50%",
                background: "#fff8ee",
                border: `2px solid rgba(183,156,92,0.25)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Tag size={30} color={GOLD} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 24, color: DARK, marginBottom: 10 }}>
                {t("empty.title")}
              </h3>
              <p style={{ color: "#888", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>
                {t("empty.text")}
              </p>
              <Link
                href={`/${locale}/tours`}
                className="gotur-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 10 }}
              >
                {t("empty.button")}
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <Row className="gutter-y-30 gutter-x-30">
                {tours.map((item) => (
                  <Col lg={4} md={6} key={item.id}>
                    <TourCard
                      item={item}
                      toggleWishlist={toggleWishlist}
                      isInWishlist={isInWishlist}
                      openVideoReviews={openVideoReviews}
                    />
                  </Col>
                ))}
              </Row>
              <div style={{ marginTop: 40, paddingBottom: 20 }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </Container>
      </section>

      {/* ── Promo Section ────────────────────────────────────────────── */}
      <ListingPromo
        title={{ en: t("promoTitle"), de: t("promoTitle"), it: t("promoTitle"), es: t("promoTitle") }}
        description={{ en: t("promoDescription"), de: t("promoDescription"), it: t("promoDescription"), es: t("promoDescription") }}
        image1={{ url: "/images/resources/offer-1-1.jpg", alt: { en: t("header.title") } }}
        image2={{ url: "/images/resources/offer-1-2.jpg", alt: { en: t("header.title") } }}
        images={[
          { url: "/images/resources/offer-1-1.jpg", alt: { en: t("header.title") } },
          { url: "/images/resources/offer-1-2.jpg", alt: { en: t("header.title") } },
        ]}
        subtitle={{ en: t("promoSubtitle"), de: t("promoSubtitle"), it: t("promoSubtitle"), es: t("promoSubtitle") }}
        button={{
          label: { en: t("promoButton"), de: t("promoButton"), it: t("promoButton"), es: t("promoButton") },
          href: `/${locale}/${getLocalizedStaticSlug("contact", locale)}`,
        }}
        locale={locale}
      />

      {/* ── FAQ — same design as /faq page ───────────────────────────── */}
      <ListingFaqs
        faqs={SPECIAL_OFFERS_FAQS}
        title={t("faqTitle")}
        locale={locale}
      />

      <VideoModal isOpen={isOpen} setOpen={setOpen} ids={videoIds} />
      <FooterOne />
    </Layout>
  );
}
