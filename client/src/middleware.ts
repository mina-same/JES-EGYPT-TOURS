import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getCanonicalStaticSlug,
  getLocalizedStaticPath,
  getLocalizedStaticSlug,
} from '@/lib/url/staticSlugs';

const locales = ['en', 'de', 'it', 'es'];
const defaultLocale = 'en';

function redirectPreservingSearchParams(request: NextRequest, pathname: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  return NextResponse.redirect(redirectUrl);
}

function getLocaleRedirectPath(pathname: string, locale: string) {
  if (pathname === '/') return `/${locale}`;

  const firstPathSegment = pathname.slice(1).split('/')[0];
  const canonicalStaticSlug = getCanonicalStaticSlug(firstPathSegment);

  if (!canonicalStaticSlug) return `/${locale}${pathname}`;

  const remainingPath = pathname.slice(firstPathSegment.length + 1);
  return `${getLocalizedStaticPath(canonicalStaticSlug, locale)}${remainingPath}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip internal next.js requests, API routes, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return;
  }

  // 2. EXCLUDE root Admin routes from any locale handling.
  // We want /admin to remain exactly as is at the root level, but it must
  // NEVER be indexed — even after the public site opens for indexing. The
  // admin layout is a Client Component and can't export metadata, so we set
  // the noindex signal here at the edge instead.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // Normalize an accidentally repeated locale prefix without guessing between
  // different locales. Examples: /en/en/tours -> /en/tours and /de/de -> /de.
  // Cloning nextUrl preserves the query string while keeping the redirect on
  // the same origin.
  const pathSegments = pathname.split('/');
  const firstPathSegment = pathSegments[1];
  const secondPathSegment = pathSegments[2];

  if (
    firstPathSegment === secondPathSegment &&
    locales.includes(firstPathSegment)
  ) {
    const normalizedUrl = request.nextUrl.clone();
    normalizedUrl.pathname = `/${[firstPathSegment, ...pathSegments.slice(3)].join('/')}`;
    return NextResponse.redirect(normalizedUrl, 308);
  }

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = (cookieLocale && locales.includes(cookieLocale)) ? cookieLocale : defaultLocale;

  if (pathname === '/tailorMade') {
    return redirectPreservingSearchParams(
      request,
      `/${locale}/${getLocalizedStaticSlug('tailor-made', locale)}`
    );
  }

  const oldTailorMadeLocale = locales.find((currentLocale) => pathname === `/${currentLocale}/tailorMade`);
  if (oldTailorMadeLocale) {
    return redirectPreservingSearchParams(
      request,
      `/${oldTailorMadeLocale}/${getLocalizedStaticSlug('tailor-made', oldTailorMadeLocale)}`
    );
  }

  // Egypt DMC used to be waved through here without a locale prefix. It is a
  // normal localized page now — `/egypt-dmc` is a permanent redirect to
  // `/en/egypt-dmc` in next.config, and needs no exception.

  // 3. Check if the current path already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Handle special case: localized admin routes (e.g. /de/admin)
    // We want to redirect these back to the plain /admin version
    const firstSegment = pathname.split('/')[1];
    const subPath = pathname.replace(`/${firstSegment}`, '') || '/';
    if (subPath === '/admin' || subPath.startsWith('/admin/')) {
        return redirectPreservingSearchParams(request, subPath);
    }
    
    // Valid localized path: Let Next.js handle it via the [locale] file structure
    return;
  }

  // 4. No locale prefix found: Determine the target locale and redirect
  // We check for the NEXT_LOCALE cookie first, then fall back to default Locale
  const targetPath = getLocaleRedirectPath(pathname, locale);
  
  // Redirect directly to the public slug for the selected locale
  // (e.g. / -> /en, or /about + de -> /de/ueber-uns).
  return redirectPreservingSearchParams(request, targetPath);
}

export const config = {
  matcher: [
    // Match all request paths except internal ones:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - api (API routes)
    '/((?!api$|api/|_next/static|_next/image|favicon.ico).*)',
  ],
};
