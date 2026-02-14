import React from 'react';

interface TourNavigationProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  hasReviewVideos: boolean;
  reviewVideosCount: number;
  commentsCount: number;
}

const NAV_SECTIONS = [
  { id: 'description', label: 'Description' },
  { id: 'tour-plan', label: 'Tour Plan' },
  { id: 'amenities', label: 'Tour Amenities' },
  { id: 'pricing', label: 'Pricing Plans' },
  { id: 'gallery', label: 'Tour Gallery' },
  { id: 'faqs', label: 'Tour FAQ' },
] as const;

export const TourNavigation: React.FC<TourNavigationProps> = ({
  activeSection,
  onSectionClick,
  hasReviewVideos,
  reviewVideosCount,
  commentsCount
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    onSectionClick(sectionId);
  };

  return (
    <div className="tour-details-nav-wrapper bg-white" style={{ borderBottom: '2px solid #f0f0f0', marginBottom: '40px' }}>
      <nav className="tour-details-nav">
        {NAV_SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`tour-nav-link ${activeSection === id ? 'active' : ''}`}
            onClick={(e) => handleClick(e, id)}
          >
            {label}
          </a>
        ))}
        
        {hasReviewVideos && (
          <a
            href="#honest-reviews"
            className={`tour-nav-link ${activeSection === 'honest-reviews' ? 'active' : ''}`}
            onClick={(e) => handleClick(e, 'honest-reviews')}
          >
            Reflective & Honest Reviews
            <span className="review-count">{reviewVideosCount}</span>
          </a>
        )}
        
        <a
          href="#reviews"
          className={`tour-nav-link ${activeSection === 'reviews' ? 'active' : ''}`}
          onClick={(e) => handleClick(e, 'reviews')}
        >
          Tour Reviews
          <span className="review-count">{commentsCount}</span>
        </a>
      </nav>
    </div>
  );
};
