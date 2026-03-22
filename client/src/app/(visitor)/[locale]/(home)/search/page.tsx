"use client";

import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import SearchResultsPage from "@/components/sections/SearchResultsPage/SearchResultsPage";
import { useTranslation } from "react-i18next";
import { useEffect, use } from "react";

export default function SearchPage({
  searchParams,
  params
}: {
  searchParams: Record<string, string | string[] | undefined>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { t, i18n } = useTranslation('search');
  
  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title={t('pageHeaderTitle')} subTitle={t('pageHeaderSubTitle')} />
      <SearchResultsPage initialSearchParams={searchParams} />
      <FooterOne />
    </Layout>
  );
}
