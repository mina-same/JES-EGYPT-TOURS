import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Error404 from "@/components/sections/Error404/Error404";
import type { Metadata } from "next";
import { getNotFoundRobotsMetadata } from "@/lib/seo/robots";

/*
 * robots for every visitor 404. For a not-found response Next builds the
 * <head> from the layouts plus the metadata of the DEEPEST not-found file on
 * the route. Every visitor page lives under (home), so that is this file, and
 * the metadata in [locale]/not-found.tsx never reaches a 404. Without this,
 * a 404 carried the [locale] layout's site value ("index, follow" once
 * launched) next to Next's own "noindex".
 */
export const metadata: Metadata = {
  robots: getNotFoundRobotsMetadata(),
};

export default function CustomNotFound() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title='Page Not Found' subTitle='404' />
      <Error404 />
      <FooterOne />
    </Layout>
  );
}
