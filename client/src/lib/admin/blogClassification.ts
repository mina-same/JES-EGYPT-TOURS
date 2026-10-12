import type { FormErrorItem } from '@/lib/parseApiError';

/**
 * What an article must be filed under before it goes public: one active
 * category, one active subcategory of it and one published destination. A
 * draft may leave any of them open, or point at one still being prepared.
 *
 * The API decides (server/src/utils/blogClassification.ts); this is the form's
 * earlier answer, one entry per field, so the editor is taken to the select
 * that needs attention. `path` is that select's id.
 */
const REQUIRED_TO_PUBLISH = [
  { key: 'category', field: 'Category' },
  { key: 'subCategory', field: 'Subcategory' },
  { key: 'destination', field: 'Destination' },
] as const;

type ClassificationKey = (typeof REQUIRED_TO_PUBLISH)[number]['key'];

export type ArticleClassificationForm = { status?: string } & Partial<Record<ClassificationKey, string | null>>;

/** A destination as the editor's list holds it. The Admin list includes drafts. */
export type DestinationOption = { _id: string; status?: string; isActive?: boolean };

export type ArticleClassificationOptions = {
  /** The destinations offered in the form; omitted or still loading means "not known here". */
  destinations?: readonly DestinationOption[];
};

/** Shown under the three selects. */
export const PUBLISH_CLASSIFICATION_HINT =
  'To publish or schedule: an active category and subcategory, and a published destination. A draft can leave them open.';

const isChosen = (value: string | null | undefined): boolean => {
  const id = typeof value === 'string' ? value.trim() : '';
  return id !== '' && id !== 'none';
};

/** The form is about to save an article that is, or will become, public. */
export const isPublishing = (status: string | undefined): boolean => status === 'published' || status === 'scheduled';

/** Has a public page — the rule the API applies: published, and not switched off. */
export const isPublishedDestination = (destination: DestinationOption): boolean =>
  destination.status === 'published' && destination.isActive !== false;

/**
 * What still stands between the form and the status it is about to save.
 *
 * The category and subcategory lists hold active entries only, so one that has
 * since been switched off cannot be recognized here; the API answers for it.
 */
export function publishClassificationErrors(
  form: ArticleClassificationForm,
  options: ArticleClassificationOptions = {}
): FormErrorItem[] {
  if (!isPublishing(form.status)) return [];

  const errors: FormErrorItem[] = REQUIRED_TO_PUBLISH.filter(({ key }) => !isChosen(form[key])).map(({ key, field }) => ({
    field,
    message: `${field} is required before publishing`,
    path: key,
  }));

  const destination = isChosen(form.destination)
    ? options.destinations?.find((option) => option._id === form.destination)
    : undefined;
  if (destination && !isPublishedDestination(destination)) {
    errors.push({
      field: 'Destination',
      message: 'The selected destination has no published page. Choose a published destination before publishing',
      path: 'destination',
    });
  }

  return errors;
}
