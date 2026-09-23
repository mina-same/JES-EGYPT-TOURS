'use client';

import React from 'react';
import type { LucideProps } from 'lucide-react';
import { FALLBACK_ICON_NAME, ICON_REGISTRY, resolveIconName } from './iconRegistry';

interface LucideIconProps extends LucideProps {
  /**
   * Stored icon name, e.g. "Plane" or "map-pin". Deliberately a plain string
   * rather than `IconName`: this value arrives from the database, where
   * nothing has ever type-checked it, and narrowing it here would only push
   * a cast onto every caller.
   */
  name: string;
}

/**
 * Renders one icon from the approved registry, chosen by a stored name.
 *
 * This used to pull in Lucide's whole module namespace and index it with
 * `name`. Because the key is only known at runtime, the
 * bundler had to keep every icon Lucide ships — a measured 586 KB / 146.6 KB
 * gzipped, on every page the `[slug]` route serves, to satisfy a database
 * holding a single icon name. Resolving against a named registry instead lets
 * tree-shaking drop everything nobody imported. See `iconRegistry.ts`.
 *
 * An unrecognised name draws the fallback compass rather than returning null:
 * the old behaviour left a silent hole in the layout, which looks like a bug
 * to the visitor and hides the editor's typo from the person who could fix it.
 */
const LucideIcon: React.FC<LucideIconProps> = ({ name, ...props }) => {
  const resolved = resolveIconName(name) ?? FALLBACK_ICON_NAME;
  const IconComponent = ICON_REGISTRY[resolved];

  return <IconComponent {...props} />;
};

export default LucideIcon;
