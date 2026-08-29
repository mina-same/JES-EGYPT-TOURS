"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, usePathname } from "next/navigation";
import { Container } from "react-bootstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { ChevronDown, MessageCircle, ArrowRight } from "lucide-react";
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
import { TrustBand } from "./components/TrustBand";
import { BookingForm } from "./components/BookingForm";
import { TourPlan } from "./components/TourPlan";
import { PricingPlans } from "./components/PricingPlans";
import { TourMosaic } from "./components/TourMosaic";
import { DownloadPdfBrochure } from "./components/DownloadPdfBrochure";
import { MobileStickyBookingBar } from "./components/MobileStickyBookingBar";
import { planHasPrices } from "@/lib/tours/startingPrice";
import { normalizeAmenityItems, isOrderedListContent, bindLeadingDash } from "@/lib/normalizeAmenityItems";
import TourQuestionModal from "./components/TourQuestionModal";
import FaqAccordion from "@/components/common/Faq/FaqAccordion";
import { waHref } from "@/config/contact";
import { normalizeRichTextInternalLinks } from "@/lib/richTextLinks";
import { splitRichTextByHeading } from "@/lib/richTextSections";
import { calculateBookingSidebarLayout } from "@/lib/bookingSidebarUx";
import { useLineClamp } from "@/hooks/useLineClamp";
import FeatureTwo from "../FeatureTwo/FeatureTwo";
import ClientCarousel from "../ClientCarousel/ClientCarousel";

/** Questions shown before the "Read More" button. The rest are rendered too —
 *  see the FAQ section — just hidden until the button is pressed. */
const FAQ_VISIBLE_COUNT = 4;

/** Notes shown before the button on a phone. The whole section runs past
 *  1250px there -- more than three screens -- while on a desktop it fits in
 *  624px and is never folded. Every note stays in the HTML either way; only CSS
 *  hides them, so crawlers still read the full set. */
