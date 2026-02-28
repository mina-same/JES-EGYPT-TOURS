// API Configuration
// Base URL without /api - will be added by specific implementations
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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
