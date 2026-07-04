import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
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
