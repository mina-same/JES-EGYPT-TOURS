"use client";

import dynamic from "next/dynamic";

/**
 * The 404 page, loaded when a 404 is actually shown.
 *
 * Next sends the not-found page of a segment along with EVERY page under it,
 * so that it is at hand if the page calls notFound(), and the browser fetches
 * the code of every client component in it at once. While not-found.tsx
 * rendered the header and footer itself, that was a second request for them
 * on every visitor page: the page's own view already carries TopbarOne,
 * SiteHeader, LanguageSelector, CurrencySwitcher and FooterOne, and the
 * bundler gave the not-found page its own chunks holding the same modules in
 * a different order. On the home page, the listings, a tour, an article, a
 * destination, the wishlist and special offers, 54 to 59 modules arrived
 * twice; with the 404's own sections that was 22.6 KB of gzipped JavaScript
 * on each of those pages (1.4 KB on About, FAQ, Contact and Search). Only one
 * copy ever ran.
 *
 * Behind this wrapper the page under it references one small component, and
 * the header and footer are requested once, by the page that shows them. A
 * real 404 is answered as before: on this site the server's HTML of a 404
 * raised by the page has never held the page (the browser renders it), and
 * its code is now one more request, made on that page alone.
 *
 * SSR stays ON and there is no `loading` option, for the reasons given in
 * [slug]/_views/CategoryViewLazy.tsx.
 */
const NotFoundViewLazy = dynamic(() => import("./NotFoundView"));

export default NotFoundViewLazy;
