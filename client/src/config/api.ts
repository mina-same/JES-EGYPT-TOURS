// API Configuration
// Base URL without /api - will be added by specific implementations
const DEV_FALLBACK_API_URL = 'http://localhost:5001';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEV_FALLBACK_API_URL;

/**
 * A production build with no NEXT_PUBLIC_API_URL is the failure that hides.
 *
 * Every visitor page fetches through this constant, and every one of those
 * fetches is wrapped in a `catch` that returns [] or null so a single dead
 * endpoint cannot take the page down. That is the right behaviour for ONE
 * endpoint failing — but when the base URL itself is wrong, ALL of them fail
 * at once, every catch returns empty, and the site renders: the hero collapses
 * to its 895px empty shell, Featured Tours, the intro, the FAQ and the video
 * band each return null, and only the sections built from local data survive.
 *
 * The page still answers HTTP 200. Nothing is logged. The build succeeds. It
 * looks exactly like "the database is down" from the outside, which is the one
 * thing it is not.
 *
 * So: say so, loudly, once, at startup — and only on the server, where there is
 * someone to read it. This deliberately does not throw: an API reachable at
 * localhost:5001 from the Next server is a legitimate same-host deployment.
 */
if (
  typeof window === 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  console.warn(
    '\n[config/api] NEXT_PUBLIC_API_URL is not set in this production build.\n' +
      `           Falling back to ${DEV_FALLBACK_API_URL}.\n` +
      '           If the API is not reachable there, every data-driven section\n' +
      '           will render EMPTY while the pages still return HTTP 200.\n'
  );
}

// Full API URL with /api prefix
export const API_URL = `${API_BASE_URL}/api`;

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    ME: `${API_URL}/auth/me`,
    LOGOUT: `${API_URL}/auth/logout`,
  },
  
  // Tailor Made
  TAILOR_MADE: {
    BASE: `${API_URL}/tailor-made`,
    BY_ID: (id: string) => `${API_URL}/tailor-made/${id}`,
    STATS: `${API_URL}/tailor-made/stats`,
  },
  
  // Users
  USERS: {
    BASE: `${API_URL}/users`,
    BY_ID: (id: string) => `${API_URL}/users/${id}`,
  },

  // Contact Forms
  CONTACT: {
    BASE: `${API_URL}/contact`,
    TRAVEL_TRADE: `${API_URL}/contact/travel-trade`,
    TOUR_QUESTION: `${API_URL}/contact/tour-question`,
    BY_ID: (id: string) => `${API_URL}/contact/${id}`,
  },

  SLIDER_CONTENT: {
    PUBLIC: `${API_URL}/slider-content`,
    PROMO_PUBLIC: `${API_URL}/slider-content/promo`,
    ADMIN_BASE: `${API_URL}/slider-content/admin/slider-content`,
    ADMIN_BY_ID: (id: string) => `${API_URL}/slider-content/admin/slider-content/${id}`,
    ADMIN_TOGGLE_ACTIVE: (id: string) => `${API_URL}/slider-content/admin/slider-content/${id}/toggle-active`,
    PROMO_ADMIN: `${API_URL}/slider-content/admin/promo`,
  },

  NOTIFICATIONS: {
    BASE: `${API_URL}/notifications`,
    BY_ID: (id: string) => `${API_URL}/notifications/${id}`,
    MARK_READ: (id: string) => `${API_URL}/notifications/${id}/read`,
  },

  // FAQs
  FAQ: {
    BASE: `${API_URL}/faqs`,
    HOME: `${API_URL}/faqs/home`,
    CATEGORIES: `${API_URL}/faqs/categories`,
    BY_ID: (id: string) => `${API_URL}/faqs/${id}`,
  },
};
