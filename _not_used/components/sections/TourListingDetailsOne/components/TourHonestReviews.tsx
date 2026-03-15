import React from "react";

interface ReviewVideo {
  videoId: string;
  title: string;
  url: string;
}

interface TourHonestReviewsProps {
  reviewVideos: ReviewVideo[];
}

export const TourHonestReviews: React.FC<TourHonestReviewsProps> = ({ reviewVideos }) => {
  if (!reviewVideos || reviewVideos.length === 0) return null;

  return (
    <div className='tour-listing-details__content__item'>
      <div className="mb-4">
        <h4 className='tour-listing-details__title mb-2'>Reflective & Honest Reviews</h4>
        <p className="tour-reviews-subtitle">Watch real experiences from travelers on YouTube.</p>
      </div>
      <div className="row gutter-y-30">
        {reviewVideos.map((v, idx) => (
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
                  Open on YouTube
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
