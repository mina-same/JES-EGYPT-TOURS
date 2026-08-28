"use client";
import React, { useState } from "react";
import { Accordion } from "react-bootstrap";
import Image from "next/image";
import { BedDouble, ChevronDown, Plane, Sparkle, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Itinerary } from "../types";
import { normalizeRichTextInternalLinks } from "@/lib/richTextLinks";
import { useLineClamp } from "@/hooks/useLineClamp";
import {
  DAY_ACCOMMODATION_FALLBACKS,
  DAY_FLIGHT_FALLBACKS,
} from "@/lib/tours/dayLogistics";

interface TourPlanProps {
  itinerary?: Itinerary;
}

/** Strips a "Day 1:" the admin may have typed into the title, in any of the
 *  locales the site publishes, since the component prints that prefix itself. */
const LEADING_DAY_LABEL = /^(?:Day|Tag|Giorno|Día)\s*\d+[:\s-]*/i;

/** Per-day logistics, in the order they are shown. Each is optional on a day. */
const LOGISTICS_KEYS = ["flight", "meals", "accommodation"] as const;
type LogisticsKey = (typeof LOGISTICS_KEYS)[number];

const LOGISTICS_ICONS: Record<LogisticsKey, typeof Plane> = {
  flight: Plane,
  meals: Utensils,
  accommodation: BedDouble,
};

/** i18next prints the key itself when one is missing; these keep a half-updated
 *  locale from putting "tourDetails.logistics.flight" in front of a visitor. */
const LOGISTICS_FALLBACKS: Record<LogisticsKey, string> = {
  flight: "Fly to",
  meals: "Meals",
  accommodation: "Accommodation",
};

const MEAL_FALLBACKS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  welcomeDrink: "Welcome Drink",
  none: "None",
};

/** Two lines on desktop, five on a phone. Not a mismatch: a desktop line here
 *  runs to roughly 110 characters and a phone line to about 45, so both settings
 *  reveal a comparable amount of text before the fold. */
const INTRO_VISIBLE_LINES = { desktop: 2, mobile: 5 };

