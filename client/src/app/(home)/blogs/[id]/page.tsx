import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import DynamicBlogDetails from "@/components/sections/DynamicBlogDetails/DynamicBlogDetails";
import { getBlogById } from "@/lib/api/blog";
import { notFound } from "next/navigation";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const blog = await getBlogById(id);
    const featuredImageUrl =
      typeof blog.featuredImage === "string"
        ? blog.featuredImage
        : blog.featuredImage?.url;

    return {
      title: blog.metaTitle || `${blog.title} || JES Egypt Tours`,
      description: blog.metaDescription || blog.excerpt,
      icons: {
        icon: "/favicon-32x32.png",
      },
      openGraph: {
        title: blog.metaTitle || blog.title,
        description: blog.metaDescription || blog.excerpt,
        images: blog.metaImage?.url
          ? [blog.metaImage.url]
          : [featuredImageUrl || "https://placehold.co/1200x630?text=Image"],
      },
    };
  } catch (error) {
    return {
      title: "Blog Not Found || JES Egypt Tours",
    };
  }
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const blog = await getBlogById(id);

    return (
      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />
        <PageHeader title={blog.title} subTitle='Blog Details' />
        <DynamicBlogDetails blog={blog} showSidebar='right' />
        <FooterOne />
      </Layout>
    );
  } catch (error) {
    notFound();
  }
}
