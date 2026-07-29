import type { Metadata } from "next";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Layout from "@/components/layout/Layout/Layout";
import { ogSiteDefaults } from "@/lib/ogDefaults";
import {
  getStaticLocaleAlternates,
  SEO_BASE_URL,
} from "@/lib/seo/localeAlternates";
import {
  normalizeLocale,
  type SupportedLocale,
} from "@/lib/url";
import deStrings from "@/i18n/locales/de/travelTrade.json";
import enStrings from "@/i18n/locales/en/travelTrade.json";
import esStrings from "@/i18n/locales/es/travelTrade.json";
import itStrings from "@/i18n/locales/it/travelTrade.json";
import TravelTradeContent from "./_components/TravelTradeContent";

const strings: Record<SupportedLocale, typeof enStrings> = {
  en: enStrings,
  de: deStrings,
  it: itStrings,
  es: esStrings,
};

interface TravelTradePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: TravelTradePageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const copy = strings[lang];
  const canonicalUrl = `${SEO_BASE_URL}/${lang}/travel-trade`;
  const socialImage = `${SEO_BASE_URL}/images/resources/contact-og.jpg`;

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: getStaticLocaleAlternates(lang, "travel-trade"),
    openGraph: {
      ...ogSiteDefaults(lang),
      title: copy.metadata.title,
      description: copy.metadata.description,
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: socialImage,
          alt: copy.hero.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadata.title,
      description: copy.metadata.description,
      images: [socialImage],
    },
  };
}

export default async function TravelTradePage({
  params,
}: TravelTradePageProps) {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const copy = strings[lang];
  const pageUrl = `${SEO_BASE_URL}/${lang}/travel-trade`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy.breadcrumb.home,
        item: `${SEO_BASE_URL}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: copy.breadcrumb.current,
        item: pageUrl,
      },
    ],
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: copy.metadata.title,
    description: copy.metadata.description,
    inLanguage: lang,
    isPartOf: {
      "@id": `${SEO_BASE_URL}/#website`,
    },
    about: {
      "@id": `${SEO_BASE_URL}/#travelagency`,
    },
    breadcrumb: {
      "@id": `${pageUrl}#breadcrumb`,
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: copy.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <TopbarOne />
      <HeaderOne linkTheme="dark" />
      <HeaderOneCloned />
      <TravelTradeContent dictionary={copy} locale={lang} />
      <FooterOne />
    </Layout>
  );
}
