"use client";

import { useEffect } from "react";
import { ILocalizedString } from "@/types/shared";
import { useSlugs } from "@/contexts/SlugContext";

interface SlugManagerProps {
  slugs: Record<string, string | undefined>;
}

export const SlugManager: React.FC<SlugManagerProps> = ({ slugs }) => {
  const { setLocalizedSlugs } = useSlugs();

  useEffect(() => {
    if (slugs) {
      setLocalizedSlugs(slugs);
    }
    // Cleanup is handled by SlugProvider on path change
  }, [slugs, setLocalizedSlugs]);

  return null;
};
