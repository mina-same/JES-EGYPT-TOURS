import { API_ENDPOINTS } from '@/config/api';

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  isActive: boolean;
  order: number;
  displayOnHome: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FAQResponse {
  success: boolean;
  data: FAQ[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FAQSingleResponse {
  success: boolean;
  data: FAQ;
}

export interface FAQCreateRequest {
  question: string;
  answer: string;
  category?: string;
  isActive?: boolean;
  displayOnHome?: boolean;
}

export interface FAQUpdateRequest extends Partial<FAQCreateRequest> {
  order?: number;
}

export interface FAQQueryParams {
  category?: string;
  isActive?: boolean;
  displayOnHome?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

class FaqService {
  // Get all FAQs with optional filtering
  async getAllFaqs(params?: FAQQueryParams): Promise<FAQResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.category && params.category !== 'all') searchParams.append('category', params.category);
      if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
      if (params?.displayOnHome !== undefined) searchParams.append('displayOnHome', params.displayOnHome.toString());
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.sort) searchParams.append('sort', params.sort);
      if (params?.search) searchParams.append('search', params.search);

      const url = searchParams.toString() 
        ? `${API_ENDPOINTS.FAQ.BASE}?${searchParams.toString()}`
        : API_ENDPOINTS.FAQ.BASE;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch FAQs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  }

  // Get FAQs specifically for home page
  async getHomeFaqs(limit: number = 8): Promise<FAQResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.FAQ.HOME}?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch home FAQs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching home FAQs:', error);
      throw error;
    }
  }

  // Get single FAQ by ID
  async getFaqById(id: string): Promise<FAQSingleResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.FAQ.BY_ID(id));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch FAQ: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw error;
    }
  }

  // Get FAQ categories
  async getFaqCategories(): Promise<{ success: boolean; data: string[] }> {
    try {
      const response = await fetch(API_ENDPOINTS.FAQ.CATEGORIES);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch FAQ categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      throw error;
    }
  }

  // Create new FAQ (admin only)
  async createFaq(faqData: FAQCreateRequest): Promise<FAQSingleResponse> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.FAQ.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(faqData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create FAQ: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  }

  // Update FAQ (admin only)
  async updateFaq(id: string, faqData: FAQUpdateRequest): Promise<FAQSingleResponse> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.FAQ.BY_ID(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(faqData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update FAQ: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  }

  // Delete FAQ (admin only)
  async deleteFaq(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.FAQ.BY_ID(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete FAQ: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  }

  // Helper method to get auth token
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('authToken');
  }
}

export const faqService = new FaqService();
export default faqService;
