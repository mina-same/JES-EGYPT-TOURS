import React from "react";
import EmptyState from "@/components/common/EmptyState/EmptyState";

interface TourAmenitiesSectionProps {
  amenities: string[];
  amenitiesTwo: string[];
}

export const TourAmenitiesSection: React.FC<TourAmenitiesSectionProps> = ({ 
  amenities, 
  amenitiesTwo 
}) => {
  if ((!amenities || amenities.length === 0) && (!amenitiesTwo || amenitiesTwo.length === 0)) {
    return (
      <EmptyState
        title="No Amenities Information"
        description="There are currently no amenities or inclusions/exclusions listed for this tour."
        icon="file"
        size="medium"
      />
    );
  }

  return (
    <div className='tour-listing-details__content__item tour-listing-details__amenities'>
      <div className="mb-4">
        <h4 className='tour-listing-details__title mb-2'>Tour Amenities</h4>
        <p className="tour-reviews-subtitle">Comprehensive list of what's provided for your comfortable journey.</p>
      </div>
      <div className="row gutter-y-30">
        {amenities && amenities.length > 0 && (
          <div className="col-lg-6">
            <div className="amenities-card inclusion-card">
              <div className="amenities-card-header">
                <div className="amenities-icon-wrapper inclusion-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h4 className='amenities-card-title'>What's Included</h4>
              </div>
              <ul className='amenities-card-list'>
                {amenities.map((amenity, index) => (
                  <li key={index} className="amenities-card-item">
                    <i className='fas fa-check'></i>
                    <span>{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {amenitiesTwo && amenitiesTwo.length > 0 && (
          <div className="col-lg-6">
            <div className="amenities-card exclusion-card">
              <div className="amenities-card-header">
                <div className="amenities-icon-wrapper exclusion-icon">
                  <i className="fas fa-times-circle"></i>
                </div>
                <h4 className='amenities-card-title'>What's Not Included</h4>
              </div>
              <ul className='amenities-card-list'>
                {amenitiesTwo.map((amenity, index) => (
                  <li key={index} className="amenities-card-item">
                    <i className='fas fa-times'></i>
                    <span>{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
