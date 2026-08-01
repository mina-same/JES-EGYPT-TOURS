"use client";

import React from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import PhotoSwipe from "photoswipe";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { stripHtml } from "@/lib/seo/tourJsonLd";
import OfferPriceFooter, { type OfferLabels } from "./OfferPriceFooter";
import styles from "./TourCard.module.css";

/** Meta icons that carry the itinerary/destination chain — given a full row. */
const LOCATION_ICONS = ["icon-location", "icon-pin", "icon-pin1", "icon-maps-and-flags"];

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
  /** Short summary under the title — HTML is stripped and clamped to 2 lines. */
  description?: string;
  /** Tour detail URL. Empty string renders the title/CTA as plain text. */
  link: string;
  price: number | any;
  /** Pre-discount price, when the data provides one (offer footer only). */
  originalPrice?: number | any;
  videoId?: string;
  discount?: string;
  meta: TourCardMeta[];
}

interface TourCardProps {
  item: TourCardItem;
  /** Omit to render the heart as a static icon (carousels don't wire it). */
  toggleWishlist?: (id: string) => void;
  isInWishlist?: (id: string) => boolean;
  /** Replaces the heart with a remove control (wishlist grid). */
  onRemove?: (id: string) => void;
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
  openVideoReviews,
  onPlayVideo,
  variant = "default",
  offerLabels,
  imageHeight = 257,
  imageZoom = false,
  linkMeta = true,
  showBadges = true,
}) => {
  const { formatPrice } = useCurrency();
  // Owned by the card so every listing gets the same localised, pluralised
  // wording — call sites no longer pass a review label.
  const { t } = useTranslation("common");

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
  // Callers may hand over rich text straight from the tour document.
  const summary = stripHtml(item.description).trim();

  return (
    <div className="item">
      <div
        className={`listing-card-four ${styles.card} wow fadeInUp`}
        data-wow-duration="1500ms"
      >
        <div className={`listing-card-four__image ${styles.media}`}>
          <div
            className={`relative w-full${imageZoom ? " overflow-hidden" : ""}`}
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
              <div className={`listing-card-four__discount ${styles.discountBadge}`}>
                {item.discount}% OFF
              </div>
            </div>
          )}

          <div className="listing-card-four__btns">
            {/* Buttons, not links: none of these navigate. As anchors with
                href="#" they announced themselves to screen readers as links to
                nowhere and could not be reached the way a control should be. */}
            {onRemove ? (
              <button
                type="button"
                aria-label={t("tourCard.removeFromWishlist")}
                onClick={() => onRemove(item.id)}
              >
                <i className="far fa-trash-alt"></i>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleWishlist?.(item.id)}
                aria-label={t(
                  wishlisted ? "tourCard.removeFromWishlist" : "tourCard.addToWishlist"
                )}
                aria-pressed={wishlisted}
                className={wishlisted ? "is-active" : undefined}
              >
                <i className={wishlisted ? "fas fa-heart" : "far fa-heart"}></i>
              </button>
            )}

            {(galleryImages.length > 0 || canPlayVideo || canOpenReviews) && (
              <div className="listing-card-four__btns__hover">
                {galleryImages.length > 0 && (
                  <button
                    type="button"
                    className="listing-card-four__popup card__popup"
                    aria-label={t("tourCard.viewPhotos")}
                    onClick={() => openTourImages(galleryImages)}
                  >
                    <span className="icon-image"></span>
                  </button>
                )}

                {(canPlayVideo || canOpenReviews) && (
                  <button
                    type="button"
                    className="video-popup"
                    aria-label={t("tourCard.playVideo")}
                    onClick={() => {
                      if (canPlayVideo) onPlayVideo!(item.videoId as string);
                      else openVideoReviews!(item.slug as string);
                    }}
                  >
                    <span className="icon-video"></span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        <div className={`listing-card-four__content ${styles.body}`}>
          {/* No rating row. The stars were five hardcoded icons on every card
              and the count was a number typed by hand in the admin — neither
              came from a real review, so both are gone rather than dressed up. */}
          <h3 className={`listing-card-four__title ${styles.title}`}>
            {item.link ? <Link href={item.link}>{item.title}</Link> : <span>{item.title}</span>}
          </h3>

          {summary && <p className={styles.description}>{summary}</p>}

          {item.meta.length > 0 && (
            <ul className={styles.metaList}>
              {item.meta.map((meta) => {
                // The itinerary chain gets its own row; the rest share one.
                const isLocation = LOCATION_ICONS.includes(meta.icon);
                const text = String(meta.title || "");
                const inner = (
                  <>
                    <span className={styles.metaIcon}>
                      <i className={meta.icon}></i>
                    </span>
                    <span>{text}</span>
                  </>
                );
                return (
                  <li
                    key={meta.id}
                    className={`${styles.metaItem}${isLocation ? ` ${styles.metaWide}` : ""}`}
                  >
                    {linkMeta && item.link ? (
                      <Link href={item.link} title={text}>
                        {inner}
                      </Link>
                    ) : (
                      <span>{inner}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className={styles.footer}>
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
                  {t("tourCard.startFrom")}
                </span>
                <span className="listing-card-four__price__number">
                  {formatPrice(item.price)}
                </span>
              </div>
              {item.link && (
                <Link href={item.link} className="listing-card-four__btn gotur-btn">
                  {t("tourCard.viewTour")}{" "}
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
    </div>
  );
};

export default TourCard;
