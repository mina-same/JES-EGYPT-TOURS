import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getAllBlogs } from "@/lib/api/blog";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

export const metadata = {
  title: "Travel Blog || JES Egypt Tours",
  description:
    "Explore our travel blog for tips, guides, and stories about Egypt and beyond. Discover amazing destinations and plan your perfect adventure.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: { page?: string; tag?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const tag = typeof searchParams.tag === "string" ? searchParams.tag : undefined;
  const blogsData = await getAllBlogs({ page, limit: 9, tags: tag });

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title='Travel Blog' subTitle='Blog' />
      <DynamicBlogGrid 
        blogs={blogsData.data} 
        pagination={blogsData.pagination}
        basePath={tag ? `/blogs?tag=${encodeURIComponent(tag)}` : "/blogs"}
      />
      <FooterOne />
    </Layout>
  );
}
