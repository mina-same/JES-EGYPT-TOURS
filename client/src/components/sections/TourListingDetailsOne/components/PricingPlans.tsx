"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Trans, useTranslation } from "react-i18next";
import { PricingPlan, Season } from "../types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getLocalizedStaticPath } from "@/lib/url/staticSlugs";
import StayIcon from "./StayIcon";
import SeasonIcon from "./SeasonIcon";
import {
  classifySeason,
  holidayLabelKey,
  seasonDescriptorKey,
  seasonLabelKey,
  splitSeasonWindows,
  type HolidayKind,
  type SeasonKind,
} from "@/lib/tours/seasonKind";
import {
  PRICE_TIERS,
  isUsableAmount,
  planHasPrices,
  seasonHasPrices,
  type PriceTier,
} from "@/lib/tours/startingPrice";

interface PricingPlansProps {
  pricingPlans?: PricingPlan[];
}

/** Label key per group-size tier. Rows follow PRICE_TIERS order, smallest
 *  party first. */
const TIER_LABELS: Record<PriceTier, { key: string; fallback: string }> = {
  solo: { key: "tourDetails.pricing.soloTraveler", fallback: "Solo" },
  pax_2_4: { key: "tourDetails.pricing.pax2_4", fallback: "2-4 Pax" },
  pax_5_8: { key: "tourDetails.pricing.pax5_8", fallback: "5-8 Pax" },
  pax_9_16: { key: "tourDetails.pricing.pax9_16", fallback: "9-16 Pax" },
};

/** English wording if a locale has not been given the key yet. */
const SEASON_FALLBACKS: Record<SeasonKind, string> = {
  low: "Low Season",
  regular: "Regular Season",
  peak: "Peak Season",
};

/** The weather word, kept as a subtitle beside the price-tier name. */
const SEASON_DESCRIPTORS: Record<SeasonKind, string> = {
  low: "Summer",
  regular: "Winter",
  peak: "Holidays",
};

const HOLIDAY_FALLBACKS: Record<HolidayKind, string> = {
  christmas: "Christmas & New Year",
  easter: "Easter",
};

/** The tier that visitors are steered toward. Fixed rather than an admin flag:
 *  it is the same tier on every package, and a per-tour switch would be one
 *  more field to keep in sync for no editorial gain. */
const isMostChosen = (planName: string) => planName.toUpperCase().startsWith("GOLD");

