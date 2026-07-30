"use client";

import React from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import PhotoSwipe from "photoswipe";
import { useCurrency } from "@/contexts/CurrencyContext";
import OfferPriceFooter, { type OfferLabels } from "./OfferPriceFooter";

export interface TourCardMeta {
  id: number;
  title: string;
  icon: string;
}

export interface TourCardItem {
  id: string;
  slug?: string;
  image: string | StaticImageData;
  imageAlt?: string;
  /** Gallery images — `allImages` (listing pages) or `images` (carousels). */
  allImages?: string[];
  images?: string[];
  title: string;
  /** Tour detail URL. Empty string renders the title/CTA as plain text. */
  link: string;
  price: number | any;
  /** Pre-discount price, when the data provides one (offer footer only). */
  originalPrice?: number | any;
  rating: number;
  reviews: number;
  videoId?: string;
  discount?: string;
  meta: TourCardMeta[];
}

export interface TourCardLabels {
  startFrom?: string;
  cta?: string;
  review?: string;
}

interface TourCardProps {
  item: TourCardItem;
  /** Omit to render the heart as a static icon (carousels don't wire it). */
  toggleWishlist?: (id: string) => void;
  isInWishlist?: (id: string) => boolean;
  /** Replaces the heart with a remove control (wishlist grid). */
  onRemove?: (id: string) => void;
  removeLabel?: string;
  /** Opens curated video reviews, looked up by slug (listing pages). */
  openVideoReviews?: (slug: string) => void;
  /** Opens a YouTube video by id (carousels). Pass per item to hide it when absent. */
  onPlayVideo?: (videoId: string) => void;
  /** Footer style: the offer row shows was/now/saving instead of "Start from". */
  variant?: "default" | "special-offer";
  offerLabels?: OfferLabels;
  /** Image box height in px — carousel cards are shorter. */
  imageHeight?: number;
  /** Rounded, clipped image box with a hover zoom (carousel look). */
  imageZoom?: boolean;
  /** Wrap meta entries in links and shorten the location to its first word. */
  linkMeta?: boolean;
  /** Image badges — currently just the discount badge, and only when the tour has one. */
  showBadges?: boolean;
  /** Localised labels; English defaults keep existing call sites unchanged. */
  labels?: TourCardLabels;
}

/** Reads an image's real dimensions so the lightbox shows its true ratio. */
const measureImage = (src: string) =>
  new Promise<{ src: string; width: number; height: number }>((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      resolve({ src, width: img.naturalWidth || 1600, height: img.naturalHeight || 1067 });
    img.onerror = () => resolve({ src, width: 1600, height: 1067 });
    img.src = src;
  });

/**
 * Opens a PhotoSwipe lightbox with this tour's images. Built on click, so no
 * gallery DOM is rendered and no image is downloaded until the button is used.
 */
const openTourImages = async (images: string[]) => {
  if (!images.length) return;
  const dataSource = await Promise.all(images.map(measureImage));
  const pswp = new PhotoSwipe({
    dataSource,
    showHideAnimationType: "fade",
    // PhotoSwipe re-focuses the clicked button on close; inside a carousel that
    // scrolls the slide into view and shifts the whole track.
    returnFocus: false,
  });
  pswp.init();
};

/**
 * The single tour card used across the site — listings, search, carousels and
 * the wishlist. Every visual detail lives here so a design change lands
 * everywhere at once; the optional props only toggle behaviour that genuinely
 * differs per context (wishlist wiring, media handlers, badges, image size).
 */
