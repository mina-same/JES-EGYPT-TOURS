"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { Container, Accordion } from "react-bootstrap";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { Calendar, Headphones, Tag, Star, Zap, ChevronDown, HelpCircle } from "lucide-react";
import TourListingDetailsOneSkeleton from "./TourListingDetailsOneSkeleton";

import EmptyState from "@/components/common/EmptyState/EmptyState";
import BlogCard from "@/components/common/BlogCard/BlogCard";
import { buildBlogCardViewModels } from "@/lib/blog/cardViewModel";

// Import types
import { TourListingOneDetailsProps } from "./types";

// Import custom hook
import { useTourData } from "./useTourData";

// Import sub-components
import { TourInfoBar } from "./components/TourInfoBar";
import { BookingForm } from "./components/BookingForm";
import { TourPlan } from "./components/TourPlan";
import { PricingPlans } from "./components/PricingPlans";
import { TourMosaic } from "./components/TourMosaic";
import { DownloadPdfBrochure } from "./components/DownloadPdfBrochure";
import { MobileStickyBookingBar } from "./components/MobileStickyBookingBar";
import { planHasPrices } from "@/lib/tours/startingPrice";
import { normalizeAmenityItems } from "@/lib/normalizeAmenityItems";
import { calculateBookingSidebarLayout } from "@/lib/bookingSidebarUx";
import FeatureTwo from "../FeatureTwo/FeatureTwo";
import ClientCarousel from "../ClientCarousel/ClientCarousel";

/** Questions shown before the "Read More" button. The rest are rendered too —
 *  see the FAQ section — just hidden until the button is pressed. */
const FAQ_VISIBLE_COUNT = 4;

/**
 * Lines of description TEXT shown before "Read More". The effect below turns
 * this into a pixel height; the CSS fallback only covers the first paint.
 *
 * Two values because a line holds far fewer words on a phone: measured against
 * the real descriptions, three lines is a quarter of the copy on a 1440px screen
 * but barely a tenth — one short sentence — at 420px. Keeping the counts apart
 * shows a comparable amount of text on both instead of a teaser so short that
 * everyone has to expand it.
 */
const DESCRIPTION_VISIBLE_LINES_DESKTOP = 3;
const DESCRIPTION_VISIBLE_LINES_MOBILE = 5;
/** Same breakpoint the rest of this page treats as desktop (CSS: max-width 991px). */
const DESKTOP_MIN_WIDTH = 992;

