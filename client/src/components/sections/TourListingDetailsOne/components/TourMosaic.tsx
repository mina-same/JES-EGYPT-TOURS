"use client";
import React from "react";
import Image from "next/image";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { useTranslation } from "react-i18next";
import { Images } from "lucide-react";

type MosaicImage = string | { url?: string; src?: string; alt?: string; title?: string };

interface TourMosaicProps {
  images: MosaicImage[];
  title: string;
}

/** Tiles drawn on screen. Every photo beyond this still opens in the lightbox. */
const MAX_TILES = 6;
const HERO_SIZES = "(max-width: 991px) calc(100vw - 40px), (max-width: 1399px) 46vw, 660px";
const THUMB_SIZES = "(max-width: 991px) 40vw, (max-width: 1399px) 22vw, 330px";

/**
 * The tour's photos as an adaptive grid, replacing the 3-item tiny-slider.
 *
 * The grid template is chosen from the REAL number of photos (`data-tiles`), so
 * every cell is always filled — a tour with one photo gets one wide band, not a
 * row with five empty frames. Four of five tours in this catalogue currently
 * have exactly one image, so that case is the common one, not the edge case.
 *
 * One DOM tree serves desktop and mobile: `.tour-mosaic__rail` is
 * `display: contents` on desktop (its children become grid items) and a
 * scroll-snap row on mobile. No `isMobile` branch, so the server HTML equals the
 * first client paint.
 */
export const TourMosaic: React.FC<TourMosaicProps> = ({ images, title }) => {
  const { t } = useTranslation("tours");

  // Same normalisation the carousel and the #gallery section already use.
  const photos = React.useMemo(
    () =>
      (images || [])
        .map((img, idx) => {
          const url = typeof img === "string" ? img : (img as any)?.url || (img as any)?.src || "";
          const ttl = typeof img === "object" && (img as any)?.title ? String((img as any).title) : "";
          const alt =
            typeof img === "object" && (img as any)?.alt
              ? String((img as any).alt)
              : ttl || `${title} - Image ${idx + 1}`;
          return { url, title: ttl, alt };
        })
        .filter((p) => !!p.url),
    [images, title]
  );

  const total = photos.length;
  if (total === 0) return null; // never render an empty frame

  const tiles = photos.slice(0, MAX_TILES);
  const hidden = total - tiles.length;
  const countLabel = t("tourDetails.photoCount", "{{count}} photos", { count: total });

  // A nested provider with an explicit dataSource: six tiles on screen, every
  // photo in the lightbox, and the number on the badge always equals the
  // lightbox length. Keeps this collection separate from the #gallery masonry,
  // which registers with the page-level provider.
  const dataSource = photos.map((p, i) => ({
    sourceId: i,
    original: p.url,
    thumbnail: p.url,
    width: 1600,
    height: 1000,
    alt: p.alt,
    caption: p.title || p.alt,
  }));

  const renderTile = (p: (typeof photos)[number], i: number, isHero: boolean) => (
    <Item
      key={`${p.url}-${i}`}
      sourceId={i}
      original={p.url}
      thumbnail={p.url}
      width={1600}
      height={1000}
      alt={p.alt}
      caption={p.title || p.alt}
    >
      {({ ref, open }) => (
        <button
          type="button"
          ref={ref as unknown as React.Ref<HTMLButtonElement>}
          onClick={open}
          title={p.title || undefined}
          aria-label={isHero && total > 1 ? `${p.alt} — ${countLabel}` : p.alt}
          className={`tour-mosaic__tile${isHero ? " tour-mosaic__tile--hero" : ""}`}
        >
          <Image
            src={p.url}
            alt={p.alt}
            title={p.title || undefined}
            fill
            className="tour-mosaic__img"
            sizes={isHero ? HERO_SIZES : THUMB_SIZES}
            loading={isHero ? "eager" : "lazy"}
          />
          {isHero && total > 1 && (
            <span className="tour-mosaic__count">
              <Images size={15} aria-hidden="true" />
              {total}
            </span>
          )}
          {!isHero && hidden > 0 && i === tiles.length - 1 && (
            <span className="tour-mosaic__more" aria-hidden="true">
              +{hidden}
            </span>
          )}
        </button>
      )}
    </Item>
  );

  return (
    <div
      className="tour-mosaic"
      data-tiles={tiles.length}
      data-photos={total}
      role="group"
      aria-label={`${title} — ${countLabel}`}
    >
      <PhotoSwipeGallery dataSource={dataSource} withCaption>
        <>
          {renderTile(tiles[0], 0, true)}
          {tiles.length > 1 && (
            <div className="tour-mosaic__rail">
              {tiles.slice(1).map((p, i) => renderTile(p, i + 1, false))}
            </div>
          )}
        </>
      </PhotoSwipeGallery>
    </div>
  );
};
