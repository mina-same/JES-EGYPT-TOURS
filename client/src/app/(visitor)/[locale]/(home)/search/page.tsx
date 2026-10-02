import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import SearchResultsPage from "@/components/sections/SearchResultsPage/SearchResultsPage";
import { getServerTranslation } from "@/lib/i18n-server";
import { getSeoBaseUrl } from "@/lib/url/baseUrl";
import { getListingRobotsMetadata } from "@/lib/seo/robots";
import { parsePublicListingQuery, shouldRedirectPublicQuery } from "@/lib/tours/publicListingUrl";
import { getPublicDestinationKeys } from "@/lib/api/tour.server";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SearchProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, "search");
  return {
    title: t("pageMetaTitle"),
    description: t("pageMetaDescription"),
    robots: getListingRobotsMetadata(true),
    alternates: { canonical: `${getSeoBaseUrl()}/${locale}/search` },
  };
}

export default async function SearchPage({ searchParams, params }: SearchProps) {
  const [{ locale }, rawQuery] = await Promise.all([params, searchParams]);
  const destinationKeys = rawQuery.destinations ? await getPublicDestinationKeys() : undefined;
  const parsed = parsePublicListingQuery(rawQuery, { allowBlogKeys: true, destinationKeys });
  if (parsed.error) notFound();
  if (shouldRedirectPublicQuery(rawQuery, parsed)) permanentRedirect(`/${locale}/search${parsed.redirectSearch}`);
  const { t } = await getServerTranslation(locale, 'search');

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title={t('pageHeaderTitle')} subTitle={t('pageHeaderSubTitle')} />
      <SearchResultsPage initialSearchParams={rawQuery} />
      <FooterOne />
    </Layout>
  );
}
