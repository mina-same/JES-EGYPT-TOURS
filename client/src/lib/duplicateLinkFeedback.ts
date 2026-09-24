export const DUPLICATE_LINK_FEEDBACK = 'admin:duplicate-link-feedback';
export const REVEAL_LINK_LOCATION = 'admin:reveal-link-location';

export interface DuplicateLinkGroup {
  locale: string;
  target: string;
  count: number;
  locations: { path: string; label: string; occurrence: number; blockId?: string }[];
}

/** Called only on a save response, never on editor changes. */
export function reportDuplicateLinkResponse<T>(data: T): T {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/admin')) return data;
  const result = data as { code?: string; success?: boolean; duplicates?: DuplicateLinkGroup[] } | null;
  if (result?.code === 'DUPLICATE_INTERNAL_LINKS' && Array.isArray(result.duplicates)) {
    window.dispatchEvent(new CustomEvent(DUPLICATE_LINK_FEEDBACK, { detail: result.duplicates }));
  } else if (result?.success) {
    window.dispatchEvent(new CustomEvent(DUPLICATE_LINK_FEEDBACK, { detail: [] }));
  }
  return data;
}
