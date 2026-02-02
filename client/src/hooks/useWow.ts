"use client";
import { useEffect } from "react";

const useWow = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;
    // Ensure this only runs in the browser
    if (typeof window !== "undefined") {
      import("wow.js")
        .then((module) => {
          const WOW = module.default;
          const wow = new WOW({
            boxClass: "wow",
            animateClass: "animated",
            offset: 0,
            mobile: true,
            live: true,
          });
          wow.init();
        })
        .catch((error) => {
          console.error("Failed to load WOW.js:", error);
        });
    }
  }, [enabled]);
};

export default useWow;
