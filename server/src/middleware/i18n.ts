import { Request, Response, NextFunction } from 'express';

// Add locale to the Request interface for TypeScript
declare global {
  namespace Express {
    interface Request {
      locale: string;
    }
  }
}

/**
 * Middleware to extract the locale from the request headers or fallback to 'en'.
 *
 * It also declares that dependency to shared caches.
 *
 * ── Why Vary belongs here ──
 * This is the middleware that READS X-Locale, so it is the one place that
 * cannot forget to announce it. Most controllers localize their response from
 * `req.locale` (13 of 21 read it), yet the URL is identical across languages:
 * GET /api/tours/slug/foo returns German or Italian depending only on a
 * header. Without `Vary`, any shared cache — CDN, reverse proxy, Cloudflare —
 * is entitled to store one of those representations and replay it to every
 * other language, because nothing in the response says the header matters.
 *
 * Applied globally rather than per-route on purpose. A route list would need
 * updating every time an endpoint starts localizing, and the failure mode of
 * forgetting is silent and severe, while the cost of the extra token on the
 * few locale-agnostic endpoints is a handful of bytes and some harmless edge
 * fragmentation.
 *
 * `res.vary()` merges through the `vary` package — the same one cors and
 * compression use for Origin and Accept-Encoding — so the three combine into
 * a single well-formed header instead of overwriting one another.
 */
export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const supportedLocales = ['en', 'de', 'it', 'es', 'bypass'];
  
  // Check 'X-Locale' header or 'Accept-Language' header
  const headerLocale = (req.headers['x-locale'] as string) || (req.headers['accept-language']?.split(',')[0].split('-')[0]) || 'en';
  
  // Set the locale for the request
  req.locale = supportedLocales.includes(headerLocale) ? headerLocale : 'en';
  
  res.vary('X-Locale');
  
  next();
};
