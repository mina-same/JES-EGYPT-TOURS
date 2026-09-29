
 import type { Metadata } from 'next';
 import { getNotFoundRobotsMetadata } from '@/lib/seo/robots';
 import NotFound from '../not-found';
 
 /*
  * A direct-access page that shows the 404 screen but answers HTTP 200, so it
  * must never be indexed: noindex, nofollow before and after launch. It uses
  * the shared 404 value, not the site switch, which reads "index, follow" once
  * the site is launched.
  */
 export const metadata: Metadata = {
   robots: getNotFoundRobotsMetadata(),
 };
 
 export default function NotFoundPage() {
   return <NotFound />;
 }

