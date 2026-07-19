# Blog Import JSON Contract

This document defines the JSON file format accepted by the JES Egypt Tours admin at
**Admin → Blogs → Import JSON** (`/admin/blogs/blog/import`).

Give this document (and `example.json`) to the content-generation agents. Files that
follow this contract are imported with every field landing in its CMS slot automatically.

## File shape

The file root is **one article object** or **an array of article objects** (max 50 per file).
One file per import run.

## Language objects

Every localized field is an object with up to four keys:

```json
{ "en": "…", "de": "…", "it": "…", "es": "…" }
```

- `en` is **required** for `title` and `slug`, and strongly recommended everywhere.
- For other fields, if `en` is missing but another language exists, the first available
  language is copied into `en` automatically (a warning is shown in the preview).
- `summary`, `keyTakeaways` and `faqs` are language-independent — any language may exist
  without the others.

## Fields

| Field | Required | Type / rules |
|---|---|---|
| `title` | ✅ (`en`) | Localized strings |
| `slug` | ✅ (`en`) | Localized strings — lowercase letters/numbers separated by hyphens (`saqqara-visitor-guide`). Must be unique per language across the site; duplicates are rejected with a clear error |
| `excerpt` | optional | Localized strings — short teaser shown in lists and used as description fallback |
| `contentBlocks` | ✅ | **Per-language arrays** — see "Article body" below |
| `metaTitle` | optional | Localized strings, ~60 chars — auto-filled from `title` when omitted |
| `metaDescription` | optional | Localized strings, ~150-160 chars |
| `metaKeywords` | optional | `{ "en": ["kw1", "kw2"], … }` arrays per language |
| `ogTitle` / `ogDescription` | optional | Localized strings — auto-completed per language from the meta fields when omitted |
| `focusKeyword` | optional | Localized strings |
| `summary` | optional | Localized **HTML** — the article's "Final Summary" bullets: `"<ul><li>Point…</li><li>…</li></ul>"`. Internal links allowed inside items |
| `keyTakeaways` | optional | Same format as `summary` |
| `faqs` | optional | **Per-language arrays** (like `contentBlocks`): `{ "en": [{ "key": "q1", "question": "…", "answer": "…" }], "de": [...] }` with plain strings. Same merge rules as blocks: shared `key` = same question across languages merged into one item; a key in one language only = language-exclusive FAQ; without keys, counts must match. (Legacy shape — array of `{question:{en,…}, answer:{…}}` objects — still accepted) |

## Article body (`contentBlocks`)

Each language's body is authored **independently against its own keyword map** —
section counts and order may differ between languages on purpose (e.g. a
Spanish-exclusive section that exists in no other language). The format
reflects that: **one array per language**, each block single-language with
plain strings:

```json
"contentBlocks": {
  "en": [ { "key": "why-visit", "type": "html", "title": "Why visit?", "content": "<p>…</p>" },
          { "key": "quote-tip", "type": "blockquote", "content": "Arrive early — plain text only." } ],
  "de": [ { "key": "why-visit", "type": "html", "title": "Warum besuchen?", "content": "<p>…</p>" },
          { "key": "quote-tip", "type": "blockquote", "content": "Kommen Sie früh — nur reiner Text." } ],
  "it": [ { "key": "why-visit", "type": "html", "content": "<p>…</p>" } ],
  "es": [ { "key": "why-visit", "type": "html", "content": "<p>…</p>" },
          { "key": "es-restauracion", "type": "html", "title": "Sección exclusiva ES", "content": "<p>…</p>" },
          { "key": "quote-tip", "type": "blockquote", "content": "Llegue temprano — solo texto plano." } ]
}
```

- `type`: `"html"` or `"blockquote"`.
- `content`: **required** non-empty string.
  - For `"html"`: an HTML string — headings `<h2>/<h3>`, `<p>`, `<ul><li>`,
    `<a href="/es/…">` locale-matching internal links, `<strong>`.
  - For `"blockquote"`: **PLAIN TEXT ONLY — no HTML tags at all, not even `<p>`**.
    The quote field is a plain-text field by design; any tags are stripped on
    import, but don't rely on that — emit clean text.
- `title`: optional plain string (rendered as the block's heading).
- **`key`** (recommended): a shared section identifier. The importer MERGES
  blocks with the same `key` across languages into ONE multilingual block —
  exactly how the CMS stores them (one block with EN/DE/IT/ES tabs). A key
  that exists in one language only stays a language-exclusive block.
  - Use the same key for the same logical section in every language.
  - If you use keys, key **every** block in **every** language.
  - Without keys, blocks are merged by position, which is only allowed when
    all languages have the **same number of blocks** — different counts
    without keys are rejected (misalignment would be silent otherwise).
- A language key may be omitted entirely, but at least one language must have blocks.
- On the site, each language page renders **exactly its own blocks, in its own
  order** — a section that exists in one language never leaks into another.

(A legacy shape — one aligned array whose blocks carry `{en,de,it,es}` objects —
is still accepted for backward compatibility.)

## Ignored on purpose

These are set by hand in the admin AFTER import — include nothing for them
(anything sent is ignored with a warning):

`status` (always imported as **draft**), `featuredImage`, gallery/images of any kind,
`category`, `subCategory`, `destination`, `tags`, `relatedPosts`, `relatedTours`,
`author`, `isFeatured`, `publishedAt`.

## Publishing rule

Imported drafts have **no featured image**. Publishing is blocked server-side until an
image is added during the human review.
