import { Response } from 'express';
import Blog from '../models/Blog';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';
import Destination from '../models/Destination';
import { PublishingValidationError } from './publishing';

/** The fields of a referenced document the publish guard reads. */
type Stored = { isActive?: unknown; status?: unknown; category?: unknown };

/** Switched on. Absent counts as on, as in the slug resolver's `isActive: { $ne: false }`. */
const isActive = (doc: Stored): boolean => doc.isActive !== false;

/**
 * Has a public page: PUBLIC_DESTINATION_FILTER (models/Destination.ts) applied
 * to a document already in hand. The two must say the same thing —
 * tests/blog-classification.test.ts holds them together.
 */
export const hasPublicPage = (doc: Stored): boolean => doc.status === 'published' && doc.isActive !== false;

/**
 * How an article is classified: one category, one topic of that category
 * (stored as `subCategory`) and one destination. Topic and destination are
 * parallel — what the article is about, and where — and the destination's own
 * page lists an article through `destination` alone.
 *
 * Per reference: what the guard selects, what makes the document ready for a
 * public article, and how the message names it when it is not. Labels are the
 * Admin form's: the editor reads these messages.
 */
const FIELDS = [
  { key: 'category', label: 'category', select: 'isActive', ready: isActive, notReady: 'is inactive', remedy: 'an active category' },
  { key: 'subCategory', label: 'subcategory', select: 'category isActive', ready: isActive, notReady: 'is inactive', remedy: 'an active subcategory' },
  { key: 'destination', label: 'destination', select: 'status isActive', ready: hasPublicPage, notReady: 'has no published page', remedy: 'a published destination' },
] as const;

type ClassificationKey = (typeof FIELDS)[number]['key'];
export type BlogClassification = Partial<Record<ClassificationKey, unknown>>;

/** What the article page needs of its destination to name it and link to it. */
export const ARTICLE_DESTINATION_FIELDS = 'name shortName slug';

/**
 * The id a reference holds — given as a string, an ObjectId or a populated
 * document — or null when it holds none. The Admin form posts an unchosen
 * select as '' or as its "none" option.
 */
const referenceId = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  // An ObjectId's own `_id` is itself; only a populated document has another.
  const nested = typeof value === 'object' ? (value as { _id?: unknown })._id : undefined;
  const id = String(nested !== undefined && nested !== null && nested !== value ? nested : value).trim();
  return id && id !== 'none' ? id : null;
};

/** Whether two references — ids, ObjectIds or populated documents — name the same document. */
export const sameReference = (a: unknown, b: unknown): boolean =>
  (referenceId(a)?.toLowerCase() ?? null) === (referenceId(b)?.toLowerCase() ?? null);

/**
 * Stores an unchosen reference as null. Left as the form sent it, '' fails the
 * ObjectId cast, and a draft that simply has no destination yet answered 500.
 */
export const normalizeBlogClassification = (body: BlogClassification): void => {
  for (const { key } of FIELDS) {
    if (key in body && referenceId(body[key]) === null) body[key] = null;
  }
};

