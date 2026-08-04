"use client";
import React from "react";
import { useTranslation } from "react-i18next";

interface TourInfoBarProps {
  location: string;
  activitiesType: string;
  activateDay: string;
  /** '#map' — passed only when the tour actually has a map embed. */
  mapHref?: string;
}

/**
 * The tour's key facts, now a three-item strip inside the content rail rather
 * than a full-bleed five-item band.
 *
 * "Traveler" is gone: it printed a hardcoded `10` for every tour and was never
 * a field on the Tour model. The old "Price starts from" button is gone too —
 * it linked nowhere, and the price now heads the booking card where it belongs.
 *
 * A fact with no value is dropped rather than rendered as a label above empty
 * space, so a tour missing its duration or location degrades quietly.
 */
export const TourInfoBar: React.FC<TourInfoBarProps> = ({
  location,
  activitiesType,
  activateDay,
  mapHref,
}) => {
  const { t } = useTranslation("tours");

  const facts = [
    {
      key: "location",
      icon: "icon-location",
      label: t("tourDetails.info.location", "Location"),
      value: location,
      href: mapHref,
    },
    {
      key: "activitiesType",
      icon: "icon-travel-and-tourism",
      label: t("tourDetails.info.activitiesType", "Activities Type"),
      value: activitiesType,
    },
    {
      key: "activateDay",
      icon: "icon-clock",
      label: t("tourDetails.info.activateDay", "Duration"),
      value: activateDay,
    },
  ].filter((fact) => !!fact.value);

  if (facts.length === 0) return null;

  return (
    <div
      className='tour-listing-details__info-area tour-listing-details__info-area--rail wow fadeInUp'
      data-wow-duration='1500ms'
      data-wow-delay='500ms'
    >
      <ul className='tour-listing-details__info-area__info list-unstyled'>
        {facts.map((fact) => (
          <li key={fact.key}>
            <div className='tour-listing-details__info-area__icon'>
              <i className={fact.icon} style={{ color: '#b79c5c' }} aria-hidden='true'></i>
            </div>
            <div className='tour-listing-details__info-area__content'>
              <h3 className='tour-listing-details__info-area__title'>{fact.label}</h3>
              <p className='tour-listing-details__info-area__text'>
                {fact.href ? (
                  <a href={fact.href} className='tour-info-fact-link'>{fact.value}</a>
                ) : (
                  fact.value
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
