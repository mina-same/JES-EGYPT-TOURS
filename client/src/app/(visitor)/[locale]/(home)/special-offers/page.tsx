import { Metadata } from "next";
import SpecialOffersView from "./_views/SpecialOffersView";
import enStrings from "@/i18n/locales/en/specialOffers.json";
import deStrings from "@/i18n/locales/de/specialOffers.json";
import itStrings from "@/i18n/locales/it/specialOffers.json";
import esStrings from "@/i18n/locales/es/specialOffers.json";
import { getStaticLocaleAlternates, SEO_BASE_URL } from "@/lib/seo/localeAlternates";
import { getLocalizedStaticSlug } from "@/lib/url";
import { ogSiteDefaults } from "@/lib/ogDefaults";
import { API_URL } from "@/config/api";
import { SPECIAL_OFFERS_FAQS } from "./specialOffersFaqs";

const baseUrl = SEO_BASE_URL;

const strings: Record<string, typeof enStrings> = { en: enStrings, de: deStrings, it: itStrings, es: esStrings };

type Lang = "en" | "de" | "it" | "es";
const toLang = (locale: string): Lang =>
  (["en", "de", "it", "es"].includes(locale) ? locale : "en") as Lang;

// Fields the tour card needs — same projection the view uses client-side.
const CARD_FIELDS =
  "slug,heading,name,images,gallery,priceStartingFrom,reviewsCount,videoLink,specialOfferDiscount,duration,minAge,tourLocation";

// Page 1 of the offers, fetched server-side so the grid is part of the
// initial HTML (SEO + no spinner). The API localizes per the X-Locale header.
// On failure returns null and the view falls back to its client fetch.
async function getInitialOffers(locale: string) {
  try {
    const params = new URLSearchParams({
      isSpecialOffer: "true",
      page: "1",
      limit: "9",
      sort: "-createdAt",
      fields: CARD_FIELDS,
    });
    const res = await fetch(`${API_URL}/tours?${params.toString()}`, {
      headers: { "X-Locale": locale },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) return null;
    return {
      tours: json.data,
      total: json.total ?? json.count ?? json.data.length,
      totalPages: json.totalPages ?? 1,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = toLang(locale);
  const s = strings[lang] ?? enStrings;
  // Per-locale slug (e.g. /de/sonderangebote) — must match what the locale
  // actually serves (see next.config rewrites + lib/url/staticSlugs).
  const canonicalUrl = `${baseUrl}/${lang}/${getLocalizedStaticSlug("special-offers", lang)}`;

  return {
    title: s.pageTitle,
    description: s.pageDescription,
    keywords: s.seoKeywords,
    alternates: getStaticLocaleAlternates(locale, "special-offers"),
    openGraph: {
      ...ogSiteDefaults(lang),
      title: s.pageTitle,
      description: s.pageDescription,
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: `${baseUrl}/images/resources/special-offers-og.jpg`,
          alt: s.header.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: s.pageTitle,
      description: s.pageDescription,
      images: [`${baseUrl}/images/resources/special-offers-og.jpg`],
    },
  };
}

export default async function SpecialOffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = toLang(locale);
  const initialOffers = await getInitialOffers(lang);

  // Built from the SAME constant the visible FAQ section renders —
  // Google requires structured data to match the on-page text.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SPECIAL_OFFERS_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question[lang] || faq.question.en,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer[lang] || faq.answer.en,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SpecialOffersView
        key={locale}
        locale={locale}
        initialTours={initialOffers?.tours}
        initialTotal={initialOffers?.total}
        initialTotalPages={initialOffers?.totalPages}
      />
    </>
  );
}
