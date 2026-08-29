import { DEFAULT_LOCALE, normalizeLocale, type SupportedLocale } from "@/lib/url";

/** One namespace name -> its flat translation object. */
export type LocaleBundle = Record<string, Record<string, unknown>>;

/** What the client i18n instance is seeded with for a single request. */
export type LocaleResources = Partial<Record<SupportedLocale, LocaleBundle>>;

/**
 * Translations are loaded HERE, on the server, and handed to the client.
 *
 * lib/i18n.ts used to `import` all nine namespaces for all four languages at
 * module scope — about 164 KB of raw JSON — and pass them straight into
 * `i18n.init({ resources })`. Nothing about that is tree-shakeable: an object
 * literal of static imports ships whole. Every visitor downloaded and parsed
 * the German, Italian and Spanish translations in order to read one language.
 *
 * These per-locale modules are imported dynamically from a SERVER component
 * (the [locale] layout), so they never enter a client chunk at all. The
 * resulting object travels once inside the RSC payload as data, and
 * I18nProvider seeds i18next with it synchronously before the first render —
 * so `t()` still resolves on the very first paint, exactly as before.
 *
 * English rides along for every other language because `fallbackLng: "en"`
 * is what makes an untranslated key fall back to English rather than render
 * as a raw key path. Dropping it would have been a silent content regression.
 */
async function loadBundle(locale: SupportedLocale): Promise<LocaleBundle> {
  switch (locale) {
    case "de":
      return (await import("./de")).default as LocaleBundle;
    case "it":
      return (await import("./it")).default as LocaleBundle;
    case "es":
      return (await import("./es")).default as LocaleBundle;
    case "en":
    default:
      return (await import("./en")).default as LocaleBundle;
  }
}

export async function getLocaleResources(locale: string): Promise<LocaleResources> {
  const active = normalizeLocale(locale);

  if (active === DEFAULT_LOCALE) {
    return { [DEFAULT_LOCALE]: await loadBundle(DEFAULT_LOCALE) };
  }

  const [activeBundle, fallbackBundle] = await Promise.all([
    loadBundle(active),
    loadBundle(DEFAULT_LOCALE),
  ]);

  return {
    [active]: activeBundle,
    [DEFAULT_LOCALE]: fallbackBundle,
  };
}
