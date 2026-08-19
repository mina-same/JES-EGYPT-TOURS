import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import ContactTop from "@/components/sections/ContactTop/ContactTop";
import ContactPage from "@/components/sections/ContactPage/ContactPage";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { getServerTranslation } from "@/lib/i18n-server";
import { Metadata } from "next";
import { getStaticLocaleAlternates, SEO_BASE_URL } from "@/lib/seo/localeAlternates";
import { getLocalizedStaticPath, normalizeLocale } from "@/lib/url";
import { ogSiteDefaults } from "@/lib/ogDefaults";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const { t } = await getServerTranslation(lang, 'contact');
  // getLocalizedStaticPath owns the unprefixed-English rule, so this stays
  // correct if `contact` is ever added to UNPREFIXED_ENGLISH_STATIC_PAGES.
  const canonicalUrl = `${SEO_BASE_URL}${getLocalizedStaticPath("contact", lang)}`;

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: getStaticLocaleAlternates(lang, "contact"),
    openGraph: {
      ...ogSiteDefaults(lang),
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: `${SEO_BASE_URL}/images/resources/contact-og.jpg`,
          alt: t('pageTitle'),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: [`${SEO_BASE_URL}/images/resources/contact-og.jpg`],
    },
  };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const { t } = await getServerTranslation(lang, 'contact');
  const pageUrl = `${SEO_BASE_URL}${getLocalizedStaticPath("contact", lang)}`;

  // Same shape the travel-trade page emits, so both pages hang off the single
  // site-level #website / #travelagency entities declared by SEOProvider.
  const contactPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: t('metaTitle'),
    description: t('metaDescription'),
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t('breadcrumb.home'),
        item: `${SEO_BASE_URL}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t('breadcrumb.current'),
        item: pageUrl,
      },
    ],
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader
        title={t('pageTitle')}
        subTitle={t('pageSubTitle')}
        breadcrumbs={[{ label: t('breadcrumb.current') }]}
      />
      <ContactTop />
      <ContactPage locale={lang} />
      <FooterOne />
    </Layout>
  );
}
