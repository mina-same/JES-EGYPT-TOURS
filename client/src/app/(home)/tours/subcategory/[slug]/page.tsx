'use client';
import React, { useState, useEffect, use, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import Pagination from "@/components/common/Pagination/Pagination";
import { tourAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { ChevronRight, Loader2 } from "lucide-react";
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

export default function TourSubCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [loading, setLoading] = useState(true);
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

  // Filters state (same as category page)
  const [draftFilters, setDraftFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    tourType: "",
    tourStyle: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    tourType: "",
    tourStyle: "",
  });
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
    const f = {
      ...appliedFilters,
      ...overrides,
    };

    const sp = new URLSearchParams();
    if (p && p !== 1) sp.set("page", String(p));
    if (s && s !== "-createdAt") sp.set("sort", s);
    if (f.search) sp.set("search", f.search);
    if (f.minPrice) sp.set("minPrice", f.minPrice);
    if (f.maxPrice) sp.set("maxPrice", f.maxPrice);
    if (f.tourType) sp.set("tourType", f.tourType);
    if (f.tourStyle) sp.set("tourStyle", f.tourStyle);

    const qs = sp.toString();
    return `/tours/subcategory/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.replace(buildUrl({ page }), { scroll: false } as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    router.replace(buildUrl({
      page: 1,
      ...draftFilters,
    }), { scroll: false } as any);
  };

  const handleResetFilters = () => {
    const empty = {
      search: "",
      minPrice: "",
      maxPrice: "",
      tourType: "",
      tourStyle: "",
    };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setSort("-createdAt");
    setCurrentPage(1);
    router.replace(`/tours/subcategory/${encodeURIComponent(slug)}`, { scroll: false } as any);
  };

  const handleSortChange = (nextSort: string) => {
    setSort(nextSort);
    setCurrentPage(1);
    router.replace(buildUrl({ page: 1, sort: nextSort }), { scroll: false } as any);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Subcategory
        const subResponse = await tourSubcategoryAPI.getBySlug(slug);
        if (!subResponse.success || !subResponse.data) {
          setError("Subcategory not found");
          setLoading(false);
          return;
        }
        setSubcategory(subResponse.data);

        const categoryId =
          typeof subResponse.data?.category === "string"
            ? subResponse.data.category
            : subResponse.data?.category?._id;

        if (categoryId) {
          const siblingsRes = await tourSubcategoryAPI.getByCategory(categoryId);
          if (siblingsRes?.success && Array.isArray(siblingsRes.data)) {
            setSiblingSubcategories(siblingsRes.data);
          } else {
            setSiblingSubcategories([]);
          }
        } else {
          setSiblingSubcategories([]);
        }

        // 2. Fetch Tours by Subcategory ID with Pagination
        const toursResponse = await tourAPI.getAll({ 
          subcategory: subResponse.data._id,
          page: currentPage,
          limit: toursPerPage
        });
        
        if (toursResponse.success && toursResponse.data) {
          setTotalPages(toursResponse.totalPages || 1);
          // Map tours
           const mappedTours = toursResponse.data.map((tour: any) => {
            const galleryImages = [
              ...(tour.images || []).map((img: any) => img.url),
              ...(tour.gallery || []).map((img: any) => img.url)
            ].filter(Boolean);
            const uniqueImages = Array.from(new Set(galleryImages));

            return {
              id: tour._id,
              slug: tour.slug,
              image: uniqueImages[0] || "/assets/images/resources/tour-1-1.jpg", 
              allImages: uniqueImages.length > 0 ? uniqueImages : ["/assets/images/resources/tour-1-1.jpg"],
              title: tour.heading || tour.name,
              link: `/tours/${tour.slug}`,
              price: tour.priceStartingFrom || 0,
              rating: 5,
              reviews: tour.reviews?.length || 0,
              videoId: tour.videoLink || "", 
              discount: "", 
              meta: [
                { id: 1, title: `${tour.duration || '3 Days'}`, icon: "icon-clock" },
                { id: 2, title: `${tour.minAge || '12'} +`, icon: "icon-user" },
                { id: 3, title: tour.tourLocation || "Location", icon: "icon-location" },
              ]
            };
          });
          setTours(mappedTours);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, currentPage]);

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
      const res = await tourApiForFetch.getBySlug(tourSlug);
      if (res.success && res.data) {
        const vids = (Array.isArray(res.data.reviews) ? res.data.reviews : [])
          .map((r: any) => getYouTubeVideoId(typeof r?.url === "string" ? r.url : ""))
          .filter(Boolean);
        if (vids.length > 0) {
          setVideoIds(vids);
          setOpen(true);
        } else {
          toast({
            title: "No video reviews",
            description: "This tour doesn’t have any reflective & honest review videos yet.",
            variant: "info",
          });
        }
      }
    } catch {
      toast({
        title: "Failed to load videos",
        description: "Network or server error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
     <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title="Loading..." />
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <FooterOne />
    </Layout>
    );
  }

  if (error || !subcategory) {
    return (
     <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title="Not Found" />
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        <h3>{error || "Subcategory not found"}</h3>
      </div>
      <FooterOne />
    </Layout>
    );
  }

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader
        title={subcategory.name}
        breadcrumbs={[
          { label: 'Destination', href: '/tours' },
          {
            label: subcategory.category?.name || 'Category',
            href: subcategory.category?.slug ? `/tours/category/${subcategory.category.slug}` : undefined,
          },
          { label: subcategory.name }
        ]}
      />

      {(() => {
        const sh = subcategory?.sectionHeader;
        const images = Array.isArray(sh?.images) && sh.images.length
          ? sh.images
          : (sh?.image?.url ? [sh.image] : []);
        const hasData =
          sh &&
          sh.isEnabled !== false &&
          (!!sh?.title || !!sh?.description || images.length > 0 || (!!sh?.button?.label && !!sh?.button?.href));

        if (!hasData) return null;

        return (
          <EnhancedSectionHeader
            title={sh?.title}
            descriptionHtml={sh?.description ? String(sh.description) : ''}
            button={sh?.button}
            images={images}
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
                      <Link href={`/tours/subcategory/${sub.slug}`} className="subcategory-card-link">
                        <div className={`subcategory-card${isActive ? " is-active" : ""}`}>
                          <div className="subcategory-card__image-box">
                            <Image
                              src={sub.image?.url || "/assets/images/resources/tour-1-1.jpg"}
                              alt={sub.name}
                              fill
                              className="subcategory-card__image"
                            />
                            <div className="subcategory-card__overlay" />
                          </div>
                          <div className="subcategory-card__content">
                            <h3 className="subcategory-card__title">{sub.name}</h3>
                            <span className="subcategory-card__icon">
                              <ChevronRight className="w-4 h-4" />
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
          <Row className='gutter-y-30 gutter-x-30'>
            {tours.length > 0 ? (
                tours.map((item: any) => (
                <Col lg={4} md={6} key={item.id}>
                    <PhotoSwipeGallery>
                    <div className='item'>
                        <div
                        className='listing-card-four wow fadeInUp'
                        data-wow-duration='1500ms'
                        >
                        <div className='listing-card-four__image'>
                            <div className="relative w-full" style={{ height: '257px' }}>
                            <Image 
                                src={item.image} 
                                alt={item.title} 
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                            />
                            </div>
                            <div className='listing-card-four__btn-group'>
                            {item.discount && (
                                <div className='listing-card-four__discount'>
                                -{item.discount}% off
                                </div>
                            )}
                            <div className='listing-card-four__featured'>
                                Featured
                            </div>
                            </div>
                            <div className='listing-card-four__btns'>
                            <Link
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(item.id);
                              }}
                              aria-label={isInWishlist(item.id) ? "Remove from wishlist" : "Add to wishlist"}
                              className={isInWishlist(item.id) ? 'is-active' : undefined}
                            >
                              <i className={isInWishlist(item.id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                            </Link>
                            <div className='listing-card-four__btns__hover'>
                                {/* Primary Image Item (Visible Toggle) */}
                                <Item
                                original={item.allImages[0]}
                                thumbnail={item.allImages[0]}
                                width='1200'
                                height='800'
                                >
                                {({ ref, open }) => (
                                    <Link
                                    href='#'
                                    className='listing-card-four__popup card__popup'
                                    ref={ref as any}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        open(e);
                                    }}
                                    >
                                    <span className='icon-image'></span>
                                    </Link>
                                )}
                                </Item>

                                {/* Hidden Image Items for the Swipe Gallery */}
                                {item.allImages.slice(1).map((imgUrl: string, idx: number) => (
                                <Item
                                    key={idx}
                                    original={imgUrl}
                                    thumbnail={imgUrl}
                                    width='1200'
                                    height='800'
                                >
                                    {({ ref }) => (
                                    <div ref={ref as any} style={{ display: 'none' }} />
                                    )}
                                </Item>
                                ))}

                                <Link
                                className='video-popup'
                                href='#'
                                onClick={(e) => {
                                    e.preventDefault();
                                    openVideoReviews(item.slug);
                                }}
                                >
                                <span className='icon-video'></span>
                                </Link>
                            </div>
                            </div>
                            <ul className='listing-card-four__meta list-unstyled'>
                            {item.meta.map((meta: any) => {
                              const isLocation = meta.icon === "icon-location";
                              const fullText = String(meta.title || "");
                              const firstWord = isLocation
                                ? (fullText.split(/[, ]+/).filter(Boolean)[0] || fullText)
                                : fullText;
                              return (
                                <li key={meta.id}>
                                  <Link href={item.link} title={isLocation ? fullText : undefined}>
                                    <span className='listing-card-four__meta__icon'>
                                      <i className={meta.icon}></i>
                                    </span>
                                    <span className={isLocation ? 'meta-text' : undefined}>{firstWord}</span>
                                  </Link>
                                </li>
                              );
                            })}
                            </ul>
                        </div>
                        <div className='listing-card-four__content'>
                            <div className='listing-card-four__rating'>
                            <span>({item.reviews} Review)</span>
                            {[...Array(item.rating)].map((_, i) => (
                                <i key={i} className='icon-star'></i>
                            ))}
                            </div>
                            <h3 className='listing-card-four__title'>
                            <Link href={item.link}>{item.title}</Link>
                            </h3>

                            <div className='listing-card-four__content__btn'>
                            <div className='listing-card-four__price'>
                                <span className='listing-card-four__price__sub'>
                                Per Day
                                </span>
                                <span className='listing-card-four__price__number'>
                                ${item.price}
                                </span>
                            </div>
                            <Link
                                href={item.link}
                                className='listing-card-four__btn gotur-btn'
                            >
                                Book Now{" "}
                                <span className='icon'>
                                <i className='icon-right'></i>{" "}
                                </span>
                            </Link>
                            </div>
                        </div>
                        </div>
                    </div>
                    </PhotoSwipeGallery>
                </Col>
                ))
            ) : (
                <div className="flex items-center justify-center min-h-[200px] w-full">
                    <p className="text-xl text-gray-500">No tours found in this subcategory.</p>
                </div>
            )}

            <Col xs={12}>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </Col>
          </Row>
        </Container>
      </section>
      <style jsx global>{`
        .subcategory-slider-wrapper {
          overflow-x: auto;
          padding-bottom: 12px;
          margin: 0 -15px;
        }
        .subcategory-slider-wrapper::-webkit-scrollbar {
          height: 6px;
        }
        .subcategory-slider-wrapper::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 3px;
        }
        .subcategory-slider-wrapper::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }
        .subcategory-slider-wrapper::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
        .subcategory-slider {
          display: flex;
          gap: 16px;
          padding: 0 15px;
        }
        .subcategory-slide {
          flex: 0 0 auto;
          width: 180px;
        }
        .subcategory-card {
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          height: 140px;
          display: flex;
          flex-direction: column;
        }
        .subcategory-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .subcategory-card__image-box {
          position: relative;
          flex: 1;
          min-height: 0;
        }
        .subcategory-card__image {
          object-fit: cover;
        }
        .subcategory-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
        }
        .subcategory-card__content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
        }
        .subcategory-card__title {
          font-size: 14px;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .subcategory-card__icon {
          width: 24px;
          height: 24px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease;
        }
        .subcategory-card:hover .subcategory-card__icon {
          background: var(--gotur-primary, #b79c5c);
          color: white;
        }
        .subcategory-card-link {
          text-decoration: none;
          color: inherit;
        }

        .subcategory-card.is-active {
          box-shadow: 0 0 0 2px var(--gotur-primary, #b79c5c), 0 6px 16px rgba(0,0,0,0.12);
        }
      `}</style>
      <VideoModal isOpen={isOpen} setOpen={setOpen} ids={videoIds} />

      <AboutOne extraclass='about-one--one' />
      <FooterOne />
    </Layout>
  );
}
