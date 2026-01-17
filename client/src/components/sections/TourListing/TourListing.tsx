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
  const [tours, setTours] = useState<FeatureOneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const response = await tourAPI.getAll();
        
        if (response.success && response.data) {
          const mappedTours = response.data.map((tour: any) => ({
            id: tour._id,
            image: tour.images?.[0]?.url || "/assets/images/resources/tour-1-1.jpg", // Fallback image
            title: tour.heading || tour.name,
            link: `/tours/${tour._id}`,
            price: tour.priceStartingFrom || 0,
            rating: 5, // Default rating as backend might not have it yet
            reviews: tour.reviews?.length || 0,
            videoId: "", // Add if available in backend
            discount: "", // Add if available
            meta: [
              { id: 1, title: `${tour.duration || '3 Days'}`, icon: "icon-clock" },
              { id: 2, title: `${tour.minAge || '12'} +`, icon: "icon-user" },
              { id: 3, title: tour.tourLocation || "Location", icon: "icon-location" },
            ]
          }));
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
  }, []);

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
          <PhotoSwipeGallery>
            <Row className='gutter-y-30 gutter-x-30'>
              {tours.map((item: FeatureOneItem) => (
                <Col lg={4} md={6} key={item.id}>
                  <div className='item' key={item.id}>
                    <div
                      className='listing-card-four wow fadeInUp'
                      data-wow-duration='1500ms'
                    >
                      <div className='listing-card-four__image'>
                        <div className="relative w-full" style={{ height: '257px' }}>
                          <Image 
                            src={typeof item.image === 'string' ? item.image : item.image} 
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
                            <Item
                              original={typeof item.image === 'string' ? item.image : item.image.src}
                              thumbnail={typeof item.image === 'string' ? item.image : item.image.src}
                              width='370'
                              height='257'
                            >
                              {({ ref, open }) => (
                                <Link
                                  href='#'
                                  className='listing-card-four__popup card__popup'
                                  ref={ref}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    open(e);
                                  }}
                                >
                                  <span className='icon-image'></span>
                                </Link>
                              )}
                            </Item>

                            <Link
                              className='video-popup'
                              href='https://www.youtube.com/watch?v=0MuL8fd3pb8'
                              onClick={(e) => {
                                e.preventDefault();
                                setOpen(true);
                                setVideoId(item.videoId);
                              }}
                            >
                              <span className='icon-video'></span>
                            </Link>
                          </div>
                        </div>
                        <ul className='listing-card-four__meta list-unstyled'>
                          {item.meta.map((meta: Metadata) => (
                            <li key={meta.id}>
                              <Link href='tour-listing-details-2'>
                                {" "}
                                <span className='listing-card-four__meta__icon'>
                                  {" "}
                                  <i className={meta.icon}></i>{" "}
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
                </Col>
              ))}

              <Col xs={12}>
                <Pagination />
              </Col>
            </Row>
          </PhotoSwipeGallery>
        </Container>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourListing;
