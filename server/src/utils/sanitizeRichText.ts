import sanitizeHtml from 'sanitize-html';

/**
 * Editor HTML, cleaned once — at the moment it is saved.
 *
 * ── The problem this closes ──
 * Rich-text fields written in the admin (FAQ answers, tour overviews, blog
 * bodies, the homepage intro, category descriptions) were injected into the
 * visitor pages with `dangerouslySetInnerHTML` and no sanitization at all —
 * about thirty call sites, several of them server-rendered, so any markup
 * stored here landed in the initial HTML. One component had grown a chain of
 * regex replaces instead, which is the failure mode this file exists to avoid:
 * it stripped `<script>` tags but not, for example, `<svg\nonload=...>`, and
 * its blanket `.replace(/data:/gi, '')` corrupted legitimate content.
 *
 * ── Why at write time ──
 * Content is written rarely and read constantly. Sanitizing on save is O(saves)
 * rather than O(page views), keeps the sanitizer out of the front-end bundle
 * entirely, and means the database itself never holds a payload — so a future
 * render path that forgets to sanitize is not a new hole.
 *
 * ── It must only ever see HTML ──
 * sanitize-html HTML-ENCODES the text it is given: a bare `&` becomes `&amp;`.
 * That is correct for HTML and invisible once rendered, but destructive for a
 * value React prints as text (`<h3>{note.title}</h3>` shows `&amp;` literally)
 * or for a URL (`?a=1&b=2` -> `?a=1&amp;b=2`). Several models keep plain-text
 * siblings right next to their HTML — `notes: [{ title, text }]`,
 * `contentBlocks: [{ title, content, alt, caption, url }]` — so paths name the
 * HTML LEAF (`notes[].text`) and nothing recurses blindly past it.
 *
 * Existing rows written before this was added are cleaned by
 * `npm run sanitize:existing` (src/scripts/sanitizeExistingContent.ts).
 */

/**
 * What an editor is allowed to produce.
 *
 * Deliberately an ALLOW list, not a block list: anything not named here is
 * removed, so a tag or attribute nobody thought of cannot slip through. This
 * covers what the admin's rich-text editor (react-quill-new) can actually emit.
 */
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    // Quill writes alignment and indent as classes, not inline styles.
    '*': ['class'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    /*
     * `data-list` is NOT decoration — it is the only thing that tells a bullet
     * list from a numbered one.
     *
     * Quill 2 (react-quill-new) writes BOTH as <ol>, marking each item
     * `data-list="bullet"` or `data-list="ordered"`; quill.snow.css draws the
     * marker from that attribute. Strip it and the two become byte-identical:
     * the distinction is gone from the database, the next editor to open the
     * content sees a bullet list as a numbered one, and
     * src/lib/normalizeAmenityItems.ts on the front end — which reads this
     * attribute for exactly this reason — starts answering wrong.
     *
     * A data-* attribute carries no behaviour, so keeping it costs nothing.
     */
    li: ['data-list'],
  },
  // Only these can appear in an href/src. This is what removes `javascript:`
  // and `data:` URLs without the false positives a regex on the word "data:"
  // produced in the old client-side chain.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  // No inline styles at all: `style` is an injection surface of its own
  // (url(), expression()) and the site's stylesheet owns presentation.
  allowedStyles: {},
  // Every editor link leaves the site, so force the safe rel. Without
  // noopener a target=_blank link hands the opener to the destination.
  transformTags: {
    a: (tagName, attribs) => {
      const next: Record<string, string> = { ...attribs };
      if (next.target === '_blank') {
        next.rel = 'noopener noreferrer';
      }
      return { tagName, attribs: next };
    },
  },
  // Drop the CONTENT of these too, not just the tags — otherwise the text
  // inside a stripped <script> is re-emitted as visible page text.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'iframe'],
};

const LOCALES = ['en', 'de', 'it', 'es'] as const;

/** Clean one HTML string. Non-strings are returned untouched. */
export function sanitizeRichText<T>(value: T): T {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, RICH_TEXT_OPTIONS) as unknown as T;
}

/**
 * Clean ONE rich-text value: an HTML string, a `{ en, de, it, es }` localized
 * object, or an array of either.
 *
 * It descends through the four language keys and nothing else. An object with
 * no language key is returned untouched — that is the guard that keeps a
 * plain-text sibling out of the sanitizer if a path is ever pointed one level
 * too high.
 */
