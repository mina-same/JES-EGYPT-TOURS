"use client";
import Image, { StaticImageData } from "next/image";
import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import Link from "next/link";
import Pagination from "@/components/common/Pagination/Pagination";
import { tourAPI } from "@/lib/api/tour";
import { Loader2 } from "lucide-react";

interface FeatureOneItem {
  id: string;
  image: StaticImageData | string;
  title: string;
  link: string;
  price: string | number;
  rating: number;
  reviews: number;
  videoId: string;
  discount: string;
  meta: Metadata[];
}
interface Metadata {
  id: number;
  title: string;
  icon: string;
}

const TourListing: React.FC = () => {
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toursPerPage = 10;

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const response = await tourAPI.getAll({
          page: currentPage,
          limit: toursPerPage
        });
        
        if (response.success && response.data) {
          setTotalPages(response.totalPages || 1);
          const mappedTours = response.data.map((tour: any) => {
            // Collect all available images for the gallery
            const galleryImages = [
              ...(tour.images || []).map((img: any) => img.url),
              ...(tour.gallery || []).map((img: any) => img.url)
            ].filter(Boolean);

            // Ensure unique URLs
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
        } else {
          setError("Failed to load tours");
        }
      } catch (err) {
        console.error("Error fetching tours:", err);
        setError("An error occurred while loading tours");
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <section className='tour-listing-page section-space'>
        <Container>
          <Row className='gutter-y-30 gutter-x-30'>
            {tours.map((item: any) => (
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
            ))}

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
    </>
  );
};

export default TourListing;
