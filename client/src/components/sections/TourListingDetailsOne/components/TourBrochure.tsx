'use client';
import React from "react";
import { MapPin, Calendar, DollarSign, Check, X } from "lucide-react";
import { footerOneData } from "@/data/footerOneData";
import { useTranslation } from "react-i18next";
import type { TourDetailsOneData, TierAmount } from "../types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { normalizeAmenityItems } from "@/lib/normalizeAmenityItems";

interface TourBrochureProps {
  tour: TourDetailsOneData;
  assets?: {
    logoDataUrl?: string;
    qrDataUrl?: string;
    mapQrDataUrl?: string;
    pageUrl?: string;
    phone?: string;
    email?: string;
    website?: string;
    telHref?: string;
    waHref?: string;
  };
}

const TourBrochure = React.forwardRef<HTMLDivElement, TourBrochureProps>(({ tour, assets }, ref) => {
  const { t, i18n } = useTranslation("tours");
  const { formatPrice } = useCurrency();
  const highlightItems = normalizeAmenityItems(tour.highlightList);
  const getImgUrl = (img: any) => {
    if (!img) return "";
    if (typeof img === "string") return img;
    if (typeof img === "object" && "src" in img) return (img as any).src || "";
    return "";
  };

  const heroImage =
    (tour.sliderImages && tour.sliderImages.length > 0 && getImgUrl(tour.sliderImages[0])) ||
    (tour.images && tour.images.length > 0 && getImgUrl(tour.images[0])) ||
    "https://placehold.co/1200x800?text=Tour";

  const gallery = (tour.images || []).slice(0, 5).map(getImgUrl).filter(Boolean);
  const companyName = "JES Egypt Tours";
  const website = assets?.website || (typeof window !== "undefined" ? window.location.origin : "");
  const overviewText = (tour.overview || "").replace(/<[^>]*>/g, "");

  const pricingPlans = tour.pricingPlans || [];
  const itineraryDays = tour.itinerary?.days || [];

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        backgroundColor: "#FDFAF6",
        color: "#2D1F0E",
      }}
    >
      <div style={{ position: "relative", height: 520, overflow: "hidden" }}>
        <img
          src={heroImage}
          alt={tour.title}
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 60,
            right: 60,
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
             {assets?.logoDataUrl ? (
              <div style={{ marginBottom: 14 }}>
                <img
                  src={assets.logoDataUrl}
                  alt="Logo"
                  crossOrigin="anonymous"
                  style={{ height: 42, width: "auto", objectFit: "contain" }}
                />
              </div>
            ) : null}
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 12,
                color: "#F5A623",
              }}
            >
              {companyName}
            </div>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              maxWidth: 800,
              color: "#fff",
            }}
          >
            {tour.title}
          </h1>
          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 20,
              fontSize: 15,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={16} /> <span>{tour.location}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={16} /> {tour.activateDay}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#F5A623",
                color: "#000",
                padding: "6px 16px",
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              <DollarSign size={16} /> {t("tourDetails.info.priceStartsFrom")} {formatPrice(tour.price)}
            </span>
          </div>
        </div>
      </div>

      {(assets?.phone || assets?.email || assets?.waHref || assets?.qrDataUrl) && (
        <div style={{ padding: "18px 60px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {assets?.phone ? (
                <a
                  href={assets.telHref || `tel:${assets.phone}`}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#2D1F0E",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {t("tourDetails.brochure.contact.phone")}: {assets.phone}
                </a>
              ) : null}
              {assets?.waHref ? (
                <a
                  href={assets.waHref}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "#E8F5E9",
                    border: "1px solid rgba(46,125,50,0.25)",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#1B5E20",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {t("tourDetails.brochure.contact.whatsapp")}: {t("tourDetails.brochure.contact.available")}
                </a>
              ) : null}
              {assets?.email ? (
                <a
                  href={`mailto:${assets.email}`}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#2D1F0E",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {t("tourDetails.brochure.contact.email")}: {assets.email}
                </a>
              ) : null}
            </div>

            {assets?.qrDataUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8B7355" }}>
                  {t("tourDetails.brochure.scanOnline")}
                </div>
                <img
                  src={assets.qrDataUrl}
                  alt="Tour QR"
                  crossOrigin="anonymous"
                  style={{ width: 78, height: 78, borderRadius: 12, background: "#fff" }}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div style={{ padding: "48px 60px" }}>
        <SectionHeader 
          label={t("tourDetails.nav.description")} 
          title={tour.overviewTitle || t("tourDetails.nav.description")} 
        />
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: "#5C4A32",
            maxWidth: 900,
            marginTop: 16,
          }}
        >
          {overviewText}
        </p>

        {(assets?.mapQrDataUrl || tour.map) && (
          <div
            style={{
              marginTop: 26,
              padding: 18,
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              gap: 18,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 320, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#2D1F0E", marginBottom: 6 }}>
                {t("tourDetails.brochure.mapLabel")}
              </div>
              <div style={{ fontSize: 13, color: "#8B7355", lineHeight: 1.6 }}>
                {t("tourDetails.brochure.scanMap")}
              </div>
              {tour.location ? (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#2D1F0E" }}>
                  {tour.location}
                </div>
              ) : null}
            </div>

            {assets?.mapQrDataUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={assets.mapQrDataUrl}
                  alt="Map QR"
                  crossOrigin="anonymous"
                  style={{ width: 110, height: 110, borderRadius: 14, background: "#FDFAF6" }}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {gallery.length > 0 && (
        <div style={{ padding: "0 60px 48px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 12,
            }}
          >
            {gallery.map((img, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  height: 160,
                }}
              >
                <img
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {highlightItems.length > 0 && (
        <div style={{ padding: "48px 60px", backgroundColor: "#F0EAE0" }}>
          <SectionHeader 
             label={t("tourDetails.highlightList")} 
             title={t("tourDetails.brochure.whySpecial")} 
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 40px",
              marginTop: 24,
            }}
          >
            {highlightItems.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                  padding: "10px 16px",
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#F5A623",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span dangerouslySetInnerHTML={{ __html: h }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(tour.amenities?.length > 0 || tour.amenitiesTwo?.length > 0) && (
        <div style={{ padding: "48px 60px" }}>
          <SectionHeader 
             label={t("tourDetails.included")} 
             title={t("tourDetails.brochure.inclusionsExclusions")} 
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              marginTop: 24,
            }}
          >
            {tour.amenities?.trim().length > 0 && (
              <div style={{ backgroundColor: "#E8F5E9", borderRadius: 16, padding: 28 }}>
                <h4
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#2E7D32",
                  }}
                >
                  ✓ {t("tourDetails.included")}
                </h4>
                <div
                  style={{ fontSize: 14, color: "#1B5E20" }}
                  dangerouslySetInnerHTML={{ __html: tour.amenities }}
                />
              </div>
            )}
            {tour.amenitiesTwo?.trim().length > 0 && (
              <div style={{ backgroundColor: "#FFF3E0", borderRadius: 16, padding: 28 }}>
                <h4
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#E65100",
                  }}
                >
                  ✗ {t("tourDetails.notIncluded")}
                </h4>
                <div
                  style={{ fontSize: 14, color: "#BF360C" }}
                  dangerouslySetInnerHTML={{ __html: tour.amenitiesTwo }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {pricingPlans.length > 0 && (
        <div style={{ padding: "48px 60px", backgroundColor: "#F0EAE0" }}>
          <SectionHeader 
             label={t("tourDetails.brochure.pricingLabel")} 
             title={t("tourDetails.brochure.choosePackage")} 
          />
          {pricingPlans.map((plan, i) => (
            <div key={i} style={{ marginTop: 24 }}>
              <h4
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {plan.planName}
              </h4>
              <div style={{ display: "flex", gap: 16 }}>
                {plan.seasons.map((s, j) => (
                  <div
                    key={j}
                    style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 24,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        color: "#F5A623",
                        marginBottom: 4,
                      }}
                    >
                      {s.seasonName}
                    </div>
                    <div style={{ fontSize: 13, color: "#8B7355", marginBottom: 16 }}>
                      {s.startDate} – {s.endDate}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      {s.prices.solo != null && <PriceTag label={t("tourDetails.pricing.soloTraveler", "Solo")} price={s.prices.solo} />}
                      {s.prices.pax_2_4 != null && <PriceTag label={t("tourDetails.pricing.pax2_4", "2–4 pax")} price={s.prices.pax_2_4} />}
                      {s.prices.pax_5_8 != null && <PriceTag label={t("tourDetails.pricing.pax5_8", "5–8 pax")} price={s.prices.pax_5_8} />}
                      {s.prices.pax_9_16 != null && <PriceTag label={t("tourDetails.pricing.pax9_16", "9–16 pax")} price={s.prices.pax_9_16} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {itineraryDays.length > 0 && (
        <div style={{ padding: "48px 60px" }}>
          <SectionHeader 
             label={t("tourDetails.brochure.dayByDay")} 
             title={t("tourDetails.nav.tourPlan")} 
          />
          <div style={{ marginTop: 24 }}>
            {itineraryDays.map((d, k) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  gap: 24,
                  marginBottom: 32,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                    width: 60,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "#F5A623",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 16,
                      fontFamily: "'Playfair Display', serif",
                    }}
                  >
                    {d.day}
                  </div>
                  {k < itineraryDays.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        backgroundColor: "#E0D5C5",
                        marginTop: 8,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 20,
                      fontWeight: 600,
                      margin: "8px 0 12px",
                    }}
                  >
                    {d.title}
                  </h4>
                  {d.activities?.some((a) => a.image?.url) && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                      {d.activities
                        .filter((a) => a.image?.url)
                        .slice(0, 3)
                        .map((a, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: 200,
                              height: 130,
                              borderRadius: 10,
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={a.image!.url}
                              alt={a.heading}
                              crossOrigin="anonymous"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                  {d.activities?.map((a, idx) => (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#2D1F0E" }}>
                        {a.heading}
                      </div>
                      <div style={{ fontSize: 13, color: "#8B7355", lineHeight: 1.6 }}>
                        {(a.description || "").replace(/<[^>]*>/g, "")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          padding: "40px 60px",
          backgroundColor: "#2D1F0E",
          color: "#E0D5C5",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#F5A623",
            marginBottom: 8,
          }}
        >
          {companyName}
        </div>
        <div style={{ fontSize: 14, marginBottom: 4 }}>
          {footerOneData?.contact?.phone ? `📞 ${footerOneData.contact.phone}` : null}
          {footerOneData?.contact?.email ? ` \n•\n ✉ ${footerOneData.contact.email}` : null}
          {website ? ` \n•\n 🌐 ${website}` : null}
        </div>
        <div style={{ fontSize: 12, color: "#8B7355", marginTop: 12 }}>
          {t("tourDetails.brochure.generatedOn")} {new Date().toLocaleDateString(i18n.language)} — {t("tourDetails.brochure.disclaimer")}
        </div>
      </div>
    </div>
  );
});

TourBrochure.displayName = "TourBrochure";

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 3, backgroundColor: "#F5A623", borderRadius: 2 }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#F5A623",
          }}
        >
          {label}
        </span>
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 32,
          fontWeight: 700,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </>
  );
}

/** `price` is the per-currency object the API stores, not a bare number — it was
 *  declared as `number` and only worked because formatPrice accepts both. */
function PriceTag({ label, price }: { label: string; price: TierAmount }) {
  const { formatPrice } = useCurrency();
  return (
    <div style={{ textAlign: "center", padding: "10px 8px", backgroundColor: "#FDFAF6", borderRadius: 10 }}>
      <div style={{ fontSize: 12, color: "#8B7355", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#2D1F0E" }}>{formatPrice(price)}</div>
    </div>
  );
}

export default TourBrochure;
