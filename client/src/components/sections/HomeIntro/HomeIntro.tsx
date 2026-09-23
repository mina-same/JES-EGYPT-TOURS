"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { generalContentAPI } from "@/lib/api/generalContent";
import { ChevronDown, ChevronUp, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";

/** Raw, all-locales document as the API returns it. */
export interface HomeIntroContent {
  title: any;
  subtitle?: any;
  content: any;
}

type HomeIntroProps = {
  /**
   * Fetched on the server by the homepage.
   *
   * This section used to fetch its own copy in a useEffect: the long-form,
   * keyword-dense intro — exactly the content the homepage should rank for —
   * was absent from the server-rendered HTML, and a crawler that does not run
   * JavaScript saw none of it. Visitors saw a spinner, then a block of a
   * completely different height dropping in and shoving the page down.
   *
   * Same `initialX` pattern as HomeFAQ, FeaturedToursSection and BlogTwoTwo.
   */
  initialContent?: HomeIntroContent | null;
};

/** Clamp height in px. Must match the maxHeight applied below — one value. */
const COLLAPSED_HEIGHT = 220;
/** Sub-pixel rounding alone is not worth a "read more" button. */
const OVERFLOW_TOLERANCE = 4;

const HomeIntro: React.FC<HomeIntroProps> = ({ initialContent = null }) => {
  const { i18n, t } = useTranslation("common");
  const [content, setContent] = useState<HomeIntroContent | null>(initialContent);
  const [loading, setLoading] = useState(!initialContent);
  const [isExpanded, setIsExpanded] = useState(false);

  const localizedTitle = getLocalizedValue(content?.title, i18n.language);
  const localizedSubtitle = getLocalizedValue(content?.subtitle, i18n.language);
  const localizedContent = getLocalizedValue(content?.content, i18n.language);

  /**
   * Already sanitized — by the API, at the moment an editor saved it.
   *
   * A chain of regex replaces used to run here instead. It was the only
   * sanitization anywhere on the site (the FAQ answers below this section had
   * none at all), and it did not work: it stripped `<script>` but not, say,
   * `<svg` with a newline before `onload=`, and its blanket
   * `.replace(/data:/gi, "")` corrupted legitimate content that merely
   * contained the word. Sanitization now lives in one place, on write —
   * server/src/utils/sanitizeRichText.ts.
   */
  const sanitizedContent = localizedContent || "";

/*
 * ── Collapse ──
 * The narrative is clamped to COLLAPSED_HEIGHT, and the "read more" control
 * plus the fade above it appear ONLY when there is something hidden behind
 * them. Both used to render unconditionally: with a short intro the button
 * expanded nothing (max-height went 220px -> 4000px over content 150px tall,
 * so no movement at all) and the 96px fade sat over perfectly readable text,
 * making it look truncated when it was not.
 */

  const narrativeId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  /*
   * Starts from whether there is content at all, NOT from `false`.
   *
   * `false` would mean the server renders the intro unclamped and hydration
   * then collapses it — measured at ~725px down to 220px on the English copy,
   * shoving every section below it upward. Assuming it overflows puts the
   * clamp in the server HTML, so the common case (a long intro, which is why
   * this control exists) moves not at all; only a short one loses its button
   * after the first measurement. Same reasoning, and the same starting value,
   * as useLineClamp in src/hooks.
   *
   * It is derived, not a constant, so an empty intro never renders a fade and
   * a button over nothing. The expression is deterministic, so the server and
   * the client's first render agree and hydration matches.
   */
  const [overflows, setOverflows] = useState(
    () => sanitizedContent.trim().length > 0
  );

  /*
   * The content's natural height, so opening can be ANIMATED.
   *
   * A transition needs a length at both ends: `max-height` going from 220px to
   * `none` is a jump, because `none` is not a length and nothing interpolates
   * to it. Measuring the open height here — the inner element is never clamped,
   * so scrollHeight is the real one whatever the wrapper is doing — gives the
   * second length. Same technique as `--desc-full` in useLineClamp.
   *
   * It is re-measured by the observer below, so a resize while expanded keeps
   * the box the right height instead of freezing at the old one.
   */
  const [fullHeight, setFullHeight] = useState<number | null>(null);

  useEffect(() => {
    /*
     * Measured on the INNER element, which is never clamped — the max-height
     * lives on its parent. Measuring the parent instead is circular: with no
     * overflow detected there is no clamp, so scrollHeight equals clientHeight,
     * so no overflow is ever detected, and long content stays undetected
     * forever.
     *
     * contentRef is read on every call rather than captured, so a measurement
     * queued before unmount finds nothing and returns instead of setting state.
     */
    const measure = () => {
      const content = contentRef.current;
      if (!content) return;
      const natural = content.scrollHeight;
      setOverflows(natural > COLLAPSED_HEIGHT + OVERFLOW_TOLERANCE);
      setFullHeight(natural);
    };

    measure();

    let cancelled = false;
    // Web fonts land after first paint and change where lines break, so the
    // height measured before they arrive is not the final one.
    document.fonts?.ready
      .then(() => {
        if (!cancelled) measure();
      })
      .catch(() => {});

    // One observer, on the content itself. A change of the parent's width
    // reflows this element and therefore changes ITS box, which is what
    // ResizeObserver reports — so watching the parent as well would only add
    // callbacks on expand/collapse without changing the answer.
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (observer && contentRef.current) observer.observe(contentRef.current);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [sanitizedContent]);

  useEffect(() => {
    // Fallback path only — the homepage passes initialContent. This runs when
    // the server fetch failed, so the section still appears for the visitor.
    if (initialContent) {
      setContent(initialContent);
      setLoading(false);
      return;
    }

    let alive = true;
    const fetchContent = async () => {
      try {
        const response = await generalContentAPI.getBySlug("home-intro");
        if (alive && response.success) {
          setContent(response.data);
        }
      } catch (err) {
        console.error("Error fetching home intro:", err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchContent();
    return () => {
      alive = false;
    };
  }, [initialContent]);

  // Nothing is rendered while the fallback fetch runs. The spinner that used
  // to sit here occupied a py-20 box and was then replaced by content of a
  // completely different height, shoving everything below it down the page.
  // With the copy arriving from the server this branch is unreachable in the
  // normal path anyway.
  if (loading || !content) return null;
  
  /**
   * The heading is one CMS field; everything after the first colon is styled
   * as the gold accent line.
   *
   * This used to be `split(':')` reading parts [0] and [1], which threw away
   * everything after a SECOND colon. "Egypt: Land of Pharaohs: A Journey
   * Through Time" rendered as "Egypt" / "Land of Pharaohs" and the rest
   * vanished — no error, nothing in the console, just a shorter heading than
   * the editor typed. Splitting once keeps the remainder intact.
   */
  const separator = localizedTitle ? localizedTitle.indexOf(":") : -1;
  const mainTitle =
    separator === -1 ? localizedTitle || "" : localizedTitle.slice(0, separator);
  const highlightTitle =
    separator === -1 ? "" : localizedTitle.slice(separator + 1).trim();

  return (
    <section className="relative py-20 overflow-hidden bg-[#fafafa]">
      <Container>
        <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-100/50 overflow-hidden relative">
          
          {/* Decorative Background Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#b79c5c]/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1a1a1a]/5 rounded-full -ml-20 -mb-20 blur-[60px] pointer-events-none"></div>

          <Row className="g-0 items-stretch">
            {/* Content Side */}
            <Col lg={7} className="p-8 md:p-12 lg:p-20 flex flex-col justify-center order-2 lg:order-1 relative z-10">
              <div className="space-y-8">
                
                {/* Decorative Badge */}
                <div className="inline-flex items-center gap-3">
                  <div className="w-12 h-[2px] bg-[#b79c5c] rounded-full"></div>
                  <span className="text-[#b79c5c] font-black uppercase tracking-[0.25em] text-[10px] md:text-xs">
                    {localizedSubtitle || t("homeIntro.fallbackSubtitle")}
                  </span>
                </div>

                {/* Impactful Heading */}
                <h2 className="text-[#1a1a1a] font-extrabold text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
                  {mainTitle}
                  {highlightTitle && (
                    <span className="block text-[#b79c5c] mt-3 italic font-serif font-normal opacity-95 low-italic-fix">
                      {highlightTitle}
                    </span>
                  )}
                </h2>

                {/* Narrative with Smart Expansion */}
                <div className="relative group">
                  {/* `transition-[max-height]`, not `transition-all`: the old
                      rule animated every animatable property on an element
                      carrying `prose` and `leading-[1.8]`, each for a full
                      second. `motion-reduce` drops the animation for readers
                      who ask for less motion — the states are unchanged. */}
                  <div
                    id={narrativeId}
                    className="overflow-hidden prose prose-lg max-w-none text-gray-500 font-medium leading-[1.8] transition-[max-height] duration-700 ease-in-out motion-reduce:transition-none"
                    style={{
                      // Both ends are LENGTHS so the box can animate between
                      // them. Open uses the measured natural height plus a few
                      // pixels of slack for sub-pixel rounding; `none` would
                      // have made opening a jump. Undefined only when nothing
                      // is hidden, so a short intro carries no clamp at all.
                      //
                      // The old `isExpanded ? '4000px' : '220px'` also capped
                      // the OPEN state at 4000px — a silent ceiling that
                      // truncated any longer intro with nothing to reveal it.
                      maxHeight: !overflows
                        ? undefined
                        : isExpanded
                          ? `${(fullHeight ?? COLLAPSED_HEIGHT) + 8}px`
                          : `${COLLAPSED_HEIGHT}px`,
                    }}
                  >
                    <div
                      ref={contentRef}
                      className="narrative-html"
                      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />
                  </div>

                  {overflows && !isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
                  )}
                </div>

                {/* Interactive Controls — only when there is something to
                    reveal. This rendered unconditionally, so a short intro got
                    a button that expanded nothing. */}
                {overflows && (
                  <div className="flex flex-wrap items-center gap-8 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      aria-expanded={isExpanded}
                      aria-controls={narrativeId}
                      className="group flex items-center gap-2 text-[#1a1a1a] font-black uppercase text-[11px] tracking-widest border-b-2 border-[#b79c5c] pb-1 hover:text-[#b79c5c] transition-colors duration-300"
                    >
                      {isExpanded ? (
                        <>{t("homeIntro.readLess")} <ChevronUp size={16} aria-hidden="true" className="group-hover:-translate-y-1 transition-transform" /></>
                      ) : (
                        <>{t("homeIntro.readMore")} <ChevronDown size={16} aria-hidden="true" className="group-hover:translate-y-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                )}

                {/* Trust Footer */}
                <div className="pt-10 border-t border-gray-100 flex flex-wrap gap-x-10 gap-y-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">{t("homeIntro.licensedAgency")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={22} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">{t("homeIntro.heritageExperts")}</span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Visual Side */}
            <Col lg={5} className="relative min-h-[500px] lg:min-h-full order-1 lg:order-2">
              <div className="absolute inset-0">
                {/* The site's own photograph, not an Unsplash hotlink: the
                    remote URL made this section depend on a third-party CDN
                    and forced the image optimizer to allow that host.

                    NO `priority`. This is the third section down, well below
                    the fold, and `priority` emits a <link rel="preload"> that
                    competed directly with the hero — the actual LCP element —
                    for early bandwidth. */}
                <Image
                  src="/images/about/private-egypt-tours-planned-around-you-giza-pyramids.webp"
                  alt={t("homeIntro.imageAlt")}
                  fill
                  sizes="(max-width: 991px) 100vw, 42vw"
                  className="object-cover transition-transform duration-[20s] hover:scale-110 ease-out"
                />
                
                {/* Sophisticated Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/90 via-transparent to-transparent lg:bg-gradient-to-l lg:from-[#1a1a1a]/40 lg:via-transparent"></div>
                
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      <style jsx global>{`
        .narrative-html p {
          margin-bottom: 1.5rem;
        }
        .narrative-html p:last-child {
          margin-bottom: 0;
        }
        .narrative-html a {
          color: #b79c5c;
          text-decoration: underline;
          font-weight: 600;
        }
        .narrative-html a:hover {
          opacity: 0.9;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        @media (max-width: 991px) {
          .low-italic-fix {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </section>
  );
};

export default HomeIntro;
