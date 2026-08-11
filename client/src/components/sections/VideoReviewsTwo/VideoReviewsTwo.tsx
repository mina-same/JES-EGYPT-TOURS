"use client";
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface HomeVideoReview {
  _id: string;
  /** Already resolved to the request locale by the API. */
  title: string;
  tourName: string;
  url: string;
  videoId: string;
}

interface VideoReviewsTwoProps {
  reviews: HomeVideoReview[];
}

/**
 * Traveller video reviews on the homepage, managed under
 * Content Management → Video Management.
 *
 * The data was reaching `GET /api/video-reviews` and stopping there: the admin
 * screens could create and order these, but no visitor page had ever read
 * them, so anything entered was invisible. This is the missing consumer.
 *
 * Renders nothing at all when there is no active video — no heading, no empty
 * state, no spacing. An empty "Video Reviews" band is worse than no band.
 */
const VideoReviewsTwo: React.FC<VideoReviewsTwoProps> = ({ reviews }) => {
  const { t } = useTranslation("common");

  const playable = (reviews || []).filter((review) => review?.videoId);
  if (playable.length === 0) return null;

  return (
    <section className="video-reviews-two section-space">
      <Container>
        <div className="section-title text-center">
          <span className="section-title__tagline">
            {t("videoReviews.tagline", "Real Travellers")}
          </span>
          <h2 className="section-title__title">
            {t("videoReviews.title", "Video Reviews")}
          </h2>
        </div>

        <Row className="gutter-y-30">
          {playable.map((review) => (
            <Col lg={4} md={6} key={review._id}>
              <div className="video-reviews-two__item">
                <div className="ratio ratio-16x9 video-reviews-two__frame">
                  <iframe
                    // nocookie: the same host the tour page uses, so an embed
                    // on the homepage does not set tracking cookies before the
                    // visitor has interacted with anything.
                    src={`https://www.youtube-nocookie.com/embed/${review.videoId}`}
                    title={review.title || review.tourName || "Video review"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="video-reviews-two__body">
                  {review.title && (
                    <h3 className="video-reviews-two__title">{review.title}</h3>
                  )}
                  {review.tourName && (
                    <p className="video-reviews-two__tour">{review.tourName}</p>
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default VideoReviewsTwo;
