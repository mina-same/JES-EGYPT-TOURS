"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useStore from "@/store/useStore";
import { useDrawerComponent } from "@/components/layout/Drawer/drawerSlot";
import { usePreferencesSheet } from "@/components/common/SitePreferences/sheetSlot";

const LayoutObserver = dynamic(
  () => import("@/components/layout/LayoutObserver/LayoutObserver"),
  { ssr: false }
);
const Search = dynamic(() => import("@/components/common/Search/Search"), {
  ssr: false,
});

/**
 * The full-screen preloader was REMOVED.
 *
 * It initialised to `true`, so the server-rendered HTML opened with a fixed
 * #0A2B40 overlay at z-index 9991 covering the whole page — and it was only
 * taken down by a `setTimeout` inside an effect, which never runs unless the
 * client bundle downloads, parses and hydrates. On a slow connection, a failed
 * chunk, or with JavaScript off, the homepage was a solid navy rectangle.
 * custom.css had already grown an 8-second CSS fade and `pointer-events: none`
 * as a "if it gets stuck" escape hatch, which is what that failure looks like
 * when someone hits it.
 *
 * Nothing was being masked. Every section is server-rendered, the hero
 * reserves an explicit 895px/660px, and the carousels reserve their own space
 * through placeholderClassName — so the first paint is the real page. The
 * timer was 50ms besides: shorter than a single frame on most devices, long
 * enough to guarantee a navy paint before the content paint, which turned a
 * fast First Contentful Paint into a meaningless one and pushed LCP out behind
 * an overlay.
 */
export default function HomeClientShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { searchPopupStatus, preferencesSheetStatus } = useStore();
  // The drawer's code is fetched by the header (drawerSlot.ts): ahead of time
  // below 1200px once the page has loaded, else on the menu button's first
  // touch. It is rendered as soon as it is there, closed until opened.
  const Drawer = useDrawerComponent();
  // The language & currency sheet's code is fetched by its button, from the
  // press on (sheetSlot.ts); it is mounted the first time it is opened.
  const PreferencesSheet = usePreferencesSheet();
  const [enableNonCriticalUi, setEnableNonCriticalUi] = useState(false);
  const [shouldMountSearch, setShouldMountSearch] = useState(false);
  const [shouldMountPreferences, setShouldMountPreferences] = useState(false);

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
    if (searchPopupStatus) {
      setShouldMountSearch(true);
    }
    if (preferencesSheetStatus) {
      setShouldMountPreferences(true);
    }
  }, [searchPopupStatus, preferencesSheetStatus]);

  return (
    <>
      {children}
      {enableNonCriticalUi && <LayoutObserver />}
      {enableNonCriticalUi && Drawer ? <Drawer /> : null}
      {enableNonCriticalUi && shouldMountSearch ? <Search /> : null}
      {enableNonCriticalUi && shouldMountPreferences && PreferencesSheet ? <PreferencesSheet /> : null}
    </>
  );
}
