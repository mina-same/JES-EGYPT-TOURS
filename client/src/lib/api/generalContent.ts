import { publicGet } from './publicGet';
import { ILocalizedString, ILocalizedMixed } from '@/types/tour';

export const generalContentAPI = {
  /**
   * Get content by slug
   *
   * A public read, by fetch: the home intro's fallback is its one caller, and
   * through axios it made that fallback download axios first.
   */
  getBySlug: async (slug: string) => {
    try {
      return await publicGet(`/general-content/${slug}`);
    } catch (error: any) {
      console.error(`Error fetching general content for slug ${slug}:`, error);
      return error.response?.data || { success: false, message: 'Failed to fetch content' };
    }
  },

  /**
   * Upsert content (Admin)
   */
  upsert: async (data: {
    slug: string;
    title: ILocalizedString;
    subtitle?: ILocalizedString;
    content: ILocalizedMixed;
    isActive?: boolean;
  }) => {
    try {
      const { default: axiosInstance } = await import('./axios');
      const response = await axiosInstance.post(`/general-content`, data);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to update content' };
    }
  },
};
