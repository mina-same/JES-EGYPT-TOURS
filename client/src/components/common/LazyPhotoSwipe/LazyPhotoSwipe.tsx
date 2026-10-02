"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type PhotoSwipe from "photoswipe";
import type { SlideData } from "photoswipe";
import "./LazyPhotoSwipe.css";

/**
 * `Gallery` and `Item` with react-photoswipe-gallery's API, except that
 * PhotoSwipe is loaded on the first click instead of with the page.
 *
 * The library's gallery module imports `photoswipe` at module scope, so every
 * page with a gallery (tour pages, category and subcategory listings) carried
 * the whole lightbox in its initial JavaScript, for photos most visitors never
 * open. The thumbnails are untouched: same render prop, same markup, rendered on
 * the server. Only the lightbox waits for a click.
 *
 * The open logic is the library's (v3.1.1): slides in page order or from
 * `dataSource`, the zoom from the clicked thumbnail, one lightbox at a time,
 * the same caption element. Left out because no caller uses them: hash
 * navigation (`id`), options, plugins, custom UI elements, HTML slides and the
 * download button. TourCard imports the same `photoswipe` module on click, so
 * both load one chunk.
 */

interface ItemData {
  original?: string;
  originalSrcset?: string;
  thumbnail?: string;
  width?: string | number;
  height?: string | number;
  alt?: string;
  caption?: string;
  cropped?: boolean;
  /** Names this Item's slide in the Gallery's `dataSource`. */
  sourceId?: string | number;
}

type DataSourceItem = Omit<ItemData, "sourceId"> & { sourceId: string | number };
type ItemRef = React.MutableRefObject<HTMLElement | null>;
type Point = { x: number; y: number };

interface GalleryProps {
  children?: React.ReactNode;
  /** Every slide, when the lightbox holds more photos than there are Items on screen. */
  dataSource?: DataSourceItem[];
  /** Shows each slide's `caption` (or `alt`) under the photo. */
  withCaption?: boolean;
}

interface ItemProps extends ItemData {
  children: (props: {
    ref: (node: HTMLElement | null) => void;
    open: (e: React.MouseEvent) => void;
  }) => React.ReactElement;
}

interface GalleryApi {
  set: (ref: ItemRef, data: ItemData) => void;
  remove: (ref: ItemRef) => void;
  handleClick: (ref: ItemRef, e?: React.MouseEvent) => void;
}

const GalleryContext = createContext<GalleryApi>({
  set: () => {},
  remove: () => {},
  handleClick: () => {},
});

/** The open lightbox: one at a time across every gallery on the page. */
let openLightbox: PhotoSwipe | null = null;
/** Set once the module has loaded, so every later open is synchronous. */
let PhotoSwipeClass: typeof PhotoSwipe | null = null;
/** Bumped on every click; only the latest click opens once the module arrives. */
let latestClick = 0;
/**
 * The photo whose click is waiting for the first load. On a slow connection
 * that wait runs to seconds with nothing on screen, so the photo is marked busy
 * (`aria-busy`, plus a spinner that LazyPhotoSwipe.css shows only after 300 ms)
 * until its lightbox opens, the load fails, or a later click replaces it.
 */
let pendingTrigger: HTMLElement | null = null;

const markPending = (el: HTMLElement | null) => {
  if (pendingTrigger && pendingTrigger !== el) {
    pendingTrigger.removeAttribute("aria-busy");
    pendingTrigger.removeAttribute("data-pswp-loading");
  }
  pendingTrigger = el;
  el?.setAttribute("aria-busy", "true");
  el?.setAttribute("data-pswp-loading", "");
};

const toSlide = (
  { width, height, original, originalSrcset, thumbnail, cropped, ...rest }: ItemData,
  ref?: ItemRef
): SlideData => ({
  w: width ? Number(width) : undefined,
  h: height ? Number(height) : undefined,
  src: original,
  srcset: originalSrcset,
  msrc: thumbnail,
  element: ref?.current ?? undefined,
  thumbCropped: cropped,
  ...rest,
});

/** Every Item on screen, in page order. */
function slidesFromItems(items: Map<ItemRef, ItemData>, target: ItemRef) {
  const entries = [...items]
    .filter(([ref]) => ref.current instanceof Element)
    .sort(([a], [b]) => {
      const x = a.current as HTMLElement;
      const y = b.current as HTMLElement;
      if (x === y) return 0;
      return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
    });
  return {
    slides: entries.map(([ref, data]) => toSlide(data, ref)),
    index: entries.findIndex(([ref]) => ref === target),
  };
}

