import type { Metadata } from "next";
import Link from "next/link";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import { footerOneData } from "@/data/footerOneData";
import {
  getStaticLocaleAlternates,
  SEO_BASE_URL,
} from "@/lib/seo/localeAlternates";
import { localizeInternalUrl, normalizeLocale, type SupportedLocale } from "@/lib/url";
import deStrings from "@/i18n/locales/de/privacyPolicy.json";
import enStrings from "@/i18n/locales/en/privacyPolicy.json";
import esStrings from "@/i18n/locales/es/privacyPolicy.json";
import itStrings from "@/i18n/locales/it/privacyPolicy.json";
import styles from "./PrivacyPolicy.module.css";

const strings: Record<SupportedLocale, typeof enStrings> = {
  en: enStrings,
  de: deStrings,
  it: itStrings,
  es: esStrings,
};

interface PrivacyPolicyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PrivacyPolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const copy = strings[lang];

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: getStaticLocaleAlternates(lang, "privacy-policy"),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: PrivacyPolicyPageProps) {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const copy = strings[lang];
  const pageUrl = `${SEO_BASE_URL}/${lang}/privacy-policy`;

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: copy.title,
    description: copy.metaDescription,
    inLanguage: lang,
    isPartOf: { "@id": `${SEO_BASE_URL}/#website` },
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader
        title={copy.title}
        subTitle={copy.subtitle}
        breadcrumbs={[{ label: copy.title }]}
      />
      <main className={styles.policy}>
        <div className="container">
          <article className={styles.article}>
            <p className={styles.intro}>{copy.intro}</p>
            {copy.sections.map((section) => (
              <section className={styles.section} key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </section>
            ))}
            <section className={styles.contact}>
              <h2>{copy.contactTitle}</h2>
              <p>
                {copy.contactText}{" "}
                <a href={`mailto:${footerOneData.contact.email}`}>
                  {footerOneData.contact.email}
                </a>
                .
              </p>
            </section>
            <Link href={localizeInternalUrl("/travel-trade", lang)} className={styles.back}>
              ← {copy.backLabel}
            </Link>
          </article>
        </div>
      </main>
      <FooterOne />
    </Layout>
  );
}
