import type { Metadata } from "next";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";

// Metadata-only layout: the /blogs listing is a client component and can't
// export metadata itself, so canonical + hreflang for the 4 locales live here.
// The /blogs/all child sets its OWN canonical in its generateMetadata, so it
// is not mislabeled as a duplicate of /blogs. Renders children untouched;
// robots (noindex during dev) is inherited from the [locale] root layout.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: getStaticLocaleAlternates(locale, "blogs") };
}

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
