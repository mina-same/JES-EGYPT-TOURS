"use client";

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
const Sidebar = dynamic(() => import("@/components/common/Sidebar/Sidebar"), {
  ssr: false,
});
const Search = dynamic(() => import("@/components/common/Search/Search"), {
  ssr: false,
});

export default function HomeClientShell({
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
          <Sidebar />
          <Search />
        </>
      ) : null}
    </DarkModeProvider>
  );
}
