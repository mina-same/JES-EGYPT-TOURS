import React from "react";

interface TourDescriptionSectionProps {
  overviewTitle: string;
  overview: string;
  whatYouWillLoveHtml?: string;
  highlightList: string[];
}

export const TourDescriptionSection: React.FC<TourDescriptionSectionProps> = ({
  overviewTitle,
  overview,
  whatYouWillLoveHtml,
  highlightList,
}) => {
  return (
    <div className='tour-listing-details__content__item'>
      <div className='tour-listing-details__content__text mb-5'>
        <h4 className='tour-listing-details__title'>
          {overviewTitle}
        </h4>
        <div
          className='tour-listing-details__text'
          dangerouslySetInnerHTML={{ __html: overview }}
        />
        {whatYouWillLoveHtml && (
          <div
            className="tour-listing-details__what-you-love border-top pt-4 mt-4"
            dangerouslySetInnerHTML={{ __html: whatYouWillLoveHtml }}
          />
        )}
      </div>

      {highlightList && highlightList.length > 0 && (
        <div className='tour-listing-details__content__item tour-listing-details__list bg-light p-4 rounded-4 shadow-sm border-0'>
          <h4 className='tour-listing-details__title mb-4'>
            Highlight List
          </h4>
          <ul className='tour-listing-details__content__list list-unstyled d-flex flex-wrap'>
            {highlightList.map((item, index) => (
              <li key={index} className="w-50 mb-3 pe-3">
                <i className='icon-check-star me-2' style={{ color: '#b79c5c' }}></i> {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
