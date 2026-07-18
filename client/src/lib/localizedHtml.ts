// Helpers for localized rich-text fields whose legacy values were
// per-language ARRAYS of bullet strings (chips inputs) and are now
// localized HTML strings (rich-text editor).

/**
 * Normalizes a localized value to HTML per language: arrays become a
 * <ul><li> list, strings pass through untouched. Idempotent — safe to call
 * on every render, which is exactly how it heals stale localStorage drafts
 * that still carry the array format straight into the editor.
 */
export const mixedToHtml = (val: any) => {
  const out: any = { en: '', de: '', it: '', es: '' };
  if (!val) return out;
  for (const l of ['en', 'de', 'it', 'es'] as const) {
    const v = val[l];
    if (Array.isArray(v)) {
      out[l] = v.length ? '<ul>' + v.map((x: any) => '<li>' + String(x) + '</li>').join('') + '</ul>' : '';
    } else if (typeof v === 'string') {
      out[l] = v;
    }
  }
  return out;
};

/** Empty when every language has no visible text (HTML tags stripped). */
export const htmlAllEmpty = (v: any) =>
  !v ||
  (['en', 'de', 'it', 'es'] as const).every(
    (l) => !String(v?.[l] || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim()
  );
