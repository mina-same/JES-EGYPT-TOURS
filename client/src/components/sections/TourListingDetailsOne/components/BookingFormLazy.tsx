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

import React from "react";
import dynamic from "next/dynamic";
import type { ICurrencyPrice } from "@/contexts/CurrencyContext";
import { useRouteLocale } from "@/hooks/useRouteLocale";
import type { SupportedLocale } from "@/lib/url/locales";
import { sameBookingCardProps } from "@/lib/bookingFormUx";
import { BookingCardHeader } from "./BookingCardHeader";
import { BookingFormBoundary } from "./BookingFormBoundary";

/**
 * The booking form's fields, loaded as their own chunk.
 *
 * BookingForm and its ./bookingLocales entries are the only code in the app
 * that imports react-datepicker, react-phone-number-input (and with it
 * libphonenumber's metadata) and date-fns' locale data. Those four are worth
 * ~371 KB of uncompressed
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
 * single remaining static `import { BookingForm }` (or of a ./bookingLocales
 * entry) anywhere would pull the module back into the route's chunk group and
 * undo the split entirely.
 *
 * The import is one of four, one per site locale. Each ./bookingLocales entry
 * imports only its own language's date-fns locale and phone-country names, so
 * a German tour page downloads the German calendar and country data and not
 * the other three languages' as well. Because the language data sits inside
 * the same import() as the form, it arrives with the form's code rather than
 * after it, and the server still renders the fields in the route's language.
 */
/*
 * This `loading` gives the fields their own <Suspense> boundary, and the
 * boundary is kept on purpose: React can hydrate the rest of the tour page
 * without waiting for this chunk, and hydrate the fields when it lands.
 *
 * The cost is that React's server renderer streams a completed boundary
 * this large out of line: the fields' server HTML sits hidden at the end
 * of the document until an inline script moves it here, which happens at
 * once in any browser running scripts. With JavaScript off this
 * placeholder is what shows — under the card's title and price, which are
 * outside the boundary. That is acceptable only because the form cannot
 * be submitted without JavaScript anyway (onSubmit, no action).
 *
 * It reserves the fields' height (688–690px on desktop), so the card does
 * not collapse while the chunk loads after a client-side navigation.
 */
const bookingFieldsPlaceholder = () => (
  <div className="booking-form-card" style={{ minHeight: 690 }} aria-hidden="true" />
);

const BOOKING_FORM_FIELDS = {
  en: dynamic(() => import("./bookingLocales/en"), { loading: bookingFieldsPlaceholder }),
  de: dynamic(() => import("./bookingLocales/de"), { loading: bookingFieldsPlaceholder }),
  it: dynamic(() => import("./bookingLocales/it"), { loading: bookingFieldsPlaceholder }),
  es: dynamic(() => import("./bookingLocales/es"), { loading: bookingFieldsPlaceholder }),
} satisfies Record<SupportedLocale, unknown>;

interface BookingCardProps {
  tourId: string;
  /** The starting price shown in the card's header: `priceStartingFrom`'s
   *  { USD, EUR, GBP } object, resolved by the currency context. */
  price?: number | ICurrencyPrice | null;
  /** True when the tour has real pricing plans, so the price can link to them. */
  hasPricing?: boolean;
  /** The tour's own pricing plan names, in the order the admin arranged them. */
  packageOptions?: string[];
  /** Names the tour in the prefilled WhatsApp message. */
  tourTitle?: string;
}

/**
 * The booking card: its title and price, then the form.
 *
 * The title and price are written here, outside the fields' lazy boundary, so
 * they are part of the page's own server markup — visible with JavaScript off,
 * and never replaced by the fields' placeholder.
 */
function BookingCard({ tourId, price, hasPricing, packageOptions, tourTitle }: BookingCardProps) {
  // The route locale, as BookingForm read it for its own lookups; anything
  // unexpected gets English, the fallback those lookups used.
  const locale = useRouteLocale();
  const BookingFormFields = BOOKING_FORM_FIELDS[locale] ?? BOOKING_FORM_FIELDS.en;

  return (
    <div className="tour-listing-details__sidebar__item tour-listing-details__sidebar__item-form">
      <BookingCardHeader price={price} hasPricing={hasPricing} />
      <BookingFormBoundary>
        <BookingFormFields tourId={tourId} tourTitle={tourTitle} packageOptions={packageOptions} />
      </BookingFormBoundary>
    </div>
  );
}

/**
 * Memoised on the props' values, which is what keeps the server-rendered form
 * on screen until its chunk arrives.
 *
 * Until then the fields' boundary is dehydrated: React holds the server HTML
 * and cannot render the component behind it. Any update that reaches the
 * boundary in that window makes React give up on hydrating it — it deletes the
 * server HTML and shows the placeholder until the chunk lands. The tour page
 * re-renders straight after hydrating (it measures its nav and sidebar) and
 * again when its related content arrives, each time with a new package array
 * and, after the re-map, a new price object holding the same amounts. Compared
 * by value, those renders stop here. Context updates are the other way in;
 * the providers above make their load-time updates as transitions, which React
 * holds back until the boundary has hydrated.
 */
export const BookingFormLazy = React.memo(BookingCard, sameBookingCardProps);
