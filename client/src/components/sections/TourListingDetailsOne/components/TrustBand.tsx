"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldUser, GraduationCap, Headset, Route } from "lucide-react";

/**
 * "Book With Confidence" — the trust panel between the facts strip and the
 * section nav.
 *
 * It used to be five 70px circled icons over generic claims ("Best Prices",
 * "Rated 5* Stars") laid out in a Bootstrap row, sized so the icons carried the
 * section and the words trailed underneath. It reads as decoration, not as a
 * reason to book, and it cost more vertical space than any other block in the
 * rail.
 *
 * The rebuild keeps the panel it already had — the gold-tinted surface, its
 * 20px radius, its border — and re-cuts the contents to the rhythm of
 * [TourInfoBar] directly above it: a small icon, a 14px title, a 12px muted
 * line, columns divided by a hairline. Two neighbouring sections that present
 * the same shape of information now present it the same way, which is what
 * makes this read as part of the page rather than a banner dropped onto it.
 *
 * Every string comes from the `tours` namespace, so all four locales stay in
 * step with the rest of the page.
 */
/**
 * The four claims, in reading order.
 *
 * Icons are stroked lucide glyphs, as the section has always used, kept small:
 * the claim is the point and the icon only labels it.
 *
 * The English strings are i18next FALLBACKS, not the copy that ships — every
 * locale file carries its own. They matter because i18next renders the key
 * itself when one is missing, so a typo or a half-updated locale would put
 * "tourDetails.features.private.title" in front of a visitor. This block was
 * restructured from flat strings to {title, text} objects once already, which
 * is exactly the kind of change that leaves one file behind.
 */
const TRUST_ITEMS = [
  { key: "private", Icon: ShieldUser, fallbackTitle: "Private Tours Only", fallbackText: "Your party, your pace" },
  { key: "guides", Icon: GraduationCap, fallbackTitle: "Expert Egyptologists", fallbackText: "Professional local guidance" },
  { key: "support", Icon: Headset, fallbackTitle: "24/7 Travel Support", fallbackText: "Direct help when you need it" },
  { key: "flexible", Icon: Route, fallbackTitle: "Flexible Trip Planning", fallbackText: "Personalize your Egypt experience" },
] as const;

export const TrustBand: React.FC = () => {
  const { t } = useTranslation("tours");

  return (
    <section className="tour-trust-band" aria-labelledby="tour-trust-band-title">
      <h2
        id="tour-trust-band-title"
        className="tour-listing-details__title tour-trust-band__title"
      >
        {t("tourDetails.bookConfidence", "Book With Confidence")}
      </h2>
      <p className="tour-trust-band__lead">{t(
          "tourDetails.bookConfidenceDesc",
          "Private tours, expert guidance, and direct support throughout your journey."
        )}</p>

      <ul className="tour-trust-band__list list-unstyled">
        {TRUST_ITEMS.map(({ key, Icon, fallbackTitle, fallbackText }) => (
          <li key={key} className="tour-trust-band__item">
            <span className="tour-trust-band__icon">
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="tour-trust-band__body">
              <span className="tour-trust-band__item-title">
                {t(`tourDetails.features.${key}.title`, fallbackTitle)}
              </span>
              <span className="tour-trust-band__item-text">
                {t(`tourDetails.features.${key}.text`, fallbackText)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
