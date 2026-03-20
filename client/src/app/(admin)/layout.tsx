"use client";
import React, { useEffect, useState } from 'react';
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
