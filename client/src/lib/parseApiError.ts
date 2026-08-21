import {
  isAuthenticationErrorMessage,
  SESSION_EXPIRED_FIELD,
  SESSION_EXPIRED_SUMMARY,
  SESSION_RECOVERY_STEPS,
} from '@/lib/authSessionMessages';

/**
 * Represents a single structured form error.
 */
export interface FormErrorItem {
  /** Human-readable field name (e.g. "Tour Name", "URL Slug") */
  field: string;
  /** The specific error message */
  message: string;
  /** Language code if this is a localized field (e.g. "en", "de") */
  lang?: string;
  /** The raw field path for scroll-to behavior (e.g. "name.en", "seo.metaTitle.de") */
  path?: string;
  /** Optional instructions and action that help the user recover from the error. */
  recovery?: {
    steps: readonly string[];
    action?: {
      label: string;
      href: string;
      newTab?: boolean;
    };
  };
}

/**
 * Parse an API error response into structured FormErrorItem[].
 * Handles:
 *  - Mongoose ValidationError format: { errors: { fieldPath: { message } } }
 *  - Express-validator format: [{ path, msg }]
 *  - Simple string message: "Field xyz is required"
 *  - Object with `message` string
 *  - Object with `error` string
 */
export function parseApiError(responseData: any): FormErrorItem[] {
  if (!responseData) return [{ field: 'Server', message: 'An unknown error occurred.' }];

  const errors: FormErrorItem[] = [];
  const rawMessage = responseData.message || responseData.error || responseData.msg;

  // Authentication failures are page-level errors, not field validation errors.
  // Give staff a safe recovery path without closing the page or losing their work.
  if (typeof rawMessage === 'string' && isAuthenticationErrorMessage(rawMessage)) {
    return [{
      field: SESSION_EXPIRED_FIELD,
      message: SESSION_EXPIRED_SUMMARY,
      recovery: {
        steps: SESSION_RECOVERY_STEPS,
        action: {
          label: 'Open login in a new tab',
          href: '/login',
          newTab: true,
        },
      },
    }];
  }

  // 1. Mongoose-style: { errors: { 'field.lang': { message: '...' } } }
  if (responseData.errors && typeof responseData.errors === 'object' && !Array.isArray(responseData.errors)) {
    for (const [rawPath, errObj] of Object.entries(responseData.errors)) {
      const msg = (errObj as any)?.message || String(errObj);
      const { field, lang } = parseFieldPath(rawPath);
      errors.push({ field, message: msg, lang, path: rawPath });
    }
    if (errors.length > 0) return errors;
  }

  // 2. Express-validator style: { errors: [{ path, msg }] } OR just an array
  const errorArray = Array.isArray(responseData.errors)
    ? responseData.errors
    : Array.isArray(responseData)
    ? responseData
    : null;

  if (errorArray) {
    for (const item of errorArray) {
      const rawPath = item.path || item.param || item.field || '';
      const msg = item.msg || item.message || String(item);
      const { field, lang } = parseFieldPath(rawPath);
      errors.push({ field, message: msg, lang, path: rawPath });
    }
    if (errors.length > 0) return errors;
  }

  // 3. Simple message string
  if (typeof rawMessage === 'string' && rawMessage) {
    // Try to extract field hints from common phrasing like "slug is required"
    errors.push(...extractFromMessage(rawMessage));
    if (errors.length > 0) return errors;
  }

  // 4. Fallback
  return [{
    field: 'Server',
    message: typeof rawMessage === 'string' ? rawMessage : 'The server returned an error. Please try again.',
  }];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const LANG_CODES = ['en', 'de', 'it', 'es'];

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  title: 'Title',
  slug: 'URL Slug',
  description: 'Description',
  excerpt: 'Intro',
  cardDescription: 'Card description',
  author: 'Author',
  category: 'Category',
  status: 'Status',
  featuredImage: 'Featured Image',
  'featuredImage.url': 'Featured Image URL',
  image: 'Image',
  'image.url': 'Image URL',
  'seo.metaTitle': 'Meta Title',
  'seo.metaDescription': 'Meta Description',
  'seo.metaKeywords': 'Meta Keywords',
  metaTitle: 'Meta Title',
  metaDescription: 'Meta Description',
  metaKeywords: 'Meta Keywords',
  tags: 'Tags',
  contentBlocks: 'Content',
};

function parseFieldPath(rawPath: string): { field: string; lang?: string } {
  // e.g. "name.en" → field: "Name", lang: "en"
  // e.g. "seo.metaTitle.de" → field: "Meta Title", lang: "de"
  // e.g. "slug" → field: "URL Slug"

  const parts = rawPath.split('.');
  let lang: string | undefined;
  let fieldPath = rawPath;

  // Check if last segment is a language code
  if (parts.length > 1 && LANG_CODES.includes(parts[parts.length - 1])) {
    lang = parts[parts.length - 1];
    fieldPath = parts.slice(0, -1).join('.');
  }

  const label = FIELD_LABELS[fieldPath] || humanize(fieldPath.split('.').pop() || fieldPath);
  return { field: label, lang };
}

function humanize(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function extractFromMessage(message: string): FormErrorItem[] {
  // Look for known field names in the message
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const keyPart = key.split('.').pop() || key;
    const escapedKey = keyPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wholeFieldName = new RegExp(`(^|[^a-z0-9])${escapedKey}([^a-z0-9]|$)`, 'i');

    if (wholeFieldName.test(message)) {
      return [{ field: label, message, path: key }];
    }
  }

  return [{ field: 'Submission', message }];
}
