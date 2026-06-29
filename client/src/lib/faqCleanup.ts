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
