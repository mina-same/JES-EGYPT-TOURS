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
 * SSR stays ON, and there is deliberately NO `loading` option: it would wrap
 * the view in a <Suspense> boundary, and React's server renderer streams a
 * large completed boundary out of line, hidden at the end of the document
 * until an inline script moves it into place. The itinerary, pricing and FAQ
 * were invisible with JavaScript off. Without the boundary the view is
 * written inline; the chunk is still split and still preloaded.
 *
 * BookingFormLazy, inside this view, keeps ITS boundary on purpose; see there.
 */
const TourListingOneDetailsLazy = dynamic(() => import("./TourListingDetailsOne"));

export default TourListingOneDetailsLazy;
