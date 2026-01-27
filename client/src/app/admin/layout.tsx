"use client";
import React, { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/admin/app-sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { TailorMadeProvider } from '@/contexts/TailorMadeContext';
import { ContactFormProvider } from '@/contexts/ContactFormContext';
import { BookingProvider } from '@/contexts/BookingContext';
import AdminRealtimeListener from '@/components/admin/AdminRealtimeListener';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import '../(home)/globals.css';
import './admin.css';

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
                <AdminRealtimeListener />
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                      <SidebarTrigger className="-ml-1 !text-black" />
                      <Separator orientation="vertical" className="mr-2 h-4 !text-black" />
                      <div className="flex flex-1 items-center gap-2">
                        <h1 className="text-lg font-semibold">Dashboard</h1>
                      </div>
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
                  </SidebarInset>
                </SidebarProvider>
              </ProtectedRoute>
            </BookingProvider>
          </ContactFormProvider>
        </TailorMadeProvider>
      </AuthProvider>
    </div>
  );
}
