'use client';
import React, { useState, useEffect } from "react";
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
import { useWishlist } from "@/contexts/WishlistContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "@/hooks/use-toast";
import bannerBg from "@/assets/images/resources/offer-1-1.jpg";

const GOLD = "#b79c5c";
const DARK = "#1d231f";

const FAQS = [
  {
    question: { en: "What are special offer tours?", de: "Was sind Sonderangebots-Touren?", it: "Cosa sono i tour in offerta speciale?", es: "¿Qué son los tours en oferta especial?" },
    answer: {
      en: "Special offer tours are handpicked experiences with exclusive pricing or added value. They include seasonal discounts, early-bird deals, and bonus inclusions — all curated by our Egypt experts.",
      de: "Sonderangebots-Touren sind handverlesene Erlebnisse mit exklusiven Preisen oder Mehrwert. Sie umfassen Saisonrabatte, Frühbucher-Angebote und Bonus-Leistungen — alle kuratiert von unseren Ägypten-Experten.",
      it: "I tour in offerta speciale sono esperienze selezionate con prezzi esclusivi o valore aggiunto. Includono sconti stagionali, offerte early bird e inclusioni bonus — tutti curati dai nostri esperti d'Egitto.",
      es: "Los tours en oferta especial son experiencias seleccionadas con precios exclusivos o valor añadido. Incluyen descuentos de temporada, ofertas anticipadas e inclusiones adicionales — todos curados por nuestros expertos en Egipto.",
    },
  },
  {
    question: { en: "How long do special offers last?", de: "Wie lange gelten Sonderangebote?", it: "Quanto durano le offerte speciali?", es: "¿Cuánto duran las ofertas especiales?" },
    answer: {
      en: "Availability varies by tour and season. We recommend booking early — special offer tours are limited and sell out fast. Once gone, the discounted price is no longer available.",
      de: "Die Verfügbarkeit variiert je nach Tour und Saison. Wir empfehlen frühzeitiges Buchen — Sonderangebots-Touren sind begrenzt und schnell ausgebucht. Danach gilt der Rabattpreis nicht mehr.",
      it: "La disponibilità varia per tour e stagione. Ti consigliamo di prenotare in anticipo — i tour in offerta speciale sono limitati e si esauriscono rapidamente. Una volta terminati, il prezzo scontato non è più disponibile.",
      es: "La disponibilidad varía según el tour y la temporada. Recomendamos reservar con antelación — los tours en oferta especial son limitados y se agotan rápidamente. Una vez agotados, el precio con descuento ya no está disponible.",
    },
  },
  {
    question: { en: "Can I customize a special offer tour?", de: "Kann ich eine Sonderangebots-Tour anpassen?", it: "Posso personalizzare un tour in offerta speciale?", es: "¿Puedo personalizar un tour en oferta especial?" },
    answer: {
      en: "Yes. Many special offer tours can be tailored to your schedule or group. Use our Tailor-Made form for a personalized quote — we'll do our best to honour the special offer pricing.",
      de: "Ja. Viele Sonderangebots-Touren können an Ihren Zeitplan oder Ihre Gruppe angepasst werden. Nutzen Sie unser maßgeschneidertes Formular für ein persönliches Angebot — wir bemühen uns, den Sonderangebotspreis zu berücksichtigen.",
      it: "Sì. Molti tour in offerta speciale possono essere personalizzati in base al tuo programma o gruppo. Usa il nostro modulo su misura per un preventivo personalizzato — faremo del nostro meglio per rispettare il prezzo dell'offerta speciale.",
      es: "Sí. Muchos tours en oferta especial pueden adaptarse a tu horario o grupo. Usa nuestro formulario a medida para obtener un presupuesto personalizado — haremos lo posible por respetar el precio de la oferta especial.",
    },
  },
  {
    question: { en: "Is a deposit required to reserve a special offer?", de: "Wird eine Anzahlung zur Reservierung benötigt?", it: "È richiesto un deposito per prenotare un'offerta speciale?", es: "¿Se requiere un depósito para reservar una oferta especial?" },
    answer: {
      en: "A small deposit secures your spot at the special offer price. Full payment details are provided during booking. Cancellation policies vary by tour — check the tour page for specifics.",
      de: "Eine kleine Anzahlung sichert Ihren Platz zum Sonderangebotspreis. Vollständige Zahlungsdetails werden beim Buchen mitgeteilt. Stornierungsrichtlinien variieren je nach Tour — prüfen Sie die Tourseite für Details.",
      it: "Un piccolo deposito garantisce il tuo posto al prezzo dell'offerta speciale. I dettagli di pagamento completi vengono forniti durante la prenotazione. Le politiche di cancellazione variano per tour — controlla la pagina del tour per i dettagli.",
      es: "Un pequeño depósito asegura tu plaza al precio de la oferta especial. Los detalles completos de pago se proporcionan durante la reserva. Las políticas de cancelación varían según el tour — consulta la página del tour para más detalles.",
    },
  },
];