const joinLabels = (labels: string[]): string =>
  labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}` : labels[0];

type ReferenceModel = {
  findById: (id: string) => { select: (fields: string) => { lean: () => Promise<unknown> } };
};

const MODELS: Record<ClassificationKey, ReferenceModel> = {
  category: BlogCategory as unknown as ReferenceModel,
  subCategory: BlogSubCategory as unknown as ReferenceModel,
  destination: Destination as unknown as ReferenceModel,
};

/** The referenced document, or null for an id that cannot name one. */
const findReference = (model: ReferenceModel, id: string, fields: string): Promise<Stored | null> =>
  /^[0-9a-fA-F]{24}$/.test(id)
    ? (model.findById(id).select(fields).lean() as Promise<Stored | null>)
    : Promise.resolve(null);

/**
 * Throws unless an article may be public with this classification:
 *
 *   - all three references are set and each names a document that exists;
 *   - the category and the topic are switched on, and the destination has a
 *     public page — an article links to all three, and a parent that is off
 *     or still a draft answers 404;
 *   - the topic belongs to the article's category.
 *
 * For published and scheduled articles only — a scheduled one goes public
 * without passing through here again. A draft is saved with whatever it has,
 * a parent still being prepared included.
 */
export const assertPublishableClassification = async (classification: BlogClassification): Promise<void> => {
  const ids = {
    category: referenceId(classification.category),
    subCategory: referenceId(classification.subCategory),
    destination: referenceId(classification.destination),
  };

  const missing = FIELDS.filter(({ key }) => !ids[key]).map(({ label }) => label);
  if (missing.length > 0) {
    const list = joinLabels(missing);
    throw new PublishingValidationError(
      `${list.charAt(0).toUpperCase()}${list.slice(1)} ${missing.length > 1 ? 'are' : 'is'} required before publishing`
    );
  }

  const [category, subCategory, destination] = await Promise.all(
    FIELDS.map(({ key, select }) => findReference(MODELS[key], ids[key] as string, select))
  );
  const found: Record<ClassificationKey, Stored | null> = { category, subCategory, destination };

  const gone = FIELDS.filter(({ key }) => !found[key]).map(({ label }) => label);
  if (gone.length > 0) {
    throw new PublishingValidationError(
      `The selected ${joinLabels(gone)} no longer ${gone.length > 1 ? 'exist' : 'exists'}. Choose another before publishing`
    );
  }

  const unready = FIELDS.filter(({ key, ready }) => !ready(found[key] as Stored));
  if (unready.length > 0) {
    throw new PublishingValidationError(
      `The selected ${joinLabels(unready.map(({ label, notReady }) => `${label} ${notReady}`))}. ` +
        `Choose ${joinLabels(unready.map(({ remedy }) => remedy))} before publishing`
    );
  }

  if (!sameReference((subCategory as Stored).category, ids.category)) {
    throw new PublishingValidationError('The selected subcategory does not belong to the selected category');
  }
};

// ── The parent's side of the same rule ──────────────────────────────────────

/** The statuses in which an article is public, or becomes public with no further review. */
const PUBLIC_ARTICLE_STATUSES = ['published', 'scheduled'];

/** `isActive` as an update may carry it: the boolean, or a form's "false". */
export const switchesOff = (value: unknown): boolean => value === false || value === 'false';

/**
 * What an editor is trying to do to a category, a topic or a destination.
 * `move` is a topic going under another category.
 */
type ParentChange = 'deactivate' | 'unpublish' | 'delete' | 'move';

/**
 * Throws when a category, a topic or a destination is what a published or
 * scheduled article is filed under, and so may not stop being available — nor,
 * for a topic, change category.
 *
 * The publish guard above keeps an article from going public under a parent
 * that is off, a draft or gone, or under a topic of another category; this
 * keeps the parent from being switched off, unpublished, deleted or moved from
 * under an article that already is. Nothing is done to the articles — the
 * editor refiles or unpublishes them, then retries.
 *
 * Counted on the article's own reference alone. A draft does not count: it may
 * be filed under a parent still in preparation, and is checked when published.
 */
export const assertNoPublicArticlesUnder = async (
  key: ClassificationKey,
  id: unknown,
  change: ParentChange
): Promise<void> => {
  const count = await Blog.countDocuments({ status: { $in: PUBLIC_ARTICLE_STATUSES }, [key]: id });
  if (count === 0) return;

  const { label } = FIELDS.find((field) => field.key === key) as (typeof FIELDS)[number];
  const inUse = `${count} published or scheduled ${count === 1 ? 'article uses' : 'articles use'} it`;
  throw new PublishingValidationError(
    change === 'move'
      ? `Cannot move this ${label} to another category because ${inUse}. Reclassify those articles first`
      : `Cannot ${change} this ${label} because ${inUse}`
  );
};

/** Answers a refusal from either guard as the 400 the Admin shows; false for any other error. */
export const respondToPublishingValidation = (error: unknown, res: Response): boolean => {
  if (!(error instanceof PublishingValidationError)) return false;
  res.status(400).json({ success: false, error: error.message });
  return true;
};
