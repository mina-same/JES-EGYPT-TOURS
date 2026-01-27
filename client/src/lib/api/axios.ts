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

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') {
      return config;
    }

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
