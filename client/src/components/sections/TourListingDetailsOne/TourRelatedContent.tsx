"use client";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { Container } from "react-bootstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import BlogCard from "@/components/common/BlogCard/BlogCard";
import { buildBlogCardViewModels } from "@/lib/blog/cardViewModel";
import FeatureTwo from "../FeatureTwo/FeatureTwo";
import { useTourRelatedContent } from "./useTourRelatedContent";

interface TourRelatedContentProps {
  /** The tour's URL slug. */
  id?: string;
  /** The raw tour the related content is looked up for. */
  tour: any;
}

/**
 * Related Tours, Related Blogs and More Tours, below the tour itself.
 *
 * Their data is loaded and held HERE so its arrival re-renders only these
 * sections; as page state it re-rendered the entire tour page.
 */
const TourRelatedContent: React.FC<TourRelatedContentProps> = ({ id, tour }) => {
  const { relatedTours, moreTours, relatedBlogs } = useTourRelatedContent(id, tour);
  const { t, i18n } = useTranslation("tours");
  const params = useParams() as { locale: string };
  const relatedBlogsSliderRef = useRef<SwiperClass | null>(null);

  const relatedBlogCards = React.useMemo(
    () => buildBlogCardViewModels(relatedBlogs, i18n.language || params?.locale || "en"),
    [relatedBlogs, i18n.language, params?.locale]
  );

  return (
    <>
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
            keepCardsOnSliderInit
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
            keepCardsOnSliderInit
          />
        )}
    </>
  );
};

export default TourRelatedContent;
