import axiosInstance from './axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'superadmin' | 'admin';
  permissions?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin';
  permissions?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Auth API functions
export const authAPI = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await axiosInstance.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    const response = await axiosInstance.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  // Register user (admin only)
  register: async (data: RegisterData): Promise<ApiResponse<{ user: User }>> => {
    const response = await axiosInstance.post<ApiResponse<{ user: User }>>('/auth/register', data);
    return response.data;
  },
};

// User API functions
export const userAPI = {
  // Get all users (admin only)
  getAllUsers: async (): Promise<ApiResponse<{ users: User[]; count: number }>> => {
    const response = await axiosInstance.get<ApiResponse<{ users: User[]; count: number }>>('/users');
    return response.data;
  },

  // Get single user (admin only)
  getUser: async (id: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await axiosInstance.get<ApiResponse<{ user: User }>>(`/users/${id}`);
    return response.data;
  },

  // Update user (admin only)
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response = await axiosInstance.put<ApiResponse<{ user: User }>>(`/users/${id}`, data);
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response = await axiosInstance.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },
};
