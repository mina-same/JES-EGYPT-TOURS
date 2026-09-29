"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency, type ICurrencyPrice } from "@/contexts/CurrencyContext";

interface BookingCardHeaderProps {
  /**
   * Starting price, shown at the top of both the desktop card and mobile sheet.
   * Not a plain number — `priceStartingFrom` is a { USD, EUR, GBP } object, so
   * the currency context resolves it.
   */
  price?: number | ICurrencyPrice | null;
  /** True when the tour has real pricing plans, so the price can link to them. */
  hasPricing?: boolean;
}

/**
 * The booking card's title and starting price.
 *
 * Rendered by BookingFormLazy, OUTSIDE the form's lazy boundary, so it is part
 * of the tour view's own markup: written inline by the server, visible with
 * JavaScript off, and never swapped for the form's loading placeholder. It uses
 * nothing from the form's chunk — only the currency context and translations
 * the rest of the page already loads.
 */
export const BookingCardHeader: React.FC<BookingCardHeaderProps> = ({ price, hasPricing }) => {
  const { t } = useTranslation('tours');
  const { t: tCommon } = useTranslation('common');
  const { formatPrice, getPriceValue } = useCurrency();
  // Resolved through the context rather than a `typeof === 'number'` check: the
  // value arrives as a per-currency object on real tours, so a numeric test
  // silently hid the price on every one of them.
  const resolvedPrice = getPriceValue(price);

  return (
    /* Keep price and intent together in one compact header. The form stays
       reassuringly priced without spending three full rows above Name.
       Two columns: what the card is for on the left, what it costs on the
       right. The secondary "Pricing" link lives under the title rather than
       under the amount — it belongs to the reading path, not to the number,
       and it fills the column's second line instead of ragging the badge. */
    <div className="booking-card-header">
      <div className="booking-card-header__intent">
        <h2 className='tour-listing-details__sidebar__title'>
          {t("tourDetails.bookingForm.title")}
        </h2>
        {hasPricing && (
          <a className="booking-price-block__link" href="#pricing">
            {t("tourDetails.nav.pricing")}
            <ChevronRight size={13} aria-hidden="true" />
          </a>
        )}
      </div>

      {resolvedPrice > 0 ? (
        <div className="booking-price-block">
          {/* "from" rather than "Price starts from": the long label was the
              widest thing in the header and pushed the title onto two lines
              in every locale. Same promise, and it now sits on the amount's
              own baseline where it reads as one phrase. */}
          <span className="booking-price-block__label">
            {t("tourDetails.from", "from")}
          </span>
          <span className="booking-price-block__value">{formatPrice(price)}</span>
          <span className="booking-price-block__unit">
            {t("tourDetails.pricing.perPerson", "per person")}
          </span>
        </div>
      ) : (
        /*
         * Same rule as the tour cards — priced means an effective amount
         * above zero, with the currency context resolving the per-currency
         * value or converting from USD — so a detail page and the card that
         * links to it can never disagree about whether a tour has a price.
         *
         * The block used to be omitted entirely, leaving the booking card
         * headed by nothing. The label and the "per person" unit are dropped
         * with the amount, because neither means anything without a number;
         * only the value slot speaks. `resolvedPrice` itself is untouched and
         * still numeric — this is display text, never a calculation input.
         */
        <div className="booking-price-block">
          <span className="booking-price-block__value">
            {tCommon("tourCard.priceOnRequest")}
          </span>
        </div>
      )}
    </div>
  );
};
