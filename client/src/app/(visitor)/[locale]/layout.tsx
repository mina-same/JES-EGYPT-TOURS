import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import Script from "next/script";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/contexts/I18nProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
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
  return (
    <html lang={locale || "en"} suppressHydrationWarning>
      <head></head>
      <body
        className={`${jakartaSans.variable} ${caveat.variable}`}
        suppressHydrationWarning
      >
        <Script
          id="strip-bis-attributes"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function stripBisAttributes(root) {
                  if (!root || !root.querySelectorAll) return;

                  // 1. Remove specific known problematic attributes
                  var nodes = root.querySelectorAll('[bis_skin_checked],[bis_size],[bis_id],[bis_register]');
                  for (var i = 0; i < nodes.length; i++) {
                    nodes[i].removeAttribute('bis_skin_checked');
                    nodes[i].removeAttribute('bis_size');
                    nodes[i].removeAttribute('bis_id');
                    nodes[i].removeAttribute('bis_register');
                  }

                  // 2. Strip any attribute starting with "bis_" or "__processed_"
                  var all = root.getElementsByTagName('*');
                  for (var j = 0; j < all.length; j++) {
                    var attrs = all[j].attributes;
                    for (var k = attrs.length - 1; k >= 0; k--) {
                      var name = attrs[k].name;
                      if (name && (name.indexOf('bis_') === 0 || name.indexOf('__processed_') === 0)) {
                        all[j].removeAttribute(name);
                      }
                    }
                  }
                  
                  // Also check the root element (document.documentElement) and body
                  if (root.attributes) {
                    var rootAttrs = root.attributes;
                    for (var l = rootAttrs.length - 1; l >= 0; l--) {
                        var rootAttrName = rootAttrs[l].name;
                        if (rootAttrName && (rootAttrName.indexOf('bis_') === 0 || rootAttrName.indexOf('__processed_') === 0)) {
                            root.removeAttribute(rootAttrName);
                        }
                    }
                  }
                }

                try {
                  stripBisAttributes(document.documentElement);
                  stripBisAttributes(document.body);

                  var observer = new MutationObserver(function (mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName && (m.attributeName.indexOf('bis_') === 0 || m.attributeName.indexOf('__processed_') === 0)) {
                        if (m.target && m.target.removeAttribute) {
                          m.target.removeAttribute(m.attributeName);
                        }
                      }
                      if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var n = m.addedNodes[j];
                          if (n && n.nodeType === 1) {
                            stripBisAttributes(n);
                          }
                        }
                      }
                    }
                  });

                  observer.observe(document.documentElement, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                  });
                } catch (e) {
                  // ignore
                }
              })();
            `,
          }}
        />
        <ErrorBoundary>
          <WishlistProvider>
            <SlugProvider>
              <I18nProvider locale={locale}>
                <CurrencyProvider>
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
