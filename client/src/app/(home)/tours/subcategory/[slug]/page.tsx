'use client';
import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import Pagination from "@/components/common/Pagination/Pagination";
import { tourAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import AboutOne from "@/components/sections/AboutOne/AboutOne";

export default function TourSubCategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [loading, setLoading] = useState(true);
  const [subcategory, setSubcategory] = useState<any>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toursPerPage = 10;

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
      <PageHeader title={subcategory.name} subTitle={subcategory.category?.name || "Tour Subcategory"} />
      
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
                            <Link href='#'>
                                <i className='far fa-heart'></i>
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
                                    if (item.videoId) {
                                    setVideoId(item.videoId);
                                    setOpen(true);
                                    } else {
                                    alert("No video preview available for this tour.");
                                    }
                                }}
                                >
                                <span className='icon-video'></span>
                                </Link>
                            </div>
                            </div>
                            <ul className='listing-card-four__meta list-unstyled'>
                            {item.meta.map((meta: any) => (
                                <li key={meta.id}>
                                <Link href={item.link}>
                                    <span className='listing-card-four__meta__icon'>
                                    <i className={meta.icon}></i>
                                    </span>
                                    {meta.title}
                                </Link>
                                </li>
                            ))}
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
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />

      <AboutOne extraclass='about-one--one' />
      <FooterOne />
    </Layout>
  );
}
