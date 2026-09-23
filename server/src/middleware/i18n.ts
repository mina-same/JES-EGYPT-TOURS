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
  
  /*
   * X-Locale is the ONLY header that selects the response language.
   *
   * This used to fall back to Accept-Language, which made the same URL
   * return four different bodies to four browsers while the response
   * advertised only `Vary: X-Locale` — a shared cache could not see the
   * second dependency and would replay one language to all of them.
   *
   * Declaring `Vary: X-Locale, Accept-Language` would have been the other
   * way to make that honest, but browser Accept-Language values are almost
   * unbounded ("de-DE,de;q=0.9,en;q=0.8", "de;q=0.8,en-US;q=0.7", ...), so a
   * future CDN would shard four real languages across hundreds of variants.
   * Narrowing the contract is both cheaper and more predictable: the cache
   * key is exactly URL + X-Locale, and four values cover the whole site.
   *
   * Missing or unsupported -> English. Never a guess from the browser.
   * 'bypass' is unchanged: the admin uses it to read raw multilingual docs.
   */
  const headerLocale = req.headers['x-locale'];
  
  req.locale =
    typeof headerLocale === 'string' && supportedLocales.includes(headerLocale)
      ? headerLocale
      : 'en';
  
  res.vary('X-Locale');
  
  next();
};
