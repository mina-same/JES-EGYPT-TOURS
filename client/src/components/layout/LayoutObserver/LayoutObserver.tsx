"use client";

import { useEffect } from "react";
import useStore from "@/store/useStore";
import { usePathname } from "next/navigation";

/**
 * The last path this observer saw. Module scope, not a ref: a language switch
 * remounts the whole [locale] tree, this observer included, and the change
 * of path it brings must still close what was open.
 */
let lastPathname: string | null = null;

const LayoutObserver = () => {
  const mobileDrawerStatus = useStore((state) => state.mobileDrawerStatus);
  const mobileDrawerTwoStatus = useStore((state) => state.mobileDrawerTwoStatus);
  const pathname = usePathname();
  useEffect(() => {
    if (mobileDrawerStatus || mobileDrawerTwoStatus) {
      document.body.classList.add("megamenu-popup-active");
    } else {
      document.body.classList.remove("megamenu-popup-active");
    }

    return () => {
      document.body.classList.remove("megamenu-popup-active");
    };
  }, [mobileDrawerStatus, mobileDrawerTwoStatus]);

  // Navigating closes the drawer and the language & currency sheet — on a
  // CHANGE of path only. This observer is itself loaded by the page's first
  // tap (HomeClientShell), so it often mounts just after that tap has opened
  // the menu; closing on mount shut the menu again at once, and a tap on the
  // hamburger in the first second of a page opened nothing.
  useEffect(() => {
    const changed = lastPathname !== null && lastPathname !== pathname;
    lastPathname = pathname;
    if (!changed) return;

    const state = useStore.getState();
    if (state.mobileDrawerStatus) state.setMobileDrawerStatus(false);
    if (state.mobileDrawerTwoStatus) state.setMobileDrawerTwoStatus(false);
    if (state.preferencesSheetStatus) state.setPreferencesSheetStatus(false);
  }, [pathname]);

  return null;
};

export default LayoutObserver;
