import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import LocalizedPageHeader from "@/components/sections/PageHeader/LocalizedPageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getAllBlogs } from "@/lib/api/blog";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

export const metadata = {
  title: "All Blog Posts || JES Egypt Tours",
  description: "Explore all our travel articles.",
};

export default async function AllBlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const tag = typeof resolvedSearchParams.tag === "string" ? resolvedSearchParams.tag : undefined;
  const blogsData = await getAllBlogs({ page, limit: 9, tags: tag });

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <LocalizedPageHeader namespace="blogs" titleKey="allNews" subTitleKey="ourBlog" />
      <DynamicBlogGrid 
        blogs={blogsData.data} 
        pagination={blogsData.pagination}
        basePath={tag ? `/blogs/all?tag=${encodeURIComponent(tag)}` : "/blogs/all"}
      />
      <FooterOne />
    </Layout>
  );
}
