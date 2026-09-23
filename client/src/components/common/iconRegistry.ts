import {
  Backpack,
  BookOpen,
  CalendarDays,
  Camera,
  Clock,
  Compass,
  Heart,
  Info,
  Landmark,
  MapPin,
  Mountain,
  Plane,
  Ship,
  ShoppingBag,
  Star,
  Sun,
  Tent,
  Users,
  Utensils,
  Waves,
} from 'lucide-react';

/**
 * Every Lucide icon this site is allowed to render from a stored string.
 *
 * ── Why a registry rather than the whole library ──
 * `LucideIcon` used to reach its icon through Lucide's whole module namespace
 * and index it with a name coming from the database. A computed
 * lookup into a namespace object is unshakeable by definition — the bundler
 * cannot prove any single icon is unused — so all 3,822 of them were retained.
 * Measured, that was a 586 KB (146.6 KB gzipped) chunk on EVERY page the
 * `[slug]` catch-all serves: every tour, category, subcategory, destination and
 * blog article. The database, meanwhile, contained exactly one icon name.
 *
 * Naming each icon here restores tree-shaking: the twenty below cost ~13.7 KB
 * of raw source between them, and only the ones actually imported ship.
 *
 * ── Adding an icon ──
 * Import it above and add it to the object. That is the whole procedure, and
 * it is deliberately a code change: this list is also what the admin icon
 * picker offers, so the two can never disagree about what is selectable.
 * Keep it small — the point is a curated set, not a second copy of Lucide.
 */
export const ICON_REGISTRY = {
  Backpack,
  BookOpen,
  CalendarDays,
  Camera,
  Clock,
  Compass,
  Heart,
  Info,
  Landmark,
  MapPin,
  Mountain,
  Plane,
  Ship,
  ShoppingBag,
  Star,
  Sun,
  Tent,
  Users,
  Utensils,
  Waves,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;

/**
 * The icon shown when a stored name matches nothing in the registry.
 *
 * A compass rather than nothing: an unknown name is an editor mistake, and a
 * missing tile reads as a broken page, while a neutral travel glyph reads as
 * an icon nobody got round to choosing. It is also what `BlogCategoryView`
 * already draws inline when a subcategory has no icon at all, so the two
 * fallback paths look identical.
 */
export const FALLBACK_ICON_NAME: IconName = 'Compass';

/** Registry names, sorted — the admin picker's only source of options. */
export const ICON_NAMES = Object.keys(ICON_REGISTRY).sort() as IconName[];

/** True when a stored string names an icon this site can actually render. */
export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && value in ICON_REGISTRY;
}

/**
 * Resolve a stored icon string to a registry key.
 *
 * Both spellings the data uses are accepted, and the RAW value is tried first
 * on purpose. The kebab-to-Pascal conversion lower-cases everything after each
 * hyphen, so a name already in Pascal case survives it only by luck:
 * "Plane" → "Plane", but "MapPin" → "Mappin", which matches nothing. Checking
 * the raw string first means both "MapPin" and "map-pin" resolve, and the one
 * value currently in the database — "Plane" — keeps working untouched.
 *
 * Returns null rather than the fallback so callers can tell "no icon for this
 * name" from "the editor picked a compass".
 */
export function resolveIconName(name: string | null | undefined): IconName | null {
  if (!name) return null;

  const raw = name.trim();
  if (isIconName(raw)) return raw;

  const pascal = raw
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

  return isIconName(pascal) ? pascal : null;
}
