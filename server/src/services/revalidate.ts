/**
 * Tells the front end that something it caches has changed.
 *
 * The visitor pages tag their fetches (`author:<slug>`, `blog`) and are then
 * served from cache until one of those tags is cleared. This is what clears
 * them, so an editor's save is live immediately instead of waiting out a timer
 * — and the site stops reading the database on every single page view.
 *
 * ── Deliberately best-effort ──
 * Nothing here is awaited by the request that triggered it and no failure is
 * propagated. Saving an article must not fail because the front end was
 * briefly unreachable; the worst case is a stale page until the next save,
 * which is strictly better than a 500 on publish. Failures are logged.
 */
const REVALIDATE_TIMEOUT_MS = 4000;

export const revalidateTags = (tags: string[]): void => {
  const secret = process.env.REVALIDATE_SECRET;
  const clientUrl = process.env.CLIENT_URL;

  // Not configured is not an error: a developer running only the API should
  // not see a failed request on every save.
  if (!secret || !clientUrl || tags.length === 0) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS);

  void fetch(`${clientUrl.replace(/\/+$/, '')}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': secret,
    },
    body: JSON.stringify({ tags }),
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) {
        console.error(`Revalidation rejected (${response.status}) for tags: ${tags.join(', ')}`);
      }
    })
    .catch((error) => {
      console.error('Revalidation request failed:', error?.message || error);
    })
    .finally(() => clearTimeout(timer));
};

/** The tags an article change affects: the blog listings and its author's page. */
export const revalidateBlog = (authorSlug?: string | null): void => {
  revalidateTags(['blog', ...(authorSlug ? [`author:${authorSlug}`] : [])]);
};

/**
 * Whether a query write actually changed a document, from the result MongoDB
 * returned for it. For a model's post('updateMany') hook, which Mongoose runs
 * after every updateMany whether or not anything matched.
 *
 * Only an explicit "nothing written" answers false: 0 modified and 0 upserted.
 * A result without counts is treated as a change, so an unexpected shape costs
 * a cache refresh rather than a stale page.
 */
export const wroteDocuments = (result: unknown): boolean => {
  const { modifiedCount, upsertedCount } = (result ?? {}) as { modifiedCount?: unknown; upsertedCount?: unknown };
  if (typeof modifiedCount !== 'number') return true;
  return modifiedCount > 0 || (typeof upsertedCount === 'number' && upsertedCount > 0);
};
