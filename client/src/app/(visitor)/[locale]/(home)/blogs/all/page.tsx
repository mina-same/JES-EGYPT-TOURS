import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import LocalizedPageHeader from "@/components/sections/PageHeader/LocalizedPageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getAllBlogs } from "@/lib/api/blog";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import type { Metadata } from "next";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";

// Self-referential canonical (+ hreflang) so /blogs/all is not treated as a
// duplicate of /blogs by the parent blogs/layout.tsx alternates.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "All Blog Posts || JES Egypt Tours",
    description: "Explore all our travel articles.",
    alternates: getStaticLocaleAlternates(locale, "blogs/all"),
  };
}

export default async function AllBlogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const tag = typeof resolvedSearchParams.tag === "string" ? resolvedSearchParams.tag : undefined;
  const blogsData = await getAllBlogs({ page, limit: 9, tags: tag, locale });

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <LocalizedPageHeader namespace="blogs" titleKey="allNews" subTitleKey="ourBlog" />
      <DynamicBlogGrid 
        blogs={blogsData.data} 
        pagination={blogsData.pagination}
        // This grid IS the page — its first row is the LCP candidate.
        prioritizeFirstRow
        // Locale-prefixed, like every other listing. Without it the pager
        // pushed to /blogs/all?page=2 and the middleware resolved the language
        // from the NEXT_LOCALE cookie instead of the page being read — a
        // visitor on /de/blogs/all with no cookie landed on the English page.
        basePath={
          tag
            ? `/${locale}/blogs/all?tag=${encodeURIComponent(tag)}`
            : `/${locale}/blogs/all`
        }
      />
      <FooterOne />
    </Layout>
  );
}
