"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isAdminWorkPage = (path: string) => {
  const normalizedPath = path.replace(/\/+$/, '') || '/';

  return [
    /^\/admin\/tour\/category\/new$/,
    /^\/admin\/tour\/subcategory\/new$/,
    /^\/admin\/tour\/tour\/new$/,
    /^\/admin\/tour\/tour\/[^/]+\/edit$/,
    /^\/admin\/tour\/booking$/,
    /^\/admin\/special-offers$/,
    /^\/admin\/destinations\/new$/,
    /^\/admin\/blogs\/category\/new$/,
    /^\/admin\/blogs\/subcategory\/new$/,
    /^\/admin\/blogs\/blog\/new$/,
    /^\/admin\/blogs\/blog\/[^/]+\/edit$/,
  ].some((pattern) => pattern.test(normalizedPath));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Pre-fill user from localStorage if available for faster UI
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }

      const response = await authAPI.getCurrentUser();
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // Only clear if specifically unauthorized or explicit failure
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error: any) {
      // If it's a 401, we definitely logout. 
      // Other errors (network, 500) we might want to keep the session temporarily.
      console.error('Auth check failed:', error);
      if (error.response?.status === 401) {
        if (isAdminWorkPage(window.location.pathname)) {
          localStorage.setItem('auth_redirect', `${window.location.pathname}${window.location.search}`);
          return;
        }

        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Store token and user
        // Note: localStorage is persistent. If we wanted temporary session, we'd use sessionStorage.
        // User specifically asked for localStorage and persistent login.
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        
        const savedRedirect = localStorage.getItem('auth_redirect');
        if (savedRedirect?.startsWith('/admin')) {
          localStorage.removeItem('auth_redirect');
          router.push(savedRedirect);
        } else {
          // Redirect to admin dashboard
          router.push('/admin');
        }
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