const TourListingOneDetails: React.FC<TourListingOneDetailsProps> = ({ id, initialRawTour }) => {
  const { tourData, loading, error, moreTours, relatedBlogs, hasTourContent } = useTourData(id, initialRawTour);
  const [activeSection, setActiveSection] = useState("description");
  const navRef = useRef<HTMLDivElement>(null);
  const navPlaceholderRef = useRef<HTMLDivElement>(null);
  /** The content column, so the pinned nav can match its width instead of the
   *  viewport's — otherwise it stretches over the booking card. */
  const contentColRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(0);
  const [isNavFixed, setIsNavFixed] = useState(false);
  /** True once the reader has scrolled PAST the last section: the pinned bar
   *  then navigates nothing on screen, so it slides away. It slides (transform)
   *  rather than unpinning, because unpinning would collapse the spacer above
   *  the viewport and visibly jolt the page. */
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [contentLeft, setContentLeft] = useState(0);
  const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarRowRef = useRef<HTMLDivElement>(null);
  /** The column, not the card: while the card is `fixed` its own rect reports the
   *  fixed position, so measuring bounds from it made the card drift on resize. */
  const sidebarColRef = useRef<HTMLDivElement>(null);
  const [isSidebarFixed, setIsSidebarFixed] = useState(false);
  /** The row now spans the whole page, so the card reaches the row's end long
   *  before the page does. Parked = stop pinning, rest at the column bottom. */
  const [isSidebarParked, setIsSidebarParked] = useState(false);
  const [sidebarLeft, setSidebarLeft] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [sidebarTop, setSidebarTop] = useState(20);
  const [sidebarViewportHeight, setSidebarViewportHeight] = useState(0);
  /** The column's own left padding — the parked (absolute) card is positioned
   *  against the column's padding box, so this realigns it with the content. */
  const [sidebarPadLeft, setSidebarPadLeft] = useState(0);
  /** Measured reactively rather than read during render — the card grows when a
   *  validation message appears, and a render-time read misses that. */
  const [cardHeight, setCardHeight] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  /**
   * A callback ref, not useRef: `loading` flips true→false while the tour is
   * fetched, so the component swaps to the skeleton and back and React mounts a
   * BRAND NEW description node. A plain ref would leave the measurement effect
   * pointing at the discarded node — the clamp it wrote was silently thrown
   * away. Storing the node in state re-runs the effect on every remount.
   */
  const [descriptionEl, setDescriptionEl] = useState<HTMLDivElement | null>(null);
  /**
   * Starts true so the button is part of the SERVER-rendered markup — the clamp
   * is CSS-only and therefore already active on first paint, so a button that
   * only appeared after hydration would leave the control missing exactly when
   * the text is cut. The effect below switches it off for the rare description
   * that is short enough to fit uncut.
   */
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(true);
  const [faqActiveKey, setFaqActiveKey] = useState<string | null>("0");
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const params = useParams() as { locale: string };
  const { t, i18n } = useTranslation("tours");

  const relatedBlogCards = React.useMemo(
    () => buildBlogCardViewModels(relatedBlogs, i18n.language || params?.locale || "en"),
    [relatedBlogs, i18n.language, params?.locale]
  );

  useEffect(() => {
    if (params?.locale && i18n.resolvedLanguage !== params.locale) {
      i18n.changeLanguage(params.locale);
    }
  }, [params?.locale, i18n]);

  /**
   * Sizes the clamp to exactly the wanted number of lines OF TEXT.
   *
   * A plain max-height cannot do this: the budget is shared with the gaps
   * between paragraphs, so a height worth five lines renders four lines plus a
   * blank one, and how many lines survive changes with where the paragraph
   * breaks happen to fall — one tour showed a single orphaned line. Measuring
   * the real line boxes and clamping to the last wanted line's box makes the
   * count identical on every tour, whatever the paragraph rhythm.
   *
   * Overflowing content is still laid out under `overflow: hidden`, so the rects
   * for the clipped lines are available and the element can be measured without
   * expanding it first.
   */
  useEffect(() => {
    const el = descriptionEl;
    if (!el) return;

    const measure = () => {
      const inner = el.firstElementChild as HTMLElement | null;
      if (!inner) return;

      const visibleLines =
        window.innerWidth >= DESKTOP_MIN_WIDTH
          ? DESCRIPTION_VISIBLE_LINES_DESKTOP
          : DESCRIPTION_VISIBLE_LINES_MOBILE;

      // Collect the elements that actually own line boxes: descend until a node
      // whose children are all inline. Ranging the whole description at once
      // reports the paragraph boxes ALONGSIDE the line boxes, which inflated the
      // count and clamped some tours to fewer lines than asked for.
      const isBlock = (node: Element) => {
        const display = getComputedStyle(node).display;
        return display === "block" || display === "list-item" || display === "flex" || display === "grid" || display === "table";
      };
      const leafBlocks: Element[] = [];
      const collect = (node: Element) => {
        const children = Array.from(node.children);
        if (children.length === 0 || !children.some(isBlock)) {
          leafBlocks.push(node);
          return;
        }
        children.forEach(collect);
      };
      collect(inner);

      // Blocks stack vertically, so de-duplicating by top WITHIN a block folds
      // the several rects of one line (split by inline tags) into a single line.
      const lines: DOMRect[] = [];
      const range = document.createRange();
      for (const block of leafBlocks) {
        range.selectNodeContents(block);
        const seen = new Set<number>();
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.height <= 0 || rect.width <= 0) continue;
          const key = Math.round(rect.top * 10);
          if (seen.has(key)) continue;
          seen.add(key);
          lines.push(rect);
        }
      }
      lines.sort((a, b) => a.top - b.top);

      if (lines.length <= visibleLines) {
        el.style.removeProperty("--desc-clamp");
        setIsDescriptionOverflowing(false);
        return;
      }

      const lastVisible = lines[visibleLines - 1];
      const lineHeight = parseFloat(getComputedStyle(inner).lineHeight);
      // getClientRects returns the glyph box, which is shorter than the line
      // box. Adding the half-leading back puts the cut on the line boundary
      // instead of shaving the descenders.
      const halfLeading = Number.isFinite(lineHeight)
        ? Math.max(0, (lineHeight - lastVisible.height) / 2)
        : 0;
      const clamp = Math.ceil(lastVisible.bottom - el.getBoundingClientRect().top + halfLeading);

      el.style.setProperty("--desc-clamp", `${clamp}px`);
      setIsDescriptionOverflowing(true);
    };

    measure();
    window.addEventListener("resize", measure);
    // Web fonts land after first paint and change where the lines break.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
    // `tourData.overview` rather than the destructured `overview`, which is
    // declared further down and would be in its temporal dead zone here.
  }, [descriptionEl, tourData.overview]);

  useEffect(() => {
    const updateNavHeight = () => {
      const h = navRef.current?.getBoundingClientRect().height || 0;
      setNavHeight(h);
    };

    // Measured from the COLUMN. Reading the card instead meant that once it was
    // `fixed`, its rect reported the fixed position, so every resize re-fixed it
    // against its own displaced coordinates and the card drifted.
    // Inner (content-box) bounds of a column, in viewport coordinates. Used to
    // pin both the nav and the booking card to their own column rather than to
    // the page — a fixed element gets no layout from its parent, so without this
    // it spans the viewport.
    const columnBounds = (col: HTMLDivElement | null) => {
      if (!col) return null;
      const rect = col.getBoundingClientRect();
      const style = window.getComputedStyle(col);
      const padLeft = parseFloat(style.paddingLeft || '0');
      const padRight = parseFloat(style.paddingRight || '0');
      return { left: rect.left + padLeft, width: rect.width - padLeft - padRight, padLeft };
    };

    const updateSidebarBounds = () => {
      const sidebar = columnBounds(sidebarColRef.current);
      if (sidebar) {
        setSidebarLeft(sidebar.left);
        setSidebarWidth(sidebar.width);
        setSidebarPadLeft(sidebar.padLeft);
      }
      const content = columnBounds(contentColRef.current);
      if (content) {
        setContentLeft(content.left);
        setContentWidth(content.width);
      }
    };

    updateNavHeight();
    updateSidebarBounds();
    setIsMobile(window.innerWidth < 992);
    const handleResize = () => {
      updateNavHeight();
      updateSidebarBounds();
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track the booking card's height. It changes when validation messages or the
  // success banner appear, and the pin maths needs the current value.
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const content = el.firstElementChild instanceof HTMLElement
      ? el.firstElementChild
      : null;
    const read = () => setCardHeight(Math.max(
      el.scrollHeight,
      content?.getBoundingClientRect().height || 0
    ));
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateFixedState = () => {
      // Disable sticky navigation tabs on mobile
      if (window.innerWidth < 992) {
        setIsNavFixed(false);
        return;
      }
      
      const el = navPlaceholderRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setIsNavFixed(top <= 0);

      // Past the end of the two-column row (= past #honest-reviews, the last
      // section the bar links to), the bar only hovers over related tours and
      // the footer — hide it there, bring it back when scrolling up.
      const row = sidebarRowRef.current;
      const barHeight = navRef.current?.getBoundingClientRect().height || 64;
      setIsNavHidden(!!row && row.getBoundingClientRect().bottom <= barHeight + 8);
    };

    const updateSidebarFixed = () => {
      // Only run sticky logic on desktop (>= 992px)
      if (window.innerWidth < 992) {
        setIsSidebarFixed(false);
        setIsSidebarParked(false);
        setSidebarViewportHeight(0);
        return;
      }

      const row = sidebarRowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const height = cardHeight || sidebarRef.current?.getBoundingClientRect().height || 0;

      const layout = calculateBookingSidebarLayout({
        rowTop: rowRect.top,
        rowBottom: rowRect.bottom,
        cardHeight: height,
        viewportHeight: window.innerHeight,
      });

      setSidebarTop(layout.top);
      setSidebarViewportHeight(layout.availableHeight);
      setIsSidebarFixed(layout.canFix && !layout.reachedEnd);
      setIsSidebarParked(layout.canFix && layout.reachedEnd);
    };

    const onScroll = () => {
      updateFixedState();
      updateSidebarFixed();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onScroll);
    };
  }, [cardHeight]);

  // Handle scroll spy and smooth scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['description', 'tour-plan', 'map', 'amenities', 'pricing', 'gallery', 'download-pdf', 'faqs', 'honest-reviews'];

      // Find the current active section
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if section is in viewport (considering header offset)
          const y = (isNavFixed ? (navHeight || 0) : 0) + 20;
          if (rect.top <= y && rect.bottom >= y) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Handle click on nav link or its children
      const link = target.closest('.tour-nav-link');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const sectionId = href.substring(1);
          const element = document.getElementById(sectionId);
          if (element) {
            // Calculate position with offset for sticky header
            const headerOffset = (isNavFixed ? (navHeight || 0) : 0) + 20;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            // Immediately set active section
            setActiveSection(sectionId);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
    };
  }, [navHeight, isNavFixed]);

  const {
    title,
    overview,
    overviewTitle,
    location,
    pickupAndDropOff,
    activitiesType,
    activateDay,
    availability,
    price,
    relatedTours,
    sliderImages,
    amenities,
    amenitiesTwo,
    highlightList,
    images,
    faqs,
    map,
    itinerary,
    pricingPlans,
    reviewVideos,
  } = tourData;

  const hasReviewVideos = (reviewVideos || []).length > 0;
  /** Plans existing is not the same as prices existing: a plan is created the
   *  moment a tour is set up, long before anyone fills in amounts. */
  const hasQuotablePricing = (pricingPlans || []).some(planHasPrices);
  const includedAmenityItems = normalizeAmenityItems(amenities);
  const excludedAmenityItems = normalizeAmenityItems(amenitiesTwo);
  const whatToPackItems = normalizeAmenityItems(tourData.whatToPack);
  const highlightItems = normalizeAmenityItems(highlightList);

  if (loading) {
    return <TourListingDetailsOneSkeleton />;
  }

  // The error screen replaces the page only when there is no tour to show.
  // Second guard alongside the hook's own check: a decorative lookup failing
  // must never hide content the server already rendered.
  if (error && !hasTourContent) {
    return (
      <div className="d-flex align-items-center justify-content-center text-danger" style={{ minHeight: '400px' }}>
        {error}
      </div>
    );
  }

  const isSidebarViewportConstrained =
    (isSidebarFixed || isSidebarParked) &&
    cardHeight > sidebarViewportHeight;

  return (
    <>
      <section className='tour-listing-details section-space'>
        {/* Header Section - Commented out */}

        <PhotoSwipeGallery>
        {/* paddingLeft/Right rather than the shorthand `padding: '0 20px'` the
            other containers use: the shorthand also sets padding-top to 0
            inline, which no stylesheet rule can then override. */}
        <Container
          fluid
          style={{ maxWidth: '1400px', paddingLeft: '20px', paddingRight: '20px' }}
          className="tour-top-block"
        >
          {/* ONE two-column row for the whole page: it starts here, right under
              the hero, and ends after the last section. That is what makes the
              booking card stay pinned for the length of the page — the existing
              sidebarRowRef mechanism measures this row, so no new machinery. */}
          <div className='row gutter-y-30 tour-details-row' ref={sidebarRowRef}>
            {/* Main Content */}
            <div className='col-lg-9' ref={contentColRef}>
              {/* Photos first: an adaptive grid that fills every cell at any
                  photo count, replacing the 3-item slider whose centred first
                  slide left a wide blank edge. */}
              <TourMosaic images={sliderImages} title={title} />

              {/* Tour Key Facts - Screen Reader Only. Now actually precedes the
                  facts it labels. */}
              <h2 className="sr-only">Tour Key Facts</h2>

              {/* Info Bar Section */}
              <TourInfoBar
                pickupAndDropOff={pickupAndDropOff}
                location={location}
                activitiesType={activitiesType}
                activateDay={activateDay}
                availability={availability}
                mapHref={map ? '#map' : undefined}
              />

              {/* Trust band — same content and icons as before, moved into the
                  rail so it sits level with the price instead of below the
                  twelfth section where almost nobody reached it. */}
              <div className="info-area info-bg tour-trust-band">
                <div className="row align-items-center">
                  <div className="col-lg-4">
                    <div className="section-heading" style={{ marginBottom: '0' }}>
                      <p className="sec__title" style={{ color: '#1a1a1a', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '10px' }}>{t("tourDetails.bookConfidence")}</p>
                      <p className="sec__desc" style={{ color: '#666', fontWeight: '400', letterSpacing: '0px', marginBottom: '0' }}>{t("tourDetails.bookConfidenceDesc")}</p>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="d-flex justify-content-center align-items-center flex-wrap" style={{ gap: '20px' }}>
                      {[
                        { title: t("tourDetails.features.monthly"), icon: Calendar },
                        { title: t("tourDetails.features.support"), icon: Headphones },
                        { title: t("tourDetails.features.prices"), icon: Tag },
                        { title: t("tourDetails.features.rating"), icon: Star },
                        { title: t("tourDetails.features.fast"), icon: Zap }
                      ].map((item, idx) => (
                        <div key={idx} className="text-center" style={{ minWidth: '120px' }}>
                          <div className="info-icon flex-shrink-0 bg-white shadow-sm mx-auto mb-2" style={{
                            width: '70px',
                            height: '70px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            border: '1.5px solid #b79c5c',
                            transition: 'transform 0.3s ease',
                            boxShadow: '0 8px 16px rgba(183, 156, 92, 0.15)'
                          }}>
                            <item.icon size={35} color="#b79c5c" />
                          </div>
                          <span className="info__title d-block" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600', margin: '0' }}>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Bar */}
              <div ref={navPlaceholderRef} />
              <div
                ref={navRef}
                className="tour-details-nav-wrapper bg-white"
                style={{
                  position: isNavFixed ? 'fixed' : 'relative',
                  top: isNavFixed ? 0 : undefined,
                  // Pinned to the CONTENT COLUMN's bounds, not the viewport. This
                  // bar used to span the full page because it lived outside the
                  // columns; now that it sits inside col-lg-9, `left: 0; right: 0`
                  // made it stretch across the booking card and cover it.
                  left: isNavFixed ? contentLeft : undefined,
                  zIndex: isNavFixed ? 1100 : undefined,
                  background: '#fff',
                  borderBottom: '2px solid #f0f0f0',
                  width: isNavFixed ? contentWidth : '100%',
                  // Slide away below the last section; visibility also drops it
                  // from the tab order and the accessibility tree while gone.
                  transform: isNavFixed && isNavHidden ? 'translateY(-110%)' : undefined,
                  visibility: isNavFixed && isNavHidden ? 'hidden' : undefined,
                  transition: isNavFixed ? 'transform 0.25s ease, visibility 0.25s ease' : undefined,
                }}
              >
                <nav className="tour-details-nav">
                  <a href="#description" className={`tour-nav-link ${activeSection === 'description' ? 'active' : ''}`}>{t("tourDetails.nav.description")}</a>
                  <a href="#tour-plan" className={`tour-nav-link ${activeSection === 'tour-plan' ? 'active' : ''}`}>{t("tourDetails.nav.tourPlan")}</a>
                  {/* Only when the tour actually has a map — the tab used to scroll to
                      an empty section on the tours with no embed. */}
                  {map && (
                    <a href="#map" className={`tour-nav-link ${activeSection === 'map' ? 'active' : ''}`}>{t("tourDetails.nav.map")}</a>
                  )}
                  <a href="#amenities" className={`tour-nav-link ${activeSection === 'amenities' ? 'active' : ''}`}>{t("tourDetails.nav.amenities")}</a>
                  {/* Same guard as the map and gallery tabs: a tab that scrolls
                      to a section which is not on the page is a dead control. */}
                  {hasQuotablePricing && (
                    <a href="#pricing" className={`tour-nav-link ${activeSection === 'pricing' ? 'active' : ''}`}>{t("tourDetails.nav.pricing")}</a>
                  )}
                  {/* Same guard as the map: tour.gallery is empty on most tours,
                      so the tab used to scroll to an EmptyState. */}
                  {images && images.length > 0 && (
                    <a href="#gallery" className={`tour-nav-link ${activeSection === 'gallery' ? 'active' : ''}`}>{t("tourDetails.nav.gallery")}</a>
                  )}
                  <a href="#download-pdf" className={`tour-nav-link ${activeSection === 'download-pdf' ? 'active' : ''}`}>{t("tourDetails.nav.brochure")}</a>
                  <a href="#faqs" className={`tour-nav-link ${activeSection === 'faqs' ? 'active' : ''}`}>{t("tourDetails.nav.faq")}</a>
                  {/* No "Reviews" tab: the section it pointed at is gone. The video
                      reviews keep their own tab above. */}
                </nav>
              </div>

              <div style={{ height: (isNavFixed && !isMobile) ? (navHeight || 0) + 40 : 0 }} />

              <div className='tour-listing-details__content'>

                {/* Description Section */}
                <section id="description" className="tour-section">
                  <div className='tour-listing-details__content__item border-0 p-0 shadow-none'>
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div style={{ width: '5px', height: '32px', borderRadius: '4px', backgroundColor: '#b79c5c' }}></div>
                      <h2 className='tour-listing-details__title m-0' style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                        {overviewTitle}
                      </h2>
                    </div>
                    
                    {/* The clamp is CSS-only and covers the prose alone. Every
                        word — including the part below the fold — is rendered
                        into the server HTML and merely clipped, so the copy stays
                        crawlable and any internal links inside it keep counting.
                        Never trim `overview` itself to shorten this. */}
                    <div
                      id="tour-description-body"
                      ref={setDescriptionEl}
                      className={`tour-description-wrapper ${isDescriptionExpanded ? '' : 'collapsed'}`}
                    >
                      <div
                        className='tour-listing-details__text'
                        style={{ color: '#444', fontSize: '1rem', lineHeight: '1.8' }}
                        dangerouslySetInnerHTML={{ __html: overview }}
                      />
                    </div>

                    {isDescriptionOverflowing && (
                      <button
                        type="button"
                        className="tour-read-more-btn"
                        onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                        aria-expanded={isDescriptionExpanded}
                        aria-controls="tour-description-body"
                      >
                        <span>
                          {isDescriptionExpanded
                            ? t("tourDetails.readLess", "Read Less")
                            : t("tourDetails.readMore", "Read More")}
                        </span>
                        <ChevronDown
                          size={16}
                          className="tour-read-more-btn__chevron"
                          style={{ transform: isDescriptionExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      </button>
                    )}

                  </div>

                  {/* Tour Highlights Section */}
                  <div className='tour-listing-details__content__item border-0 p-0'>
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div style={{ width: '4px', height: '24px', backgroundColor: '#b79c5c' }}></div>
                      <h2 className='tour-listing-details__title m-0' style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                        {t("tourDetails.highlightList")}
                      </h2>
                    </div>
                    <ul className="list-unstyled row gutter-y-20" style={{ paddingLeft: 0 }}>
                      {highlightItems.map((item, index) => (
                        <li key={index} className="col-md-6 col-lg-4 mb-3">
                          <div className="d-flex align-items-start gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                              width: '26px',
                              height: '26px',
                              backgroundColor: 'rgba(183, 156, 92, 0.1)',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className='icon-check-star' style={{ color: '#b79c5c', fontSize: '12px' }}></i>
                            </div>
                            <span className="text-dark fw-medium" style={{ fontSize: '0.93rem' }} dangerouslySetInnerHTML={{ __html: item }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section id="tour-plan" className="tour-section">
                  <TourPlan itinerary={itinerary} />
                </section>

                {/* The <section> itself is conditional: `.tour-section` carries 40px
                    of padding top and bottom plus a bottom border, so rendering it
                    empty for a tour with no map left a blank gap and a stray rule. */}
                {map && (
                  <section id="map" className="tour-section">
                    <div className='tour-listing-details__content__item'>
                      <h2 className='tour-listing-details__title'>{t("tourDetails.mapTitle")}</h2>
                      <div className="tour-listing-details__map-box" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <iframe
                          // Names the tour, in the page's language: screen readers
                          // announce an iframe by its title, and "Google Map" named
                          // the vendor rather than the content — identically on
                          // every tour and in English on the translated pages.
                          title={title ? `${t("tourDetails.mapTitle")} — ${title}` : t("tourDetails.mapTitle")}
                          src={map}
                          allowFullScreen
                          // Restored from the pasted iframe, which the old code
                          // dropped by keeping only `src`. Without lazy loading the
                          // Maps bundle was fetched on every tour view even though
                          // the map sits far below the fold.
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className='w-100'
                          height='450'
                          style={{ border: 0 }}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Amenities Section */}
                <section id="amenities" className="tour-section">
                  {includedAmenityItems.length > 0 || excludedAmenityItems.length > 0 ? (
                    <div className='tour-listing-details__content__item border-0 p-0'>
                      <h2 className='tour-listing-details__title mb-4' style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                        {t("tourDetails.amenitiesTitle")}
                      </h2>
                      <div className="row g-4">
                        {includedAmenityItems.length > 0 && (
                          <div className="col-lg-6">
                            <div className="p-4 rounded-4 h-100 inclusion-card" style={{ border: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                              <h3 className='m-0 fs-6 fw-bold text-dark mb-4' style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {t("tourDetails.included")}
                              </h3>
                              <ul className="amenities-card-list">
                                {includedAmenityItems.map((item, index) => (
                                  <li key={index} className="amenities-card-item">
                                    <i className="fas fa-check" aria-hidden="true" />
                                    <span dangerouslySetInnerHTML={{ __html: item }} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        {excludedAmenityItems.length > 0 && (
                          <div className="col-lg-6">
                            <div className="p-4 rounded-4 h-100 exclusion-card" style={{ border: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                              <h3 className='m-0 fs-6 fw-bold text-dark mb-4' style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {t("tourDetails.notIncluded")}
                              </h3>
                              <ul className="amenities-card-list">
                                {excludedAmenityItems.map((item, index) => (
                                  <li key={index} className="amenities-card-item">
                                    <i className="fas fa-times text-danger" aria-hidden="true" />
                                    <span dangerouslySetInnerHTML={{ __html: item }} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title={t("tourDetails.empty.amenitiesTitle")}
                      description={t("tourDetails.empty.amenitiesDesc")}
                      icon="file"
                      size="medium"
                    />
                  )}
                </section>

                {/* Pricing — omitted entirely when nothing is quotable.
                    Tours are routinely written and published before sales have
                    priced them, and an empty "Tour Pricing" band advertises the
                    gap. Showing nothing reads as a tour without published
                    rates; showing an empty section reads as a broken page. */}
                {hasQuotablePricing && (
                  <section id="pricing" className="tour-section">
                    <div className='tour-listing-details__content__item tour-listing-details__pricing'>
                      <div className="mb-4">
                        <h2 className='tour-listing-details__title mb-2'>{t("tourDetails.pricingTitle")}</h2>
                        <p className="tour-reviews-subtitle">{t("tourDetails.pricingSubtitle")}</p>
                      </div>
                      <PricingPlans pricingPlans={pricingPlans} />
                    </div>
                  </section>
                )}
                
                {/* Important Notes Section */}
                {tourData.notes && tourData.notes.length > 0 && (
                  <section id="important-notes" className="tour-section">
                    <div className="mb-4 d-flex align-items-center gap-2">
                      <div style={{ width: '3px', height: '18px', backgroundColor: '#b79c5c' }}></div>
                      <h2 className='tour-listing-details__title m-0' style={{ fontSize: '1.15rem' }}>
                        {t("tourDetails.importantNotes", "Important Notes")}
                      </h2>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {tourData.notes?.map((note, index) => (
                        <div key={index} className="tour-note-item">
                          {note.title && (
                            <div className="mb-1">
                              <span className="fw-bold fs-7 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: '#b79c5c' }}>
                                {note.title}
                              </span>
                            </div>
                          )}
                          <div
                            className="text-muted tour-listing-details__text"
                            style={{
                              fontSize: '0.925rem',
                              lineHeight: '1.6',
                              color: '#555 !important'
                            }}
                            dangerouslySetInnerHTML={{ __html: note.text }}
                          />
                          {index < (tourData.notes?.length || 0) - 1 && (
                            <hr className="mt-3 mb-0 opacity-10" />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* What to Pack Section */}
                {whatToPackItems.length > 0 && (
                  <section id="what-to-pack" className="tour-section">
                    <div className='tour-listing-details__content__item p-3 p-md-4 rounded-3 shadow-sm' style={{
                      backgroundColor: 'rgba(183, 156, 92, 0.02)',
                      border: '1px solid rgba(183, 156, 92, 0.1)',
                      borderRight: '4px solid #b79c5c'
                    }}>
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <h2 className='tour-listing-details__title m-0 d-flex align-items-center gap-2' style={{ fontSize: '1.2rem' }}>
                          <i className="fas fa-suitcase text-primary" style={{ color: '#b79c5c', fontSize: '1rem' }} aria-hidden="true"></i>
                          {t("tourDetails.whatToPack", "What to Pack")}
                        </h2>
                      </div>
                      <div className="row g-2">
                        {whatToPackItems.map((item, index) => (
                          <div key={index} className="col-md-6 col-lg-4 mb-2">
                            <div className="d-flex align-items-center gap-2">
                               <div style={{ width: '5px', height: '5px', backgroundColor: '#b79c5c', borderRadius: '50%' }}></div>
                               <span className="text-dark" style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: item }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* What You Will Love — sits between What to Pack and the gallery */}
                {tourData.whatYouWillLoveHtml && (
                  <section id="what-you-will-love" className="tour-section">
                    <div className="tour-listing-details__what-you-love p-5 rounded-4 shadow-sm" style={{
                      background: 'linear-gradient(135deg, rgba(183, 156, 92, 0.08) 0%, rgba(183, 156, 92, 0.03) 100%)',
                      border: '1px solid rgba(183, 156, 92, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Premium Background Element */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        fontSize: '160px',
                        opacity: '0.04',
                        transform: 'rotate(-15deg)',
                        userSelect: 'none',
                        pointerEvents: 'none'
                      }}>💎</div>

                      <div className="d-flex align-items-center gap-4 mb-4">
                        <div className="bg-white p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                          <i className="icon-star" style={{ fontSize: '24px', color: '#b79c5c' }}></i>
                        </div>
                        <div>
                          <h2 className="m-0 fs-5 fw-bold text-dark" style={{ letterSpacing: '0.01em' }}>
                            {t("tourDetails.whatYouWillLove", "What You Will Love about this tour?")}
                          </h2>
                          <div style={{ width: '40px', height: '3px', borderRadius: '2px', backgroundColor: '#b79c5c', marginTop: '4px' }}></div>
                        </div>
                      </div>

                      <div
                        className='tour-listing-details__text'
                        style={{
                          color: '#333',
                          lineHeight: '1.9',
                          fontSize: '1rem',
                          fontWeight: '400'
                        }}
                        dangerouslySetInnerHTML={{ __html: tourData.whatYouWillLoveHtml }}
                      />
                    </div>
                  </section>
                )}

                {/* Gallery Section — the whole section is conditional, same as the
                    map: `tour.gallery` is empty on most tours, so this used to
                    render a padded section containing only an EmptyState, with a
                    nav tab pointing at it. */}
                {images && images.length > 0 && (
                  <section id="gallery" className="tour-section">
                    <div className='tour-listing-details__content__item tour-listing-details__thumb'>
                      <div className="mb-4">
                        <h2 className='tour-listing-details__title mb-2'>{t("tourDetails.galleryTitle")}</h2>
                        <p className="tour-reviews-subtitle">{t("tourDetails.gallerySubtitle")}</p>
                      </div>
                      
                      {isMobile && (
                        <div className="mobile-swipeable-gallery">
                          {images.map((img, idx) => {
                            const imgUrl = typeof img === 'string' ? img : (img as any).url || (img as any).src;
                            const imageTitle = (typeof img === 'object' && (img as any).title) ? (img as any).title : "";
                            const imgAlt = (img as any).alt || imageTitle || `${title} gallery ${idx + 1}`;
                            return (
                              <Item
                                key={`mobile-img-${idx}`}
                                original={imgUrl}
                                thumbnail={imgUrl}
                                width="1200"
                                height="800"
                                caption={imageTitle || imgAlt}
                              >
                                {({ ref, open }) => (
                                  <a
                                    href={imgUrl}
                                    ref={ref as unknown as React.Ref<HTMLAnchorElement>}
                                    onClick={(e) => { e.preventDefault(); open(e); }}
                                    className="mobile-gallery-link"
                                    title={imageTitle}
                                  >
                                    <div className='tour-gallery-item h-100'>
                                      <div className='tour-gallery-image-wrapper h-100'>
                                        <Image
                                          src={imgUrl}
                                          alt={imgAlt}
                                          title={imageTitle}
                                          width={400}
                                          height={300}
                                          className="tour-gallery-image"
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      </div>
                                    </div>
                                  </a>
                                )}
                              </Item>
                            );
                          })}
                        </div>
                      )}
                      
                      {!isMobile && (
                        <Masonry
                          breakpointCols={{ default: 3, 1100: 2, 700: 1 }}
                          className="tour-gallery-masonry"
                          columnClassName="tour-gallery-masonry-column"
                        >
                          {images.map((img, idx) => {
                            const imgUrl = typeof img === 'string' ? img : (img as any).url || (img as any).src;
                            const imageTitle = (typeof img === 'object' && (img as any).title) ? (img as any).title : "";
                            const imgAlt = (img as any).alt || imageTitle || `${title} gallery ${idx + 1}`;
                            return (
                              <Item
                                key={`desk-img-${idx}`}
                                original={imgUrl}
                                thumbnail={imgUrl}
                                width="1200"
                                height="800"
                                caption={imageTitle || imgAlt}
                              >
                                {({ ref, open }) => (
                                  <a
                                    href={imgUrl}
                                    ref={ref as unknown as React.Ref<HTMLAnchorElement>}
                                    onClick={(e) => { e.preventDefault(); open(e); }}
                                    title={imageTitle}
                                    style={{ display: 'block' }}
                                  >
                                    <div className='tour-gallery-item'>
                                      <div className='tour-gallery-image-wrapper'>
                                        <Image
                                          src={imgUrl}
                                          alt={imgAlt}
                                          title={imageTitle}
                                          width={400}
                                          height={300}
                                          className="tour-gallery-image"
                                          style={{ width: '100%', height: 'auto' }}
                                        />
                                      </div>
                                    </div>
                                  </a>
                                )}
                              </Item>
                            );
                          })}
                        </Masonry>
                      )}
                    </div>
                  </section>
                )}

                {/* Download Section */}
                <section id="download-pdf" className="tour-section">
                  <DownloadPdfBrochure tour={tourData} />
                </section>

                {/* FAQs Section */}
                <section id="faqs" className="tour-section">
                  {faqs && faqs.length > 0 ? (
                    <div className='tour-listing-details__content__item tour-listing-details__faqs'>
                      <div className="mb-4">
                        <h2 className='tour-listing-details__title mb-2'>{t("tourDetails.faqTitle")}</h2>
                        <p className="tour-reviews-subtitle">{t("tourDetails.faqSubtitle")}</p>
                      </div>
                      <div className="faq-accordion gotur-accordion" data-grp-name="gotur-accordion">
                        <Accordion
                          id="tour-faq-list"
                          defaultActiveKey="0"
                          activeKey={faqActiveKey || undefined}
                          onSelect={(k) => setFaqActiveKey(k as string)}
                          className="wow fadeInUp"
                          data-wow-duration="1500ms"
                          data-wow-delay="500ms"
                        >
                          {/* EVERY question is rendered, always. The ones past the
                              fold are hidden in CSS rather than sliced out of the
                              array, so the full Q&A text ships in the server HTML
                              and stays crawlable — and keeps matching the FAQPage
                              JSON-LD, which Google requires to be page-visible. */}
                          {faqs.map((faq, index) => {
                            const eventKey = String(index);
                            const isOpen = faqActiveKey === eventKey;
                            const isBeyondFold = index >= FAQ_VISIBLE_COUNT;
                            return (
                              <Accordion.Item
                                eventKey={eventKey}
                                key={index}
                                className={(!showAllFaqs && isBeyondFold) ? 'faq-item--collapsed' : undefined}
                              >
                                <div className="accordion-header">
                                  <Accordion.Button className="bg-transparent border-0 w-100 shadow-none p-0">
                                    <div className="faq-header-content d-flex align-items-center gap-3 w-100" style={{ padding: '20px' }}>
                                      <div className="faq-icon-box">
                                        <HelpCircle size={20} />
                                      </div>
                                      <div className="faq-question-box text-start flex-grow-1">
                                        <h3 className="faq-question-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{faq.question}</h3>
                                      </div>
                                      <div 
                                        className="faq-chevron"
                                        style={{ 
                                          transition: 'transform 0.3s ease',
                                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }}
                                      >
                                        <ChevronDown size={18} />
                                      </div>
                                    </div>
                                  </Accordion.Button>
                                </div>
                                <Accordion.Body>
                                  <div className="accordion-content">
                                    <div className="inner">
                                      <div className="inner__text" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                    </div>
                                  </div>
                                </Accordion.Body>
                              </Accordion.Item>
                            );
                          })}
                        </Accordion>

                        {faqs.length > FAQ_VISIBLE_COUNT && (
                          <button
                            type="button"
                            className="faq-toggle-btn"
                            onClick={() => setShowAllFaqs((prev) => !prev)}
                            aria-expanded={showAllFaqs}
                            aria-controls="tour-faq-list"
                          >
                            <span>
                              {showAllFaqs
                                ? t("tourDetails.faqShowLess")
                                : t("tourDetails.faqShowMore", { remaining: faqs.length - FAQ_VISIBLE_COUNT })}
                            </span>
                            <ChevronDown
                              size={18}
                              className="faq-toggle-btn__chevron"
                              style={{ transform: showAllFaqs ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title={t("tourDetails.empty.faqTitle")}
                      description={t("tourDetails.empty.faqDesc")}
                      icon="file"
                      size="medium"
                    />
                  )}
                </section>

                {hasReviewVideos ? (
                  <section id="honest-reviews" className="tour-section">
                    <div className='tour-listing-details__content__item'>
                      <div className="mb-4">
                        <h2 className='tour-listing-details__title mb-2'>{t("tourDetails.honestReviewsTitle")}</h2>
                        <p className="tour-reviews-subtitle">{t("tourDetails.honestReviewsSubtitle")}</p>
                      </div>
                      <div className="row gutter-y-30">
                        {(reviewVideos || []).map((v, idx) => (
                          <div className="col-lg-6" key={`${v.videoId}-${idx}`}>
                            <div
                              className="bg-white border rounded-3 overflow-hidden"
                              style={{ boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}
                            >
                              <div className="p-3 border-bottom">
                                <div className="fw-semibold" style={{ color: '#1a1a1a' }}>{v.title || 'Review'}</div>
                              </div>
                              <div className="ratio ratio-16x9">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${v.videoId}`}
                                  title={v.title || 'YouTube review'}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                              <div className="p-3">
                                <a href={v.url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                  {t("tourDetails.openYoutube")}
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null}

                {/* The written-reviews section is gone: it showed a hardcoded
                    4.9 average and five fixed stars over an empty review table,
                    none of it from a real traveller. */}

              </div>
            </div>

            {/* Sidebar - Booking Form */}
            <div className='col-lg-3' ref={sidebarColRef} style={{ position: 'relative' }}>
              {/* Spacer to prevent layout jump when sidebar is fixed */}
              {isSidebarFixed && <div style={{ height: cardHeight }} />}
              <div
                ref={sidebarRef}
                className={`tour-listing-details__sidebar ${
                  isSidebarViewportConstrained
                    ? 'tour-listing-details__sidebar--scrollable'
                    : ''
                }`}
                style={{
                  // Parked = absolutely pinned to the COLUMN'S bottom, out of the
                  // flow. The previous margin-top approach fed on itself: the
                  // margin was computed from the row's height and then ADDED to
                  // that height, so every scroll event grew the page — measured
                  // at +6,000px of blank space after a few wheel ticks.
                  position: isSidebarFixed ? 'fixed' : isSidebarParked ? 'absolute' : 'relative',
                  left: isSidebarFixed ? sidebarLeft : isSidebarParked ? sidebarPadLeft : undefined,
                  width: (isSidebarFixed || isSidebarParked) ? sidebarWidth : undefined,
                  top: isSidebarFixed ? sidebarTop : undefined,
                  bottom: isSidebarParked ? 0 : undefined,
                  zIndex: isSidebarFixed ? 1000 : undefined,
                  alignSelf: 'flex-start',
                  height: 'fit-content',
                  maxHeight: (isSidebarFixed || isSidebarParked)
                    ? sidebarViewportHeight
                    : undefined,
                  overflowY: isSidebarViewportConstrained ? 'auto' : undefined,
                }}
              >
                <BookingForm
                  tourId={String(tourData.id || '')}
                  price={price}
                  // Gates the card's "Pricing" link. Plans existing is not
                  // enough: an unpriced tour renders no #pricing section, so
                  // the link would scroll to nothing.
                  hasPricing={hasQuotablePricing}
                  packageOptions={(pricingPlans || []).map((plan) => plan.planName)}
                  tourTitle={title}
                />
              </div>
            </div>
          </div>
        </Container>

        {/* ── Related Tours (curated in the admin) ── */}
        {relatedTours.length > 0 && (
          <FeatureTwo
            id="related-tours"
            extraClass="section-space-top"
            itemsPerRow={4}
            homeThree={false}
            showShape={false}
            tours={relatedTours}
            title={t("tourDetails.relatedTours.title", "Related Tours")}
            titleSpan=""
            subtitle={t("tourDetails.relatedTours.tagline", "Curated Selection")}
          />
        )}

        {/* ── Related Blogs (max 3, curated or featured fallback) ── */}
        {relatedBlogCards.length > 0 && (
          <div className="section-space-top section-space-bottom" style={{ background: '#f8f9fb' }}>
            <Container>
                <div className="sec-title text-center mb-5">
                  <h6 className='sec-title__tagline'>{t("tourDetails.relatedBlogs.tagline", "Travel Stories")}</h6>
                  <h3 className='sec-title__title'>{t("tourDetails.relatedBlogs.title", "Related Blogs")}</h3>
                </div>
                <div className="row gutter-y-30">
                  {relatedBlogCards.map((post, index) => (
                    <div key={post.id} className="col-lg-4 col-md-6">
                      <BlogCard post={post} variant='feature' index={index} />
                    </div>
                  ))}
                </div>
            </Container>
          </div>
        )}

        {/* ── More Tours from Same Category (full-width carousel) ── */}
        {moreTours.length > 0 && (
          <FeatureTwo
            extraClass="section-space-top"
            itemsPerRow={4}
            homeThree={false}
            showShape={false}
            tours={moreTours}
            title={t("tourDetails.moreTours.title", "More")}
            titleSpan={t("tourDetails.moreTours.span", "Tours")}
            subtitle={t("tourDetails.moreTours.subtitle", "More tours from this category")}
          />
        )}

        {/* ── Trusted Partners / Brands ── */}
        <ClientCarousel extraClass="section-space-top section-space-bottom" />

      </PhotoSwipeGallery>
      </section>

      {/* Mobile Sticky Booking Bar */}
      <MobileStickyBookingBar
        tourId={String(tourData.id || "")}
        price={price}
        tourTitle={title}
        packageOptions={(pricingPlans || []).map((plan) => plan.planName)}
      />
    </>
  );
};

export default TourListingOneDetails;
