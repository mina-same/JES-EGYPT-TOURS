import axios from 'axios';
import { API_URL } from '@/config/api';

const API_BASE_URL = API_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

// Request interceptor to add token and locale
axiosInstance.interceptors.request.use(
  async (config) => {
    if (typeof window === 'undefined') {
      return config;
    }

    // 1. Add Auth Token
    let token: string | null = null;
    try {
      token = window.localStorage.getItem('authToken');
    } catch {
      token = null;
    }

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Add Locale from i18n
    try {
      const { default: i18n } = await import('../i18n');
      const isAdmin = window.location.pathname.includes('/admin');
      
      config.headers = config.headers ?? {};
      if (isAdmin) {
        config.headers['X-Locale'] = 'bypass'; // Ensure RAW data for admin
      } else if (i18n.language) {
        config.headers['X-Locale'] = i18n.language;
      }
    } catch (err) {
      console.warn('Failed to load i18n for axios interceptor', err);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (Invalid/Expired Token)
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('authToken');
          window.localStorage.removeItem('user');
        } catch {
          // ignore
        }

        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 403 Forbidden
    // In a permission-based system, 403 can be expected (admin lacks a permission).
    // Do NOT redirect globally to avoid infinite loops; let the UI handle it.
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
