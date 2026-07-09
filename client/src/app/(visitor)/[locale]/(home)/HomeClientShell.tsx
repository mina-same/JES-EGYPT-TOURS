"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Preloader from "@/components/common/Preloader/Preloader";
import useStore from "@/store/useStore";

const LayoutObserver = dynamic(
  () => import("@/components/layout/LayoutObserver/LayoutObserver"),
  { ssr: false }
);
const Drawer = dynamic(() => import("@/components/layout/Drawer/Drawer"), {
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
  const { mobileDrawerStatus, searchPopupStatus } = useStore();
  const [showPreloader, setShowPreloader] = useState(true);
  const [enableNonCriticalUi, setEnableNonCriticalUi] = useState(false);
  const [shouldMountDrawer, setShouldMountDrawer] = useState(false);
  const [shouldMountSearch, setShouldMountSearch] = useState(false);

  useEffect(() => {
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
    };
  }, []);

  useEffect(() => {
    if (mobileDrawerStatus) {
      setShouldMountDrawer(true);
    }
    if (searchPopupStatus) {
      setShouldMountSearch(true);
    }
  }, [mobileDrawerStatus, searchPopupStatus]);

  return (
    <>
      {showPreloader && <Preloader />}
      {children}
      {enableNonCriticalUi && <LayoutObserver />}
      {enableNonCriticalUi && shouldMountDrawer ? <Drawer /> : null}
      {enableNonCriticalUi && shouldMountSearch ? <Search /> : null}
    </>
  );
}
