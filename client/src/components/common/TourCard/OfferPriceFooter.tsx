"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCurrency, type ICurrencyPrice } from "@/contexts/CurrencyContext";
import styles from "./OfferPriceFooter.module.css";

type Price = number | ICurrencyPrice | null | undefined;

export interface OfferLabels {
  was: string;
  perPerson: string;
  viewOffer: string;
  /** Receives the already-formatted saving, e.g. "Save $30". */
  save: (amount: string) => string;
}

interface OfferPriceFooterProps {
  /** Existing tour detail URL — the same one the card title links to. */
  href: string;
  price: Price;
  /**
   * Pre-discount price. Rendered ONLY when the data genuinely provides one;
   * it is never derived from the discount-badge percentage.
   */
  originalPrice?: Price;
  labels: OfferLabels;
}

/**
 * Pricing + action row for special-offer tour cards: original price, discounted
 * price, unit, saving pill and a "View Offer" link. Replaces the default
 * "Start from / Book Now" row only where the offer variant is requested.
 */
export default function OfferPriceFooter({
  href,
  price,
  originalPrice,
  labels,
}: OfferPriceFooterProps) {
  const { formatPrice, getPriceValue, currency } = useCurrency();

  const current = getPriceValue(price);
  const original = getPriceValue(originalPrice);

  // Every guard the data has to clear before a discount is claimed.
  const hasSaving =
    Number.isFinite(current) &&
    Number.isFinite(original) &&
    current > 0 &&
    original > 0 &&
    original > current;

  /*
   * getPriceValue() already returns the amount in the selected currency, so the
   * saving is wrapped back into a per-currency object before formatting —
   * handing formatPrice a raw number would convert it a second time.
   */
  const formatConverted = (value: number) =>
    formatPrice({ [currency]: value } as unknown as ICurrencyPrice);

  return (
    <div className={styles.footer}>
      <div className={styles.priceGroup}>
        {hasSaving && (
          <span className={styles.was}>
            {labels.was}{" "}
            <s className={styles.wasAmount}>{formatPrice(originalPrice)}</s>
          </span>
        )}
        {/* An unpriced tour shows no amount rather than "$0.00 per person" —
            tours are published before sales price them. */}
        {current > 0 && (
          <>
            <span className={styles.price}>{formatPrice(price)}</span>
            <span className={styles.unit}>{labels.perPerson}</span>
          </>
        )}
      </div>

      {hasSaving && (
        <span className={styles.savePill}>
          {labels.save(formatConverted(original - current))}
        </span>
      )}

      <Link href={href} className={styles.cta}>
        <span>{labels.viewOffer}</span>
        <span className={styles.ctaIcon} aria-hidden="true">
          <ArrowRight size={15} strokeWidth={2.5} />
        </span>
      </Link>
    </div>
  );
}