export function sanitizeLocalized<T>(field: T): T {
  if (field == null) return field;
  if (typeof field === 'string') return sanitizeRichText(field);

  if (Array.isArray(field)) {
    return field.map((entry) => sanitizeLocalized(entry)) as unknown as T;
  }

  if (typeof field === 'object') {
    const source = field as Record<string, unknown>;
    if (!LOCALES.some((lang) => lang in source)) return field;

    const next: Record<string, unknown> = { ...source };
    for (const lang of LOCALES) {
      if (lang in next) next[lang] = sanitizeLocalized(next[lang]);
    }
    return next as unknown as T;
  }

  return field;
}

/**
 * A path down to a rich-text leaf. `[]` steps into every element of an array,
 * so `notes[].text` means "the `text` of each note" and leaves `notes[].title`
 * — a plain-text heading — alone.
 */
function parsePath(path: string): string[] {
  return path
    .split('.')
    .flatMap((segment) =>
      segment.endsWith('[]') ? [segment.slice(0, -2), '[]'] : [segment]
    );
}

/** Applies sanitizeLocalized at the end of a parsed path. Does not mutate. */
function sanitizeAtPath(value: unknown, segments: string[]): unknown {
  if (value == null) return value;
  if (segments.length === 0) return sanitizeLocalized(value);

  const [head, ...rest] = segments;

  if (head === '[]') {
    if (!Array.isArray(value)) return value;
    return value.map((entry) => sanitizeAtPath(entry, rest));
  }

  if (typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  if (!(head in source)) return value;

  return { ...source, [head]: sanitizeAtPath(source[head], rest) };
}

/** "notes[].text" -> "notes.text", for comparing against a dotted update key. */
function leafPathOf(path: string): string {
  return parsePath(path)
    .filter((segment) => segment !== '[]')
    .join('.');
}

/** "notes.0.text" -> "notes.text": array indices are not part of the shape. */
function withoutIndices(key: string): string {
  return key
    .split('.')
    .filter((part) => !/^\d+$/.test(part))
    .join('.');
}

/**
 * Clean a whole document field by its declared path, returning the new value
 * for that field. Used by the one-off migration, which works on lean objects
 * rather than Mongoose documents.
 */
export function sanitizeAtDocumentPath(value: unknown, path: string): unknown {
  const [, ...rest] = parsePath(path);
  return sanitizeAtPath(value, rest);
}

/**
 * A Mongoose `pre('validate')` hook that cleans the named rich-text paths.
 *
 * `validate` rather than `save` so the cleaned value is what gets validated,
 * and it also covers `Model.create`. Update operations are covered separately
 * by `sanitizeUpdatePaths`.
 */
export function sanitizeDocumentPaths(paths: readonly string[]) {
  return function (this: any, next: (err?: Error) => void) {
    for (const path of paths) {
      const [root, ...rest] = parsePath(path);
      const current = this.get(root);
      if (current === undefined) continue;
      this.set(root, sanitizeAtPath(current, rest));
    }
    next();
  };
}

/**
 * The same for `findOneAndUpdate` / `updateOne` / `updateMany`, which never
 * run document hooks and would otherwise be an open path straight past the
 * sanitizer. Handles `{ field: ... }`, `{ $set: { field: ... } }`, and the
 * dotted forms the admin sends (`{ 'answer.de': ... }`).
 */
export function sanitizeUpdatePaths(paths: readonly string[]) {
  return function (this: any, next: (err?: Error) => void) {
    const update = this.getUpdate();
    if (!update || typeof update !== 'object') return next();

    const containers: Record<string, unknown>[] = [update as Record<string, unknown>];
    if ((update as any).$set && typeof (update as any).$set === 'object') {
      containers.push((update as any).$set as Record<string, unknown>);
    }

    for (const container of containers) {
      for (const key of Object.keys(container)) {
        for (const path of paths) {
          const segments = parsePath(path);
          const root = segments[0];

          // Whole field: `{ notes: [...] }` — walk the declared path into it.
          if (key === root) {
            container[key] = sanitizeAtPath(container[key], segments.slice(1));
            break;
          }

          // Dotted field. The key must land ON the declared leaf or inside it
          // (a language key), so `{ 'notes.0.text': ... }` is cleaned while
          // `{ 'notes.0.title': ... }` — plain text — is not touched.
          const leaf = leafPathOf(path);
          const normalized = withoutIndices(key);
          if (normalized === leaf || normalized.startsWith(`${leaf}.`)) {
            container[key] = sanitizeLocalized(container[key]);
            break;
          }
        }
      }
    }

    this.setUpdate(update);
    next();
  };
}
