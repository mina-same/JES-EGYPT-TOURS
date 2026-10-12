"use client";

import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Error404 from "@/components/sections/Error404/Error404";

/**
 * The visitor 404 page: the site's header and footer around the "Page Not
 * Found" message. Rendered through NotFoundViewLazy, which says why this is a
 * component of its own.
 */
export default function NotFoundView() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title='Page Not Found' subTitle='404' breadcrumbLabelKey="pageNames.notFound" />
      <Error404 />
      <FooterOne />
    </Layout>
  );
}
