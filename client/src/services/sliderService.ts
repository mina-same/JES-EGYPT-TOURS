import { SliderItem } from '@/types/slider';
import { API_ENDPOINTS } from '@/config/api';
import { SliderUnderPromo } from '@/types/slider';

class SliderService {
  /**
   * Fetch all active slider content for public display
   */
  /** `locale` narrows the response to one language; omit it for all four. */
  async getActiveSliderContent(locale?: string): Promise<SliderItem[]> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.PUBLIC, {
        ...(locale ? { headers: { "X-Locale": locale } } : {}),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch slider content: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch slider content');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching slider content:', error);
      throw error;
    }
  }

  async getPublicSliderPromo(locale?: string): Promise<SliderUnderPromo | null> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.PROMO_PUBLIC, {
        ...(locale ? { headers: { "X-Locale": locale } } : {}),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch slider promo: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch slider promo');
      }

      return data.data || null;
    } catch (error) {
      console.error('Error fetching slider promo:', error);
      throw error;
    }
  }

  async getAdminSliderPromo(): Promise<SliderUnderPromo | null> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.PROMO_ADMIN, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch slider promo: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch slider promo');
      }

      return data.data || null;
    } catch (error) {
      console.error('Error fetching slider promo:', error);
      throw error;
    }
  }

  async upsertAdminSliderPromo(underPromo: SliderUnderPromo | null): Promise<SliderUnderPromo | null> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.PROMO_ADMIN, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ underPromo }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || data?.error || 'Failed to update slider promo');
      }

      return data.data || null;
    } catch (error) {
      console.error('Error updating slider promo:', error);
      throw error;
    }
  }

  async clearAdminSliderPromo(): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.PROMO_ADMIN, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || data?.error || 'Failed to clear slider promo');
      }
    } catch (error) {
      console.error('Error clearing slider promo:', error);
      throw error;
    }
  }

  /**
   * Fetch all slider content (admin only)
   */
  async getAllSliderContent(params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<{ data: SliderItem[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.sort) {
        queryParams.append('sort', params.sort);
      }
      
      const url = `${API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BASE}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch all slider content: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch slider content');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching all slider content:', error);
      throw error;
    }
  }

  /**
   * Get single slider content by ID (admin only)
   */
  async getSliderContentById(id: string): Promise<SliderItem> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BY_ID(id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch slider content: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch slider content');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching slider content by ID:', error);
      throw error;
    }
  }

  /**
   * Create new slider content (admin only)
   */
  async createSliderContent(sliderData: Partial<SliderItem>): Promise<SliderItem> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(sliderData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create slider content: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create slider content');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error creating slider content:', error);
      throw error;
    }
  }

  /**
   * Update slider content (admin only)
   */
  async updateSliderContent(id: string, sliderData: Partial<SliderItem>): Promise<SliderItem> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BY_ID(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(sliderData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update slider content: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update slider content');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating slider content:', error);
      throw error;
    }
  }

  /**
   * Delete slider content (admin only)
   */
  async deleteSliderContent(id: string): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_BY_ID(id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete slider content: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete slider content');
      }
    } catch (error) {
      console.error('Error deleting slider content:', error);
      throw error;
    }
  }

  /**
   * Toggle active status of slider content (admin only)
   */
  async toggleSliderContentActive(id: string): Promise<SliderItem> {
    try {
      const response = await fetch(API_ENDPOINTS.SLIDER_CONTENT.ADMIN_TOGGLE_ACTIVE(id), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to toggle slider content status: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to toggle slider content status');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error toggling slider content status:', error);
      throw error;
    }
  }
}

export const sliderService = new SliderService();
