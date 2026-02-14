import React from "react";
import { BookingForm } from "./BookingForm";

interface TourSidebarProps {
  tourId: string;
  map?: string;
  onBookingSubmit: (data: any) => void;
}

export const TourSidebar: React.FC<TourSidebarProps> = ({ tourId, map, onBookingSubmit }) => {
  return (
    <div className='tour-listing-details__sidebar'>
      <BookingForm tourId={tourId || ''} onSubmit={onBookingSubmit} />

      <div className='tour-listing-details__sidebar__item tour-listing-details__sidebar__item-location'>
        <div className='tour-listing-details__sidebar__item-box'>
          {map && (
            <iframe
              title='Google Map'
              src={map}
              allowFullScreen
              className='w-100 border-0 rounded-3 shadow-sm'
              height='300'
            />
          )}
        </div>
      </div>
    </div>
  );
};
