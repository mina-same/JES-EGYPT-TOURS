/**
 * "Does this FAQ have a usable question and answer in at least one language?"
 *
 * This is deliberately a COPY of the same rule in the server's
 * `models/shared/FaqSchema.ts`, which is the authority: the schema rejects the
 * save, and this runs first so the admin can drop half-written rows instead of
 * showing the editor a validation error. The two must agree -- if they drift,
 * the admin either strips rows the server would have accepted or sends rows the
 * server refuses. Change one, change the other.
 */
const FAQ_LOCALES = ['en', 'de', 'it', 'es'] as const;

function hasMeaningfulFaqValue(value: unknown): boolean {
  if (value == null) return false;

  if (typeof value === 'string') {
    const text = value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();

    return text.length > 0;
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulFaqValue);
  }

  if (typeof value === 'object') {
    return Object.values(value).some(hasMeaningfulFaqValue);
  }

  return Boolean(value);
}

export function hasCompleteFaqLocalePair(faq: any): boolean {
  return FAQ_LOCALES.some(
    locale =>
      hasMeaningfulFaqValue(faq?.question?.[locale]) &&
      hasMeaningfulFaqValue(faq?.answer?.[locale])
  );
}

export function normalizeFaqsForSave<T extends { order?: number }>(faqs?: T[] | null): T[] {
  if (!Array.isArray(faqs)) return [];

  return faqs
    .filter(hasCompleteFaqLocalePair)
    .map((faq, index) => ({
      ...faq,
      order: index,
    }));
}
