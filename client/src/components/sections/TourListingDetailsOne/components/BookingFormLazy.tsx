"use client";

/*
 * The booking form's stylesheets are imported HERE rather than in BookingForm
 * itself, and that placement is the whole point of the split.
 *
 * This wrapper is statically imported, so these two files stay in the route's
 * eagerly-loaded CSS — where they already were. Left inside BookingForm they
 * would travel with its async chunk and arrive AFTER the server-rendered form
 * had painted, flashing an unstyled calendar and country selector on every
 * tour page. CSS is cheap and carries no JavaScript; the megabyte this split
 * exists to defer is all on the other side of the dynamic import below.
 */
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";

import dynamic from "next/dynamic";

/**
 * The booking form, loaded as its own chunk.
 *
 * BookingForm is the only module in the app that imports react-datepicker,
 * react-phone-number-input (and with it libphonenumber's metadata) and
 * date-fns' locale data. Those four are worth ~371 KB of uncompressed
 * JavaScript, and they were reaching visitors who could never use them:
 * `[slug]/page.tsx` resolves ONE URL into seven content types, so Turbopack
 * puts every client component that route can reach into a single chunk group.
 * A category page such as /en/egypt-tour-packages downloaded the tour
 * detail page's datepicker before it could render a tour card.
 *
 * The fix has to be an async import() and it has to live on the client side of
 * a "use client" boundary — that is the only construct the bundler turns into
 * a separate chunk. The same dynamic() written one level up, inside the Server
 * Component, runs at render time on the server and changes nothing about what
 * the browser downloads.
 *
 * SSR stays ON (no `ssr: false`): the complete form is still in the HTML the
 * server sends, so nothing about the tour page's markup, indexing or layout
 * changes. Only the JavaScript is deferred.
 *
 * Both call sites — the desktop sidebar in TourListingDetailsOne and the
 * mobile bottom sheet in MobileStickyBookingBar — must import THIS module. A
 * single remaining static `import { BookingForm }` anywhere would pull the
 * module back into the route's chunk group and undo the split entirely.
 */
export const BookingFormLazy = dynamic(
  () => import("./BookingForm").then((mod) => mod.BookingForm),
  {
    /*
     * Only ever seen on a client-side navigation into a tour page: on a fresh
     * load the server has already rendered the real form, and React keeps that
     * markup on screen until the chunk hydrates it.
     *
     * It carries the card's own classes and reserves its height so that brief
     * window does not collapse the sidebar and shift the page around it.
     */
    loading: () => (
      <div
        className="tour-listing-details__sidebar__item tour-listing-details__sidebar__item-form"
        style={{ minHeight: 600 }}
        aria-hidden="true"
      />
    ),
  }
);
