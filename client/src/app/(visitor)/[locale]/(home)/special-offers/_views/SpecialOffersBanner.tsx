'use client';
import React from "react";
import { Container } from "react-bootstrap";
import { ArrowDown, Check, Tag } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import styles from "./SpecialOffersBanner.module.css";

interface SpecialOffersBannerProps {
  /** Highest live discount; drives the headline number. */
  percent: number;
  /** id of the offers list the CTA jumps to. */
  listId: string;
}

/**
 * Compact promo banner between the page hero and the offers list.
 *
 * Deliberately NOT a second hero: the heading is an <h2> (the page H1 lives in
 * PageHeader), the layout is a single contained card, and the whole block stays
 * short so the tour cards are reachable almost immediately.
 */
export default function SpecialOffersBanner({ percent, listId }: SpecialOffersBannerProps) {
  const { t } = useTranslation("specialOffers");

  const trustPoints = [
    t("banner.trust.private"),
    t("banner.trust.guides"),
    t("banner.trust.inclusions"),
  ];

  // Plain anchor is the source of truth (works without JS and for keyboard
  // users); this handler only upgrades the jump to a smooth scroll when the
  // visitor has not asked for reduced motion.
  const handleCtaClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(listId);
    if (!target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${listId}`);
  };

  return (
    <section className={styles.section} aria-labelledby="special-offers-banner-title">
      <Container>
        <div className={styles.card}>
          <div className={styles.inner}>
            <div className={styles.content}>
              <p className={styles.eyebrow}>
                <Tag size={14} strokeWidth={2} className={styles.eyebrowIcon} aria-hidden="true" />
                {t("banner.eyebrow")}
              </p>

              <h2 id="special-offers-banner-title" className={styles.heading}>
                <Trans
                  t={t}
                  i18nKey="banner.heading"
                  values={{ percent }}
                  components={{ gold: <span className={styles.gold} /> }}
                />
              </h2>

              <p className={styles.description}>{t("banner.description")}</p>

              <ul className={styles.trust}>
                {trustPoints.map((point) => (
                  <li key={point} className={styles.trustItem}>
                    <Check size={14} strokeWidth={2.75} className={styles.trustIcon} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.ctaWrap}>
              <a href={`#${listId}`} onClick={handleCtaClick} className={styles.cta}>
                {t("banner.cta")}
                <ArrowDown size={17} strokeWidth={2.2} className={styles.ctaIcon} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
