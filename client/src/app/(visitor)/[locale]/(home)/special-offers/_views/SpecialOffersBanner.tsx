'use client';
import React from "react";
import { Container } from "react-bootstrap";
import { Check, Tag } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import styles from "./SpecialOffersBanner.module.css";

interface SpecialOffersBannerProps {
  /** Highest live discount; drives the headline number. */
  percent: number;
}

/**
 * Short introductory message above the offers list — deliberately NOT a second
 * hero and no longer a call-to-action section: the offers grid starts directly
 * underneath, so a "view offers" button only scrolled a few dozen pixels.
 *
 * The heading is an <h2>; the page H1 lives in PageHeader.
 */
export default function SpecialOffersBanner({ percent }: SpecialOffersBannerProps) {
  const { t } = useTranslation("specialOffers");

  const trustPoints = [
    t("banner.trust.private"),
    t("banner.trust.guides"),
    t("banner.trust.inclusions"),
  ];

  return (
    <section className={styles.section} aria-labelledby="special-offers-banner-title">
      <Container>
        <div className={styles.card}>
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
        </div>
      </Container>
    </section>
  );
}
