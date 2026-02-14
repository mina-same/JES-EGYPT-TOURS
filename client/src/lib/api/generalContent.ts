import axiosInstance from './axios';

export const generalContentAPI = {
  /**
   * Get content by slug
   */
  getBySlug: async (slug: string) => {
    try {
      const response = await axiosInstance.get(`/general-content/${slug}`);
      return response.data;
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
    title: string;
    subtitle?: string;
    content: string;
    isActive?: boolean;
  }) => {
    try {
      const response = await axiosInstance.post(`/general-content`, data);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to update content' };
    }
  },
};
