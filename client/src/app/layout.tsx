"use client";

import { Plus_Jakarta_Sans, Just_Another_Hand } from "next/font/google";
import "@/assets/vendors/fontawesome/css/all.min.css";
import "@/assets/vendors/gotur-icons/style.css";
import "@/assets/vendors/animate/animate.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "tiny-slider/dist/tiny-slider.css";
import "photoswipe/dist/photoswipe.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import "rc-slider/assets/index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "@/assets/css/gotur.css";
import "@/assets/css/custom.css";
import "@/styles/sidebar-fix.css";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${jakartaSans.variable} ${justAnotherHand.variable}`} suppressHydrationWarning>
        <ErrorBoundary>
          {children}
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
