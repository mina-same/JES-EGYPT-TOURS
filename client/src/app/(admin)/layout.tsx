"use client";
import React, { useEffect, useState } from 'react';
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

import { Plus_Jakarta_Sans, Just_Another_Hand } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "@/contexts/NotificationContext";

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

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force English in the admin panel regardless of the user's selected language
    import('@/lib/i18n').then((module) => {
      const i18n = module.default;
      if (i18n.language !== 'en') {
        i18n.changeLanguage('en');
      }
    });
  }, []);

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${jakartaSans.variable} ${justAnotherHand.variable}`} suppressHydrationWarning>
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
        {!mounted ? null : (
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
        )}
      </body>
    </html>
  );
}