const NOTES_VISIBLE_ON_PHONE = 3;

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
  /* Measurement, the CSS variable it writes and the overflow flag all live in
     useLineClamp — the Tour Plan intro runs the identical routine. */
  const isDescriptionOverflowing = useLineClamp(descriptionEl, tourData.overview, {
    desktop: DESCRIPTION_VISIBLE_LINES_DESKTOP,
    mobile: DESCRIPTION_VISIBLE_LINES_MOBILE,
  });
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const relatedBlogsSliderRef = useRef<SwiperClass | null>(null);

  const params = useParams() as { locale: string };
  const pathname = usePathname();
  /* The tour's own slug, taken from the URL rather than the payload: the route
     already resolved it for this locale, and the localized slug is what makes
     an enquiry's tour link work when the team opens it. */
  const tourSlug = React.useMemo(
    () => (pathname || "").split("?")[0].split("/").filter(Boolean).pop() || "",
    [pathname]
  );
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

    const measure = () => {
      updateFixedState();
      updateSidebarFixed();
    };

    /* Same reason as the scroll spy: both helpers read layout, so at most one
       pass per frame rather than one per scroll event. */
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onScroll);
    };
  }, [cardHeight]);

  // Handle scroll spy and smooth scroll
  useEffect(() => {
    const readActiveSection = () => {
      /*
       * The tabs ARE the list of tracked sections, read from the DOM instead of
       * repeated here.
       *
       * A hand-written copy is what broke the bar: `honest-reviews` was left in
       * it after its tab was removed, so the spy kept marking a section active
       * that no tab could match and the whole nav went dark for the 520px the
       * reviews occupy. The tabs are conditional too -- map, pricing, gallery
       * and packing render only for tours that have them -- so a literal list
       * has four more conditions to stay in step with. Deriving it means the
       * two cannot disagree, whatever sections are added later.
       *
       * Sections with no tab of their own (Important Notes, What You Will Love)
       * are simply not tracked, so the nearest preceding tracked section stays
       * lit while they are read. That fall-through is deliberate; a blank bar
       * is not.
       */
      const trackedIds = Array.from(
        new Set(
          Array.from(document.querySelectorAll<HTMLAnchorElement>('.tour-nav-link'))
            .map((link) => link.getAttribute('href') || '')
            .filter((href) => href.startsWith('#') && href.length > 1)
            .map((href) => href.slice(1))
        )
      );

      /* Sorted by where the sections actually sit, not by tab order -- the two
         differ (the gallery tab comes before the packing tab while the sections
         run the other way round), and at a boundary two neighbours can both
         straddle the probe line, so the first match has to be the higher one. */
      const y = (isNavFixed ? (navHeight || 0) : 0) + 20;
      const boxes = trackedIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => ({ id: el.id, rect: el.getBoundingClientRect() }))
        .sort((a, b) => a.rect.top - b.rect.top);

      const current = boxes.find(({ rect }) => rect.top <= y && rect.bottom >= y);
      if (current) setActiveSection(current.id);
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

    /* Coalesced into one animation frame and registered passive. It used to run
       on every scroll event, and each run does up to nine getBoundingClientRect
       reads that force synchronous layout; without `passive` a non-passive
       listener on `scroll` can also hold up the scroll itself. */
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        readActiveSection();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
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
  /* Link normalisation is a regex pass over every rich-text field on the page —
     around 60 of them here. Scrolling re-renders this component whenever the
     sticky bar, the sidebar or the active tab flips, so the passes are memoised
     on the source strings instead of running again each time. Note the explicit
     arrow: passing the function straight to `.map` would hand it the array index
     as its `siteUrl` argument. */
  const richText = React.useCallback(
    (html: string | null | undefined) => normalizeRichTextInternalLinks(html),
    []
  );
  const overviewHtml = React.useMemo(() => richText(overview), [richText, overview]);
  const whatYouWillLoveHtml = React.useMemo(
    () => richText(tourData.whatYouWillLoveHtml),
    [richText, tourData.whatYouWillLoveHtml]
  );
  /* One element per benefit so the section can lay them out two across. Null
     when the content is not a clean run of headed benefits — an intro
     paragraph before the first heading, a wrapper element around the lot, a
     single benefit — and the section falls back to the one-column block it has
     always rendered. */
  const whatYouWillLoveSections = React.useMemo(
    () => splitRichTextByHeading(whatYouWillLoveHtml),
    [whatYouWillLoveHtml]
  );
  const includedAmenityItems = React.useMemo(
    () => normalizeAmenityItems(amenities).map((item) => richText(item)),
    [richText, amenities]
  );
  const excludedAmenityItems = React.useMemo(
    () => normalizeAmenityItems(amenitiesTwo).map((item) => richText(item)),
    [richText, amenitiesTwo]
  );
  const whatToPackOrdered = React.useMemo(
    () => isOrderedListContent(tourData.whatToPack),
    [tourData.whatToPack]
  );
  const whatToPackItems = React.useMemo(
    () =>
      normalizeAmenityItems(tourData.whatToPack).map((item) =>
        bindLeadingDash(richText(item))
      ),
    [richText, tourData.whatToPack]
  );
  const whatToPackListClass =
    "tour-pack__list" + (whatToPackOrdered ? " tour-pack__list--ordered" : "");
  const highlightItems = React.useMemo(
    () => normalizeAmenityItems(highlightList).map((item) => richText(item)),
    [richText, highlightList]
  );
  const noteItems = React.useMemo(
    () => (tourData.notes || []).map((note) => ({ ...note, text: richText(note.text) })),
    [richText, tourData.notes]
  );
  const faqItems = React.useMemo(
    () => (faqs || []).map((faq) => ({ ...faq, answer: richText(faq.answer) })),
    [richText, faqs]
  );

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

              {/* Trust band — sits in the rail so it lands level with the price
                  instead of below the twelfth section, where almost nobody
                  reached it. Its own component now, like every other section
                  of this page. */}
              <TrustBand />

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
                  {/* Guarded like the map and gallery tabs: only tours that
                      actually carry a packing list get the tab. */}
                  {whatToPackItems.length > 0 && (
                    <a href="#what-to-pack" className={`tour-nav-link ${activeSection === 'what-to-pack' ? 'active' : ''}`}>{t("tourDetails.nav.whatToPack", "Packing")}</a>
                  )}
                  <a href="#download-pdf" className={`tour-nav-link ${activeSection === 'download-pdf' ? 'active' : ''}`}>{t("tourDetails.nav.brochure")}</a>
                  <a href="#faqs" className={`tour-nav-link ${activeSection === 'faqs' ? 'active' : ''}`}>{t("tourDetails.nav.faq")}</a>
                  {/* No "Reviews" tab on purpose. The `#honest-reviews` section
                      IS still on the page -- an earlier note here said it was
                      gone, and that is what let the section linger in the scroll
                      spy's list with no tab to light. The spy now reads these
                      links, so an untabbed section can no longer blank the bar. */}
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
                        className='tour-listing-details__text html-content'
                        /* #595959 is the page's one secondary-text tone. This
                           block was #444, the itinerary #666 and the fact strips
                           #595959 — three greys a few percent apart, all meaning
                           the same thing. Contrast here goes 9.74:1 -> 7.00:1,
                           still well clear of AA. */
                        style={{ color: '#595959', fontSize: '1rem', lineHeight: '1.8' }}
                        dangerouslySetInnerHTML={{ __html: overviewHtml }}
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

                  {/* Tour Highlights — omitted entirely when the tour has none,
                      as every other list section on this page already does.
                      `tourHighlights` is optional in the admin (it is deleted on
                      save when blank), so without this guard such a tour printed
                      the gold rule and the "Highlight List" heading over nothing. */}
                  {highlightItems.length > 0 && (
                  <div className='tour-listing-details__content__item border-0 p-0'>
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div style={{ width: '4px', height: '24px', backgroundColor: '#b79c5c' }}></div>
                      <h2 className='tour-listing-details__title m-0' style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                        {t("tourDetails.highlightList")}
                      </h2>
                    </div>
                    {/* Row spacing is gutter-y-20 alone. Each item also carried mb-3, so
                        two spacing systems stacked into a 36px gap between rows and
                        left a stray 16px under the last one. paddingLeft:0 went too
                        — list-unstyled already sets it. */}
                    <ul className="list-unstyled row gutter-y-20">
                      {highlightItems.map((item, index) => (
                        <li key={index} className="col-md-6 col-lg-4">
                          <div className="d-flex align-items-start gap-3">
                            <div className="tour-highlight__check">
                              {/* Decorative: the check repeats before every
                                  highlight and names none of them. */}
                              <i className='icon-check-star' aria-hidden="true"></i>
                            </div>
                            <span
                              className="text-dark fw-medium html-content tour-highlight__text"
                              dangerouslySetInnerHTML={{ __html: item }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  )}
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
                                    <span className="html-content" dangerouslySetInnerHTML={{ __html: item }} />
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
                                    <span className="html-content" dangerouslySetInnerHTML={{ __html: item }} />
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
                {noteItems.length > 0 && (
                  <section id="important-notes" className="tour-section">
                    <div className="tour-notes-card p-3 p-md-4 rounded-3 shadow-sm">
                    <div className="mb-4 d-flex align-items-center gap-2">
                      <div className="tour-note__bar" aria-hidden="true"></div>
                      <h2 className="tour-listing-details__title tour-note__heading m-0">
                        {t("tourDetails.importantNotes", "Important Notes")}
                      </h2>
                    </div>
                    <div className="tour-note-list" id="tour-note-list">
                      {noteItems.map((note, index) => (
                        <div
                          key={index}
                          className={
                            "tour-note-item" +
                            (!showAllNotes && index >= NOTES_VISIBLE_ON_PHONE
                              ? " tour-note-item--folded"
                              : "")
                          }
                        >
                          {/* A heading, not a styled span: these are the
                              subheadings of the section and belong in the
                              document outline. */}
                          {note.title && (
                            <h3 className="tour-note__title">{note.title}</h3>
                          )}
                          <div
                            className="tour-note__text tour-listing-details__text html-content"
                            dangerouslySetInnerHTML={{ __html: note.text }}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Phone only -- the stylesheet hides the button above the
                        breakpoint, where nothing is folded. */}
                    {noteItems.length > NOTES_VISIBLE_ON_PHONE && (
                      <button
                        type="button"
                        className="tour-note-toggle"
                        onClick={() => setShowAllNotes((prev) => !prev)}
                        aria-expanded={showAllNotes}
                        aria-controls="tour-note-list"
                      >
                        <span>
                          {showAllNotes
                            ? t("tourDetails.notesShowLess", "View Fewer Notes")
                            : t("tourDetails.notesShowMore", "View All Notes")}
                        </span>
                        <ChevronDown
                          size={18}
                          className="tour-note-toggle__chevron"
                          style={{ transform: showAllNotes ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </button>
                    )}
                    </div>
                  </section>
                )}

                {/* What to Pack Section */}
                {whatToPackItems.length > 0 && (
                  <section id="what-to-pack" className="tour-section">
                    <div className="tour-listing-details__content__item tour-pack p-3 p-md-4 rounded-3 shadow-sm">
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <h2 className="tour-listing-details__title tour-pack__title m-0 d-flex align-items-center gap-2">
                          <i className="fas fa-suitcase tour-pack__icon" aria-hidden="true"></i>
                          {t("tourDetails.whatToPack", "What to Pack")}
                        </h2>
                      </div>
                      {/* A list in the markup, not only in the styling: the
                          content is authored as a list, so a screen reader
                          should announce it as one. */}
                      {React.createElement(
                        whatToPackOrdered ? "ol" : "ul",
                        { className: whatToPackListClass },
                        whatToPackItems.map((item, index) => (
                          <li
                            key={index}
                            className="tour-pack__item html-content"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        ))
                      )}
                    </div>
                  </section>
                )}

                {/* What You Will Love — sits between What to Pack and the gallery */}
                {tourData.whatYouWillLoveHtml && (
                  <section id="what-you-will-love" className="tour-section">
                    {/* p-4 up to md, p-5 above: the flat p-5 spent 96px of a
                        360px screen on horizontal padding. */}
                    <div className="tour-listing-details__what-you-love p-4 p-md-5 rounded-4 shadow-sm" style={{
                      background: 'linear-gradient(135deg, rgba(183, 156, 92, 0.08) 0%, rgba(183, 156, 92, 0.03) 100%)',
                      border: '1px solid rgba(183, 156, 92, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Decorative watermark: the same four-pointed sparkle the
                          benefit badges use, so the mark repeats at three scales
                          down the section. It replaced a 💎 character, which the
                          OS emoji font drew — grey-blue on Windows, bright blue
                          on macOS, different again on Android — so the shape was
                          never the one that had been signed off on. Drawing it
                          also drops the screen-reader problem the character had:
                          it was announced as "gem stone" mid-heading.
                          Opacity is 0.08 against the character's 0.04 because a
                          flat single-tone gold reads far fainter than a shaded
                          emoji at the same value — 0.06 was tried first and all
                          but disappeared. The intent is the presence the emoji
                          had, not more. This is the number to turn if it wants
                          to be quieter. */}
                      <div aria-hidden="true" style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '160px',
                        height: '160px',
                        opacity: 0.08,
                        transform: 'rotate(-15deg)',
                        pointerEvents: 'none'
                      }}>
                        <svg viewBox="0 0 24 24" width="160" height="160" fill="#b79c5c" focusable="false">
                          <path d="M12 1.5c.55 5.4 4.6 9.45 10 10-5.4.55-9.45 4.6-10 10-.55-5.4-4.6-9.45-10-10 5.4-.55 9.45-4.6 10-10z" />
                        </svg>
                      </div>

                      <div className="tour-listing-details__what-you-love__header d-flex align-items-center">
                        <div className="bg-white p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '58px', height: '58px' }}>
                          <i className="icon-star" aria-hidden="true" style={{ fontSize: '26px', color: '#b79c5c' }}></i>
                        </div>
                        <div>
                          <h2 className="m-0 fs-5 fw-bold text-dark" style={{ letterSpacing: '0.01em' }}>
                            {t("tourDetails.whatYouWillLove", "What You'll Love About This Tour")}
                          </h2>
                          <div style={{ width: '40px', height: '3px', borderRadius: '2px', backgroundColor: '#b79c5c', marginTop: '4px' }}></div>
                        </div>
                      </div>

                      {whatYouWillLoveSections ? (
                        <div className='tour-listing-details__text tour-listing-details__what-you-love__columns'>
                          {whatYouWillLoveSections.map((section, index) => (
                            <div
                              key={index}
                              className='html-content'
                              dangerouslySetInnerHTML={{ __html: section }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          className='tour-listing-details__text html-content'
                          dangerouslySetInnerHTML={{ __html: whatYouWillLoveHtml }}
                        />
                      )}
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
                  {faqItems.length > 0 ? (
                    <div className="tour-listing-details__faqs faq-section">
                      {/* No outer card. This section used to sit inside one
                          large bordered box, which made it read as a component
                          dropped onto the page rather than part of it. */}
                      <div className="mb-4">
                        <div className="faq-head mb-2">
                          <span className="faq-head__bar" aria-hidden="true" />
                          <h2 className='tour-listing-details__title m-0'>{t("tourDetails.faqTitle")}</h2>
                        </div>
                        <p className="tour-reviews-subtitle">{t("tourDetails.faqSubtitle")}</p>
                      </div>
                      {/* No theme class here any more: the list carries its own
                          styling, so nothing needs `.faq-accordion` from gotur.css. */}
                      <div className="tour-faq">
                        {/* EVERY question is rendered, always. The ones past
                            the fold are hidden in CSS rather than sliced out of
                            the array, so the full Q&A text ships in the server
                            HTML and stays crawlable -- and keeps matching the
                            FAQPage JSON-LD, which Google requires to be
                            page-visible. */}
                        <FaqAccordion
                          id="tour-faq-list"
                          idPrefix="tour-faq"
                          items={faqItems}
                          /* Rows past the fold are marked either way: folded
                             while hidden, revealed once shown, so the ones that
                             appear can be animated in. Rows inside the fold are
                             never touched — they must not re-animate every time
                             the button is pressed. */
                          rowClassName={(index) => {
                            if (index < FAQ_VISIBLE_COUNT) return undefined;
                            /* `--foldable` stays on in BOTH states so the row
                               has something to transition between. Adding it
                               only while open meant collapsing swapped the
                               class away and the closing had nothing to
                               animate. Rows inside the fold stay untouched. */
                            return showAllFaqs
                              ? "faq-list__row--foldable"
                              : "faq-list__row--foldable faq-list__row--folded";
                          }}
                        />

                        {faqItems.length > FAQ_VISIBLE_COUNT && (
                          <button
                            type="button"
                            className="faq-toggle-btn"
                            onClick={() => setShowAllFaqs((prev) => !prev)}
                            aria-expanded={showAllFaqs}
                            aria-controls="tour-faq-list"
                          >
                            <span>
                              {showAllFaqs
                                ? t("tourDetails.faqShowLess", "View Fewer Questions")
                                : t("tourDetails.faqShowMore", "View More Questions")}
                            </span>
                            <ChevronDown
                              size={18}
                              className="faq-toggle-btn__chevron"
                              style={{ transform: showAllFaqs ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </button>
                        )}
                      </div>

                      {/* Catches the reader who got through the questions and
                          still has a specific one. The button does nothing yet
                          -- where it should lead is still being decided. */}
                      <div className="faq-ask">
                        <span className="faq-ask__icon" aria-hidden="true">
                          <MessageCircle size={20} />
                        </span>
                        <div className="faq-ask__body">
                          <p className="faq-ask__title">{t("tourDetails.faqAskTitle", "Still have a question?")}</p>
                          <p className="faq-ask__text">
                            {t("tourDetails.faqAskText", "Tell us what you need and we'll help you plan the right version of this tour.")}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="faq-ask__button"
                          onClick={() => setAskOpen(true)}
                        >
                          {t("tourDetails.faqAskCta", "Ask Us About This Tour")}
                          <ArrowRight size={16} />
                        </button>
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

        {/* Related Blogs carousel: curated set, or a featured fallback. */}
        {relatedBlogCards.length > 0 && (
          <div className="section-space-top section-space-bottom" style={{ background: '#f8f9fb' }}>
            <Container>
                {/* `mb-5` gave the cards barely more air than the tagline
                    gives the title. The extra room is what lets the row read
                    as its own section rather than as a caption's overflow. */}
                <div className="sec-title text-center related-blogs-head">
                  <h6 className='sec-title__tagline'>{t("tourDetails.relatedBlogs.tagline", "Travel Stories")}</h6>
                  <h3 className='sec-title__title'>{t("tourDetails.relatedBlogs.title", "Related Blogs")}</h3>
                  <p className='related-blogs-head__text'>
                    {t(
                      "tourDetails.relatedBlogs.description",
                      "More travel inspiration, guides, and stories from Egypt."
                    )}
                  </p>
                  {relatedBlogCards.length > 1 && (
                    <div className='related-blogs-nav feature-package__bottom__nav owl-nav'>
                      <button
                        type='button'
                        className='owl-prev'
                        aria-label={t(
                          "tourDetails.relatedBlogs.previous",
                          "Previous related articles"
                        )}
                        onClick={() => relatedBlogsSliderRef.current?.slidePrev()}
                      >
                        <span className='icon-arrow-left' aria-hidden='true'></span>
                      </button>
                      <button
                        type='button'
                        className='owl-next'
                        aria-label={t(
                          "tourDetails.relatedBlogs.next",
                          "Next related articles"
                        )}
                        onClick={() => relatedBlogsSliderRef.current?.slideNext()}
                      >
                        <span className='icon-arrow-right' aria-hidden='true'></span>
                      </button>
                    </div>
                  )}
                </div>
                <Swiper
                  onSwiper={(instance) => {
                    relatedBlogsSliderRef.current = instance;
                  }}
                  className='related-blogs-carousel'
                  spaceBetween={30}
                  rewind
                  speed={700}
                  breakpoints={{
                    0: { slidesPerView: 1 },
                    576: { slidesPerView: 2 },
                    992: { slidesPerView: 3 },
                  }}
                >
                  {relatedBlogCards.map((post) => (
                    <SwiperSlide key={post.id}>
                      <BlogCard post={post} variant='feature' />
                    </SwiperSlide>
                  ))}
                </Swiper>
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

      {/* Mounted at the root, not inside the FAQ section, so the overlay is not
          trapped by any ancestor's stacking or overflow context. */}
      <TourQuestionModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        tourName={title || ""}
        tourSlug={tourSlug}
        locale={i18n.language || String(params?.locale || "en")}
        /* A second route for the visitor who would rather not fill in a form.
           Omitted when the tour has no title, since the message names it --
           the modal hides the button when this is undefined. */
        whatsappHref={
          title
            ? waHref(t("tourDetails.askModal.whatsappMessage", { tour: title }))
            : undefined
        }
      />

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
