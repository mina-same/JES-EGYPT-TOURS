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
 * twice, about 20 KB of gzipped JavaScript each time. Only one copy ever ran.
 *
 * Behind this wrapper the page under it references one small component, and
 * the header and footer are requested once, by the page that shows them. A
 * real 404 is rendered on the server exactly as before; its code is then the
 * only copy that page loads.
 *
 * SSR stays ON and there is no `loading` option, for the reasons given in
 * [slug]/_views/CategoryViewLazy.tsx.
 */
const NotFoundViewLazy = dynamic(() => import("./NotFoundView"));

export default NotFoundViewLazy;