export const PricingPlans: React.FC<PricingPlansProps> = ({ pricingPlans }) => {
  const { t, i18n } = useTranslation("tours");
  const { formatPrice, getPriceValue } = useCurrency();
  const contactHref = getLocalizedStaticPath(
    "contact",
    i18n.resolvedLanguage || i18n.language
  );

  /** Only plans with something to quote. An unpriced tier gets no tab at all,
   *  rather than a tab leading to an empty panel. */
  const plans = useMemo(
    () => (pricingPlans || []).filter(planHasPrices),
    [pricingPlans]
  );

  const [activePlan, setActivePlan] = useState(0);
  const [openSeasons, setOpenSeasons] = useState<Record<string, boolean>>({});

  // The section as a whole is gated by the caller; this guards direct use.
  if (plans.length === 0) return null;

  const activeIndex = Math.min(activePlan, plans.length - 1);
  const seasonKey = (planIdx: number, seasonIdx: number) => `${planIdx}:${seasonIdx}`;

  /** Priced tiers for a season, in group-size order: Solo, 2-4, 5-8, 9-16.
   *  Sorting by price instead would put the largest group first, which is a
   *  ladder the visitor has to read backwards — they know their own party size
   *  and scan for it, so the row order has to match how the sizes count up. */
  const pricedTiers = (season: Season) =>
    PRICE_TIERS.map((tier) => ({ tier, amounts: season.prices?.[tier] })).filter(
      ({ amounts }) => isUsableAmount(getPriceValue(amounts as any))
    );

  /** The cheapest quotable amount in a plan — its "starting from". */
  const planFrom = (plan: PricingPlan) => {
    const all = plan.seasons
      .filter(seasonHasPrices)
      .flatMap((season) => pricedTiers(season).map(({ amounts }) => getPriceValue(amounts as any)));
    return all.length ? Math.min(...all) : 0;
  };

  return (
    <div className="tour-pricing">
      {/* Plan tabs. Rendered only when there is a choice: a tour with one tier
          gets the panel alone, with no single-option tab bar above it. */}
      {plans.length > 1 && (
        <div className="tour-pricing__tabs" role="tablist" aria-label={t("tourDetails.pricingTitle")}>
          {plans.map((plan, index) => (
            <button
              key={plan.planName || index}
              type="button"
              role="tab"
              id={`pricing-tab-${index}`}
              aria-selected={index === activeIndex}
              aria-controls={`pricing-panel-${index}`}
              className={`tour-pricing__tab${index === activeIndex ? " is-active" : ""}`}
              onClick={() => setActivePlan(index)}
            >
              {t(`tourDetails.pricing.${plan.planName.toLowerCase()}`, plan.planName)}
            </button>
          ))}
        </div>
      )}

      {/* EVERY plan is rendered, including the inactive ones. They are hidden
          with CSS rather than dropped from the tree so that all of a tour's
          prices stay in the server-rendered HTML — a tabbed panel that only
          emits the selected tier would remove the rest from search results. */}
      {plans.map((plan, planIdx) => {
        const isActive = planIdx === activeIndex;
        const seasons = plan.seasons.filter(seasonHasPrices);
        const from = planFrom(plan);

        return (
          <div
            key={plan.planName || planIdx}
            id={`pricing-panel-${planIdx}`}
            role={plans.length > 1 ? "tabpanel" : undefined}
            aria-labelledby={plans.length > 1 ? `pricing-tab-${planIdx}` : undefined}
            className={`tour-pricing__panel${isActive ? "" : " tour-pricing__panel--hidden"}`}
          >
            <div className="tour-pricing__head">
              <div>
                <h3 className="tour-pricing__plan-name">
                  {t(`tourDetails.pricing.${plan.planName.toLowerCase()}`, plan.planName)}
                </h3>
                {from > 0 && (
                  <>
                    <p className="tour-pricing__from-label">
                      {t("tourDetails.pricing.startingFrom", "Starting from")}
                    </p>
                    <p className="tour-pricing__from-value">{formatPrice(from)}</p>
                  </>
                )}
              </div>
              {isMostChosen(plan.planName) && (
                <span className="tour-pricing__badge">
                  {t("tourDetails.pricing.mostChosen", "Most Chosen")}
                  <i className="fas fa-star" aria-hidden="true" />
                </span>
              )}
            </div>

            <div className="tour-pricing__dates">
              {/* "Available Dates" was ambiguous — available to book? to
                  depart? This says what the rows below actually do. */}
              <h4 className="tour-pricing__dates-title">
                {t("tourDetails.pricing.pricesByDate", "Prices by Travel Date")}
              </h4>
              <p className="tour-pricing__dates-hint">
                {t(
                  "tourDetails.pricing.datesHint",
                  "Choose your travel period to see the price for your group size."
                )}
              </p>
            </div>

            <div className="tour-pricing__seasons">
              {seasons.map((season, seasonIdx) => {
                const key = seasonKey(planIdx, seasonIdx);
                const isOpen = !!openSeasons[key];
                const tiers = pricedTiers(season);
                const kind = classifySeason(season.seasonName);
                const windows = splitSeasonWindows(season.seasonName, kind);
                /** Cheapest tier IN THIS SEASON — what the collapsed row shows. */
                const seasonFrom = tiers.length
                  ? Math.min(...tiers.map(({ amounts }) => getPriceValue(amounts as any)))
                  : 0;

                return (
                  <div
                    key={key}
                    className={`tour-pricing__season${isOpen ? " is-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="tour-pricing__season-toggle"
                      aria-expanded={isOpen}
                      aria-controls={`pricing-season-${key.replace(":", "-")}`}
                      onClick={() =>
                        setOpenSeasons((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                    >
                      {/* The season NAME leads and the dates follow as detail.
                          A visitor checking whether their trip fits reads
                          "Peak Season" in a glance; parsing a two-part range
                          spanning two years to reach the same answer takes real
                          effort. The dates stay in full underneath — they are
                          the contract, and each window gets its own line so two
                          periods read as two, not as one string with a slash. */}
                      <span
                        className={`tour-pricing__season-badge${kind ? ` is-${kind}` : ""}`}
                        aria-hidden="true"
                      >
                        {kind ? <SeasonIcon kind={kind} /> : <i className="far fa-calendar-alt" />}
                      </span>
                      <span className="tour-pricing__season-name">
                        {kind && (
                          <span className="tour-pricing__season-kind">
                            {t(seasonLabelKey(kind), SEASON_FALLBACKS[kind])}
                            <span className="tour-pricing__season-desc">
                              {t(seasonDescriptorKey(kind), SEASON_DESCRIPTORS[kind])}
                            </span>
                          </span>
                        )}
                        {windows.map((window, windowIdx) => (
                          <span key={windowIdx} className="tour-pricing__season-dates">
                            {window.holiday && (
                              <strong className="tour-pricing__season-holiday">
                                {t(holidayLabelKey(window.holiday), HOLIDAY_FALLBACKS[window.holiday])}
                                {" · "}
                              </strong>
                            )}
                            {window.dates}
                          </span>
                        ))}
                      </span>
                      {/* The price BEFORE opening: without it the only way to
                          compare three seasons is to open all three. */}
                      {seasonFrom > 0 && (
                        <span className="tour-pricing__season-from">
                          {t("tourDetails.pricing.fromPerPerson", "From {{price}} per person", {
                            price: formatPrice(seasonFrom),
                          })}
                        </span>
                      )}
                      {/* One glyph, rotated by CSS. Swapping between the up and
                          down icons would change the class mid-transition, and a
                          glyph swap cannot be animated. */}
                      <i
                        className="fas fa-chevron-down tour-pricing__season-chevron"
                        aria-hidden="true"
                      />
                    </button>

                    {/* Body stays mounted while collapsed — same reason as the
                        inactive panels above: the amounts must remain in the
                        HTML for crawlers even when nobody has opened them. */}
                    <div
                      id={`pricing-season-${key.replace(":", "-")}`}
                      className="tour-pricing__season-body"
                    >
                      {/* Two wrappers, both load-bearing: the outer one clips
                          the rows as the season collapses, and the inner one
                          holds the padding. Padding on the clipping element is
                          not clipped with it — it would survive as a strip of
                          blank space under a closed season. */}
                      <div className="tour-pricing__season-body-inner">
                        <div className="tour-pricing__season-body-content">
                        <p className="tour-pricing__group-title">
                          {t("tourDetails.pricing.groupSizePricing", "Group Size & Pricing")}
                        </p>
                        <dl className="tour-pricing__rows">
                          {tiers.map(({ tier, amounts }) => (
                            <div key={tier} className="tour-pricing__row">
                              <dt className="tour-pricing__row-label">
                                {t(TIER_LABELS[tier].key, TIER_LABELS[tier].fallback)}
                              </dt>
                              <dd className="tour-pricing__row-price">
                                <strong>{formatPrice(amounts as any)}</strong>
                                <span className="tour-pricing__row-unit">
                                  {" / "}
                                  {t("tourDetails.pricing.person", "person")}
                                </span>
                              </dd>
                            </div>
                          ))}
                        </dl>

                        {season.notes && season.notes.length > 0 && (
                          <div className="tour-pricing__season-notes">
                            {season.notes.map((note, noteIdx) => (
                              <p key={noteIdx}>
                                {note.title && <strong>{note.title}: </strong>}
                                {note.text}
                              </p>
                            ))}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {(plan.accommodations || []).length > 0 && (
              <div className="tour-pricing__stays">
                <h4 className="tour-pricing__stays-title">
                  <i className="fas fa-hotel" aria-hidden="true" />
                  {t("tourDetails.pricing.accommodationTitle", "Included Accommodation Options:")}
                </h4>
                <dl className="tour-pricing__stays-list">
                  {plan.accommodations!.map((stay, stayIdx) => (
                    <div key={stayIdx} className="tour-pricing__stay">
                      <dt className="tour-pricing__stay-place">
                        <span className="tour-pricing__stay-icon">
                          <StayIcon name={stay.icon} />
                        </span>
                        {stay.location}
                      </dt>
                      <dd className="tour-pricing__stay-hotels">{stay.hotels}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {plan.notes && plan.notes.length > 0 && (
              <ul className="tour-pricing__notes">
                {plan.notes.map((note, noteIdx) => (
                  <li key={noteIdx} className="tour-pricing__note">
                    <i className="fas fa-info-circle" aria-hidden="true" />
                    <span>
                      {note.title && <strong>{note.title}: </strong>}
                      {note.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <p className="tour-pricing__footnote">
        <i className="fas fa-lightbulb" aria-hidden="true" />
        <span>
          <strong>{t("tourDetails.pricing.noteTitle", "Note:")}</strong>{" "}
          <Trans
            i18nKey="tourDetails.pricing.noteSub"
            ns="tours"
            defaults="Prices are per person and may vary based on availability and booking date. Group discounts apply automatically based on the number of travelers. <contactLink>Contact us</contactLink> for custom quotes or special requests."
            components={{
              contactLink: <Link href={contactHref} />,
            }}
          />
        </span>
      </p>
    </div>
  );
};
