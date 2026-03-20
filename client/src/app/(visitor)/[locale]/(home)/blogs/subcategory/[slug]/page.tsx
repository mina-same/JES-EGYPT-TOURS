import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getBlogsBySubCategory, getSubCategoryBySlug, BlogCategory } from "@/lib/api/blog";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { notFound } from "next/navigation";
import { getLocalizedValue } from "@/lib/localize";


export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const subcategory = await getSubCategoryBySlug(params.slug);
    const title = getLocalizedValue(subcategory.seo?.metaTitle) ||
      (getLocalizedValue(subcategory.name) ? `${getLocalizedValue(subcategory.name)} - Travel Blog | JES Egypt Tours` : '');
    const description = getLocalizedValue(subcategory.seo?.metaDescription) ||
      getLocalizedValue(subcategory.description);

    return {
      title,
      description,
      robots: "noindex, nofollow",
    };

  } catch (error) {
    return {
      title: "Subcategory Not Found",
    };
  }
}

export default async function BlogSubCategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const { slug } = params;

  let subcategory: any;
  let blogsData;

  try {
    subcategory = await getSubCategoryBySlug(slug);
    blogsData = await getBlogsBySubCategory(slug, page, 9);
  } catch (error) {
    notFound();
  }

  const parentName = typeof subcategory.category === 'object' ? getLocalizedValue((subcategory.category as any).name) : '';


  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title={getLocalizedValue(subcategory.name)} subTitle={parentName || 'Blog Category'} />

      <DynamicBlogGrid
        blogs={blogsData.data}
        pagination={blogsData.pagination}
        basePath={`/blogs/subcategory/${slug}`}
      />
      <FooterOne />
    </Layout>
  );
}
