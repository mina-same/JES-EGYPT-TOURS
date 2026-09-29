"use client";

import dynamic from "next/dynamic";

/**
 * BlogCategoryView, behind its own async chunk.
 *
 * `[slug]/page.tsx` resolves ONE url into seven content types and used to
 * import all seven views at module scope. Turbopack emits a single client
 * chunk group per route entry, so every one of those views — blog, tour
 * detail, destination — landed in the same group and shipped to all of them.
 * A category page downloaded the blog article renderer before it could draw a
 * tour card.
 *
 * An async import() on the CLIENT side of a "use client" boundary is the only
 * construct the bundler turns into a separate chunk. The same dynamic() one
 * level up, inside the Server Component, runs at render time on the server and
 * changes nothing about what the browser downloads — measured, twice.
 *
 * SSR stays ON, and there is deliberately NO `loading` option. Passing one is
 * what makes next/dynamic wrap the view in a <Suspense> boundary, and React's
 * server renderer does not write a large completed boundary where it belongs:
 * past 12,800 bytes it puts the fallback there, streams the view into a
 * hidden <div> at the end of the document and leaves an inline script to swap
 * them. With JavaScript off the page showed nothing at all, because the view
 * renders the whole layout, header and footer included. Without the boundary
 * the view is written inline. The chunk is still split and still preloaded,
 * and on a client-side navigation React keeps the previous page on screen
 * until the chunk arrives instead of painting a blank placeholder.
 */
const BlogCategoryViewLazy = dynamic(() => import("./BlogCategoryView"));

export default BlogCategoryViewLazy;