export const TourPlan: React.FC<TourPlanProps> = ({ itinerary }) => {
  const { t } = useTranslation("tours");

  const [isIntroExpanded, setIsIntroExpanded] = useState(false);
  /* A callback ref, not useRef: the tour arrives asynchronously, so this node is
     mounted, discarded and remounted, and a plain ref would leave the hook
     measuring a node React had already thrown away. */
  const [introEl, setIntroEl] = useState<HTMLDivElement | null>(null);

  /* Same reasoning as the parent page: scrolling re-renders this tree whenever
     the sticky bar or the active tab flips, and re-running the link pass over
     every activity description each time is wasted work. Both memos sit above
     the early return so the hook order stays stable when there is no itinerary. */
  const generalDescriptionHtml = React.useMemo(
    () => normalizeRichTextInternalLinks(itinerary?.generalDescription),
    [itinerary?.generalDescription]
  );
  const isIntroOverflowing = useLineClamp(
    introEl,
    generalDescriptionHtml,
    INTRO_VISIBLE_LINES
  );

  const days = React.useMemo(
    () =>
      (itinerary?.days || []).map((day) => ({
        ...day,
        title: (day.title || "").replace(LEADING_DAY_LABEL, "").trim(),
        activities: (day.activities || []).map((activity) => ({
          ...activity,
          description: normalizeRichTextInternalLinks(activity.description),
        })),
        /* Resolved here so the JSX stays a plain map instead of filtering three
           optional fields inline on every render. Meals are stored as keys, so
           the words come from the locale rather than from what an admin typed —
           one choice, four correct languages. */
        logistics: LOGISTICS_KEYS.map((key) => ({
          key,
          value:
            key === "meals"
              ? day.meals
                  .map((meal) => t(`tourDetails.logistics.mealOptions.${meal}`, MEAL_FALLBACKS[meal] ?? meal))
                  .join(", ")
              : key === "accommodation"
                ? day.accommodation
                  ? t(
                      `tourDetails.logistics.stayOptions.${day.accommodation}`,
                      DAY_ACCOMMODATION_FALLBACKS[day.accommodation] ?? day.accommodation
                    )
                  : ""
                : day.flight
                  ? t(
                      `tourDetails.logistics.flyToOptions.${day.flight}`,
                      DAY_FLIGHT_FALLBACKS[day.flight] ?? day.flight
                    )
                  : "",
        })).filter((entry) => !!entry.value),
      })),
    [itinerary?.days, t]
  );

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return null;
  }

  return (
    <div className='tour-listing-details__content__item tour-listing-details__ture-plan'>
      <h2 className='tour-listing-details__title'>{t("tourDetails.tourPlanTitle", "Tour Plan")}</h2>

      {/* Clamped exactly as the page's main description is, through the same
          hook and the same .tour-description-wrapper CSS. The clip is CSS-only:
          every paragraph, and every internal link inside it, stays in the served
          HTML and is merely hidden. Never shorten `generalDescriptionHtml`
          itself — that would take the copy out of the markup a crawler reads. */}
      {generalDescriptionHtml && (
        <div className="mb-4">
          <div
            id="tour-plan-intro-body"
            ref={setIntroEl}
            className={`tour-description-wrapper tour-plan__intro-clamp ${isIntroExpanded ? '' : 'collapsed'}`}
          >
            <div
              className="html-content tour-plan__intro"
              dangerouslySetInnerHTML={{ __html: generalDescriptionHtml }}
            />
          </div>

          {isIntroOverflowing && (
            <button
              type="button"
              className="tour-read-more-btn"
              onClick={() => setIsIntroExpanded((prev) => !prev)}
              aria-expanded={isIntroExpanded}
              aria-controls="tour-plan-intro-body"
            >
              <span>
                {isIntroExpanded
                  ? t("tourDetails.readLess", "Read Less")
                  : t("tourDetails.readMore", "Read More")}
              </span>
              <ChevronDown
                size={16}
                className="tour-read-more-btn__chevron"
                style={{ transform: isIntroExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          )}
        </div>
      )}

      <div className='faq-page__accordion faq-accordion gotur-accordion'>
        <Accordion defaultActiveKey={['0']} alwaysOpen>
          {days.map((day, dayIdx) => (
            <Accordion.Item eventKey={dayIdx.toString()} key={dayIdx}>
              {/* `as="h3"` puts the day under the section's <h2> in the document
                  outline. react-bootstrap renders this element's children INSIDE
                  the accordion <button>, so the day title below is spans: a
                  heading there would be flow content inside a button, which the
                  HTML content model does not allow. */}
              <Accordion.Header as="h3">
                <div className='accordion-title'>
                  <span className="tour-plan__day-badge">
                    {t("tourDetails.day", "Day")} {day.day}
                  </span>
                  <span className="tour-plan__day-text">{day.title}</span>
                  {/* The button already carries the state and the accessible
                      name, so the chevron is decorative; CSS rotates it off
                      `.collapsed` rather than the component tracking open days. */}
                  <span className="tour-plan__toggle">
                    <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className='accordion-content'>
                  {/* A day is now its title plus its activities — the free-text
                      day description was retired because a stop written there
                      rendered outside the timeline, with no image and no marker. */}
                  {day.activities.length > 0 && (
                    <div className="tour-plan__timeline">
                      {day.activities.map((activity, activityIdx) => (
                        <div key={activityIdx} className="tour-plan__stop">
                          <div className="tour-plan__marker">
                            {activity.image ? (
                              <div className="tour-plan__photo">
                                <Image
                                  src={activity.image.url}
                                  alt={activity.image.alt || ""}
                                  title={activity.image.title || ""}
                                  width={60}
                                  height={60}
                                />
                              </div>
                            ) : (
                              <div className="tour-plan__dot" />
                            )}

                            {activityIdx < day.activities.length - 1 && (
                              <div className="tour-plan__connector" />
                            )}
                          </div>

                          <div className="tour-plan__body">
                            {/* h4: an activity belongs to its day, and the day is
                                the h3 on the accordion header above. */}
                            <h4 className="tour-plan__heading">
                              {activity.heading}
                              {activity.isOptional && (
                                <span className="tour-plan__optional">
                                  <Sparkle size={13} strokeWidth={1.75} aria-hidden="true" />
                                  {t("tourDetails.optional", "Optional")}
                                </span>
                              )}
                            </h4>
                            {/* `html-content` is what gives editorial links their
                                gold + underline treatment. Without it anchors fall
                                back to the theme's `a` rule (#d4af37, no underline)
                                and read as plain body text. */}
                            <div
                              className="html-content tour-plan__text"
                              dangerouslySetInnerHTML={{ __html: activity.description }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Day logistics. Only the fields the admin actually filled
                      are here, so a day without a flight shows two chips and a
                      day with none renders nothing — no empty row, no rule over
                      blank space. */}
                  {day.logistics.length > 0 && (
                    <ul className="tour-plan__logistics list-unstyled">
                      {day.logistics.map(({ key, value }) => {
                        const Icon = LOGISTICS_ICONS[key];
                        return (
                          <li key={key} className="tour-plan__logistic">
                            <span className="tour-plan__logistic-icon">
                              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                            </span>
                            <span className="tour-plan__logistic-body">
                              <span className="tour-plan__logistic-label">
                                {t(`tourDetails.logistics.${key}`, LOGISTICS_FALLBACKS[key])}
                              </span>
                              <span className="tour-plan__logistic-value">{value}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
