"use client";
import React, { useEffect } from 'react';
import Script from 'next/script';
import { AppSidebar } from '@/components/admin/app-sidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { TailorMadeProvider } from '@/contexts/TailorMadeContext';
import { ContactFormProvider } from '@/contexts/ContactFormContext';
import { BookingProvider } from '@/contexts/BookingContext';
import AdminRealtimeListener from '@/components/admin/AdminRealtimeListener';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import '@/app/(visitor)/[locale]/(home)/globals.css';
import './admin-ui.css';

import { Manrope, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/contexts/NotificationContext";

// The dashboard itself stays fully sans-serif - admin headings are functional,
// not editorial, so Playfair is never applied to dashboard chrome.
const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Loaded solely so the slider previews render in the same faces the published
// visitor slide uses (title -> display, subtitle -> display italic). Without it
// the editor would preview a font the live site never shows.
const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  useEffect(() => {
    // Force English in the admin panel regardless of the user's selected language
    import('@/lib/i18n').then((module) => {
      const i18n = module.default;
      if (i18n.language !== 'en') {
        i18n.changeLanguage('en');
      }
    });
  }, []);

  return (
    // Font variables belong on <html> (:root) so :root-scoped theme tokens can
    // read them. See the matching comment in the visitor layout.
    <html
      lang='en'
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
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
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthProvider>
              <NotificationProvider>
                <div className="admin-scope">
                  <TailorMadeProvider>
                    <ContactFormProvider>
                      <BookingProvider>
                        <ProtectedRoute>
                          <AdminRealtimeListener />
                          <SidebarProvider>
                            <AppSidebar />
                            <SidebarInset>
                              <AdminHeader />
                              <main className="flex flex-1 flex-col gap-4 bg-muted/30 p-4 md:p-6">
                                <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
                              </main>
                            </SidebarInset>
                          </SidebarProvider>
                        </ProtectedRoute>
                      </BookingProvider>
                    </ContactFormProvider>
                  </TailorMadeProvider>
                </div>
                <Toaster />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

