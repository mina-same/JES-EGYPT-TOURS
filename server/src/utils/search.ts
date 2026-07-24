const SEARCH_LOCALES = ['en', 'de', 'it', 'es'] as const;

export type SearchRegex = {
  $regex: string;
  $options: 'i';
};

export const createSearchRegex = (value: unknown): SearchRegex | null => {
  if (typeof value !== 'string') return null;

  const search = value.trim();
  if (!search) return null;

  return {
    $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    $options: 'i',
  };
};

export const localizedSearchFilters = (
  fields: string[],
  searchRegex: SearchRegex
): Record<string, SearchRegex>[] =>
  fields.flatMap((field) =>
    SEARCH_LOCALES.map((locale) => ({
      [`${field}.${locale}`]: searchRegex,
    }))
  );
