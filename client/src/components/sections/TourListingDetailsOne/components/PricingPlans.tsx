"use client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PricingPlan, Season } from "../types";
import { useCurrency } from "@/contexts/CurrencyContext";
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

/** Label key per group-size tier. The order here is only the tie-breaker —
 *  rows are sorted by what they actually cost. */
const TIER_LABELS: Record<PriceTier, { key: string; fallback: string }> = {
  solo: { key: "tourDetails.pricing.soloTraveler", fallback: "Solo" },
  pax_2_4: { key: "tourDetails.pricing.pax2_4", fallback: "2-4 Pax" },
  pax_5_8: { key: "tourDetails.pricing.pax5_8", fallback: "5-8 Pax" },
  pax_9_16: { key: "tourDetails.pricing.pax9_16", fallback: "9-16 Pax" },
};

/** Font Awesome glyph per accommodation icon. The admin picks the key; the
 *  drawing lives here so a glyph swap never touches stored data. */
const STAY_ICONS: Record<string, string> = {
  city: "fa-archway",
  cruise: "fa-ship",
  beach: "fa-umbrella-beach",
  resort: "fa-water",
};

/** The tier that visitors are steered toward. Fixed rather than an admin flag:
 *  it is the same tier on every package, and a per-tour switch would be one
 *  more field to keep in sync for no editorial gain. */
const isMostChosen = (planName: string) => planName.toUpperCase().startsWith("GOLD");

export const PricingPlans: React.FC<PricingPlansProps> = ({ pricingPlans }) => {
  const { t } = useTranslation("tours");
  const { formatPrice, getPriceValue } = useCurrency();

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

  /** Priced tiers for a season, cheapest first — the order the competitor's
   *  layout uses and the one a visitor scanning for affordability wants. */
  const pricedTiers = (season: Season) =>
    PRICE_TIERS.map((tier) => ({ tier, amounts: season.prices?.[tier] }))
      .filter(({ amounts }) => {
        const value = getPriceValue(amounts as any);
        return isUsableAmount(value);
      })
      .sort(
        (a, b) => getPriceValue(a.amounts as any) - getPriceValue(b.amounts as any)
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
              <h4 className="tour-pricing__dates-title">
                {t("tourDetails.pricing.availableDates", "Available Dates:")}
              </h4>
              <p className="tour-pricing__dates-hint">
                {t(
                  "tourDetails.pricing.datesHint",
                  "Select a date range to view the prices for each group size."
                )}
              </p>
            </div>

            <div className="tour-pricing__seasons">
              {seasons.map((season, seasonIdx) => {
                const key = seasonKey(planIdx, seasonIdx);
                const isOpen = !!openSeasons[key];
                const tiers = pricedTiers(season);

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
                      <i className="far fa-calendar-alt" aria-hidden="true" />
                      <span className="tour-pricing__season-name">
                        {t(
                          `tourDetails.pricing.${season.seasonName.toLowerCase()}`,
                          season.seasonName
                        )}
                      </span>
                      <i
                        className={`fas fa-chevron-${isOpen ? "up" : "down"} tour-pricing__season-chevron`}
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
                          <i className={`fas ${STAY_ICONS[stay.icon] || STAY_ICONS.city}`} aria-hidden="true" />
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
          {t(
            "tourDetails.pricing.noteSub",
            "Prices are per person and may vary based on availability and booking date."
          )}
        </span>
      </p>
    </div>
  );
};
