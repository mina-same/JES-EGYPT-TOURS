import { Plus_Jakarta_Sans, Just_Another_Hand } from "next/font/google";
import Script from "next/script";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { I18nProvider } from "@/contexts/I18nProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { SlugProvider } from "@/contexts/SlugContext";
import SEOProvider from "@/components/common/SEO/SEOProvider";
import { Metadata } from "next";

const locales = ["en", "de", "it", "es"];
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jesegypttours.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    metadataBase: new URL(baseUrl),
    icons: {
      icon: "/favicon-logo.png",
      apple: "/favicon-logo.png",
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}



const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const justAnotherHand = Just_Another_Hand({
  variable: "--font-just-another-hand",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    <html lang={locale || 'en'} suppressHydrationWarning>
      <head>
      </head>
      <body className={`${jakartaSans.variable} ${justAnotherHand.variable}`} suppressHydrationWarning>
        <Script
          id="strip-bis-attributes"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function stripBisAttributes(root) {
                  if (!root || !root.querySelectorAll) return;

                  var nodes = root.querySelectorAll('[bis_skin_checked],[bis_size],[bis_id]');
                  for (var i = 0; i < nodes.length; i++) {
                    nodes[i].removeAttribute('bis_skin_checked');
                    nodes[i].removeAttribute('bis_size');
                    nodes[i].removeAttribute('bis_id');
                  }

                  // Also strip any attribute starting with "bis_".
                  var all = root.getElementsByTagName('*');
                  for (var j = 0; j < all.length; j++) {
                    var attrs = all[j].attributes;
                    for (var k = attrs.length - 1; k >= 0; k--) {
                      var name = attrs[k].name;
                      if (name && name.indexOf('bis_') === 0) {
                        all[j].removeAttribute(name);
                      }
                    }
                  }
                }

                try {
                  stripBisAttributes(document);

                  var observer = new MutationObserver(function (mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName && m.attributeName.indexOf('bis_') === 0) {
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
                    attributeFilter: ['bis_skin_checked', 'bis_size', 'bis_id'],
                  });
                } catch (e) {
                  // ignore
                }
              })();
            `,
          }}
        />
        <Script
          id="suppress-tiny-slider-nomod"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  function isTinySliderNoMod(msg, stack, filename) {
                    msg = String(msg || '');
                    stack = String(stack || '');
                    filename = String(filename || '');

                    var hasOuter = msg.indexOf('outerHTML') !== -1 || msg.indexOf('element has no parent node') !== -1;
                    var hasNoMod = msg.indexOf('NoModificationAllowedError') !== -1;
                    var hasTiny = stack.indexOf('tiny-slider') !== -1 || filename.indexOf('tiny-slider') !== -1;

                    return (hasOuter || hasNoMod) && hasTiny;
                  }

                  var originalConsoleError = console.error;
                  console.error = function () {
                    try {
                      var args = Array.prototype.slice.call(arguments);
                      var joined = args.map(function (a) { return String(a); }).join(' ');
                      var stack = '';
                      for (var i = 0; i < args.length; i++) {
                        if (args[i] && args[i].stack) {
                          stack = String(args[i].stack);
                          break;
                        }
                      }

                      if (isTinySliderNoMod(joined, stack, '')) {
                        return;
                      }
                    } catch (e) {
                      // ignore
                    }
                    return originalConsoleError.apply(console, arguments);
                  };

                  window.addEventListener('error', function (event) {
                    try {
                      var err = event && event.error;
                      var msg = (event && event.message) || (err && (err.message || err.toString())) || '';
                      var stack = (err && err.stack) || '';
                      var filename = (event && event.filename) || '';

                      if (isTinySliderNoMod(msg, stack, filename)) {
                        event.preventDefault();
                      }
                    } catch (e) {
                      // ignore
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function (event) {
                    try {
                      var reason = event && event.reason;
                      var msg = (reason && (reason.message || reason.toString())) || '';
                      var stack = (reason && reason.stack) || '';

                      if (isTinySliderNoMod(msg, stack, '')) {
                        event.preventDefault();
                      }
                    } catch (e) {
                      // ignore
                    }
                  });
                } catch (e) {
                  // ignore
                }
              })();
            `,
          }}
        />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthProvider>
              <WishlistProvider>
                <SlugProvider>
                  <NotificationProvider>
                    <I18nProvider locale={locale}>
                      <CurrencyProvider>
                        <SEOProvider locale={locale} />
                        {children}
                        <Toaster />
                      </CurrencyProvider>
                    </I18nProvider>
                  </NotificationProvider>
                </SlugProvider>
              </WishlistProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}