import NotFoundViewLazy from "./NotFoundViewLazy";
import type { Metadata } from "next";
import { getNotFoundRobotsMetadata } from "@/lib/seo/robots";

/*
 * robots for every visitor 404. For a not-found response Next builds the
 * <head> from the layouts plus the metadata of the DEEPEST not-found file on
 * the route. Every visitor page lives under (home), so that is this file, and
 * the metadata in [locale]/not-found.tsx never reaches a 404. Without this,
 * a 404 carried the [locale] layout's site value ("index, follow" once
 * launched) next to Next's own "noindex".
 */
export const metadata: Metadata = {
  robots: getNotFoundRobotsMetadata(),
};

// The page itself is NotFoundView. It is reached through NotFoundViewLazy so
// that this file, which Next ships with every page of the segment, does not
// make each of them fetch the header and footer a second time.
export default function CustomNotFound() {
  return <NotFoundViewLazy />;
}
