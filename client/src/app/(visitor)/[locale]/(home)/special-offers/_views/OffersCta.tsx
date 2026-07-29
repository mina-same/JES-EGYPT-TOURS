'use client';
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedStaticSlug } from "@/lib/url";

const GOLD = "#b79c5c";
const DARK = "#1d231f";
const WHATSAPP = "#25D366";

/** Same number used by the floating button, the drawer and the tailor-made page. */
const WHATSAPP_NUMBER = "201007437271";

/**
 * Alternative path for visitors who liked the discount idea but whose dates or
 * itinerary don't match any live offer. It sits directly under the offers grid
 * — where that realisation happens — so it is deliberately a CONTAINED card,
 * not a full-bleed band: a full-width dark section here would read as the end
 * of the page and stop people scrolling to the sections below.
 * Primary action is the tailor-made request; WhatsApp is the low-friction one.
 */
export default function OffersCta({ locale }: { locale: string }) {
  const { t } = useTranslation("specialOffers");

  const tailorMadeHref = `/${locale}/${getLocalizedStaticSlug("tailor-made", locale)}`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("cta.whatsappMessage")
  )}`;

  return (
    <section aria-labelledby="offers-cta-title" style={{ padding: "8px 0 64px" }}>
      <Container>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: DARK,
            border: `1px solid rgba(183,156,92,0.22)`,
            borderRadius: 20,
            padding: "40px 36px",
          }}
        >
          {/* Soft gold glow — decorative only, clipped by the card radius */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-70%",
              right: "-10%",
              width: 480,
              height: 480,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(183,156,92,0.18) 0%, rgba(183,156,92,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <Row className="align-items-center gutter-y-30" style={{ position: "relative", zIndex: 1 }}>
            {/* Copy */}
            <Col lg={7}>
              <div className="text-center text-lg-start">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    background: "rgba(183,156,92,0.15)",
                    color: GOLD,
                    border: `1px solid rgba(183,156,92,0.4)`,
                    borderRadius: 50,
                    padding: "5px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  <Sparkles size={13} strokeWidth={2} />
                  {t("cta.eyebrow")}
                </span>

                <h2
                  id="offers-cta-title"
                  style={{
                    color: "#fff",
                    fontSize: "clamp(24px, 2.6vw, 32px)",
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: "-0.4px",
                    marginBottom: 12,
                  }}
                >
                  {t("cta.title")}
                </h2>

                <p
                  style={{
                    color: "rgba(255,255,255,0.68)",
                    fontSize: 16,
                    lineHeight: 1.7,
                    maxWidth: 560,
                    marginBottom: 0,
                  }}
                >
                  {t("cta.text")}
                </p>
              </div>
            </Col>

            {/* Actions */}
            <Col lg={5}>
              <div className="d-flex flex-column align-items-center align-items-lg-end">
                <div
                  className="d-flex flex-wrap justify-content-center justify-content-lg-end"
                  style={{ gap: 12 }}
                >
                  <Link
                    href={tailorMadeHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 9,
                      background: GOLD,
                      color: DARK,
                      fontWeight: 700,
                      fontSize: 15,
                      padding: "14px 26px",
                      borderRadius: 12,
                      textDecoration: "none",
                      border: `1px solid ${GOLD}`,
                      boxShadow: "0 10px 24px rgba(183,156,92,0.26)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("cta.primary")}
                    <ArrowRight size={17} strokeWidth={2.2} />
                  </Link>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={t("cta.secondary")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 9,
                      background: "rgba(37,211,102,0.12)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      padding: "14px 26px",
                      borderRadius: 12,
                      textDecoration: "none",
                      border: `1px solid rgba(37,211,102,0.55)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <MessageCircle size={18} strokeWidth={2.2} color={WHATSAPP} />
                    {t("cta.secondary")}
                  </a>
                </div>

                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12.5,
                    marginTop: 16,
                    marginBottom: 0,
                  }}
                  className="text-center text-lg-end"
                >
                  {t("cta.reassurance")}
                </p>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
}
