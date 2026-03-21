"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SlugContextType {
  localizedSlugs: Record<string, string | undefined> | null;
  setLocalizedSlugs: (slugs: Record<string, string | undefined> | null) => void;
}

const SlugContext = createContext<SlugContextType | undefined>(undefined);

export const SlugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [localizedSlugs, setLocalizedSlugs] = useState<Record<string, string | undefined> | null>(null);
  const pathname = usePathname();

  // Reset slugs when path changes (to avoid stale slugs from previous pages)
  useEffect(() => {
    setLocalizedSlugs(null);
  }, [pathname]);

  return (
    <SlugContext.Provider value={{ localizedSlugs, setLocalizedSlugs }}>
      {children}
    </SlugContext.Provider>
  );
};

export const useSlugs = () => {
  const context = useContext(SlugContext);
  if (context === undefined) {
    throw new Error("useSlugs must be used within a SlugProvider");
  }
  return context;
};
