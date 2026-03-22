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
 */
export const i18nMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const supportedLocales = ['en', 'de', 'it', 'es', 'bypass'];
  
  // Check 'X-Locale' header or 'Accept-Language' header
  const headerLocale = (req.headers['x-locale'] as string) || (req.headers['accept-language']?.split(',')[0].split('-')[0]) || 'en';
  
  // Set the locale for the request
  req.locale = supportedLocales.includes(headerLocale) ? headerLocale : 'en';
  
  next();
};
