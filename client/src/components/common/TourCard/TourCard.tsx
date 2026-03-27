"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";

interface Metadata {
  id: number;
  title: string;
  icon: string;
}

interface TourCardProps {
  item: {
    id: string;
    slug: string;
    image: string;
    imageAlt?: string;
    allImages: string[];
    title: string;
    link: string;
    price: number;
    rating: number;
    reviews: number;
    videoId: string;
    discount?: string;
    meta: Metadata[];
  };
  toggleWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  openVideoReviews: (slug: string) => void;
}

const TourCard: React.FC<TourCardProps> = ({
  item,
  toggleWishlist,
  isInWishlist,
  openVideoReviews,
}) => {
  return (
    <PhotoSwipeGallery>
      <div className="item">
        <div
          className="listing-card-four wow fadeInUp"
          data-wow-duration="1500ms"
        >
          <div className="listing-card-four__image">
            <div className="relative w-full" style={{ height: "257px" }}>
              <Image
                src={item.image}
                alt={item.imageAlt || item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="listing-card-four__btn-group">
              {item.discount && (
                <div className="listing-card-four__discount">
                  -{item.discount}% off
                </div>
              )}
              <div className="listing-card-four__featured">Featured</div>
            </div>
            <div className="listing-card-four__btns">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(item.id);
                }}
                aria-label={
                  isInWishlist(item.id)
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                className={isInWishlist(item.id) ? "is-active" : undefined}
              >
                <i
                  className={
                    isInWishlist(item.id) ? "fas fa-heart" : "far fa-heart"
                  }
                ></i>
              </Link>
              <div className="listing-card-four__btns__hover">
                {/* Primary Image Item (Visible Toggle) */}
                <Item
                  original={item.allImages[0]}
                  thumbnail={item.allImages[0]}
                  width="1200"
                  height="800"
                >
                  {({ ref, open }) => (
                    <Link
                      href="#"
                      className="listing-card-four__popup card__popup"
                      ref={ref as any}
                      onClick={(e) => {
                        e.preventDefault();
                        open(e);
                      }}
                    >
                      <span className="icon-image"></span>
                    </Link>
                  )}
                </Item>

                {/* Hidden Image Items for the Swipe Gallery */}
                {item.allImages.slice(1).map((imgUrl, idx) => (
                  <Item
                    key={idx}
                    original={imgUrl}
                    thumbnail={imgUrl}
                    width="1200"
                    height="800"
                  >
                    {({ ref }) => (
                      <div ref={ref as any} style={{ display: "none" }} />
                    )}
                  </Item>
                ))}

                <Link
                  className="video-popup"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openVideoReviews(item.slug);
                  }}
                >
                  <span className="icon-video"></span>
                </Link>
              </div>
            </div>
            <ul className="listing-card-four__meta list-unstyled">
              {item.meta.map((meta) => {
                const isLocation = meta.icon === "icon-location";
                const fullText = String(meta.title || "");
                const firstWord = isLocation
                  ? fullText.split(/[, ]+/).filter(Boolean)[0] || fullText
                  : fullText;
                return (
                  <li key={meta.id}>
                    <Link
                      href={item.link}
                      title={isLocation ? fullText : undefined}
                    >
                      <span className="listing-card-four__meta__icon">
                        <i className={meta.icon}></i>
                      </span>
                      <span className={isLocation ? "meta-text" : undefined}>
                        {firstWord}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="listing-card-four__content">
            <div className="listing-card-four__rating">
              <span>({item.reviews} Review)</span>
              {[...Array(item.rating)].map((_, i) => (
                <i key={i} className="icon-star"></i>
              ))}
            </div>
            <h3 className="listing-card-four__title">
              <Link href={item.link}>{item.title}</Link>
            </h3>

            <div className="listing-card-four__content__btn">
              <div className="listing-card-four__price">
                <span className="listing-card-four__price__sub">
                  Start from
                </span>
                <span className="listing-card-four__price__number">
                  ${item.price}
                </span>
              </div>
              <Link href={item.link} className="listing-card-four__btn gotur-btn">
                Book Now{" "}
                <span className="icon">
                  <i className="icon-right"></i>{" "}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PhotoSwipeGallery>
  );
};

export default TourCard;
