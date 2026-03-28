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

import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const DEFAULT_HEIGHT = 240;

export default function EnhancedSectionHeader({
  title,
  descriptionHtml,
  button,
  images,
}: {
  title?: string;
  descriptionHtml?: string;
  button?: SectionHeaderButton;
  images?: SectionHeaderImage[];
}) {
  const safeImages = useMemo(() => (Array.isArray(images) ? images.filter((i) => !!i?.url) : []), [images]);
  const hasMedia = safeImages.length > 0;

  const contentRef = useRef<HTMLDivElement | null>(null);
  const descInnerRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(DEFAULT_HEIGHT);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const measure = () => {
      const content = contentRef.current;
      const inner = descInnerRef.current;
      if (!content || !inner) return;
      
      // Measure actual content height
      const height = content.getBoundingClientRect().height;
      setContentHeight(Math.max(DEFAULT_HEIGHT, height));
      
      // Check if description overflows its container
      const overflowing = inner.scrollHeight > DEFAULT_HEIGHT + 6;
      setIsOverflowing(overflowing);
    };
    
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [descriptionHtml, title, button]);

  const onToggle = () => {
    setExpanded((v) => !v);
    requestAnimationFrame(() => {
      const inner = descInnerRef.current;
      if (inner) inner.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
              <div
                className="relative w-full overflow-hidden"
                style={{ height: contentHeight, borderRadius: 16 }}
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
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-cover"
                          priority={idx === 0}
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

          <Col lg={hasMedia ? 7 : 12} ref={contentRef}>
            {title ? (
              <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12 }}>{title}</h2>
            ) : null}

            {descriptionHtml ? (
              <div className="relative">
                <div
                  className={'relative overflow-hidden ' + (expanded ? 'overflow-y-auto' : '')}
                  style={{ maxHeight: DEFAULT_HEIGHT }}
                >
                  <div
                    ref={descInnerRef}
                    className="text-gray-700 prose prose-sm max-w-none [&_a]:font-semibold [&_a]:text-[#b79c5c] [&_a]:no-underline hover:[&_a]:underline"
                  >
                    <div dangerouslySetInnerHTML={{ __html: String(descriptionHtml) }} />
                  </div>

                  {!expanded && isOverflowing ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent" />
                  ) : null}
                </div>

                {isOverflowing ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onToggle}
                      className="inline-flex items-center gap-1 rounded-md bg-[#b79c5c]/10 px-3 py-1 text-sm font-semibold text-[#8a6e2d] transition hover:bg-[#b79c5c]/20"
                    >
                      {expanded ? 'Show less' : 'Read more'}
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
    </section>
  );
}