export default function SpecialOffersView({ locale }: { locale: string }) {
  const { t, i18n } = useTranslation("specialOffers");
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  const [tours, setTours] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("-createdAt");
  const [isOpen, setOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const toursPerPage = 9;

  const maxDiscount = tours.reduce((max, t) => {
    const d = Number(t.discount);
    return d > max ? d : max;
  }, 0);

  const mapTour = (tour: any) => {
    const galleryImages = [
      ...(tour.images || []).map((img: any) => img.url),
      ...(tour.gallery || []).map((img: any) => img.url),
    ].filter(Boolean);
    const uniqueImages = Array.from(new Set(galleryImages)) as string[];
    return {
      id: tour._id,
      slug: getLocalizedValue(tour.slug, locale),
      image: uniqueImages[0] || "/assets/images/resources/tour-1-1.jpg",
      imageAlt: getLocalizedValue(tour.images?.[0]?.alt || tour.gallery?.[0]?.alt, locale),
      allImages: uniqueImages.length > 0 ? uniqueImages : ["/assets/images/resources/tour-1-1.jpg"],
      title: getLocalizedValue(tour.heading || tour.name, locale),
      link: `/${locale}/${getLocalizedValue(tour.slug, locale)}`,
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
  };

  const fetchTours = async (page: number, sortVal: string, initial = false) => {
    if (initial) setLoading(true); else setPageLoading(true);
    try {
      const res = await tourAPI.getAll({ isSpecialOffer: true, page, limit: toursPerPage, sort: sortVal });
      if (res.success && res.data) {
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || res.count || 0);
        setTours(res.data.map(mapTour));
      }
    } catch {
      toast({ title: "Error", description: "Failed to load tours.", variant: "destructive" });
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
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
      />

      {/* ── Deal Banner ──────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "72px 0" }}>
        {/* Background image with dark overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src={bannerBg}
            alt={t("header.title")}
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(29,35,31,0.88)" }} />
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
        image1={{ url: "/assets/images/resources/offer-1-1.jpg", alt: { en: t("header.title") } }}
        image2={{ url: "/assets/images/resources/offer-1-2.jpg", alt: { en: t("header.title") } }}
        images={[
          { url: "/assets/images/resources/offer-1-1.jpg", alt: { en: t("header.title") } },
          { url: "/assets/images/resources/offer-1-2.jpg", alt: { en: t("header.title") } },
        ]}
        subtitle={{ en: t("promoSubtitle"), de: t("promoSubtitle"), it: t("promoSubtitle"), es: t("promoSubtitle") }}
        button={{
          label: { en: t("promoButton"), de: t("promoButton"), it: t("promoButton"), es: t("promoButton") },
          href: `/${locale}/contact`,
        }}
        locale={locale}
      />

      {/* ── FAQ — same design as /faq page ───────────────────────────── */}
      <ListingFaqs
        faqs={FAQS}
        title={t("faqTitle")}
        locale={locale}
      />

      <VideoModal isOpen={isOpen} setOpen={setOpen} ids={videoIds} />
      <FooterOne />
    </Layout>
  );
}
