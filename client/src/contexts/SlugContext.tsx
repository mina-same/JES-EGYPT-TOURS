"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

type SlugMap = Record<string, string | undefined> | null;

interface SlugContextType {
  localizedSlugs: SlugMap;
  setLocalizedSlugs: (slugs: SlugMap) => void;
}

const SlugContext = createContext<SlugContextType | undefined>(undefined);

export const SlugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  // The slugs are stored TOGETHER WITH the path they belong to, and exposed
  // only while that path is still the current one. Stale slugs from a
  // previous page are therefore invisible automatically — no reset needed.
  //
  // (The previous design reset the slugs in a `useEffect` on every pathname
  // change. React runs child effects before parent effects, so that reset
  // RACED against SlugManager's set effect and could wipe freshly-set slugs
  // right after hydration — which disabled every language in the switcher on
  // tour pages.)
  const [entry, setEntry] = useState<{ path: string; slugs: SlugMap } | null>(null);

  // Always points at the CURRENT pathname (assigned during render, which
  // always precedes the children's effects that call the setter).
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Stable identity so consumers' effect dependencies never re-fire in a loop.
  const setLocalizedSlugs = useCallback((slugs: SlugMap) => {
    setEntry({ path: pathnameRef.current, slugs });
  }, []);

  const value = useMemo<SlugContextType>(
    () => ({
      localizedSlugs: entry && entry.path === pathname ? entry.slugs : null,
      setLocalizedSlugs,
    }),
    [entry, pathname, setLocalizedSlugs]
  );

  return <SlugContext.Provider value={value}>{children}</SlugContext.Provider>;
};

export const useSlugs = () => {
  const context = useContext(SlugContext);
  if (context === undefined) {
    throw new Error("useSlugs must be used within a SlugProvider");
  }
  return context;
};