/** The `dataSource` slides, each tied to its Item's element when one is on screen. */
function slidesFromDataSource(dataSource: DataSourceItem[], items: Map<ItemRef, ItemData>, target: ItemRef) {
  const refs = new Map([...items].map(([ref, data]) => [data.sourceId, ref]));
  return {
    slides: dataSource.map(({ sourceId, ...data }) => toSlide(data, refs.get(sourceId))),
    index: dataSource.findIndex(({ sourceId }) => refs.get(sourceId) === target),
  };
}

export const Gallery: React.FC<GalleryProps> = ({ children, dataSource, withCaption }) => {
  const items = useRef(new Map<ItemRef, ItemData>());

  const show = useCallback(
    (PhotoSwipeCtor: typeof PhotoSwipe, target: ItemRef, initialPointerPos: Point | null) => {
      const { slides, index } = dataSource
        ? slidesFromDataSource(dataSource, items.current, target)
        : slidesFromItems(items.current, target);
      const lightbox = new PhotoSwipeCtor({ dataSource: slides, index: Math.max(index, 0), initialPointerPos });
      openLightbox = lightbox;
      if (withCaption) {
        lightbox.on("uiRegister", () => {
          lightbox.ui?.registerElement({
            name: "default-caption",
            order: 9,
            isButton: false,
            appendTo: "root",
            onInit: (el, pswp) => {
              el.style.position = "absolute";
              el.style.bottom = "15px";
              el.style.left = "0";
              el.style.right = "0";
              el.style.padding = "0 20px";
              el.style.color = "var(--pswp-icon-color)";
              el.style.textAlign = "center";
              el.style.fontSize = "14px";
              el.style.lineHeight = "1.5";
              el.style.textShadow = "1px 1px 3px var(--pswp-icon-color-secondary)";
              lightbox.on("change", () => {
                if (!pswp.currSlide) return;
                const { caption, alt } = pswp.currSlide.data;
                el.innerHTML = caption || alt || "";
              });
            },
          });
        });
      }
      lightbox.on("destroy", () => {
        openLightbox = null;
      });
      lightbox.init();
    },
    [dataSource, withCaption]
  );

  const handleClick = useCallback(
    (target: ItemRef, e?: React.MouseEvent) => {
      if (openLightbox) return;
      // Read at click time: PhotoSwipe uses the pointer position to tell a
      // mouse or touch open from a keyboard one, which it focuses at once.
      const point = e && e.clientX !== undefined && e.clientY !== undefined ? { x: e.clientX, y: e.clientY } : null;
      const click = ++latestClick;
      if (PhotoSwipeClass) {
        show(PhotoSwipeClass, target, point);
        return;
      }
      markPending(target.current);
      import("photoswipe").then(
        ({ default: PhotoSwipeCtor }) => {
          PhotoSwipeClass = PhotoSwipeCtor;
          // A later click (another photo, a double tap) replaces this one and
          // now owns the busy mark.
          if (click !== latestClick) return;
          markPending(null);
          // A photo that unmounted while loading has nothing to open from.
          if (!openLightbox && target.current) show(PhotoSwipeCtor, target, point);
        },
        () => {
          // A chunk that failed to load leaves the page as it was, like TourCard.
          if (click === latestClick) markPending(null);
        }
      );
    },
    [show]
  );

  useEffect(
    () => () => {
      openLightbox?.close();
    },
    []
  );

  const api = useMemo<GalleryApi>(
    () => ({
      set: (ref, data) => {
        items.current.set(ref, data);
      },
      remove: (ref) => {
        items.current.delete(ref);
      },
      handleClick,
    }),
    [handleClick]
  );

  return <GalleryContext.Provider value={api}>{children}</GalleryContext.Provider>;
};

export const Item = ({ children, ...data }: ItemProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const { set, remove, handleClick } = useContext(GalleryContext);

  // Re-registered after every render, so the slide always carries the current props.
  useEffect(() => {
    set(ref, data);
    return () => remove(ref);
  });

  const attach = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);
  const open = useCallback((e: React.MouseEvent) => handleClick(ref, e), [handleClick]);

  return children({ ref: attach, open });
};
