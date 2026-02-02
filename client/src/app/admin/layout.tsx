"use client";
import React, { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/admin/app-sidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { TailorMadeProvider } from '@/contexts/TailorMadeContext';
import { ContactFormProvider } from '@/contexts/ContactFormContext';
import { BookingProvider } from '@/contexts/BookingContext';
import AdminRealtimeListener from '@/components/admin/AdminRealtimeListener';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import '../(home)/globals.css';
import './admin-ui.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div suppressHydrationWarning>
      <AuthProvider>
        <TailorMadeProvider>
          <ContactFormProvider>
            <BookingProvider>
              <ProtectedRoute>
                <div className="admin-scope">
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
                </div>
              </ProtectedRoute>
            </BookingProvider>
          </ContactFormProvider>
        </TailorMadeProvider>
      </AuthProvider>
    </div>
  );
}
