import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: getStaticLocaleAlternates(locale, "search"),
  };
}

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
