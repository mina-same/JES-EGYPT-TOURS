'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container, Row, Col } from 'react-bootstrap';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

type SectionHeaderImage = {
  url: string;
  alt?: string;
  title?: string;
};

type SectionHeaderButton = {
  label?: string;
  href?: string;
  newTab?: boolean;
};

const COLLAPSED_HEIGHT = 250;
const EXPANDED_HEIGHT = 400;

export default function EnhancedSectionHeader({
  title,
  descriptionHtml,
  button,
  images,
  priorityFirstImage = false,
}: {
  title?: string;
  descriptionHtml?: string;
  button?: SectionHeaderButton;
  images?: SectionHeaderImage[];
  /**
   * Preload the first slide. OFF by default, and deliberately so.
   *
   * Every caller today renders this section directly beneath PageHeader's
   * full-viewport hero, so slide one is never in the first screen — yet it
   * used to be marked `priority`, which had Next emit a second
   * `<link rel="preload" as="image">` beside the hero's. On a 390px phone
   * that preload was 116.0 KB against the hero's 37.9 KB: three times the
   * weight of the actual LCP element, fetched at the same priority, over the
   * same connection, while the render-blocking CSS was still arriving.
   *
   * The capability is kept rather than deleted because a future page could
   * legitimately open with this section. Such a page opts in; it does not
   * inherit the cost by accident.
   */
  priorityFirstImage?: boolean;
}) {
  const safeImages = useMemo(() => (Array.isArray(images) ? images.filter((i) => !!i?.url) : []), [images]);
  const hasMedia = safeImages.length > 0;

  const descInnerRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  /*
   * The only measurement left, and the only one that needs the DOM: whether the
   * description is taller than its collapsed box, which decides if "Read More"
   * is offered at all. It genuinely cannot be answered in CSS — `scrollHeight`
   * against a clamped box has no stylesheet equivalent — and it has to re-run on
   * resize, because a narrower column wraps the same text into more lines.
   *
   * What used to live here as well was a second measurement that read the TEXT
   * column's height and wrote it onto the image column as an inline style, so
   * the photo would match the prose beside it. That is what `align-items:
   * stretch` on the row already does, in CSS, without a layout read — and the JS
   * version was subtly wrong anyway: it measured before `isOverflowing` had
   * added the Read More button, leaving the image 38px short of its own column
   * on every desktop render.
   */
  useEffect(() => {
    const measureOverflow = () => {
      const inner = descInnerRef.current;
      if (!inner) return;
      setIsOverflowing(inner.scrollHeight > COLLAPSED_HEIGHT + 6);
    };

    measureOverflow();
    window.addEventListener('resize', measureOverflow);
    return () => window.removeEventListener('resize', measureOverflow);
  }, [descriptionHtml, title, button, expanded]);

  const onToggle = () => {
    const wasExpanded = expanded;
    setExpanded(!expanded);

    if (!wasExpanded) {
      setTimeout(() => {
        const element = descriptionRef.current;
        if (!element) return;
        const y = element.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 400);
    }
  };

  const hasButton = !!button?.label && !!button?.href;

  return (
    <section className="section-space-top">
      <style jsx>{`
        :global(.swiper-pagination-bullet) {
          background: rgba(255, 255, 255, 0.7) !important;
          opacity: 0.6 !important;
          width: 10px;
          height: 10px;
        }
        :global(.swiper-pagination-bullet-active) {
          background: #b79c5c !important;
          opacity: 1 !important;
          width: 24px;
          border-radius: 5px;
        }
      `}</style>
      <Container>
        <Row className="align-items-stretch gutter-y-30">
          {hasMedia ? (
            <Col lg={5}>
              {/*
                Height in CSS, not JavaScript.

                Side by side (Bootstrap's lg, 992px up) the row is
                `align-items-stretch`, so this column is already as tall as the
                prose beside it; `height: 100%` simply fills it. The arbitrary
                media query matches Bootstrap's 992px rather than Tailwind's
                `lg:` (1024px), which would otherwise leave a 32px window where
                the columns had stacked but the height rule had not switched.

                Stacked below that, there is no sibling to stretch against, so
                the box needs a size of its own: a 16/9 crop, floored at 250px —
                the component's own COLLAPSED_HEIGHT — so a narrow phone still
                shows a real photo rather than a sliver. The images are
                `object-cover`, so this re-crops rather than distorts.
              */}
              <div
                className="relative w-full overflow-hidden aspect-[16/9] min-h-[250px] [@media(min-width:992px)]:aspect-auto [@media(min-width:992px)]:h-full [@media(min-width:992px)]:min-h-0"
                style={{ borderRadius: 16 }}
              >
                <Swiper
                  modules={[Navigation, Pagination]}
                  slidesPerView={1}
                  loop={safeImages.length > 1}
                  navigation={{
                    prevEl: '.esh-prev',
                    nextEl: '.esh-next',
                  }}
                  pagination={{ clickable: true }}
                  className="h-full w-full"
                >
                  {safeImages.map((img, idx) => (
                    <SwiperSlide key={`${img.url}-${idx}`}>
                      <div className="relative h-full w-full">
                        <Image
                          src={img.url}
                          alt={img.alt || img.title || title || `Image ${idx + 1}`}
                          title={img.title || img.alt || title || `Image ${idx + 1}`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-cover"
                          priority={priorityFirstImage && idx === 0}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {safeImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="esh-prev absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow transition hover:bg-white"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="esh-next absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow transition hover:bg-white"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
            </Col>
          ) : null}

          <Col lg={hasMedia ? 7 : 12}>
            {title ? (
              <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12 }}>{title}</h2>
            ) : null}

            {descriptionHtml ? (
              <div className="relative">
                <div
                  ref={descriptionRef}
                  className={`enhanced-section-header__description relative transition-all duration-700 ease-in-out ${expanded ? 'is-expanded' : 'is-collapsed'}`}
                >
                  <div
                    ref={descInnerRef}
                    className="text-gray-700 prose prose-sm max-w-none [&_a]:font-semibold [&_a]:text-[#b79c5c] [&_a]:no-underline hover:[&_a]:underline"
                  >
                    <div dangerouslySetInnerHTML={{ __html: String(descriptionHtml) }} />
                  </div>

                  {!expanded && isOverflowing ? (
                    <div className="pointer-events-none absolute bottom-0 left-0 h-[60px] w-full bg-gradient-to-t from-white to-transparent transition-opacity duration-300" />
                  ) : null}
                </div>

                {isOverflowing ? (
                  <div className="mt-2 mb-4 flex justify-center md:justify-start">
                    <button
                      type="button"
                      onClick={onToggle}
                      className="group flex items-center gap-2 border-b-2 border-[#b79c5c] pb-1 text-[12px] font-black uppercase tracking-widest text-[#b79c5c] transition-all duration-300 hover:border-[#1d231f] hover:text-[#1d231f]"
                    >
                      {expanded ? (
                        <>Show Less <ChevronUp size={16} className="transition-transform group-hover:-translate-y-1" /></>
                      ) : (
                        <>Read More <ChevronDown size={16} className="transition-transform group-hover:translate-y-1" /></>
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {hasButton ? (
              <div style={{ marginTop: 18 }}>
                <Link
                  href={button!.href!}
                  className="gotur-btn transition-all group flex items-center justify-center gap-3"
                  target={button!.newTab ? '_blank' : undefined}
                  rel={button!.newTab ? 'noreferrer noopener' : undefined}
                  style={{ width: 'fit-content' }}
                >
                  <span className="font-bold">{button!.label}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-all duration-300 group-hover:bg-[#1d231f] group-hover:translate-x-1">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                </Link>
              </div>
            ) : null}
          </Col>
        </Row>
      </Container>
      <style jsx global>{`
        .enhanced-section-header__description {
          font-size: 16px;
          line-height: 1.8;
          color: #666;
          scrollbar-width: thin;
          scrollbar-color: #b79c5c #f1f1f1;
        }

        .enhanced-section-header__description.is-expanded {
          max-height: ${EXPANDED_HEIGHT}px !important;
          overflow-y: auto !important;
          padding-right: 15px;
        }

        .enhanced-section-header__description.is-collapsed {
          max-height: ${COLLAPSED_HEIGHT}px !important;
          overflow-y: hidden !important;
          padding-right: 0;
        }

        .enhanced-section-header__description img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5rem 0;
        }

        .enhanced-section-header__description h1,
        .enhanced-section-header__description h2,
        .enhanced-section-header__description h3,
        .enhanced-section-header__description h4,
        .enhanced-section-header__description h5,
        .enhanced-section-header__description h6 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #1d231f;
          font-weight: 700;
        }

        .enhanced-section-header__description p {
          margin-bottom: 1.25rem;
        }

        .enhanced-section-header__description ul,
        .enhanced-section-header__description ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
          list-style-position: outside;
        }

        .enhanced-section-header__description ul {
          list-style-type: disc;
        }

        .enhanced-section-header__description ol {
          list-style-type: decimal;
        }

        .enhanced-section-header__description li {
          margin-bottom: 0.5rem;
        }

        .enhanced-section-header__description strong,
        .enhanced-section-header__description b {
          color: #1d231f;
          font-weight: 700;
        }

        .enhanced-section-header__description::-webkit-scrollbar {
          width: 5px;
        }

        .enhanced-section-header__description::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .enhanced-section-header__description::-webkit-scrollbar-thumb {
          background: #b79c5c;
          border-radius: 10px;
        }

        .enhanced-section-header__description::-webkit-scrollbar-thumb:hover {
          background: #1d231f;
        }

        @media (max-width: 991px) {
          .enhanced-section-header__description {
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
