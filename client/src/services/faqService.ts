import { API_ENDPOINTS } from '@/config/api';
import { ILocalizedString, ILocalizedMixed } from '@/types/tour';

export interface FAQ {
  _id: string;
  question: ILocalizedString;
  answer: ILocalizedMixed;
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
  question: ILocalizedString;
  answer: ILocalizedMixed;
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
  /** 'en' | 'de' | 'it' | 'es' for visitors, or 'bypass' for the admin. */
  locale?: string;
  /**
   * Server-side caching, opt-in. The admin never passes it, so an editor
   * always reads live rows; the visitor pages pass a tag the API clears on
   * save (see server/src/models/Faq.ts) plus a long window as a safety net.
   */
  cache?: { revalidate?: number; tags?: string[] };
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

      // The API narrows FAQs to the requested language and drops rows that have
      // no question/answer in it. Visitor callers pass their locale; the ADMIN
      // must pass 'bypass' so the editor always sees every row in every
      // language — otherwise an Italian-only FAQ would vanish from the list.
      // The locale is in the query string too: Next keys its Data Cache on
      // the request, and this repo's convention is to make the language part
      // of the URL so one language's response cannot be replayed to another.
      const cachedUrl = params?.locale
        ? `${url}${url.includes('?') ? '&' : '?'}locale=${encodeURIComponent(params.locale)}`
        : url;

      const response = await fetch(cachedUrl, {
        ...(params?.locale ? { headers: { 'X-Locale': params.locale } } : {}),
        ...(params?.cache ? { next: params.cache } : {}),
      });

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
  async getHomeFaqs(limit: number = 8, locale?: string): Promise<FAQResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.FAQ.HOME}?limit=${limit}`, {
        ...(locale ? { headers: { 'X-Locale': locale } } : {}),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch home FAQs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching home FAQs:', error);
      throw error;
    }
  }

  /**
   * Every FAQ, in every language, whatever the caller's UI language.
   *
   * The admin screens must use THIS rather than getAllFaqs: the visitor endpoint
   * drops rows that have no text in the requested language, so an Italian-only
   * FAQ would silently disappear from the editor and become uneditable. Making
   * it a separate method means a new admin screen cannot forget the flag.
   */
  async getAllFaqsForAdmin(params?: Omit<FAQQueryParams, 'locale'>): Promise<FAQResponse> {
    return this.getAllFaqs({ ...params, locale: 'bypass' });
  }

  /**
   * Single FAQ, always with all four languages — the edit form needs every tab.
   * `bypass` is explicit so this keeps working if the endpoint ever starts
   * narrowing by locale like the list one does.
   */
  async getFaqById(id: string): Promise<FAQSingleResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.FAQ.BY_ID(id), {
        headers: { 'X-Locale': 'bypass' },
      });
      
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
