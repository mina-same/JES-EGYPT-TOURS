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
};
