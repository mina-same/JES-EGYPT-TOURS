import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import SearchResultsPage from "@/components/sections/SearchResultsPage/SearchResultsPage";

export const metadata = {
  title: "Search Results || JES Egypt Tours",
  description: "Search tours and blogs.",
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title="Search" subTitle="Results" />
      <SearchResultsPage initialSearchParams={searchParams} />
      <FooterOne />
    </Layout>
  );
}
