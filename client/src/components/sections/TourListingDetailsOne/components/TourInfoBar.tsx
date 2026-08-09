"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { PickupIcon } from "./PickupIcon";

/** The gold the facts strip has always used for its icons. */
const ICON_COLOR = "#b79c5c";

interface TourInfoBarProps {
  location: string;
  pickupAndDropOff: string;
  activitiesType: string;
  activateDay: string;
  availability: string;
  /** '#map' — passed only when the tour actually has a map embed. */
  mapHref?: string;
}

/**
 * The tour's key facts, a strip inside the content rail rather than a
 * full-bleed five-item band.
 *
 * "Traveler" is gone: it printed a hardcoded `10` for every tour and was never
 * a field on the Tour model. The old "Price starts from" button is gone too —
 * it linked nowhere, and the price now heads the booking card where it belongs.
 *
 * Pickup leads the strip. It is the first thing a visitor checks before
 * booking — "does someone collect me from my hotel?" — and it used to be
 * collected in the admin and then shown nowhere at all.
 *
 * A fact with no value is dropped rather than rendered as a label above empty
 * space, so a tour missing its duration or location degrades quietly.
 */
export const TourInfoBar: React.FC<TourInfoBarProps> = ({
  location,
  pickupAndDropOff,
  activitiesType,
  activateDay,
  availability,
  mapHref,
}) => {
  const { t } = useTranslation("tours");

  /** Font glyph for the three facts gotur-icons covers; a drawn one for pickup. */
  const glyph = (name: string) => (
    <i className={name} style={{ color: ICON_COLOR }} aria-hidden="true" />
  );

  const facts = [
    {
      key: "pickup",
      icon: <PickupIcon style={{ color: ICON_COLOR }} />,
      label: t("tourDetails.info.pickup", "Pickup & Drop-off"),
      value: pickupAndDropOff,
    },
    {
      key: "location",
      icon: glyph("icon-location"),
      label: t("tourDetails.info.location", "Location"),
      value: location,
      href: mapHref,
    },
    {
      key: "activitiesType",
      icon: glyph("icon-travel-and-tourism"),
      label: t("tourDetails.info.tourType", "Tour Type"),
      value: activitiesType,
    },
    {
      key: "activateDay",
      icon: glyph("icon-clock"),
      label: t("tourDetails.info.activateDay", "Duration"),
      value: activateDay,
    },
    // Next to Duration on purpose: "how long" and "when can I go" are the same
    // question to someone picking a date, and reading them apart is worse.
    {
      key: "availability",
      icon: glyph("icon-calendar"),
      label: t("tourDetails.info.availability", "Availability"),
      value: availability,
    },
  ].filter((fact) => !!fact.value);

  if (facts.length === 0) return null;

  return (
    <div
      className='tour-listing-details__info-area tour-listing-details__info-area--rail wow fadeInUp'
      data-wow-duration='1500ms'
      data-wow-delay='500ms'
    >
      {/* The column count follows the facts that survived the filter, so three
          facts still fill the rail and four do not overflow it. */}
      <ul
        className='tour-listing-details__info-area__info list-unstyled'
        style={{ ['--fact-count' as string]: facts.length }}
      >
        {facts.map((fact) => (
          <li key={fact.key}>
            <div className='tour-listing-details__info-area__icon'>{fact.icon}</div>
            <div className='tour-listing-details__info-area__content'>
              <h3 className='tour-listing-details__info-area__title'>{fact.label}</h3>
              {/* `title` carries the full text for the tours saved before pickup
                  was capped at 32 characters, whose value the clamp cuts off. */}
              <p className='tour-listing-details__info-area__text' title={fact.value}>
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
