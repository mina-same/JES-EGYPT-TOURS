"use client";

import dynamic from "next/dynamic";

/**
 * The tour detail view, behind its own async chunk.
 *
 * `[slug]/page.tsx` resolves ONE url into seven content types and used to
 * import all seven views at module scope. Turbopack emits a single client
 * chunk group per route entry, so this view — the largest of the seven, with
 * its itinerary, pricing plans, mosaic and booking sidebar — shipped to every
 * category, subcategory, destination and blog page the route serves.
 *
 * An async import() on the CLIENT side of a "use client" boundary is the only
 * construct the bundler turns into a separate chunk. The same dynamic() one
 * level up, inside the Server Component, runs at render time on the server and
 * changes nothing about what the browser downloads — measured, twice.
 *
 * This sits beside BookingFormLazy rather than replacing it: that split keeps
 * react-datepicker and the phone input out of the tour page's own first load,
 * and this one keeps all of it off the other six page types.
 *
 * SSR stays ON, so the tour page's markup, headings and booking form are
 * unchanged in the server HTML; `loading` is only ever seen on a client-side
 * navigation and reserves a viewport so the page does not collapse mid-transition.
 */
const TourListingOneDetailsLazy = dynamic(
  () => import("./TourListingDetailsOne"),
  {
    loading: () => <div style={{ minHeight: "100vh" }} aria-hidden="true" />,
  }
);

export default TourListingOneDetailsLazy;
