"use client";

import { Plus_Jakarta_Sans, Just_Another_Hand } from "next/font/google";
import "@/assets/vendors/fontawesome/css/all.min.css";
import "@/assets/vendors/gotur-icons/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "tiny-slider/dist/tiny-slider.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import "rc-slider/assets/index.css";
import "photoswipe/dist/photoswipe.css";
import "@/assets/css/gotur.css";
import "@/assets/css/custom.css";
import "@/app/(home)/globals.css";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DarkModeProvider } from "@/context/DarkModeProvider";
import Preloader from "@/components/common/Preloader/Preloader";

 const LayoutObserver = dynamic(
   () => import("@/components/layout/LayoutObserver/LayoutObserver"),
   { ssr: false }
 );
 const Drawer = dynamic(() => import("@/components/layout/Drawer/Drawer"), {
   ssr: false,
 });
 const DrawerTwo = dynamic(
   () => import("@/components/layout/DrawerTwo/DrawerTwo"),
   { ssr: false }
 );
 const Sidebar = dynamic(() => import("@/components/common/Sidebar/Sidebar"), {
   ssr: false,
 });
 const Search = dynamic(() => import("@/components/common/Search/Search"), {
   ssr: false,
 });

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
  const [showPreloader, setShowPreloader] = useState(true);
  const [enableNonCriticalUi, setEnableNonCriticalUi] = useState(false);

  useEffect(() => {
    const originalConsoleError = console.error;

    console.error = (...args: any[]) => {
      try {
        const msg = args.map((a) => String(a)).join(" ");
        const hasTinySlider = msg.includes("tiny-slider") || msg.includes("tiny-slider-react");
        const hasNoMod = msg.includes("NoModificationAllowedError") || msg.includes("outerHTML");

        if (hasTinySlider && hasNoMod) {
          return;
        }
      } catch {
        // ignore
      }

      originalConsoleError(...args);
    };

    const tinySliderErrorHandler = (event: ErrorEvent) => {
      const err = event?.error as any;
      const stack = String(err?.stack || "");

      if (
        err?.name === "NoModificationAllowedError" &&
        (stack.includes("tiny-slider") || stack.includes("tiny-slider-react"))
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", tinySliderErrorHandler);

    let didEnable = false;
    const enableUi = () => {
      if (didEnable) return;
      didEnable = true;
      setEnableNonCriticalUi(true);
    };

    const idleId = (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(enableUi, { timeout: 1500 })
      : null;
    const enableUiTimer = setTimeout(enableUi, 1200);

    const timer = setTimeout(() => setShowPreloader(false), 50); // Reduced from 150ms for faster loading

    const onFirstInteraction = () => {
      enableUi();
      window.removeEventListener("pointerdown", onFirstInteraction, true);
      window.removeEventListener("keydown", onFirstInteraction, true);
      window.removeEventListener("scroll", onFirstInteraction, true);
    };
    window.addEventListener("pointerdown", onFirstInteraction, true);
    window.addEventListener("keydown", onFirstInteraction, true);
    window.addEventListener("scroll", onFirstInteraction, true);

    return () => {
      clearTimeout(timer);
      clearTimeout(enableUiTimer);
      if (idleId && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleId);
      }
      window.removeEventListener("pointerdown", onFirstInteraction, true);
      window.removeEventListener("keydown", onFirstInteraction, true);
      window.removeEventListener("scroll", onFirstInteraction, true);
      window.removeEventListener("error", tinySliderErrorHandler);
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <DarkModeProvider>
          {showPreloader && <Preloader />}
          {children}
          {enableNonCriticalUi ? (
            <>
              <LayoutObserver />
              <Drawer />
              <DrawerTwo />
              <Sidebar />
              <Search />
            </>
          ) : null}
      </DarkModeProvider>
  );
}
