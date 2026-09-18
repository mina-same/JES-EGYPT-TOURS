"use client";

import { useEffect } from "react";
import useStore from "@/store/useStore";
import { usePathname } from "next/navigation";

const LayoutObserver = () => {
  const mobileDrawerStatus = useStore((state) => state.mobileDrawerStatus);
  const mobileDrawerTwoStatus = useStore((state) => state.mobileDrawerTwoStatus);
  const setMobileDrawerTwoStatus = useStore(
    (state) => state.setMobileDrawerTwoStatus
  );
  const setMobileDrawerStatus = useStore((state) => state.setMobileDrawerStatus);
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

  useEffect(() => {
    if (mobileDrawerStatus) {
      setMobileDrawerStatus(false);
    }
    if (mobileDrawerTwoStatus) {
      setMobileDrawerTwoStatus(false);
    }
  }, [pathname]);

  return null;
};

export default LayoutObserver;
