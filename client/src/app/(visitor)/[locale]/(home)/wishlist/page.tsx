"use client";

import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { useWishlist } from "@/contexts/WishlistContext";
import { tourAPI } from "@/lib/api/tour";
import { Loader2, Heart } from "lucide-react";
import { Col, Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import TourCard from "@/components/common/TourCard/TourCard";
import { shortenLabel } from "@/lib/displayName";
import FeatureTwo from "@/components/sections/FeatureTwo/FeatureTwo";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";

import { use } from "react";

type WishlistTour = {
  _id: string;
  slug: string;
  heading?: string;
  name?: string;
  priceStartingFrom?: any;
  images?: Array<{ url: string }>;
  gallery?: Array<{ url: string }>;
  reviews?: Array<any>;
  duration?: string;
  tourLocation?: string;
  tourType?: string;
  cardDescription?: any;
  Description?: { text?: any };
  category?: string | { _id?: string } | any;
  subcategory?:
    | string
    | { _id?: string; category?: string | { _id?: string } }
    | any;
};

export default function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { t, i18n } = useTranslation('wishlist');
  
  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  const { wishlist, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState<WishlistTour[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<any[]>([]);

  const ids = useMemo(() => wishlist, [wishlist]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (ids.length === 0) {
        setTours([]);
        setRecommended([]);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await tourAPI.getById(id);
            return res.success ? res.data : null;
          })
        );
        if (!active) return;
        const filtered = results.filter(Boolean) as WishlistTour[];
        setTours(filtered);

        // Determine most common category among wishlist tours
        const categoryCounts: Record<string, number> = {};
        const pickCategoryId = (t: any): string | null => {
          if (!t) return null;
          if (typeof t.category === "string") return t.category;
          if (t?.category?._id) return t.category._id;
          if (typeof t.subcategory === "string") return t.subcategory;
          if (t?.subcategory?.category?._id) return t.subcategory.category._id;
          if (t?.subcategory?._id) return t.subcategory._id; // fallback: subcategory id
          return null;
        };
        filtered.forEach((t) => {
          const cid = pickCategoryId(t);
          if (cid) categoryCounts[cid] = (categoryCounts[cid] || 0) + 1;
        });
        const bestCategory = Object.entries(categoryCounts).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0];

        let rec: any[] = [];
        if (bestCategory) {
          const recRes = await tourAPI.getAll({
            category: bestCategory,
            limit: 12,
          });
          if (recRes.success && recRes.data) {
            rec = recRes.data;
          }
        } else {
          const latest = await tourAPI.getAll({ limit: 12, isActive: true, sort: '-createdAt' });
          if (latest?.success && latest.data) {
            rec = latest.data;
          }
        }
        // Filter out already wishlisted tours
        const wishIds = new Set(filtered.map((t) => t._id));
        const mapped = (rec || [])
          .filter((t: any) => !wishIds.has(t._id))
          // Only recommend tours that have a real slug for the current locale,
          // so the recommendation links never fall back to an English URL.
          .filter((t: any) => getStrictLocalizedSlug(t.slug, locale as SupportedLocale))
          .map((t: any) => {
            const slug = getStrictLocalizedSlug(t.slug, locale as SupportedLocale) || "";
            const galleryImages = [
              ...(t.images || []).map((img: any) => img.url),
              ...(t.gallery || []).map((img: any) => img.url),
            ].filter(Boolean);
            const unique = Array.from(new Set(galleryImages));
            return {
              id: t._id,
              image: unique[0] || "/assets/images/resources/tour-1-1.jpg",
              title: t.heading || t.name || "Tour",
              link: `/${locale}/${slug}`,
              price: t.priceStartingFrom || { USD: 0 },
              rating: 5,
              reviews: t.reviews?.length || 0,
              videoId: "",
              discount: "",
              meta: [
                {
                  id: 1,
                  title: `${t.duration || "3 Days"}`,
                  icon: "icon-clock",
                },
                {
                  id: 3,
                  title: t.tourLocation || "Location",
                  icon: "icon-location",
                },
              ],
            };
          });
        if (active) setRecommended(mapped);
      } catch {
        if (!active) return;
        setError(t('error'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [ids]);

  const getPrimaryImage = (tour: WishlistTour) => {
    const galleryImages = [
      ...(tour.images || []).map((img) => img.url),
      ...(tour.gallery || []).map((img) => img.url),
    ].filter(Boolean);
    const unique = Array.from(new Set(galleryImages));
    return unique[0] || "/assets/images/resources/tour-1-1.jpg";
  };

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title={t('pageTitle')} subTitle={t('pageSubTitle')} />

      <section className="section-space">
        <Container>
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px] text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[300px] text-red-500 font-semibold">
              {error}
            </div>
          ) : tours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm gap-4 my-8">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <Heart size={40} className="text-red-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 m-0">{t('emptyTitle')}</h3>
              <p className="text-lg text-gray-500 max-w-md text-center m-0 mb-4">{t('emptyText')}</p>
              <Link href={`/${locale}/tours`} className="gotur-btn gotur-btn--base">
                {t('browseTours')} <i className="icon-right ml-2"></i>
              </Link>
            </div>
          ) : (
            <Row className="gutter-y-30 gutter-x-30">
              {tours.map((tour) => {
                const image = getPrimaryImage(tour);
                const title = tour.heading || tour.name || "Untitled Tour";
                const price = tour.priceStartingFrom || { USD: 0 };
                const reviews = tour.reviews?.length || 0;
                // The API localizes documents for this page, so name/shortName
                // usually arrive as plain strings already.
                const sub = tour.subcategory as any;
                const subcategoryName = sub
                  ? shortenLabel(
                      typeof sub.shortName === "string"
                        ? sub.shortName
                        : sub.shortName?.[locale] || sub.shortName?.en ||
                          (typeof sub.name === "string" ? sub.name : sub.name?.[locale] || sub.name?.en || "")
                    )
                  : "";
                // Keep the wishlisted item visible, but only link to its detail
                // page when a real slug exists for the current locale.
                const tourSlug = getStrictLocalizedSlug(tour.slug, locale as SupportedLocale) || "";
                return (
                  <Col lg={4} md={6} key={tour._id}>
                    <TourCard
                      item={{
                        id: tour._id,
                        image,
                        title,
                        link: tourSlug ? `/${locale}/${tourSlug}` : "",
                        price,
                        rating: 5,
                        reviews,
                        description: tour.cardDescription || tour.Description?.text || "",
                        meta: [
                          { id: 1, title: tour.tourLocation || t('location'), icon: "icon-location" },
                          { id: 2, title: tour.duration || t('flexible'), icon: "icon-clock" },
                          // The API localizes documents for this page, so the name
                          // normally arrives as a plain string already.
                          ...(subcategoryName ? [{ id: 4, title: subcategoryName, icon: "icon-flag" }] : []),
                        ],
                      }}
                      onRemove={toggleWishlist}
                      removeLabel={t('remove', 'Remove from wishlist')}
                      showBadges={false}
                      linkMeta={false}
                      labels={{
                        startFrom: t('startFrom'),
                        cta: t('viewTour'),
                        review: t('review'),
                      }}
                    />
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>
      </section>

      {recommended.length > 0 && (
        <div className="pb-10">
          <FeatureTwo
            extraClass="section-space-top"
            itemsPerRow={4}
            homeThree={false}
            showShape={false}
            tours={recommended}
            title={t('more')}
            titleSpan={t('tours')}
            subtitle={t('youMayAlsoLike')}
            uniqueId="wishlist-recommendations"
          />
        </div>
      )}

      <FooterOne />
    </Layout>
  );
}
