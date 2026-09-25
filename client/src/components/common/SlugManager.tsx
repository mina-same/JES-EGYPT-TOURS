"use client";

import { startTransition, useEffect } from "react";
import { useSlugs } from "@/contexts/SlugContext";

interface SlugManagerProps {
  slugs: Record<string, string | undefined>;
}

export const SlugManager: React.FC<SlugManagerProps> = ({ slugs }) => {
  const { setLocalizedSlugs } = useSlugs();

  useEffect(() => {
    if (slugs) {
      // A transition: this runs straight after the page hydrates, and a plain
      // update to a context above a Suspense boundary that is still waiting
      // for its code (the tour page's booking form) makes React throw that
      // boundary's server HTML away. React holds a transition back until the
      // boundary has hydrated instead.
      startTransition(() => setLocalizedSlugs(slugs));
    }
    // Cleanup is handled by SlugProvider on path change
  }, [slugs, setLocalizedSlugs]);

  return null;
};