const TourCard: React.FC<TourCardProps> = ({
  item,
  toggleWishlist,
  isInWishlist,
  onRemove,
  removeLabel = "Remove from wishlist",
  openVideoReviews,
  onPlayVideo,
  variant = "default",
  offerLabels,
  imageHeight = 257,
  imageZoom = false,
  linkMeta = true,
  showBadges = true,
  labels,
}) => {
  const { formatPrice } = useCurrency();

  const galleryImages =
    item.allImages && item.allImages.length
      ? item.allImages
      : item.images && item.images.length
        ? item.images
        : typeof item.image === "string"
          ? [item.image]
          : item.image?.src
            ? [item.image.src]
            : [];

  const wishlisted = isInWishlist ? isInWishlist(item.id) : false;
  const canPlayVideo = Boolean(onPlayVideo && item.videoId);
  const canOpenReviews = Boolean(openVideoReviews && item.slug);

  return (
    <div className="item">
      <div className="listing-card-four wow fadeInUp" data-wow-duration="1500ms">
        <div className="listing-card-four__image">
          <div
            className={`relative w-full${imageZoom ? " overflow-hidden rounded-3" : ""}`}
            style={{ height: `${imageHeight}px` }}
          >
            <Image
              src={item.image}
              alt={item.imageAlt || item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover${imageZoom ? " transition-transform duration-500 hover:scale-110" : ""}`}
            />
          </div>

          {showBadges && item.discount && (
            <div className="listing-card-four__btn-group">
              <div className="listing-card-four__discount">-{item.discount}% off</div>
            </div>
          )}

          <div className="listing-card-four__btns">
            {onRemove ? (
              <Link
                href="#"
                aria-label={removeLabel}
                onClick={(e) => {
                  e.preventDefault();
                  onRemove(item.id);
                }}
              >
                <i className="far fa-trash-alt"></i>
              </Link>
            ) : (
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist?.(item.id);
                }}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={wishlisted ? "is-active" : undefined}
              >
                <i className={wishlisted ? "fas fa-heart" : "far fa-heart"}></i>
              </Link>
            )}

            {(galleryImages.length > 0 || canPlayVideo || canOpenReviews) && (
              <div className="listing-card-four__btns__hover">
                {galleryImages.length > 0 && (
                  <Link
                    href="#"
                    className="listing-card-four__popup card__popup"
                    aria-label="View tour photos"
                    onClick={(e) => {
                      e.preventDefault();
                      openTourImages(galleryImages);
                    }}
                  >
                    <span className="icon-image"></span>
                  </Link>
                )}

                {(canPlayVideo || canOpenReviews) && (
                  <Link
                    className="video-popup"
                    href="#"
                    aria-label="Play tour video"
                    onClick={(e) => {
                      e.preventDefault();
                      if (canPlayVideo) onPlayVideo!(item.videoId as string);
                      else openVideoReviews!(item.slug as string);
                    }}
                  >
                    <span className="icon-video"></span>
                  </Link>
                )}
              </div>
            )}
          </div>

          <ul className="listing-card-four__meta list-unstyled">
            {item.meta.map((meta) => {
              const isLocation = meta.icon === "icon-location";
              const fullText = String(meta.title || "");
              const shortText =
                linkMeta && isLocation
                  ? fullText.split(/[, ]+/).filter(Boolean)[0] || fullText
                  : fullText;
              const inner = (
                <>
                  <span className="listing-card-four__meta__icon">
                    <i className={meta.icon}></i>
                  </span>
                  <span className={linkMeta && isLocation ? "meta-text" : undefined}>
                    {shortText}
                  </span>
                </>
              );
              return (
                <li key={meta.id}>
                  {linkMeta && item.link ? (
                    <Link href={item.link} title={isLocation ? fullText : undefined}>
                      {inner}
                    </Link>
                  ) : (
                    <span>{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="listing-card-four__content">
          <div className="listing-card-four__rating">
            <span>
              ({item.reviews} {labels?.review ?? "Review"})
            </span>
            {[...Array(item.rating)].map((_, i) => (
              <i key={i} className="icon-star"></i>
            ))}
          </div>

          <h3 className="listing-card-four__title">
            {item.link ? <Link href={item.link}>{item.title}</Link> : <span>{item.title}</span>}
          </h3>

          {variant === "special-offer" && offerLabels ? (
            <OfferPriceFooter
              href={item.link}
              price={item.price}
              originalPrice={item.originalPrice}
              labels={offerLabels}
            />
          ) : (
            <div className="listing-card-four__content__btn">
              <div className="listing-card-four__price">
                <span className="listing-card-four__price__sub">
                  {labels?.startFrom ?? "Start from"}
                </span>
                <span className="listing-card-four__price__number">
                  {formatPrice(item.price)}
                </span>
              </div>
              {item.link && (
                <Link href={item.link} className="listing-card-four__btn gotur-btn">
                  {labels?.cta ?? "Book Now"}{" "}
                  <span className="icon">
                    <i className="icon-right"></i>{" "}
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourCard;
