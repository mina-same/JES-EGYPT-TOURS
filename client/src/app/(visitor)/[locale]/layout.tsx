import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/contexts/I18nProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE, parseCurrencyCookie } from "@/lib/currency/currencyCookie";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { SlugProvider } from "@/contexts/SlugContext";
import SEOProvider from "@/components/common/SEO/SEOProvider";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const locales = ["en", "de", "it", "es"];
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.jesegypttours.com";

// The site is intentionally kept OUT of search indexes during development.
// It stays noindex unless NEXT_PUBLIC_SITE_INDEXABLE is explicitly 'true' at
// launch — the default (unset) is always noindex, so nothing is exposed now.
// Mirrors the same flag in src/app/robots.ts.
const siteIndexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale)) {
    notFound();
  }

  return {
    metadataBase: new URL(baseUrl),
    icons: {
      icon: "/favicon-logo.png",
      apple: "/favicon-logo.png",
    },
    robots: siteIndexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // Reject bogus locales (e.g. an unmatched /admin/* path leaking in as
  // locale="admin"). Without this, [locale] accepts any string and renders
  // duplicate visitor pages under garbage locales.
  if (!locales.includes(locale)) {
    notFound();
  }

  // Read here, in the layout, so the very first HTML already carries the
  // visitor's currency. Every visitor route is already `ƒ` (dynamic) — the
  // detail page even declares `revalidate = 0` — so this costs no static
  // generation that existed. A crawler sends no cookie and therefore keeps
  // receiving the neutral USD default.
  const currencyCookie = parseCurrencyCookie(
    (await cookies()).get(CURRENCY_COOKIE)?.value
  );

  return (
    <html lang={locale || "en"} suppressHydrationWarning>
      <head></head>
      <body
        className={`${jakartaSans.variable} ${caveat.variable}`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <WishlistProvider>
            <SlugProvider>
              <I18nProvider locale={locale}>
                <CurrencyProvider initialCurrency={currencyCookie ?? undefined}>
                  <SEOProvider locale={locale} />
                  {children}
                  <Toaster />
                </CurrencyProvider>
              </I18nProvider>
            </SlugProvider>
          </WishlistProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
