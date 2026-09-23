"use client";

import dynamic from "next/dynamic";

/**
 * DestinationView, behind its own async chunk.
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
 * SSR stays ON: the server still renders the real view, so the HTML, its
 * headings, copy and links are unchanged and `loading` is only ever seen on a
 * client-side navigation. It reserves a viewport so that transition does not
 * collapse the page and throw the scroll position.
 */
const DestinationViewLazy = dynamic(() => import("./DestinationView"), {
  loading: () => <div style={{ minHeight: "100vh" }} aria-hidden="true" />,
});

export default DestinationViewLazy;
