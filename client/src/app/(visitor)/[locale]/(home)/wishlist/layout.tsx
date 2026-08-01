import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { Metadata } from "next";
import { getServerTranslation } from "@/lib/i18n-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, "wishlist");

  return {
    title: t("pageMetaTitle"),
    description: t("pageMetaDescription"),
    alternates: getStaticLocaleAlternates(locale, "wishlist"),
  };
}

export default function WishlistLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
