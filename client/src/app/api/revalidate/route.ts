import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand cache invalidation, called by the API when content changes.
 *
 * ── Why this exists ──
 * Visitor pages fetched with `cache: "no-store"`, which reads the database on
 * every single visit — a crawler walking 200 article URLs is 200 round trips
 * for content that had not changed. The obvious alternative, a timed
 * `revalidate: 900`, was tried and reverted: with no invalidation hook,
 * unpublishing an article left the site linking to a page that 404s for as
 * long as the window lasted.
 *
 * Tagging the fetches and clearing the tag on save gives both properties. A
 * page is served from cache until an editor actually changes something, and
 * the change is live immediately.
 *
 * ── Security ──
 * A shared secret in the `x-revalidate-secret` header, compared in constant
 * time. Without REVALIDATE_SECRET set the route refuses every request rather
 * than defaulting to open: an unauthenticated cache-purge endpoint is a free
 * way to force a site to re-render itself indefinitely.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, error: "Revalidation is not configured" },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-revalidate-secret") || "";
  if (!safeEqual(provided, secret)) {
    return NextResponse.json({ revalidated: false, error: "Forbidden" }, { status: 403 });
  }

  let tags: unknown;
  try {
    ({ tags } = await request.json());
  } catch {
    return NextResponse.json({ revalidated: false, error: "Invalid JSON" }, { status: 400 });
  }

  const list = (Array.isArray(tags) ? tags : [tags])
    .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    .slice(0, 20);

  if (list.length === 0) {
    return NextResponse.json({ revalidated: false, error: "No tags given" }, { status: 400 });
  }

  /*
   * The second argument is required in Next 16: it names the cache profile
   * whose entries are purged. "max" is the widest, which is what a publish
   * means — drop everything held under this tag, however long-lived.
   */
  list.forEach((tag) => revalidateTag(tag, "max"));

  return NextResponse.json({ revalidated: true, tags: list });
}
